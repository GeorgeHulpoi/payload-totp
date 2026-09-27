import { type Page, expect } from '@playwright/test'

import { test } from './fixtures'

test.describe.configure({ mode: 'serial' })

test.describe(
	'verify view with an already-verified session',
	{
		annotation: {
			type: 'issue',
			description: 'https://github.com/GeorgeHulpoi/payload-totp/issues/72',
		},
	},
	() => {
		let page: Page
		let teardown: VoidFunction
		let baseURL: string
		let totpCookieValue: string

		test.beforeAll(async ({ setup, browser, helpers }) => {
			const setupResult = await setup({ forceSetup: true })
			teardown = setupResult.teardown
			baseURL = setupResult.baseURL
			const context = await browser.newContext()
			page = await context.newPage()

			await helpers.createFirstUser({ page, baseURL })
			await page.waitForURL(/^(.*?)\/admin\/setup-totp(\?back=.*?)?$/g)
			await helpers.setupTotp({ page, baseURL })
			await page.waitForURL(/^(.*?)\/admin$/g)

			totpCookieValue =
				(await context.cookies()).find((cookie) => cookie.name === 'payload-totp')?.value ??
				''
			expect(totpCookieValue).not.toEqual('')
		})

		test.afterAll(async () => {
			await teardown()
			await page.close()
		})

		test('should send a verified session back to the dashboard', async () => {
			await page.goto(`${baseURL}/admin/verify-totp`)
			await expect(page).toHaveURL(/^(.*?)\/admin$/g)
		})

		test('should send a session trusted by a surviving cookie back to the dashboard', async ({
			helpers,
		}) => {
			// A "remember this device" setup keeps the TOTP cookie across logins, so the
			// second factor is already satisfied by the time the verify view renders.
			await page.goto(`${baseURL}/admin`)
			await helpers.logout({ page })
			await helpers.login({ page, baseURL, email: 'human@domain.com', password: '123456' })
			await page.waitForURL(/^(.*?)\/admin\/verify-totp(\?back=.*?)?$/g)

			await page.context().addCookies([
				{
					name: 'payload-totp',
					url: baseURL,
					value: totpCookieValue,
				},
			])

			await page.goto(`${baseURL}/admin/verify-totp`)
			await expect(page).toHaveURL(/^(.*?)\/admin$/g)
		})
	},
)
