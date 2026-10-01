/**
 * Reproduction for `forceSetup` being enforced only by the admin UI.
 *
 * With `forceSetup: true` the admin provider sends a user who has not set TOTP up to the
 * setup view, but `totpAccess` returned the wrapped access whenever `hasTotp` was false.
 * Through REST, GraphQL or the Local API, a new account -- or one whose secret was reset --
 * kept every permission of its role with a password alone. Payload's own collections,
 * appended after plugins run, were never wrapped at all.
 */

import type { Config } from 'payload'

import { payloadTotp } from '../src/index'
import { totpAccess } from '../src/totpAccess'

type User = null | Record<string, unknown>

const unenrolled = { id: 'user-1', _strategy: 'local-jwt', collection: 'users', hasTotp: false }
const enrolledUnverified = { ...unenrolled, hasTotp: true }
const verified = { ...unenrolled, _strategy: 'totp', hasTotp: true }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function argsFor(pluginOptions: Record<string, unknown>, user: User): any {
	return { req: { payload: { config: { custom: { totp: { pluginOptions } } } }, user } }
}

const forced = { collection: 'users', forceSetup: true }

describe('totpAccess with forceSetup', () => {
	test('denies a user who has not set TOTP up', async () => {
		await expect(totpAccess(() => true)(argsFor(forced, unenrolled))).resolves.toBe(false)
		await expect(totpAccess()(argsFor(forced, unenrolled))).resolves.toBe(false)
	})

	test('lets them read only their own document where allowed', async () => {
		const access = totpAccess(() => true, { allowOwnDocumentDuringSetup: true })

		await expect(access(argsFor(forced, unenrolled))).resolves.toEqual({
			id: { equals: 'user-1' },
		})
	})

	test('narrows a query returned by the wrapped access', async () => {
		const access = totpAccess(() => ({ role: { equals: 'editor' } }), {
			allowOwnDocumentDuringSetup: true,
		})

		await expect(access(argsFor(forced, unenrolled))).resolves.toEqual({
			and: [{ role: { equals: 'editor' } }, { id: { equals: 'user-1' } }],
		})
	})

	test('keeps a denial by the wrapped access', async () => {
		const access = totpAccess(() => false, { allowOwnDocumentDuringSetup: true })

		await expect(access(argsFor(forced, unenrolled))).resolves.toBe(false)
	})

	test('still lets a verified session and an API key through', async () => {
		await expect(totpAccess(() => true)(argsFor(forced, verified))).resolves.toBe(true)
		await expect(
			totpAccess(() => true)(argsFor(forced, { ...unenrolled, _strategy: 'api-key' })),
		).resolves.toBe(true)
	})

	test('still denies an enrolled session that has not entered a code', async () => {
		await expect(totpAccess(() => true)(argsFor(forced, enrolledUnverified))).resolves.toBe(
			false,
		)
	})

	test('leaves users of another auth collection alone', async () => {
		await expect(
			totpAccess(() => true)(argsFor(forced, { ...unenrolled, collection: 'customers' })),
		).resolves.toBe(true)
	})

	test('enforces when the user carries no collection', async () => {
		await expect(
			totpAccess(() => true)(argsFor(forced, { ...unenrolled, collection: undefined })),
		).resolves.toBe(false)
	})

	test('denies anonymous requests as before', async () => {
		await expect(totpAccess(() => true)(argsFor(forced, null))).resolves.toBe(false)
	})
})

describe('totpAccess without forceSetup', () => {
	const optional = { collection: 'users' }

	test('lets a user who has not set TOTP up through', async () => {
		await expect(totpAccess(() => true)(argsFor(optional, unenrolled))).resolves.toBe(true)
		await expect(
			totpAccess(() => true, { allowOwnDocumentDuringSetup: true })(
				argsFor(optional, unenrolled),
			),
		).resolves.toBe(true)
	})
})

