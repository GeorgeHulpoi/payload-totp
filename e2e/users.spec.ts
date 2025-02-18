import { faker } from '@faker-js/faker'
import { Page, expect } from '@playwright/test'

import { test } from './fixtures'

test.describe.configure({ mode: 'parallel' })

test.describe('Users', () => {
	test.describe('API', () => {
		const forceSetupValues = [true, false]

		forceSetupValues.forEach((forceSetup) => {
			test.describe(`forceSetup is ${forceSetup}`, () => {
				test.describe.configure({ mode: 'serial' })

				let page: Page
				let teardown: VoidFunction
				let baseURL: string
				let mongoUri: string

				test.beforeAll(async ({ setup, browser, helpers }) => {
					const setupResult = await setup()
					teardown = setupResult.teardown
					baseURL = setupResult.baseURL
					mongoUri = setupResult.mongoUri
					const context = await browser.newContext()
					page = await context.newPage()
					await helpers.createFirstUser({ page, baseURL })

					// Create suite of users
					await helpers.createUser({
						email: 'user1@domain.com',
						password: '123456',
						page,
						baseURL,
					})

					await helpers.createUser({
						email: 'user2@domain.com',
						password: '123456',
						page,
						baseURL,
					})

					// Set up TOTP
					const { client, collection } = await helpers.getUsersCollection({ mongoUri })
					await collection.updateOne(
						{
							email: 'user2@domain.com',
						},
						{
							$set: {
								totpSecret: 'test',
							},
						},
					)
					await client.close(true)
				})

				test.afterAll(async () => {
					await teardown()
					await page.close()
				})

				test('should not be able to create user with totpSecret', async ({ helpers }) => {
					const res = await helpers.createUser({
						email: faker.internet.email(),
						password: faker.internet.password(),
						page,
						baseURL,
						data: {
							totpSecret: 'test',
						},
					})

					expect(res.ok()).toBeTruthy()
					const data = await res.json()
					expect(data.doc?.totpSecret).toBeUndefined()

					const { client, collection } = await helpers.getUsersCollection({ mongoUri })
					const user = await collection.findOne({
						email: data.doc.email,
					})

					expect(user).toBeTruthy()
					expect(user?.totpSecret).toBeUndefined()

					await client.close(true)
				})
			})
		})
	})

	test.describe('Dashboard', () => {})
})

// test.describe('users', () => {
// 	test.describe('forceSetup is true', () => {
// 		let page: Page
// 		let teardown: VoidFunction
// 		let baseURL: string

// 		test.beforeAll(async ({ setup, browser, helpers }) => {
// 			const setupResult = await setup({ forceSetup: true })
// 			teardown = setupResult.teardown
// 			baseURL = setupResult.baseURL
// 			page = await browser.newPage()

// 			await helpers.createFirstUser({ page, baseURL })
// 			await helpers.setupTotp({ page, baseURL })
// 			await page.goto(`${baseURL}/admin`)
// 		})

// 		test.afterAll(async () => {
// 			await teardown()
// 			await page.close()
// 		})

// 		test.describe('create new user', () => {
// 			test.skip('should not see TOTP field', async () => {})

// 			test.skip('should not be able to set totpSecret via API', async () => {})

// 			test.skip('should not be able to set totpSecret via GraphQL', async () => {})
// 		})

// 		test.describe('get user', () => {
// 			test.skip('should not see TOTP field', async () => {})

// 			test.skip('should not be able to see totpSecret via API', async () => {})

// 			test.skip('should not be able to see totpSecret via GraphQL', async () => {})
// 		})
// 	})

// 	test.describe('forceSetup is false', () => {
// 		let page: Page
// 		let teardown: VoidFunction
// 		let baseURL: string

// 		test.beforeAll(async ({ setup, browser, helpers }) => {
// 			const setupResult = await setup()
// 			teardown = setupResult.teardown
// 			baseURL = setupResult.baseURL
// 			page = await browser.newPage()
// 			await helpers.createFirstUser({ page, baseURL })
// 			await helpers.setupTotp({ page, baseURL })
// 			await page.goto(`${baseURL}/admin`)
// 		})

// 		test.afterAll(async () => {
// 			await teardown()
// 			await page.close()
// 		})

// 		test.describe('create new user', () => {
// 			test.skip('should not see TOTP field', async () => {})

// 			test.skip('should not be able to set totpSecret via API', async () => {})

// 			test.skip('should not be able to set totpSecret via GraphQL', async () => {})
// 		})

// 		test.describe('get user', () => {
// 			test.skip('should not see TOTP field', async () => {})

// 			test.skip('should not be able to see totpSecret via API', async () => {})

// 			test.skip('should not be able to see totpSecret via GraphQL', async () => {})
// 		})
// 	})
// })
