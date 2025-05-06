import { expect, Page } from '@playwright/test'

import { test } from './fixtures'

test.describe.configure({ mode: 'parallel' })

test.describe('account', () => {
	test.describe('user have TOTP configured', () => {
		test.describe('forceSetup is true', () => {
			let page: Page
			let teardown: VoidFunction
			let baseURL: string

			test.beforeAll(async ({ setup, browser, helpers }) => {
				const setupResult = await setup({ forceSetup: true })
				teardown = setupResult.teardown
				baseURL = setupResult.baseURL
				page = await browser.newPage()

				await helpers.createFirstUser({ page, baseURL })
				await page.waitForURL(/^(.*?)\/admin\/setup-totp(\?back=.*?)?$/g)
				await helpers.setupTotp({ page, baseURL })
				await page.goto(`${baseURL}/admin/account`)
			})

			test.afterAll(async () => {
				await teardown()
				await page.close()
			})

			test('setup button should not be visible', async () => {
				await expect(page.getByRole('link', { name: 'Setup' })).not.toBeVisible()
			})

			test('remove button should not be visible', async () => {
				await expect(page.getByRole('button', { name: 'Remove' })).not.toBeVisible()
			})

			test('should have Configured span', async () => {
				const span = page.getByText('Configured')
				const root = page.locator('css=#totp-ui-field')
				await expect(span).toBeVisible()
				await expect(root.filter({ has: span })).toHaveCount(1)
			})

			test.describe('GET /api/account/me', () => {
				test.describe.configure({ mode: 'serial' })

				let res
				let data

				test.beforeAll(async () => {
					res = await page.request.get(`${baseURL}/api/users/me`)

					if (res.ok()) {
						data = await res.json()
					}
				})

				test('response should be ok', async () => {
					await expect(res.ok()).toBeTruthy()
				})

				test('user should be logged in with totp strategy', async () => {
					await expect(data.user).toBeTruthy()
					await expect(data.strategy).toBe('totp')
				})

				test('should not include totpSecret', async () => {
					await expect(data.user.totpSecret).toBeUndefined()
				})
			})

			test.describe('GraphQL meUser', () => {
				test.describe.configure({ mode: 'serial' })

				let res
				let data

				test.beforeAll(async () => {
					res = await page.request.post(`${baseURL}/api/graphql`, {
						data: {
							query: `query { meUser { user { email, totpSecret }, strategy }}`,
						},
					})

					if (res.ok()) {
						data = await res.json()
					}
				})

				test('response should be ok', async () => {
					await expect(res.ok()).toBeTruthy()
				})

				test('user should be logged in with totp strategy', async () => {
					await expect(data.data.meUser.user).toBeTruthy()
					await expect(data.data.meUser.strategy).toBe('totp')
				})

				test('should not include totpSecret', async () => {
					await expect(data.data.meUser.user.totpSecret).toBeNull()
				})
			})
		})

		test.describe('forceSetup is false', () => {
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

			test('setup button should not be visible', async () => {
				await expect(page.getByRole('link', { name: 'Setup' })).not.toBeVisible()
			})

			test('remove button should be visible', async () => {
				await expect(page.getByRole('button', { name: 'Remove' })).toBeVisible()
			})

			test('should have Configured span', async () => {
				const span = page.getByText('Configured')
				const root = page.locator('css=#totp-ui-field')
				await expect(span).toBeVisible()
				await expect(root.filter({ has: span })).toHaveCount(1)
			})

			test.describe('GET /api/account/me', () => {
				test.describe.configure({ mode: 'serial' })

				let res
				let data

				test.beforeAll(async () => {
					res = await page.request.get(`${baseURL}/api/users/me`)

					if (res.ok()) {
						data = await res.json()
					}
				})

				test('response should be ok', async () => {
					await expect(res.ok()).toBeTruthy()
				})

				test('user should be logged in with totp strategy', async () => {
					await expect(data.user).toBeTruthy()
					await expect(data.strategy).toBe('totp')
				})

				test('should not include totpSecret', async () => {
					await expect(data.user.totpSecret).toBeUndefined()
				})
			})

			test.describe('GraphQL meUser', () => {
				test.describe.configure({ mode: 'serial' })

				let res
				let data

				test.beforeAll(async () => {
					res = await page.request.post(`${baseURL}/api/graphql`, {
						data: {
							query: `query { meUser { user { email, totpSecret }, strategy }}`,
						},
					})

					if (res.ok()) {
						data = await res.json()
					}
				})

				test('response should be ok', async () => {
					await expect(res.ok()).toBeTruthy()
				})

				test('user should be logged in with totp strategy', async () => {
					await expect(data.data.meUser.user).toBeTruthy()
					await expect(data.data.meUser.strategy).toBe('totp')
				})

				test('should not include totpSecret', async () => {
					await expect(data.data.meUser.user.totpSecret).toBeNull()
				})
			})
		})

		test.describe('user.forceTotp is true', () => {
			let page: Page
			let teardown: VoidFunction
			let baseURL: string

			test.beforeAll(async ({ setup, browser, helpers }) => {
				const setupResult = await setup({ forceSetup: true })
				teardown = setupResult.teardown
				baseURL = setupResult.baseURL
				page = await browser.newPage()

				await helpers.createFirstUser({ page, baseURL, forceTotp: true })
				await page.waitForURL(/^(.*?)\/admin\/setup-totp(\?back=.*?)?$/g)
				await helpers.setupTotp({ page, baseURL })
				await page.goto(`${baseURL}/admin/account`)
			})

			test.afterAll(async () => {
				await teardown()
				await page.close()
			})

			test('setup button should not be visible', async () => {
				await expect(page.getByRole('link', { name: 'Setup' })).not.toBeVisible()
			})

			test('remove button should not be visible', async () => {
				await expect(page.getByRole('button', { name: 'Remove' })).not.toBeVisible()
			})

			test('should have Configured span', async () => {
				const span = page.getByText('Configured')
				const root = page.locator('css=#totp-ui-field')
				await expect(span).toBeVisible()
				await expect(root.filter({ has: span })).toHaveCount(1)
			})

			test.describe('GET /api/account/me', () => {
				test.describe.configure({ mode: 'serial' })

				let res
				let data

				test.beforeAll(async () => {
					res = await page.request.get(`${baseURL}/api/users/me`)

					if (res.ok()) {
						data = await res.json()
					}
				})

				test('response should be ok', async () => {
					await expect(res.ok()).toBeTruthy()
				})

				test('user should be logged in with totp strategy', async () => {
					await expect(data.user).toBeTruthy()
					await expect(data.strategy).toBe('totp')
				})

				test('should not include totpSecret', async () => {
					await expect(data.user.totpSecret).toBeUndefined()
				})
			})

			test.describe('GraphQL meUser', () => {
				test.describe.configure({ mode: 'serial' })

				let res
				let data

				test.beforeAll(async () => {
					res = await page.request.post(`${baseURL}/api/graphql`, {
						data: {
							query: `query { meUser { user { email, totpSecret }, strategy }}`,
						},
					})

					if (res.ok()) {
						data = await res.json()
					}
				})

				test('response should be ok', async () => {
					await expect(res.ok()).toBeTruthy()
				})

				test('user should be logged in with totp strategy', async () => {
					await expect(data.data.meUser.user).toBeTruthy()
					await expect(data.data.meUser.strategy).toBe('totp')
				})

				test('should not include totpSecret', async () => {
					await expect(data.data.meUser.user.totpSecret).toBeNull()
				})
			})
		})
	})

	test.describe("user doesn't have TOTP configured", () => {
		test.describe('forceSetup is true', () => {
			let page: Page
			let baseURL: string
			let teardown: VoidFunction

			test.beforeAll(async ({ setup, browser, helpers }) => {
				const setupResult = await setup({ forceSetup: true })
				teardown = setupResult.teardown
				baseURL = setupResult.baseURL
				page = await browser.newPage()
				await helpers.createFirstUser({ page, baseURL })
				await page.waitForURL(/^(.*?)\/admin\/setup-totp(\?back=.*?)?$/g)
			})

			test.afterAll(async () => {
				await teardown()
				await page.close()
			})

			test('should redirect to setup page', async ({}) => {
				await page.goto(`${baseURL}/admin/account`)
				await expect(page).toHaveURL(/^(.*?)\/admin\/setup-totp(\?back=.*?)?$/g)
			})

			test.describe('GET /api/account/me', () => {
				test.describe.configure({ mode: 'serial' })

				let res
				let data

				test.beforeAll(async () => {
					res = await page.request.get(`${baseURL}/api/users/me`)

					if (res.ok()) {
						data = await res.json()
					}
				})

				test('response should be ok', async () => {
					await expect(res.ok()).toBeTruthy()
				})

				test('user should be logged in with default strategy', async () => {
					await expect(data.user).toBeTruthy()
					await expect(data.strategy).not.toBe('totp')
				})

				test('should not include totpSecret', async () => {
					await expect(data.user.totpSecret).toBeUndefined()
				})
			})

			test.describe('GraphQL meUser', () => {
				test.describe.configure({ mode: 'serial' })

				let res
				let data

				test.beforeAll(async () => {
					res = await page.request.post(`${baseURL}/api/graphql`, {
						data: {
							query: `query { meUser { user { email, totpSecret }, strategy }}`,
						},
					})

					if (res.ok()) {
						data = await res.json()
					}
				})

				test('response should be ok', async () => {
					await expect(res.ok()).toBeTruthy()
				})

				test('user should be logged in with default strategy', async () => {
					await expect(data.data.meUser.user).toBeTruthy()
					await expect(data.data.meUser.strategy).not.toBe('totp')
				})

				test('should not include totpSecret', async () => {
					await expect(data.data.meUser.user.totpSecret).toBeNull()
				})
			})
		})

		test.describe('forceSetup is false', () => {
			let page: Page
			let teardown: VoidFunction
			let baseURL: string = ''

			test.beforeAll(async ({ setup, browser, helpers }) => {
				const setupResult = await setup()
				teardown = setupResult.teardown
				baseURL = setupResult.baseURL
				page = await browser.newPage()
				await helpers.createFirstUser({ page, baseURL })
				await page.waitForURL(/^(.*?)\/admin$/g)
				await page.goto(`${baseURL}/admin/account`)
			})

			test.afterAll(async () => {
				await teardown()
				await page.close()
			})

			test('setup button should be visible', async () => {
				await expect(page.getByRole('link', { name: 'Setup' })).toBeVisible()
			})

			test('click should go to setup page', async ({}) => {
				await page.getByRole('link', { name: 'Setup' }).click({ force: true })
				await page.waitForURL(/^(.*?)\/admin\/setup-totp(\?back=.*?)?$/g)
				await expect(page).toHaveURL(/^(.*?)\/admin\/setup-totp(\?back=.*?)?$/g)
				await page.goto(`${baseURL}/admin/account`)
			})

			test('remove button should not be visible', async () => {
				await expect(page.getByRole('button', { name: 'Remove' })).not.toBeVisible()
			})

			test('should not have Configured span', async () => {
				const span = page.getByText('Configured')
				const root = page.locator('css=#totp-ui-field')
				await expect(span).not.toBeVisible()
				await expect(root.filter({ has: span })).toHaveCount(0)
			})

			test.describe('GET /api/account/me', () => {
				test.describe.configure({ mode: 'serial' })

				let res
				let data

				test.beforeAll(async () => {
					res = await page.request.get(`${baseURL}/api/users/me`)

					if (res.ok()) {
						data = await res.json()
					}
				})

				test('response should be ok', async () => {
					await expect(res.ok()).toBeTruthy()
				})

				test('user should be logged in with default strategy', async () => {
					await expect(data.user).toBeTruthy()
					await expect(data.strategy).not.toBe('totp')
				})

				test('should not include totpSecret', async () => {
					await expect(data.user.totpSecret).toBeUndefined()
				})
			})

			test.describe('GraphQL meUser', () => {
				test.describe.configure({ mode: 'serial' })

				let res
				let data

				test.beforeAll(async () => {
					res = await page.request.post(`${baseURL}/api/graphql`, {
						data: {
							query: `query { meUser { user { email, totpSecret }, strategy }}`,
						},
					})

					if (res.ok()) {
						data = await res.json()
					}
				})

				test('response should be ok', async () => {
					await expect(res.ok()).toBeTruthy()
				})

				test('user should be logged in with default strategy', async () => {
					await expect(data.data.meUser.user).toBeTruthy()
					await expect(data.data.meUser.strategy).not.toBe('totp')
				})

				test('should not include totpSecret', async () => {
					await expect(data.data.meUser.user.totpSecret).toBeNull()
				})
			})
		})

		test.describe('user.forceTotp is true', () => {
			let page: Page
			let baseURL: string
			let teardown: VoidFunction

			test.beforeAll(async ({ setup, browser, helpers }) => {
				const setupResult = await setup({ forceSetup: false })
				teardown = setupResult.teardown
				baseURL = setupResult.baseURL
				page = await browser.newPage()
				await helpers.createFirstUser({ page, baseURL, forceTotp: true })
				await page.waitForURL(/^(.*?)\/admin\/setup-totp(\?back=.*?)?$/g)
			})

			test.afterAll(async () => {
				await teardown()
				await page.close()
			})

			test('should redirect to setup page', async ({}) => {
				await page.goto(`${baseURL}/admin/account`)
				await expect(page).toHaveURL(/^(.*?)\/admin\/setup-totp(\?back=.*?)?$/g)
			})

			test.describe('GET /api/account/me', () => {
				test.describe.configure({ mode: 'serial' })

				let res
				let data

				test.beforeAll(async () => {
					res = await page.request.get(`${baseURL}/api/users/me`)

					if (res.ok()) {
						data = await res.json()
					}
				})

				test('response should be ok', async () => {
					await expect(res.ok()).toBeTruthy()
				})

				test('user should be logged in with default strategy', async () => {
					await expect(data.user).toBeTruthy()
					await expect(data.strategy).not.toBe('totp')
				})

				test('should not include totpSecret', async () => {
					await expect(data.user.totpSecret).toBeUndefined()
				})
			})

			test.describe('GraphQL meUser', () => {
				test.describe.configure({ mode: 'serial' })

				let res
				let data

				test.beforeAll(async () => {
					res = await page.request.post(`${baseURL}/api/graphql`, {
						data: {
							query: `query { meUser { user { email, totpSecret }, strategy }}`,
						},
					})

					if (res.ok()) {
						data = await res.json()
					}
				})

				test('response should be ok', async () => {
					await expect(res.ok()).toBeTruthy()
				})

				test('user should be logged in with default strategy', async () => {
					await expect(data.data.meUser.user).toBeTruthy()
					await expect(data.data.meUser.strategy).not.toBe('totp')
				})

				test('should not include totpSecret', async () => {
					await expect(data.data.meUser.user.totpSecret).toBeNull()
				})
			})
		})
	})
})