function buildConfig(onInit?: Config['onInit']): Config {
	return {
		collections: [
			{ slug: 'users', access: { read: () => true }, auth: true, fields: [] },
			{
				slug: 'posts',
				access: { read: () => true },
				custom: { totp: { disableAccessWrapper: { read: true } } },
				fields: [],
			},
		],
		globals: [{ slug: 'settings', fields: [] }],
		onInit,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bySlug = (entities: any[] | undefined, slug: string): any =>
	entities!.find((entity) => entity.slug === slug)

describe('plugin wiring', () => {
	const config = payloadTotp(forced as never)(buildConfig())
	const args = argsFor(forced, unenrolled)

	test('the TOTP collection lets an unenrolled user read only their own document', async () => {
		const users = bySlug(config.collections, 'users')

		await expect(users.access.read(args)).resolves.toEqual({ id: { equals: 'user-1' } })
		await expect(users.access.create(args)).resolves.toBe(false)
		await expect(users.access.update(args)).resolves.toBe(false)
		await expect(users.access.delete(args)).resolves.toBe(false)
	})

	test('other collections and globals deny them', async () => {
		await expect(bySlug(config.collections, 'posts').access.update(args)).resolves.toBe(false)
		await expect(bySlug(config.globals, 'settings').access.update(args)).resolves.toBe(false)
	})
})

describe("Payload's own collections, added after plugins", () => {
	const allow = () => jest.fn(() => true)

	/** What `sanitizeConfig` appends once plugins have run, plus a collection of a later plugin. */
	function lateCollections() {
		return {
			folders: { slug: 'library-folders', access: { read: allow() }, fields: [] },
			forms: { slug: 'form-submissions', access: { create: allow(), read: allow() }, fields: [] },
			jobs: { slug: 'payload-jobs', access: { create: allow(), read: allow() }, fields: [] },
			lockedDocuments: {
				slug: 'payload-locked-documents',
				access: { create: allow(), read: allow() },
				fields: [],
			},
			queryPresets: { slug: 'payload-query-presets', access: { read: allow() }, fields: [] },
		}
	}

	async function init(
		pluginOptions: Record<string, unknown>,
		{
			late = lateCollections(),
			onInit,
		}: { late?: ReturnType<typeof lateCollections>; onInit?: Config['onInit'] } = {},
	) {
		const config = payloadTotp(pluginOptions as never)(buildConfig(onInit))
		const payload = {
			config: {
				...config,
				collections: [...config.collections!, ...Object.values(late)],
				folders: { slug: 'library-folders' },
			},
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await config.onInit!(payload as any)

		return { config, late, payload }
	}

	test('onInit wraps jobs, folders, query presets and lock writes', async () => {
		const { late } = await init(forced)

		for (const user of [unenrolled, enrolledUnverified]) {
			await expect(late.jobs.access.read(argsFor(forced, user))).resolves.toBe(false)
			await expect(late.jobs.access.create(argsFor(forced, user))).resolves.toBe(false)
			await expect(late.folders.access.read(argsFor(forced, user))).resolves.toBe(false)
			await expect(late.queryPresets.access.read(argsFor(forced, user))).resolves.toBe(false)
			await expect(late.lockedDocuments.access.create(argsFor(forced, user))).resolves.toBe(
				false,
			)
		}

		await expect(late.jobs.access.read(argsFor(forced, verified))).resolves.toBe(true)
	})

	// Payload appends it whenever a job has a `schedule`; writing it can stall scheduled jobs.
	test('onInit wraps the job schedule stats global', async () => {
		const config = payloadTotp(forced as never)(buildConfig())
		const jobsStats = {
			slug: 'payload-jobs-stats',
			access: { read: allow(), update: allow() },
			fields: [],
		}
		const payload = { config: { ...config, globals: [...config.globals!, jobsStats] } }

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await config.onInit!(payload as any)

		expect(await jobsStats.access.update(argsFor(forced, enrolledUnverified))).toBe(false)
		expect(await jobsStats.access.read(argsFor(forced, unenrolled))).toBe(false)
		expect(await jobsStats.access.update(argsFor(forced, verified))).toBe(true)
	})

	// The dashboard reads locks with access enforced and no error handling, right after login.
	test('leaves reading locks alone', async () => {
		const late = lateCollections()
		const read = late.lockedDocuments.access.read

		await init(forced, { late })

		expect(late.lockedDocuments.access.read).toBe(read)
	})

	test("leaves a later plugin's collections alone", async () => {
		const late = lateCollections()
		const { create } = late.forms.access

		await init(forced, { late })

		expect(late.forms.access.create).toBe(create)
	})

	test('keeps a per-collection opt-out', async () => {
		const late = lateCollections()
		Object.assign(late.jobs, { custom: { totp: { disableAccessWrapper: { read: true } } } })
		const read = late.jobs.access.read

		await init(forced, { late })

		expect(late.jobs.access.read).toBe(read)
		await expect(late.jobs.access.create(argsFor(forced, unenrolled))).resolves.toBe(false)
	})

	test('wraps nothing with disableAccessWrapper', async () => {
		const late = lateCollections()
		const access = late.jobs.access

		await init({ ...forced, disableAccessWrapper: true }, { late })

		expect(late.jobs.access).toBe(access)
	})

	test('wraps once per config', async () => {
		const { config, late, payload } = await init(forced)
		const read = late.jobs.access.read

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await config.onInit!(payload as any)

		expect(late.jobs.access.read).toBe(read)
	})

	test('still runs the onInit it replaced', async () => {
		const original = jest.fn()
		const { payload } = await init(forced, { onInit: original })

		expect(original).toHaveBeenCalledWith(payload)
	})
})
