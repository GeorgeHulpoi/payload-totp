import { type APIRequestContext, type Page, expect } from '@playwright/test'
import { Secret, TOTP } from 'otpauth'

import { test } from './fixtures'

/**
 * `forceSetup` used to be enforced by the admin UI alone: through the API, an account that
 * had not set TOTP up kept every permission of its role with a password alone.
 */
test.describe('forceSetup over the API', () => {
	// The tests only read, except the last; a failure restarts the worker on a fresh server.
	test.describe.configure({ mode: 'default' })

	let page: Page
	let teardown: VoidFunction
	let baseURL: string
	let api: APIRequestContext
	let headers: Record<string, string>
	let adminId: string
	let pendingId: string

	test.beforeAll(async ({ setup, browser, helpers, playwright }) => {
		const setupResult = await setup({ forceSetup: true })
		teardown = setupResult.teardown
		baseURL = setupResult.baseURL
		page = await (await browser.newContext()).newPage()

		await helpers.createFirstUser({ page, baseURL })
		await page.waitForURL(/^(.*?)\/admin\/setup-totp(\?back=.*?)?$/g)
		await helpers.setupTotp({ page, baseURL })
		adminId = (await (await page.request.get(`${baseURL}/api/users/me`)).json()).user.id

		const created = await page.request.post(`${baseURL}/api/users`, {
			data: { email: 'pending@domain.com', password: 'pending_pass' },
		})
		expect(created.status()).toBe(201)
		pendingId = (await created.json()).doc.id

		api = await playwright.request.newContext()
		const login = await api.post(`${baseURL}/api/users/login`, {
			data: { email: 'pending@domain.com', password: 'pending_pass' },
		})
		headers = { Authorization: `JWT ${(await login.json()).token}` }
	})

	test.afterAll(async () => {
		await api.dispose()
		await teardown()
		await page.close()
	})

	test('cannot create an account', async () => {
		const res = await api.post(`${baseURL}/api/users`, {
			data: { email: 'created@domain.com', password: 'created_pass' },
			headers,
		})
		expect(res.status()).toBe(403)
	})

	test('cannot read other collections', async () => {
		expect((await api.get(`${baseURL}/api/authors`, { headers })).status()).toBe(403)
	})

	test('cannot update their own account', async () => {
		const res = await api.patch(`${baseURL}/api/users/${pendingId}`, {
			data: { email: 'renamed@domain.com' },
			headers,
		})
		expect(res.status()).toBe(403)
	})

	test('sees only their own account', async () => {
		const list = await (await api.get(`${baseURL}/api/users`, { headers })).json()
		expect(list.totalDocs).toBe(1)
		expect(list.docs[0].email).toBe('pending@domain.com')
		expect((await api.get(`${baseURL}/api/users/${adminId}`, { headers })).status()).toBe(404)
	})

	test('can still load /me', async () => {
		const res = await api.get(`${baseURL}/api/users/me`, { headers })
		expect(res.status()).toBe(200)
		expect((await res.json()).user.email).toBe('pending@domain.com')
	})

	test('is refused over GraphQL', async () => {
		const res = await api.post(`${baseURL}/api/graphql`, {
			data: {
				query: 'mutation { createUser(data: { email: "gql@domain.com", password: "gql_pass" }) { id } }',
			},
			headers,
		})
		const body = await res.json()
		expect(body.errors?.length).toBeGreaterThan(0)
		expect(body.data?.createUser ?? null).toBeNull()
	})

	test('cannot lock documents', async () => {
		const res = await api.post(`${baseURL}/api/payload-locked-documents`, {
			data: { globalSlug: 'settings', user: { relationTo: 'users', value: pendingId } },
			headers,
		})
		expect(res.status()).toBe(403)
	})

	test('gets access once TOTP is set up', async () => {
		const secret = new Secret({ size: 32 })
		const totp = new TOTP({
			algorithm: 'SHA1',
			digits: 6,
			issuer: 'Payload',
			label: 'pending@domain.com',
			period: 30,
			secret,
		})
		const res = await api.post(`${baseURL}/api/setup-totp`, {
			data: { secret: secret.base32, token: totp.generate() },
			headers,
		})
		expect(await res.json()).toEqual({ ok: true })

		expect((await api.get(`${baseURL}/api/authors`, { headers })).status()).toBe(200)
	})
})
