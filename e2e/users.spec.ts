import { expect, type Page } from '@playwright/test'

import { test } from './fixtures'

test.describe.configure({ mode: 'parallel' })

test.describe('users', () => {
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
		const { totpSecret } = await helpers.setupTotp({ page, baseURL })

		await Promise.all([
			page.request.post(`${baseURL}/api/users`, {
				data: {
					email: 'test1@domain.com',
					password: 'test1_pass',
					totpSecret: '123',
				},
			}),
			page.request.post(`${baseURL}/api/users`, {
				data: {
					email: 'test2@domain.com',
					password: 'test2_pass',
					totpSecret: '456',
				},
			}),
		])

		await helpers.logout({ page })
		await helpers.login({
			page,
			baseURL,
			email: 'test1@domain.com',
			password: 'test1_pass',
		})
		await page.waitForURL(/^(.*?)\/admin\/setup-totp/g)
		await helpers.setupTotp({ page, baseURL })

		await helpers.logout({ page })
		await helpers.login({
			page,
			baseURL,
			email: 'test2@domain.com',
			password: 'test2_pass',
		})
		await page.waitForURL(/^(.*?)\/admin\/setup-totp/g)
		await helpers.setupTotp({ page, baseURL })
		await helpers.logout({ page })
		await helpers.login({
			page,
			baseURL,
			email: 'human@domain.com',
			password: '123456',
		})
		await page.waitForURL(/^(.*?)\/admin\/verify-totp/g)

		await helpers.promptTotp({ page, totpSecret })
	})

	test.afterAll(async () => {
		await teardown()
		await page.close()
	})

	test.describe('API', () => {
		test.describe.configure({ mode: 'serial' })

		test('should not expose totpSecret and hasTotp', async () => {
			const res = await page.request.get(`${baseURL}/api/users`)
			expect(res.ok()).toBeTruthy()
			const data = await res.json()
			expect(data.totalDocs).toEqual(3)
			for (const doc of data.docs) {
				expect(doc.totpSecret).toBeUndefined()

				if (doc.email !== 'human@domain.com') {
					expect(doc.hasTotp).toBeUndefined()
				}
			}
		})
	})

	test.describe('GraphQL', () => {
		test.describe.configure({ mode: 'serial' })

		test('should not expose totpSecret and hasTotp', async () => {
			const res = await page.request.post(`${baseURL}/api/graphql`, {
				data: {
					query: `query { Users { docs { email, totpSecret, hasTotp }, totalDocs } }`,
				},
			})
			expect(res.ok()).toBeTruthy()
			const data = await res.json()
			const docs = data.data.Users.docs
			const totalDocs = data.data.Users.totalDocs
			expect(totalDocs).toEqual(3)
			for (const doc of docs) {
				expect(doc.totpSecret).toBeNull()

				if (doc.email !== 'human@domain.com') {
					expect(doc.hasTotp).toBeNull()
				}
			}
		})
	})

	test.describe('Dashboard', () => {
		test.describe('Collection page', () => {
			test.beforeAll(async () => {
				await page.goto(`${baseURL}/admin/collections/users`)
			})

			test('should not be available totpSecret and hasTotp in Columns', async () => {
				const columnsBtn = page.locator('button:has-text("Columns")')
				await columnsBtn.click()

				const hasTotpBtn = page.locator('button:has-text("Has Totp")')
				const totpSecretBtn = page.locator('button:has-text("Totp Secret")')

				await expect(hasTotpBtn).not.toBeVisible()
				await expect(totpSecretBtn).not.toBeVisible()
			})

			test('should not see other user private fields', async () => {
				const anchor = page
					.locator('css=.row-1')
					.filter({ hasText: 'test1@domain.com' })
					.locator('a')
				await anchor.click()

				await page.waitForURL(/^.*?\/admin\/collections\/users\/[a-zA-Z0-9]*$/g)

				await expect(page.locator('css=#totp-ui-field')).not.toBeVisible()
			})
		})
	})
})
