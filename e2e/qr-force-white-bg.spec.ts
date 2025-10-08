import { expect, type Page } from '@playwright/test'

import { test } from './fixtures'

test.describe.configure({ mode: 'parallel' })

test.describe('forceWhiteBackgroundOnQrCode option', () => {
	test.describe('when enabled', () => {
		test.describe.configure({ mode: 'serial' })

		let page: Page
		let teardown: VoidFunction
		let baseURL: string

		test.beforeAll(async ({ setup, browser, helpers }) => {
			const setupResult = await setup({ forceWhiteBackgroundOnQrCode: true })
			teardown = setupResult.teardown
			baseURL = setupResult.baseURL
			page = await browser.newPage()

			await helpers.createFirstUser({ page, baseURL })
			await page.waitForURL(/^(.*?)\/admin$/g)
			await page.goto(`${baseURL}/admin/setup-totp`)
		})

		test.afterAll(async () => {
			teardown()
			await page.close()
		})

		test('QR image has forceWhiteBackground class', async () => {
			const qrImg = page.getByAltText('2FA QR Code')
			await expect(qrImg).toBeVisible()

			// CSS modules keep the local class name in the generated class
			await expect(qrImg).toHaveClass(/forceWhiteBackground/)
		})
	})

	test.describe('when disabled (default)', () => {
		test.describe.configure({ mode: 'serial' })

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
			await page.goto(`${baseURL}/admin/setup-totp`)
		})

		test.afterAll(async () => {
			teardown()
			await page.close()
		})

		test('QR image does not have forceWhiteBackground class', async () => {
			const qrImg = page.getByAltText('2FA QR Code')
			await expect(qrImg).toBeVisible()

			const className = await qrImg.getAttribute('class')
			expect(className || '').not.toMatch(/forceWhiteBackground/)
		})
	})
})
