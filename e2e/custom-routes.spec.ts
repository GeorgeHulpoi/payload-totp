import type { I18nOptions } from '@payloadcms/translations'
import { expect, type Page } from '@playwright/test'
import { Secret, TOTP } from 'otpauth'

import { type CustomTranslationsObject } from '../src/i18n/types.js'
import { i18n as i18nFn } from '../src/i18n/index.js'
import { test } from './fixtures'

test.describe.configure({ mode: 'serial' })
const i18n = i18nFn() as I18nOptions<CustomTranslationsObject>

test.describe('Custom routes', () => {
	let page: Page
	let teardown: VoidFunction
	let baseURL: string
	let totpSecret: string

	test.beforeAll(async ({ setup, browser }) => {
		const setupResult = await setup({
			overrideBaseURL: 'http://127.0.0.1:3100',
			overridePort: 3100,
			adminRoute: '/admin2',
			apiRoute: '/api2',
			serverURL: 'http://127.0.0.1:3100',
		})
		teardown = setupResult.teardown
		baseURL = setupResult.baseURL
		page = await browser.newPage()
	})

	test.afterAll(async () => {
		await teardown()
		await page.close()
	})

	test('should redirect to dashboard after signup', async ({ helpers }) => {
		await helpers.createFirstUser({ page, baseURL, adminRoute: '/admin2' })
		await expect(page).toHaveURL(/^(.*?)\/admin2$/g)
	})

	test('should set totp', async ({ helpers }) => {
		const totpResult = await helpers.setupTotp({ page, baseURL, adminRoute: '/admin2' })
		totpSecret = totpResult.totpSecret
		await page.goto(`${baseURL}/admin2`)
	})

	test('should remove totp', async () => {
		await page.goto(`${baseURL}/admin2/account`)
		await page.getByRole('button', { name: 'Remove' }).click()

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
			.locator('css=dialog#remove-totp input:first-child[type="text"]')
			.pressSequentially(token, { delay: 300 })

		await expect(page.getByRole('link', { name: 'Setup' })).toBeVisible()
	})
})
