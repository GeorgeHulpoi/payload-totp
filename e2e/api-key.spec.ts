import { expect, type Page } from '@playwright/test'

import { test } from './fixtures'

test.describe.configure({ mode: 'parallel' })

test.describe('api key', () => {
	let page: Page
	let teardown: VoidFunction
	let baseURL: string
	let apiKey: string

	test.beforeAll(async ({ setup, browser, helpers }) => {
		const setupResult = await setup({ forceSetup: true })
		teardown = setupResult.teardown
		baseURL = setupResult.baseURL
		const context = await browser.newContext()
		page = await context.newPage()

		await helpers.createFirstUser({ page, baseURL })
		await page.waitForURL(/^(.*?)\/admin\/setup-totp(\?back=.*?)?$/g)
		await helpers.setupTotp({ page, baseURL })
		await page.goto(`${baseURL}/admin/account`)

		const checkbox = page.locator('#field-enableAPIKey')
		await checkbox.click()

		const input = page.locator('input[name="apiKey"]')
		apiKey = await input.inputValue()

		const saveButton = page.getByRole('button', { name: 'Save' })
		await saveButton.click()
	})

	test.afterAll(async () => {
		await teardown()
		await page.close()
	})

	test('should bypass TOTP when API key is provided', async ({ browser }) => {
		const context = await browser.newContext()
		const page = await context.newPage()

		const res1 = await page.request.get(`${baseURL}/api/users`)
		expect(res1.ok()).toBeFalsy()
		expect(res1.status()).toBe(403)

		const res2 = await page.request.get(`${baseURL}/api/users`, {
			headers: { Authorization: `users API-Key ${apiKey}` },
		})
		expect(res2.ok()).toBeTruthy()
		expect(res2.status()).toBe(200)

		await page.close()
	})
})
