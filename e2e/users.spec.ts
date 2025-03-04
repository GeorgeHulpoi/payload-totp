import { Page } from '@playwright/test'
import { faker } from '@faker-js/faker'

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
		await helpers.setupTotp({ page, baseURL })

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
	})

	test.afterAll(async () => {
		await teardown()
		await page.close()
	})

	test.describe('API', () => {
		test.describe.configure({ mode: 'serial' })

		test.beforeAll(async () => {
			const res = await page.request.post(`${baseURL}/api/users`, {
				data: {
					email: faker.internet.email(),
					password: faker.internet.password(),
				},
			})
			expect(res.ok()).toBeTruthy()
			const data = await res.json()
			expect(data).toEqual({
				message: 'An error has occurred.',
				ok: false,
			})
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
