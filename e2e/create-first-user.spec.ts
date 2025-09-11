import { expect, type Page } from '@playwright/test'
import { test } from './fixtures'

test.describe.configure({ mode: 'parallel' })

test.describe('create first user', () => {
	test.describe('forceSetup is false', () => {
		test.describe.configure({ mode: 'serial' })

		let page: Page
		let teardown: VoidFunction
		let baseURL: string

		test.beforeAll(async ({ setup, browser }) => {
			const setupResult = await setup()
			teardown = setupResult.teardown
			baseURL = setupResult.baseURL
			page = await browser.newPage()
		})

		test.afterAll(async () => {
			await teardown()
			await page.close()
		})

		test('field should be not visible', async () => {
			await expect(page.getByText('Authenticator app')).not.toBeVisible()
			await expect(page.locator('css=#totp-ui-field')).not.toBeVisible()
		})

		test('should redirect to dashboard after signup', async ({ helpers }) => {
			await helpers.createFirstUser({ page, baseURL })
			await expect(page).toHaveTitle('Dashboard - Payload')
		})
	})

	test.describe('forceSetup is true', () => {
		test.describe.configure({ mode: 'serial' })

		let page: Page
		let teardown: VoidFunction
		let baseURL: string

		test.beforeAll(async ({ setup, browser }) => {
			const setupResult = await setup({ forceSetup: true })
			teardown = setupResult.teardown
			baseURL = setupResult.baseURL
			page = await browser.newPage()
		})

		test.afterAll(async () => {
			await teardown()
			await page.close()
		})

		test('field should be not visible', async () => {
			await expect(page.getByText('Authenticator app')).not.toBeVisible()
			await expect(page.locator('css=#totp-ui-field')).not.toBeVisible()
		})

		test('should redirect to setup page after signup', async ({ helpers }) => {
			await helpers.createFirstUser({ page, baseURL })
			await expect(page).toHaveURL(/^(.*?)\/admin\/setup-totp(\?back=.*?)?$/g)
		})
	})
})
