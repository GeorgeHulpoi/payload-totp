import { expect, type Page } from '@playwright/test'

import { test } from './fixtures'

test.describe.configure({ mode: 'serial' })

test.describe('Log out', () => {
	let page: Page
	let teardown: VoidFunction
	let baseURL: string

	test.beforeAll(async ({ setup, browser, helpers }) => {
		const setupResult = await setup()
		teardown = setupResult.teardown
		baseURL = setupResult.baseURL
		page = await browser.newPage()
		await helpers.createFirstUser({ page, baseURL })
		await page.waitForURL(/^(.*?)\/admin$/g)
		await helpers.setupTotp({ page, baseURL })
		await page.goto(`${baseURL}/admin/account`)
	})

	test.afterAll(async () => {
		await teardown()
		await page.close()
	})

	test('should remove totp cookie', async ({ helpers }) => {
		await helpers.logout({ page })
		const cookies = await page.context().cookies()
		const payloadTotpCookie = cookies.find((cookie) => cookie.name === 'payload-totp')
		expect(payloadTotpCookie).toBeUndefined()
	})
})
