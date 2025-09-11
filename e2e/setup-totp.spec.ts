import type { I18nOptions } from '@payloadcms/translations'
import { expect, type Page } from '@playwright/test'
import { Secret, TOTP } from 'otpauth'

import { type CustomTranslationsObject } from '../src/i18n/types.js'
import { i18n as i18nFn } from '../src/i18n/index.js'
import { test } from './fixtures'

test.describe.configure({ mode: 'parallel' })
const i18n = i18nFn() as I18nOptions<CustomTranslationsObject>

test.describe('Setup TOTP', () => {
	test.describe('Dashboard', () => {
		const params = [true, false]

		params.forEach((forceSetup) => {
			test.describe(`forceSetup is ${forceSetup ? 'true' : 'false'}`, () => {
				test.describe.configure({ mode: 'serial' })

				let page: Page
				let teardown: VoidFunction
				let baseURL: string

				test.beforeAll(async ({ setup, browser, helpers }) => {
					const setupResult = await setup({ forceSetup })
					teardown = setupResult.teardown
					baseURL = setupResult.baseURL
					page = await browser.newPage()

					await helpers.createFirstUser({ page, baseURL })
					if (forceSetup) {
						await page.waitForURL(/^(.*?)\/admin\/setup-totp(\?back=.*?)?$/g)
					} else {
						await page.waitForURL(/^(.*?)\/admin$/g)
					}
					// navigate to setup TOTP page
					await page.goto(`${baseURL}/admin/setup-totp`)
				})

				test.afterAll(async () => {
					await teardown()
					await page.close()
				})

				test('should see QR', async () => {
					const qrImg = page.getByAltText('2FA QR Code')
					await expect(qrImg).toBeVisible()
				})

				test('wrong token should show an error', async () => {
					await page
						.locator('css=input:first-child[type="text"]')
						.pressSequentially('000000', { delay: 300 })

					await expect(
						page.getByText(i18n.translations!.en!.totpPlugin.setup.incorrectCode),
					).toBeVisible()
				})

				test.describe('after PIN verification', async () => {
					test('should redirect back after input', async () => {
						await page
							.getByRole('button', {
								name: i18n.translations?.en?.totpPlugin.setup.addCodeManually,
							})
							.click()
						const totpSecret = await page.getByRole('code').textContent()

						const totp = new TOTP({
							algorithm: 'SHA1',
							digits: 6,
							issuer: 'Payload',
							label: 'human@domain.com',
							period: 30,
							secret: Secret.fromBase32(totpSecret || ''),
						})

						const token = totp.generate()

						await page.locator('css=input:first-child[type="text"]').focus()
						await page.evaluate((token) => navigator.clipboard.writeText(token), token)
						await page
							.locator('css=input:first-child[type="text"]')
							.press('ControlOrMeta+v')
						await expect(page).toHaveURL(`${baseURL}/admin`)
					})

					test('auth strategy should be totp', async () => {
						const res = await page.request.get(`${baseURL}/api/users/me`)
						await expect(res.ok()).toBeTruthy()
						const data = await res.json()
						await expect(data.user).toBeTruthy()
						await expect(data.strategy).toBe('totp')
					})

					test('payload-totp cookie should be set', async () => {
						const cookies = await page.context().cookies()
						const payloadTotpCookie = cookies.find(
							(cookie) => cookie.name === 'payload-totp',
						)
						expect(payloadTotpCookie).toBeDefined()
					})
				})

				test.describe('when user has TOTP configured', () => {
					test('should redirect to main page when navigating to setup page', async () => {
						await page.goto(`${baseURL}/admin/setup-totp`)
						await expect(page).toHaveURL(`${baseURL}/admin`)
					})
				})
			})
		})
	})

	test.describe('API', () => {
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

		test.describe('user is not logged in', () => {
			test('should response error', async () => {
				const res = await page.request.post(`${baseURL}/api/setup-totp`, {
					data: {},
				})
				expect(res.ok()).toBeTruthy()
				const data = await res.json()
				expect(data).toEqual({
					message: 'Unauthorized, you must be logged in to make this request.',
					ok: false,
				})
			})
		})

		test.describe('user is logged in', () => {
			test.beforeAll(async ({ helpers }) => {
				await helpers.createFirstUser({ page, baseURL })
				await page.waitForURL(/^(.*?)\/admin$/g)
			})

			test.describe('should response error', () => {
				test('when body is not JSON', async () => {
					const res = await page.request.post(`${baseURL}/api/setup-totp`, {
						data: 'test',
					})
					expect(res.ok()).toBeTruthy()
					const data = await res.json()
					expect(data).toEqual({
						message: 'An error has occurred.',
						ok: false,
					})
				})

				test('when body is not valid', async () => {
					const res = await page.request.post(`${baseURL}/api/setup-totp`, {
						data: {
							token: 123456,
							secret: 111111111,
						},
					})
					expect(res.ok()).toBeTruthy()
					const data = await res.json()
					expect(data).toEqual({
						message: 'An error has occurred.',
						ok: false,
					})
				})

				test('when token is not valid', async () => {
					const res = await page.request.post(`${baseURL}/api/setup-totp`, {
						data: {
							token: '123456',
							secret: 'secret',
						},
					})
					expect(res.ok()).toBeTruthy()
					const data = await res.json()
					expect(data).toEqual({
						message: i18n.translations?.en?.totpPlugin.setup.incorrectCode,
						ok: false,
					})
				})
			})

			test('should return ok when token is valid', async () => {
				const secret = new Secret({
					size: 32,
				})

				const totp = new TOTP({
					algorithm: 'SHA1',
					digits: 6,
					issuer: 'Payload',
					label: 'human@domain.com',
					period: 30,
					secret,
				})

				const res = await page.request.post(`${baseURL}/api/setup-totp`, {
					data: {
						token: totp.generate(),
						secret: secret.base32,
					},
				})
				expect(res.ok()).toBeTruthy()
				const data = await res.json()
				expect(data).toEqual({ ok: true })
			})

			test('should response error when user already has TOTP', async () => {
				const res = await page.request.post(`${baseURL}/api/setup-totp`, {
					data: {
						token: 123456,
						secret: 111111111,
					},
				})
				expect(res.ok()).toBeTruthy()
				const data = await res.json()
				expect(data).toEqual({
					message: i18n.translations?.en?.totpPlugin.errors.alreadySet,
					ok: false,
				})
			})
		})
	})
})
