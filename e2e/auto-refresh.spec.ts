import { expect, type Page } from '@playwright/test'

import { test } from './fixtures'

test.describe.configure({ mode: 'serial' })

const tokenExpirationSeconds = 5

test.describe('auto refresh', () => {
	test.describe('when autoRefresh is enabled', () => {
		let page: Page
		let teardown: VoidFunction
		let baseURL: string

		test.beforeAll(async ({ setup, browser, helpers }) => {
			const setupResult = await setup({
				autoRefresh: true,
				forceSetup: true,
				tokenExpiration: tokenExpirationSeconds,
			})
			teardown = setupResult.teardown
			baseURL = setupResult.baseURL
			page = await browser.newPage()

			await helpers.createFirstUser({ page, baseURL })
			await page.waitForURL(/^(.*?)\/admin\/setup-totp(\?back=.*?)?$/g)
			await helpers.setupTotp({ page, baseURL })
			await page.waitForURL(/^(.*?)\/admin$/g)
		})

		test.afterAll(async () => {
			await teardown()
			await page.close()
		})

		test('should refresh TOTP cookie on token refresh', async () => {
			const cookiesBefore = await page.context().cookies()
			const totpCookieBefore = cookiesBefore.find((cookie) => cookie.name === 'payload-totp')
			expect(totpCookieBefore).toBeDefined()
			const previousToken = totpCookieBefore!.value
			const previousExpiresAt = totpCookieBefore!.expires

			await page.waitForTimeout(1000)

			const refreshResponse = await page.request.post(
				`${baseURL}/api/users/refresh-token?refresh`,
			)
			expect(refreshResponse.ok()).toBeTruthy()

			const cookiesAfter = await page.context().cookies()
			const totpCookieAfter = cookiesAfter.find((cookie) => cookie.name === 'payload-totp')
			expect(totpCookieAfter).toBeDefined()
			expect(totpCookieAfter!.value).not.toBe(previousToken)
			expect(totpCookieAfter!.expires).toBeGreaterThan(previousExpiresAt)

			const nowSeconds = Date.now() / 1000
			const waitSeconds = Math.max(previousExpiresAt + 1 - nowSeconds, 0)
			await page.waitForTimeout(waitSeconds * 1000)

			const meResponse = await page.request.get(`${baseURL}/api/users/me`)
			expect(meResponse.ok()).toBeTruthy()
			const meData = await meResponse.json()
			expect(meData.user).toBeTruthy()
		})
	})

	test.describe('when autoRefresh is disabled', () => {
		let page: Page
		let teardown: VoidFunction
		let baseURL: string

		test.beforeAll(async ({ setup, browser, helpers }) => {
			const setupResult = await setup({
				autoRefresh: false,
				forceSetup: true,
				tokenExpiration: tokenExpirationSeconds,
			})
			teardown = setupResult.teardown
			baseURL = setupResult.baseURL
			page = await browser.newPage()

			await helpers.createFirstUser({ page, baseURL })
			await page.waitForURL(/^(.*?)\/admin\/setup-totp(\?back=.*?)?$/g)
			await helpers.setupTotp({ page, baseURL })
			await page.waitForURL(/^(.*?)\/admin$/g)
		})

		test.afterAll(async () => {
			await teardown()
			await page.close()
		})

		test('should log out after token expiration', async () => {
			await page.goto(`${baseURL}/`)
			await page.waitForTimeout((tokenExpirationSeconds + 1) * 1000)

			const meResponse = await page.request.get(`${baseURL}/api/users/me`)
			expect(meResponse.ok()).toBeTruthy()
			const meData = await meResponse.json()
			expect(meData.user).toBeNull()

			await page.goto(`${baseURL}/admin`)
			await expect(page.getByLabel('Email')).toBeVisible()
		})
	})
})
