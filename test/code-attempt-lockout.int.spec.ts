/**
 * Reproduction for TOTP codes being guessable without limit.
 *
 * `/verify-totp` and `/remove-totp` validated the submitted code and answered
 * `ok: false` on a miss, and nothing else. Payload locks an account after
 * `maxLoginAttempts` wrong passwords, but neither endpoint took part in that
 * count, so a caller holding a session could submit six-digit codes until one
 * of the three codes the `window: 1` validation accepts came up.
 *
 * Both endpoints now count each code, before it is checked, so a burst of parallel
 * guesses is bounded too, and refuse codes for `lockTime` after `maxLoginAttempts` of them.
 *
 * The count and the lock are in a `totp-attempts` document, not on the user: Payload's
 * login, refresh and logout write back the whole user document they read at the start, so
 * anything kept there is put back to an older value by someone who knows the password.
 */

import type { PayloadRequest } from 'payload'

import { Secret, TOTP } from 'otpauth'

jest.mock('next/headers.js', () => ({
	cookies: async () => ({ delete: jest.fn(), get: jest.fn(), set: jest.fn() }),
}))

import { removeEndpointHandler } from '../src/api/remove'
import { verifyToken } from '../src/api/verifyToken'
import { resetCodeAttemptsAfterUnlock } from '../src/hooks/resetCodeAttemptsAfterUnlock'

const SECRET = 'JBSWY3DPEHPK3PXP'
const USER_ID = 'user-1'
const LOCK_TIME = 600_000

const totp = new TOTP({ secret: Secret.fromBase32(SECRET) })
const correctCode = () => totp.generate()

/** A code outside the steps the validation accepts while a test runs. */
const WRONG_CODE = (() => {
	const accepted = new Set<string>()

	for (let step = -2; step <= 4; step++) {
		accepted.add(totp.generate({ timestamp: Date.now() + step * 30_000 }))
	}

	let code = 0

	while (accepted.has(code.toString().padStart(6, '0'))) {
		code++
	}

	return code.toString().padStart(6, '0')
})()

type UserRow = {
	email: string
	id: string
	lockUntil?: null | string
	totpSecret?: null | string
}

type AttemptsRow = {
	attempts: number
	id: string
	lockUntil?: null | string
}

type Where = Record<string, { equals: unknown }>

/**
 * The users row and the `totp-attempts` row the handlers read and write, with the primary
 * key and the atomic `$inc` the count relies on, so it survives parallel requests.
 */
function buildPayload(maxLoginAttempts: number) {
	const state: { attempts: AttemptsRow | null; user: UserRow } = {
		attempts: null,
		user: { id: USER_ID, email: 'user@example.com', lockUntil: null, totpSecret: SECRET },
	}

	const rowOf = (collection: string) => (collection === 'users' ? state.user : state.attempts)
	const matches = (row: null | object, where: Where) =>
		Boolean(row) &&
		Object.entries(where).every(
			([key, { equals }]) => (row as Record<string, unknown>)[key] === equals,
		)

	const db = {
		create: jest.fn(async ({ data }: { data: Pick<AttemptsRow, 'attempts' | 'id'> }) => {
			if (state.attempts) {
				throw new Error('duplicate key')
			}

			state.attempts = { lockUntil: null, ...data }

			return { ...state.attempts }
		}),
		findOne: jest.fn(async ({ collection, where }: { collection: string; where: Where }) => {
			const row = rowOf(collection)

			return matches(row, where) ? { ...row } : null
		}),
		updateOne: jest.fn(
			async (args: { collection: string; data: Record<string, unknown>; id: string }) => {
				const row = rowOf(args.collection)

				if (!matches(row, { id: { equals: args.id } })) {
					return null
				}

				for (const [key, value] of Object.entries(args.data)) {
					if (value && typeof value === 'object' && '$inc' in value) {
						state.attempts!.attempts += Number(value.$inc)
					} else {
						Object.assign(row!, { [key]: value })
					}
				}

				return { ...row }
			},
		),
	}

	const collection = {
		config: {
			slug: 'users',
			auth: {
				cookies: {},
				lockTime: LOCK_TIME,
				maxLoginAttempts,
				tokenExpiration: 7200,
				useSessions: false,
			},
		},
	}

	const payload = {
		collections: { users: collection },
		config: { cookiePrefix: 'payload' },
		db,
		findByID: jest.fn(async () => ({ totpSecret: state.user.totpSecret })),
		secret: 'test-secret',
		update: jest.fn(async () => {
			state.user.totpSecret = null
		}),
	}

	return { collection, payload, state }
}

