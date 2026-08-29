/**
 * Reproduction for the self-referential TOTP cookie.
 *
 * The `<prefix>-totp` cookie stores which strategy authenticated the user, so that
 * `strategy.ts` can delegate back to it. `setCookie` derives that value from
 * `user._strategy`, and when the request that writes the cookie was itself
 * authenticated through the TOTP strategy, `user._strategy === 'totp'`. The cookie
 * then points at the TOTP strategy itself, and `strategy.ts` delegates to itself
 * with the same `args` object, forever.
 */

import type { AuthStrategy } from 'payload'

import jwt from 'jsonwebtoken'

const cookieStore = {
	get: jest.fn(),
	set: jest.fn(),
}

const logger = {
	warn: jest.fn(),
}

jest.mock('next/headers.js', () => ({
	cookies: async () => cookieStore,
}))

import { setCookie } from '../src/setCookie'
import { strategy } from '../src/strategy'
import { readTotpCookie } from '../src/utilities/readTotpCookie'
import { resolveOriginalStrategy } from '../src/utilities/resolveOriginalStrategy'

const SECRET = 'test-secret'
const COOKIE_PREFIX = 'payload'
const USER_ID = 'user-1'

const authConfig = { cookies: {}, tokenExpiration: 7200 }

/**
 * The TOTP strategy self-call is unbounded, so it never throws on its own — it
 * grows the heap until the process dies. This wrapper stands in for the same
 * `strategy` object that `payloadTotp` registers under the name `totp`, and
 * aborts once re-entered, so the reproduction fails as a test instead of
 * taking down the Jest worker.
 */
function registerTotpStrategyWithReentryLimit(limit: number) {
	const state = { reentries: 0 }

	const registered: AuthStrategy = {
		name: 'totp',
		authenticate: (args) => {
			state.reentries++

			if (state.reentries > limit) {
				throw new Error(
					`the 'totp' strategy delegated to itself ${state.reentries} times; ` +
						`in production this exhausts the heap and kills the process`,
				)
			}

			return strategy.authenticate(args)
		},
	}

	return { registered, state }
}

function givenTotpCookie(originalStrategy: string, userId: number | string = USER_ID) {
	cookieStore.get.mockImplementation((name: string) =>
		name === `${COOKIE_PREFIX}-totp`
			? {
					name,
					value: jwt.sign({ originalStrategy, userId }, SECRET, { expiresIn: 7200 }),
				}
			: undefined,
	)
}

