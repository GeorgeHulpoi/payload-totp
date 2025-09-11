import type { I18nOptions } from '@payloadcms/translations'
import { expect, type Page } from '@playwright/test'
import { Secret, TOTP } from 'otpauth'

import { type CustomTranslationsObject } from '../src/i18n/types.js'
import { i18n as i18nFn } from '../src/i18n/index.js'
import { test } from './fixtures'

test.describe.configure({ mode: 'parallel' })
const i18n = i18nFn() as I18nOptions<CustomTranslationsObject>

test.describe('remove totp', () => {
	test.describe('API', () => {
		test.describe('forceSetup is true', () => {
			test.describe.configure({ mode: 'serial' })

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
			})

			test.afterAll(async () => {
				await teardown()
				await page.close()
			})

			test('should restrict access', async () => {
				const res = await page.request.post(`${baseURL}/api/remove-totp`, {
					data: {
						token: '123456',
					},
				})
				expect(res.ok()).toBeTruthy()
				const data = await res.json()
				expect(data).toEqual({
					message: 'Unauthorized, you must be logged in to make this request.',
					ok: false,
				})
			})
		})

		test.describe('forceSetup is false', () => {
			test.describe.configure({ mode: 'serial' })

			let page: Page
			let teardown: VoidFunction
			let baseURL: string

			test.beforeAll(async ({ setup, browser, helpers }) => {
				const setupResult = await setup()
				teardown = setupResult.teardown
				baseURL = setupResult.baseURL
				const context = await browser.newContext()
				page = await context.newPage()

				await helpers.createFirstUser({ page, baseURL })
				await page.waitForURL(/^(.*?)\/admin$/g)
				await page.goto(`${baseURL}/admin/account`)
			})

			test.afterAll(async () => {
				await teardown()
				await page.close()
			})

			test('should restrict access when not logged in', async ({ browser }) => {
				const context = await browser.newContext()
				const page = await context.newPage()

				const res = await page.request.post(`${baseURL}/api/remove-totp`, {
					data: {
						token: '123456',
					},
				})
				expect(res.ok()).toBeTruthy()
				const data = await res.json()
				expect(data).toEqual({
					message: 'Unauthorized, you must be logged in to make this request.',
					ok: false,
				})
			})

			test.describe('totp not set', () => {
				test('should restrict access', async () => {
					const res = await page.request.post(`${baseURL}/api/remove-totp`, {
						data: {
							token: '123456',
						},
					})
					expect(res.ok()).toBeTruthy()
					const data = await res.json()
					expect(data).toEqual({
						message: 'Unauthorized, you must be logged in to make this request.',
						ok: false,
					})
				})
			})

			test.describe('totp set', () => {
				let totpSecret: string

				test.beforeAll(async ({ helpers }) => {
					const totpResult = await helpers.setupTotp({ page, baseURL })
					totpSecret = totpResult.totpSecret
				})

				test.describe('should response error', () => {
					test('when body is not JSON', async () => {
						const res = await page.request.post(`${baseURL}/api/remove-totp`, {
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
						const res = await page.request.post(`${baseURL}/api/remove-totp`, {
							data: {
								token: 123456,
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
						const res = await page.request.post(`${baseURL}/api/remove-totp`, {
							data: {
								token: '123456',
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

				test.describe(async () => {
					let res

					test.beforeAll(async () => {
						const totp = new TOTP({
							algorithm: 'SHA1',
							digits: 6,
							issuer: 'Payload',
							label: 'human@domain.com',
							period: 30,
							secret: Secret.fromBase32(totpSecret),
						})

						res = await page.request.post(`${baseURL}/api/remove-totp`, {
							data: {
								token: totp.generate(),
							},
						})
					})

					test('should response ok', async () => {
						expect(res.ok()).toBeTruthy()
						const data = await res.json()
						expect(data).toEqual({ ok: true })
					})

					test('should remove cookie', async () => {
						const cookies = await page.context().cookies()
						const payloadTotpCookie = cookies.find(
							(cookie) => cookie.name === 'payload-totp',
						)
						expect(payloadTotpCookie).toBeUndefined()
					})

					test('should no longer has TOTP set', async () => {
						res = await page.request.get(`${baseURL}/api/users/me`)
						expect(res.ok()).toBeTruthy()
						const data = await res.json()
						expect(data?.user?.hasTotp).toBeFalsy()
					})
				})
			})
		})
	})

	test.describe('Dashboard', () => {
		test.describe('forceSetup is true', () => {
			test.describe.configure({ mode: 'serial' })

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
				await page.goto(`${baseURL}/admin/account`)
			})

			test.afterAll(async () => {
				await teardown()
				await page.close()
			})

			test('remove button should not be visible', async () => {
				await expect(page.getByRole('button', { name: 'Remove' })).not.toBeVisible()
			})
		})

		test.describe('forceSetup is false', () => {
			test.describe.configure({ mode: 'serial' })

			let page: Page
			let teardown: VoidFunction
			let baseURL: string

			test.beforeAll(async ({ setup, browser, helpers }) => {
				const setupResult = await setup()
				teardown = setupResult.teardown
				baseURL = setupResult.baseURL
				const context = await browser.newContext()
				page = await context.newPage()

				await helpers.createFirstUser({ page, baseURL })
				await page.waitForURL(/^(.*?)\/admin$/g)
				await page.goto(`${baseURL}/admin/account`)
			})

			test.afterAll(async () => {
				await teardown()
				await page.close()
			})

			test.describe('totp not set', () => {
				test('remove button should not be visible', async () => {
					await page.goto(`${baseURL}/admin/account`)
					await expect(page.getByRole('button', { name: 'Remove' })).not.toBeVisible()
				})
			})

			test.describe('totp set', () => {
				let totpSecret: string

				test.beforeAll(async ({ helpers }) => {
					const totpResult = await helpers.setupTotp({ page, baseURL })
					totpSecret = totpResult.totpSecret
					await page.goto(`${baseURL}/admin/account`)
				})

				test('remove button should be visible', async () => {
					await expect(page.getByRole('button', { name: 'Remove' })).toBeVisible()
				})

				test.describe(() => {
					test.beforeAll(async () => {
						await page.getByRole('button', { name: 'Remove' }).click()
					})

					test('should open modal', async () => {
						const dialog = page.locator('dialog#remove-totp')
						await expect(dialog).toBeVisible()
					})

					test('should contain title Verification', async () => {
						const dialog = page.locator('dialog#remove-totp')
						const title = page.getByText('Verification')
						await expect(title).toBeVisible()
						await expect(dialog.filter({ has: title })).toHaveCount(1)
					})

					test('should show error when token is incorrect', async () => {
						await page
							.locator('css=dialog#remove-totp input:first-child[type="text"]')
							.pressSequentially('000000', { delay: 300 })

						await expect(
							page.getByText(i18n.translations!.en!.totpPlugin.setup.incorrectCode),
						).toBeVisible()
					})

					test.describe(() => {
						test.beforeAll(async () => {
							await page.reload()

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
						})

						test('should reload the page', async () => {
							await expect(page).toHaveURL(`${baseURL}/admin/account`)
						})

						test('should have Setup button visible', async () => {
							await expect(page.getByRole('link', { name: 'Setup' })).toBeVisible()
						})

						test('payload-totp cookie should be deleted', async () => {
							const cookies = await page.context().cookies()
							const payloadTotpCookie = cookies.find(
								(cookie) => cookie.name === 'payload-totp',
							)
							expect(payloadTotpCookie).toBeUndefined()
						})

						test('auth strategy should be the default one', async () => {
							const res = await page.request.get(`${baseURL}/api/users/me`)
							await expect(res.ok()).toBeTruthy()
							const data = await res.json()
							await expect(data.user).toBeTruthy()
							await expect(data.strategy).toBe('local-jwt')
						})
					})
				})
			})
		})
	})
})
