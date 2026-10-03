/**
 * Reproduction for the `disabled` plugin option being a no-op.
 *
 * `PayloadTOTPConfig` declares `disabled` and the README documents it as a way to
 * "conditionally disable the plugin based on runtime conditions", but no runtime
 * code ever read it. Passing `disabled: true` produced exactly the same config as
 * `disabled: false`: access wrapped, `totp` strategy registered, admin provider and
 * views mounted, endpoints added. An enrolled user authenticating through
 * `local-jwt` was still denied access and redirected to the verify page.
 */

import type { Config } from 'payload'

import { payloadTotp } from '../src/index'
import { totpAccess } from '../src/totpAccess'

const originalUpdate = jest.fn(() => true)
const originalRead = jest.fn(() => true)
const originalGlobalRead = jest.fn(() => true)

function buildConfig(): Config {
	return {
		collections: [
			{
				slug: 'users',
				access: {
					read: originalRead,
					update: originalUpdate,
				},
				auth: true,
				fields: [],
			},
			{
				slug: 'posts',
				access: {
					read: originalRead,
				},
				fields: [],
			},
		],
		globals: [
			{
				slug: 'settings',
				access: {
					read: originalGlobalRead,
				},
				fields: [],
			},
		],
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any
}

/**
 * The report's probe: an enrolled user authenticated through `local-jwt` calling
 * the resulting `users.access.update`.
 */
function buildAccessArgs(pluginOptions: Record<string, unknown>) {
	return {
		req: {
			payload: {
				config: {
					custom: {
						totp: { pluginOptions },
					},
				},
			},
			user: {
				id: 'user-1',
				_strategy: 'local-jwt',
				collection: 'users',
				hasTotp: true,
			},
		},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const collectionBySlug = (config: Config, slug: string): any =>
	config.collections!.find((collection) => collection.slug === slug)

beforeEach(() => {
	originalUpdate.mockClear()
	originalRead.mockClear()
	originalGlobalRead.mockClear()
})

describe('disabled: true', () => {
	test('leaves the original access functions in place', async () => {
		const config = payloadTotp({ collection: 'users', disabled: true })(buildConfig())
		const users = collectionBySlug(config, 'users')

		expect(users.access.update).toBe(originalUpdate)
		expect(users.access.read).toBe(originalRead)
		expect(collectionBySlug(config, 'posts').access.read).toBe(originalRead)
		expect(config.globals![0].access!.read).toBe(originalGlobalRead)
	})

	test('lets an enrolled user authenticated by another strategy through', async () => {
		const config = payloadTotp({ collection: 'users', disabled: true })(buildConfig())
		const users = collectionBySlug(config, 'users')

		expect(await users.access.update(buildAccessArgs({ disabled: true }))).toBe(true)
	})

	test('does not register the TOTP auth strategy', () => {
		const config = payloadTotp({ collection: 'users', disabled: true })(buildConfig())
		const users = collectionBySlug(config, 'users')

		expect(users.auth?.strategies ?? []).toHaveLength(0)
	})

	test('does not mount the admin provider', () => {
		const config = payloadTotp({ collection: 'users', disabled: true })(buildConfig())

		expect(config.admin?.components?.providers ?? []).toHaveLength(0)
	})

	test('does not register the setup and verify views', () => {
		const config = payloadTotp({ collection: 'users', disabled: true })(buildConfig())

		expect(Object.keys(config.admin?.components?.views ?? {})).toHaveLength(0)
	})

	test('does not register the TOTP endpoints', () => {
		const config = payloadTotp({ collection: 'users', disabled: true })(buildConfig())

		expect(config.endpoints ?? []).toHaveLength(0)
	})

	test('does not add an onInit', () => {
		const config = payloadTotp({ collection: 'users', disabled: true })(buildConfig())

		expect(config.onInit).toBeUndefined()
	})

	test('does not add the logout and refresh hooks', () => {
		const config = payloadTotp({ collection: 'users', disabled: true })(buildConfig())
		const users = collectionBySlug(config, 'users')

		expect(users.hooks?.afterLogout ?? []).toHaveLength(0)
		expect(users.hooks?.afterRefresh ?? []).toHaveLength(0)
	})

	test('does not add the account UI field', () => {
		const config = payloadTotp({ collection: 'users', disabled: true })(buildConfig())
		const users = collectionBySlug(config, 'users')
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const names = users.fields.map((field: any) => field.name)

		expect(names).not.toContain('totpSecretUI')
		expect(names).not.toContain('hasTotp')
	})

	test('keeps the totpSecret field so the database schema is unchanged', () => {
		const config = payloadTotp({ collection: 'users', disabled: true })(buildConfig())
		const users = collectionBySlug(config, 'users')
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const totpSecret = users.fields.find((field: any) => field.name === 'totpSecret')

		expect(totpSecret).toBeDefined()
		expect(totpSecret.type).toBe('text')
	})

	test('keeps pluginOptions on the config so a manual totpAccess can read them', () => {
		const config = payloadTotp({ collection: 'users', disabled: true })(buildConfig())

		expect(config.custom?.totp?.pluginOptions).toEqual(
			expect.objectContaining({ collection: 'users', disabled: true }),
		)
	})
})

describe('disabled: false', () => {
	test('still wraps the access functions', () => {
		const config = payloadTotp({ collection: 'users', disabled: false })(buildConfig())
		const users = collectionBySlug(config, 'users')

		expect(users.access.update).not.toBe(originalUpdate)
	})

	test('still denies an enrolled user authenticated by another strategy', async () => {
		const config = payloadTotp({ collection: 'users', disabled: false })(buildConfig())
		const users = collectionBySlug(config, 'users')

		await expect(users.access.update(buildAccessArgs({ disabled: false }))).resolves.toBe(false)
	})

	test('still registers the strategy, provider, views and endpoints', () => {
		const config = payloadTotp({ collection: 'users', disabled: false })(buildConfig())
		const users = collectionBySlug(config, 'users')

		expect(users.auth.strategies).toHaveLength(1)
		expect(config.admin?.components?.providers).toHaveLength(1)
		expect(Object.keys(config.admin!.components!.views!)).toEqual(
			expect.arrayContaining(['SetupTOTP', 'VerifyTOTP']),
		)
		expect(config.endpoints).toHaveLength(3)
	})
})

describe('totpAccess used manually while disabled', () => {
	test('delegates to the inner access function', async () => {
		const access = totpAccess(originalUpdate)

		await expect(access(buildAccessArgs({ disabled: true }))).resolves.toBe(true)
		expect(originalUpdate).toHaveBeenCalled()
	})

	test('delegates for an anonymous request too', async () => {
		const access = totpAccess(() => true)
		const args = buildAccessArgs({ disabled: true })
		args.req.user = null

		await expect(access(args)).resolves.toBe(true)
	})

	test('still enforces TOTP when not disabled', async () => {
		const access = totpAccess(originalUpdate)

		await expect(access(buildAccessArgs({ disabled: false }))).resolves.toBe(false)
		expect(originalUpdate).not.toHaveBeenCalled()
	})
})