function buildArgs(authStrategies: AuthStrategy[]) {
	return {
		headers: new Headers(),
		payload: {
			authStrategies,
			config: { cookiePrefix: COOKIE_PREFIX },
			logger,
			secret: SECRET,
		},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any
}

beforeEach(() => {
	cookieStore.get.mockReset()
	cookieStore.set.mockReset()
	logger.warn.mockReset()
})

describe('TOTP strategy', () => {
	test('rejects a cookie that names the TOTP strategy as the original strategy', async () => {
		givenTotpCookie('totp')
		const { registered, state } = registerTotpStrategyWithReentryLimit(5)

		const result = await strategy.authenticate(buildArgs([registered]))

		expect(state.reentries).toBe(0)
		expect(result.user).toBeNull()
		expect(logger.warn).toHaveBeenCalledWith(
			expect.stringContaining('names "totp" as its original strategy'),
		)
	})

	test('still delegates to the original strategy for a healthy cookie', async () => {
		givenTotpCookie('local-jwt')
		const localJwt: AuthStrategy = {
			name: 'local-jwt',
			authenticate: async () =>
				({
					user: { id: USER_ID, _strategy: 'local-jwt', collection: 'users' },
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
				}) as any,
		}
		const { registered, state } = registerTotpStrategyWithReentryLimit(5)

		const result = await strategy.authenticate(buildArgs([registered, localJwt]))

		expect(state.reentries).toBe(0)
		expect(result.user).toEqual(expect.objectContaining({ id: USER_ID, _strategy: 'totp' }))
	})
})

describe('setCookie', () => {
	test('skips writing rather than recording the TOTP strategy as the original strategy', async () => {
		await setCookie({
			authConfig,
			cookiePrefix: COOKIE_PREFIX,
			secret: SECRET,
			// A user re-running setup while still holding a valid TOTP cookie is
			// authenticated through the TOTP strategy.
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			user: { id: USER_ID, _strategy: 'totp', collection: 'users' } as any,
		})

		expect(cookieStore.set).not.toHaveBeenCalled()
	})

	test('skips writing when no original strategy can be determined', async () => {
		await setCookie({
			authConfig,
			cookiePrefix: COOKIE_PREFIX,
			secret: SECRET,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			user: { id: USER_ID, collection: 'users' } as any,
		})

		expect(cookieStore.set).not.toHaveBeenCalled()
	})

	test('records the original strategy passed by the caller', async () => {
		await setCookie({
			authConfig,
			cookiePrefix: COOKIE_PREFIX,
			originalStrategy: 'local-jwt',
			secret: SECRET,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			user: { id: USER_ID, _strategy: 'totp', collection: 'users' } as any,
		})

		expect(cookieStore.set).toHaveBeenCalledTimes(1)

		const [name, token] = cookieStore.set.mock.calls[0]
		const decoded = jwt.verify(token, SECRET) as { originalStrategy: string; userId: string }

		expect(name).toBe(`${COOKIE_PREFIX}-totp`)
		expect(decoded).toEqual(
			expect.objectContaining({ originalStrategy: 'local-jwt', userId: USER_ID }),
		)
	})
})

const payload = {
	config: { cookiePrefix: COOKIE_PREFIX },
	secret: SECRET,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const user = { id: USER_ID, collection: 'users' } as any

describe('readTotpCookie', () => {
	test('returns the payload of a healthy cookie', async () => {
		givenTotpCookie('local-jwt')

		await expect(readTotpCookie({ payload, user })).resolves.toEqual(
			expect.objectContaining({ originalStrategy: 'local-jwt', userId: USER_ID }),
		)
	})

	test('rejects a cookie that names the TOTP strategy', async () => {
		givenTotpCookie('totp')

		await expect(readTotpCookie({ payload, user })).resolves.toBeUndefined()
	})

	test('rejects a cookie belonging to another user', async () => {
		givenTotpCookie('local-jwt', 'someone-else')

		await expect(readTotpCookie({ payload, user })).resolves.toBeUndefined()
	})

	test('rejects a cookie signed with another secret', async () => {
		cookieStore.get.mockReturnValue({
			name: `${COOKIE_PREFIX}-totp`,
			value: jwt.sign({ originalStrategy: 'local-jwt', userId: USER_ID }, 'other-secret'),
		})

		await expect(readTotpCookie({ payload, user })).resolves.toBeUndefined()
	})

	// The refresh hook relies on this: minting a TOTP cookie for a user who never
	// verified would grant TOTP-verified status without verification.
	test('returns undefined when no cookie is present', async () => {
		cookieStore.get.mockReturnValue(undefined)

		await expect(readTotpCookie({ payload, user })).resolves.toBeUndefined()
	})
})

describe('resolveOriginalStrategy', () => {
	test('prefers the strategy that authenticated this request', async () => {
		// A stale cookie must not override the live session's strategy.
		givenTotpCookie('api-key')

		await expect(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			resolveOriginalStrategy({ payload, user: { ...user, _strategy: 'local-jwt' } as any }),
		).resolves.toBe('local-jwt')
	})

	test('recovers the underlying strategy from the cookie when authenticated via TOTP', async () => {
		givenTotpCookie('local-jwt')

		await expect(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			resolveOriginalStrategy({ payload, user: { ...user, _strategy: 'totp' } as any }),
		).resolves.toBe('local-jwt')
	})

	test('resolves to undefined when the cookie is itself self-referential', async () => {
		givenTotpCookie('totp')

		await expect(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			resolveOriginalStrategy({ payload, user: { ...user, _strategy: 'totp' } as any }),
		).resolves.toBeUndefined()
	})
})
