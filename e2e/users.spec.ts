import { expect, Page } from '@playwright/test'
import { Secret, TOTP } from 'otpauth'

import { test } from './fixtures'

test.describe.configure({ mode: 'parallel' })

test.describe('users', () => {
	let page: Page
	let teardown: VoidFunction
	let baseURL: string

	test.beforeAll(async ({ setup, browser, helpers }) => {
		const setupResult = await setup({ forceSetup: true })
		teardown = setupResult.teardown
		baseURL = setupResult.baseURL
		const context = await browser.newContext()
		page = await context.newPage()

		await helpers.createFirstUser({ page, baseURL })
		await page.waitForURL(/^(.*?)\/admin\/setup-totp(\?back=.*?)?$/g)
		const { totpSecret } = await helpers.setupTotp({ page, baseURL })

		await Promise.all([
			page.request.post(`${baseURL}/api/users`, {
				data: {
					email: 'test1@domain.com',
					password: 'test1_pass',
				},
			}),
			page.request.post(`${baseURL}/api/users`, {
				data: {
					email: 'test2@domain.com',
					password: 'test2_pass',
				},
			}),
		])

		await helpers.logout({ page })
		await helpers.login({
			page,
			baseURL,
			email: 'test1@domain.com',
			password: 'test1_pass',
		})
		await page.waitForURL(/^(.*?)\/admin\/setup-totp/g)
		await helpers.setupTotp({ page, baseURL })

		await helpers.logout({ page })
		await helpers.login({
			page,
			baseURL,
			email: 'test2@domain.com',
			password: 'test2_pass',
		})
		await page.waitForURL(/^(.*?)\/admin\/setup-totp/g)
		await helpers.setupTotp({ page, baseURL })
		await helpers.logout({ page })
		await helpers.login({
			page,
			baseURL,
			email: 'human@domain.com',
			password: '123456',
		})
		await page.waitForURL(/^(.*?)\/admin\/verify-totp/g)

		const totp = new TOTP({
			algorithm: 'SHA1',
			digits: 6,
			issuer: 'Payload',
			label: 'human@domain.com',
			period: 30,
			secret: Secret.fromBase32(totpSecret || ''),
		})

		const token = totp.generate()

		await page
			.locator('css=dialog#verify-totp input:first-child[type="text"]')
			.pressSequentially(token, { delay: 300 })

		await page.waitForURL(/^(.*?)\/admin$/g)
	})

	test.afterAll(async () => {
		await teardown()
		await page.close()
	})

	test.describe('API', () => {
		test.describe.configure({ mode: 'serial' })

		test('should not expose totpSecret and hasTotp', async () => {
			const res = await page.request.get(`${baseURL}/api/users`)
			const body = await res.json()
			console.log(body)
			expect(res.ok()).toBeTruthy()
			const data = await res.json()
			expect(data.totalDocs).toEqual(3)
			for (const doc of data.docs) {
				expect(doc.totpSecret).toBeUndefined()

				console.log(doc)
				if (doc.email !== 'human@domain.com') {
					expect(doc.hasTotp).toBeFalsy()
				}
			}
		})
	})

	// test.describe('create new user', () => {
	// 	test.skip('should not see TOTP field', async () => {})

	// 	test.skip('should not be able to set totpSecret via API', async () => {})

	// 	test.skip('should not be able to set totpSecret via GraphQL', async () => {})
	// })

	// test.describe('get user', () => {
	// 	test.skip('should not see TOTP field', async () => {})

	// 	test.skip('should not be able to see totpSecret via API', async () => {})

	// 	test.skip('should not be able to see totpSecret via GraphQL', async () => {})
	// })
})