function buildRequest(payload: unknown, token: unknown): PayloadRequest {
	return {
		i18n: { t: (key: string) => key },
		t: (key: string) => key,
		json: async () => ({ token }),
		payload,
		user: {
			id: USER_ID,
			_strategy: 'local-jwt',
			collection: 'users',
			email: 'user@example.com',
			hasTotp: true,
		},
	} as unknown as PayloadRequest
}

const pluginOptions = { collection: 'users' as const }
const LOCKED = { message: 'error:userLocked', ok: false }

describe('verify-totp', () => {
	test('locks the account after maxLoginAttempts wrong codes and refuses the correct one', async () => {
		const { payload, state } = buildPayload(3)
		const handler = verifyToken(pluginOptions)

		for (let i = 0; i < 3; i++) {
			const res = await (await handler(buildRequest(payload, WRONG_CODE))).json()
			expect(res).toEqual({ message: 'totpPlugin:setup:incorrectCode', ok: false })
		}

		// The lock starts the count over.
		expect(state.attempts?.attempts).toBe(0)
		expect(new Date(state.attempts!.lockUntil!).getTime()).toBeGreaterThan(Date.now())

		const res = await (await handler(buildRequest(payload, correctCode()))).json()
		expect(res).toEqual({ message: 'error:userLocked', ok: false })
		// Copied to the user, so the password login is refused as well.
		expect(state.user.lockUntil).toBe(state.attempts!.lockUntil)
	})

	test('still refuses codes when the lock on the user document is written over', async () => {
		const { payload, state } = buildPayload(3)
		const handler = verifyToken(pluginOptions)

		for (let i = 0; i < 3; i++) {
			await handler(buildRequest(payload, WRONG_CODE))
		}

		// What a login, refresh or logout that read the user before the lock does.
		state.user.lockUntil = null

		const res = await (await handler(buildRequest(payload, correctCode()))).json()
		expect(res).toEqual({ message: 'error:userLocked', ok: false })
	})

	test.each([
		['another user', { id: 'admin-1', collection: 'users' }, { ok: true }],
		['the Local API', undefined, { ok: true }],
		// Payload lets any logged-in user unlock by default.
		['the locked user', { id: USER_ID, collection: 'users' }, LOCKED],
	])('after an unlock by %s, answers a correct code as expected', async (_, caller, expected) => {
		const { collection, payload } = buildPayload(3)
		const handler = verifyToken(pluginOptions)

		for (let i = 0; i < 3; i++) {
			await handler(buildRequest(payload, WRONG_CODE))
		}

		// Payload's unlock finds the user by the email, trimmed and lower-cased.
		await resetCodeAttemptsAfterUnlock({
			args: { data: { email: ' User@Example.com' } },
			collection: collection.config,
			operation: 'unlock',
			req: { payload, user: caller },
			result: true,
		} as never)

		const res = await (await handler(buildRequest(payload, correctCode()))).json()
		expect(res).toEqual(expected)
	})

	test('checks no more than maxLoginAttempts codes out of a parallel burst', async () => {
		const { payload } = buildPayload(3)
		const handler = verifyToken(pluginOptions)

		const results = await Promise.all(
			Array.from({ length: 10 }, () =>
				handler(buildRequest(payload, WRONG_CODE)).then((res) => res.json()),
			),
		)

		const checked = results.filter((res) => res.message === 'totpPlugin:setup:incorrectCode')
		const refused = results.filter((res) => res.message === 'error:userLocked')

		expect(checked).toHaveLength(3)
		expect(refused).toHaveLength(7)
	})

	test('resets the count on a correct code', async () => {
		const { payload, state } = buildPayload(3)
		const handler = verifyToken(pluginOptions)

		await handler(buildRequest(payload, WRONG_CODE))
		await handler(buildRequest(payload, WRONG_CODE))
		expect(state.attempts?.attempts).toBe(2)

		const res = await (await handler(buildRequest(payload, correctCode()))).json()
		expect(res).toEqual({ ok: true })
		expect(state.attempts?.attempts).toBe(0)
		expect(state.attempts?.lockUntil).toBeNull()
		expect(state.user.lockUntil).toBeNull()
	})

	test('accepts a correct code on the last allowed attempt and lifts its lock', async () => {
		const { payload, state } = buildPayload(3)
		const handler = verifyToken(pluginOptions)

		await handler(buildRequest(payload, WRONG_CODE))
		await handler(buildRequest(payload, WRONG_CODE))

		const res = await (await handler(buildRequest(payload, correctCode()))).json()
		expect(res).toEqual({ ok: true })
		expect(state.attempts?.attempts).toBe(0)
		expect(state.attempts?.lockUntil).toBeNull()
		expect(state.user.lockUntil).toBeNull()
	})

	test('starts a new count once the lock has ended', async () => {
		const { payload, state } = buildPayload(3)
		const handler = verifyToken(pluginOptions)

		for (let i = 0; i < 3; i++) {
			await handler(buildRequest(payload, WRONG_CODE))
		}

		state.attempts!.lockUntil = new Date(Date.now() - 1000).toISOString()

		const res = await (await handler(buildRequest(payload, WRONG_CODE))).json()
		expect(res).toEqual({ message: 'totpPlugin:setup:incorrectCode', ok: false })
		expect(state.attempts?.attempts).toBe(1)
	})

	test('does not count a malformed body as a guess', async () => {
		const { payload, state } = buildPayload(3)
		const handler = verifyToken(pluginOptions)

		const res = await (await handler(buildRequest(payload, 123456))).json()
		expect(res).toEqual({ message: 'error:unspecific', ok: false })
		expect(state.attempts).toBeNull()
	})

	test('counts nothing when maxLoginAttempts is 0', async () => {
		const { payload, state } = buildPayload(0)
		const handler = verifyToken(pluginOptions)

		for (let i = 0; i < 5; i++) {
			await handler(buildRequest(payload, WRONG_CODE))
		}

		expect(state.attempts).toBeNull()
		expect(payload.db.findOne).not.toHaveBeenCalled()

		const res = await (await handler(buildRequest(payload, correctCode()))).json()
		expect(res).toEqual({ ok: true })
	})
})

describe('remove-totp', () => {
	test('shares the count with verify-totp', async () => {
		const { payload, state } = buildPayload(3)
		const verify = verifyToken(pluginOptions)
		const remove = removeEndpointHandler(pluginOptions)

		await verify(buildRequest(payload, WRONG_CODE))
		await remove(buildRequest(payload, WRONG_CODE))
		await remove(buildRequest(payload, WRONG_CODE))

		expect(new Date(state.attempts!.lockUntil!).getTime()).toBeGreaterThan(Date.now())

		const res = await (await remove(buildRequest(payload, correctCode()))).json()
		expect(res).toEqual({ message: 'error:userLocked', ok: false })
		expect(state.user.totpSecret).toBe(SECRET)
	})

	test('resets the count and removes the secret on a correct code', async () => {
		const { payload, state } = buildPayload(3)
		const remove = removeEndpointHandler(pluginOptions)

		await remove(buildRequest(payload, WRONG_CODE))

		const res = await (await remove(buildRequest(payload, correctCode()))).json()
		expect(res).toEqual({ ok: true })
		expect(state.attempts?.attempts).toBe(0)
		expect(state.user.totpSecret).toBeNull()
	})
})
