import { type Page, expect } from '@playwright/test'

import { test } from './fixtures'

test.describe.configure({ mode: 'parallel' })

test.describe('access', () => {
	test.describe('default', () => {
		test.describe.configure({ mode: 'serial' })

		let page: Page
		let teardown: VoidFunction
		let baseURL: string
		let authorId: string
		let postId: string
		let totpSecret: string

		test.beforeAll(async ({ setup, browser, helpers }) => {
			const setupResult = await setup({ forceSetup: true })
			teardown = setupResult.teardown
			baseURL = setupResult.baseURL
			const context = await browser.newContext()
			page = await context.newPage()

			await helpers.createFirstUser({ page, baseURL })
			await page.waitForURL(/^(.*?)\/admin\/setup-totp(\?back=.*?)?$/g)
			const totpResult = await helpers.setupTotp({ page, baseURL })
			totpSecret = totpResult.totpSecret
			await page.waitForURL(/^(.*?)\/admin$/g)

			const authorsRes = await page.request.post(`${baseURL}/api/authors`, {
				data: {
					firstname: 'George',
					lastname: 'Orwell',
				},
			})

			const authorData = await authorsRes.json()
			authorId = authorData.doc.id

			const postRes = await page.request.post(`${baseURL}/api/posts`, {
				data: {
					title: 'A song of ice and fire',
					content: 'A story about dragons and kings',
				},
			})
			const postData = await postRes.json()
			postId = postData.doc.id

			await helpers.logout({ page })
		})

		test.afterAll(async () => {
			await teardown()
			await page.close()
		})
		;['guest', 'logged in (without TOTP)'].forEach((scenario) => {
			test.describe(scenario, () => {
				test.beforeAll(async ({ helpers }) => {
					if (scenario === 'logged in (without TOTP)') {
						await helpers.login({
							page,
							baseURL,
							email: 'human@domain.com',
							password: '123456',
						})
						await page.waitForURL(/^(.*?)\/admin\/verify-totp/g)
					}
				})

				test.describe('authors', () => {
					test('should forbid read', async () => {
						const res = await page.request.get(`${baseURL}/api/authors`)
						expect(res.ok()).toBeFalsy()
						expect(res.status()).toBe(403)
					})

					test('should forbid create', async () => {
						const res = await page.request.post(`${baseURL}/api/authors`, {
							data: {
								firstname: 'Ferdinand',
								lastname: 'de Saussure	',
							},
						})
						expect(res.ok()).toBeFalsy()
						expect(res.status()).toBe(403)
					})

					test('should forbid update', async () => {
						const res = await page.request.patch(`${baseURL}/api/authors/${authorId}`, {
							data: {
								firstname: 'Ferdinand',
								lastname: 'de Saussure	',
							},
						})
						expect(res.ok()).toBeFalsy()
						expect(res.status()).toBe(403)
					})

					test('should forbid delete', async () => {
						const res = await page.request.delete(`${baseURL}/api/authors/${authorId}`)
						expect(res.ok()).toBeFalsy()
						expect(res.status()).toBe(403)
					})
				})

				test.describe('posts', () => {
					test('should forbid create', async () => {
						const res = await page.request.post(`${baseURL}/api/posts`, {
							data: {
								title: 'Post title',
								content: 'Post content',
							},
						})
						expect(res.ok()).toBeFalsy()
						expect(res.status()).toBe(403)
					})

					test('should allow read', async () => {
						const res = await page.request.get(`${baseURL}/api/posts`)
						expect(res.ok()).toBeTruthy()
						expect(res.status()).toBe(200)
					})

					test('should forbid update', async () => {
						const res = await page.request.patch(`${baseURL}/api/posts/${postId}`, {
							data: {
								title: 'Post title',
								content: 'Post content',
							},
						})
						expect(res.ok()).toBeFalsy()
						expect(res.status()).toBe(403)
					})

					test('should forbid delete', async () => {
						const res = await page.request.delete(`${baseURL}/api/posts/${postId}`)
						expect(res.ok()).toBeFalsy()
						expect(res.status()).toBe(403)
					})
				})

				test.describe('settings', () => {
					test('should allow read', async () => {
						const res = await page.request.get(`${baseURL}/api/globals/settings`)
						expect(res.ok()).toBeTruthy()
						expect(res.status()).toBe(200)
					})

					test('should forbid update', async () => {
						const res = await page.request.post(`${baseURL}/api/globals/settings`, {
							data: {
								darkMode: false,
								maintenance: false,
							},
						})
						expect(res.ok()).toBeFalsy()
						expect(res.status()).toBe(403)
					})
				})
			})
		})

		test.describe('logged in (with TOTP)', () => {
			test.beforeAll(async ({ helpers }) => {
				await helpers.promptTotp({ page, totpSecret })
			})

			test.describe('authors', () => {
				test('should allow read', async () => {
					const res = await page.request.get(`${baseURL}/api/authors`)
					expect(res.ok()).toBeTruthy()
					expect(res.status()).toBe(200)
				})

				test('should allow create', async () => {
					const res = await page.request.post(`${baseURL}/api/authors`, {
						data: {
							firstname: 'Ferdinand',
							lastname: 'de Saussure	',
						},
					})
					expect(res.ok()).toBeTruthy()
					expect(res.status()).toBe(201)
				})

				test('should allow update', async () => {
					const res = await page.request.patch(`${baseURL}/api/authors/${authorId}`, {
						data: {
							firstname: 'Ferdinand',
							lastname: 'de Saussure	',
						},
					})
					expect(res.ok()).toBeTruthy()
					expect(res.status()).toBe(200)
				})

				test('should allow delete', async () => {
					const res = await page.request.delete(`${baseURL}/api/authors/${authorId}`)
					expect(res.ok()).toBeTruthy()
					expect(res.status()).toBe(200)
				})
			})

			test.describe('posts', () => {
				test('should allow create', async () => {
					const res = await page.request.post(`${baseURL}/api/posts`, {
						data: {
							title: 'Post title',
							content: 'Post content',
						},
					})
					expect(res.ok()).toBeTruthy()
					expect(res.status()).toBe(201)
				})

				test('should allow read', async () => {
					const res = await page.request.get(`${baseURL}/api/posts`)
					expect(res.ok()).toBeTruthy()
					expect(res.status()).toBe(200)
				})

				test('should allow update', async () => {
					const res = await page.request.patch(`${baseURL}/api/posts/${postId}`, {
						data: {
							title: 'Post title',
							content: 'Post content',
						},
					})
					expect(res.ok()).toBeTruthy()
					expect(res.status()).toBe(200)
				})

				test('should allow delete', async () => {
					const res = await page.request.delete(`${baseURL}/api/posts/${postId}`)
					expect(res.ok()).toBeTruthy()
					expect(res.status()).toBe(200)
				})
			})

			test.describe('settings', () => {
				test('should allow read', async () => {
					const res = await page.request.get(`${baseURL}/api/globals/settings`)
					expect(res.ok()).toBeTruthy()
					expect(res.status()).toBe(200)
				})

				test('should allow update', async () => {
					const res = await page.request.post(`${baseURL}/api/globals/settings`, {
						data: {
							darkMode: false,
							maintenance: false,
						},
					})
					expect(res.ok()).toBeTruthy()
					expect(res.status()).toBe(200)
				})
			})
		})
	})

	test.describe('disableAccessWrapper global', () => {
		test.describe.configure({ mode: 'serial' })

		let page: Page
		let teardown: VoidFunction
		let baseURL: string
		let authorId: string
		let postId: string

		test.beforeAll(async ({ setup, browser, helpers }) => {
			const setupResult = await setup({ forceSetup: true, disableAccessWrapper: true })
			teardown = setupResult.teardown
			baseURL = setupResult.baseURL
			const context = await browser.newContext()
			page = await context.newPage()

			await helpers.createFirstUser({ page, baseURL })
			await page.waitForURL(/^(.*?)\/admin\/setup-totp(\?back=.*?)?$/g)
			await helpers.setupTotp({ page, baseURL })
			await page.waitForURL(/^(.*?)\/admin$/g)

			const authorsRes = await page.request.post(`${baseURL}/api/authors`, {
				data: {
					firstname: 'George',
					lastname: 'Orwell',
				},
			})

			const authorData = await authorsRes.json()
			authorId = authorData.doc.id

			const postRes = await page.request.post(`${baseURL}/api/posts`, {
				data: {
					title: 'A song of ice and fire',
					content: 'A story about dragons and kings',
				},
			})
			const postData = await postRes.json()
			postId = postData.doc.id

			await helpers.logout({ page })
		})

		test.afterAll(async () => {
			await teardown()
			await page.close()
		})

		test.describe('guest', () => {
			test.describe('authors', () => {
				test('should forbid read', async () => {
					const res = await page.request.get(`${baseURL}/api/authors`)
					expect(res.ok()).toBeFalsy()
					expect(res.status()).toBe(403)
				})

				test('should forbid create', async () => {
					const res = await page.request.post(`${baseURL}/api/authors`, {
						data: {
							firstname: 'Ferdinand',
							lastname: 'de Saussure	',
						},
					})
					expect(res.ok()).toBeFalsy()
					expect(res.status()).toBe(403)
				})

				test('should forbid update', async () => {
					const res = await page.request.patch(`${baseURL}/api/authors/${authorId}`, {
						data: {
							firstname: 'Ferdinand',
							lastname: 'de Saussure	',
						},
					})
					expect(res.ok()).toBeFalsy()
					expect(res.status()).toBe(403)
				})

				test('should forbid delete', async () => {
					const res = await page.request.delete(`${baseURL}/api/authors/${authorId}`)
					expect(res.ok()).toBeFalsy()
					expect(res.status()).toBe(403)
				})
			})

			test.describe('posts', () => {
				test('should forbid create', async () => {
					const res = await page.request.post(`${baseURL}/api/posts`, {
						data: {
							title: 'Post title',
							content: 'Post content',
						},
					})
					expect(res.ok()).toBeFalsy()
					expect(res.status()).toBe(403)
				})

				test('should allow read', async () => {
					const res = await page.request.get(`${baseURL}/api/posts`)
					expect(res.ok()).toBeTruthy()
					expect(res.status()).toBe(200)
				})

				test('should forbid update', async () => {
					const res = await page.request.patch(`${baseURL}/api/posts/${postId}`, {
						data: {
							title: 'Post title',
							content: 'Post content',
						},
					})
					expect(res.ok()).toBeFalsy()
					expect(res.status()).toBe(403)
				})

				test('should forbid delete', async () => {
					const res = await page.request.delete(`${baseURL}/api/posts/${postId}`)
					expect(res.ok()).toBeFalsy()
					expect(res.status()).toBe(403)
				})
			})

			test.describe('settings', () => {
				test('should allow read', async () => {
					const res = await page.request.get(`${baseURL}/api/globals/settings`)
					expect(res.ok()).toBeTruthy()
					expect(res.status()).toBe(200)
				})

				test('should forbid update', async () => {
					const res = await page.request.post(`${baseURL}/api/globals/settings`, {
						data: {
							darkMode: false,
							maintenance: false,
						},
					})
					expect(res.ok()).toBeFalsy()
					expect(res.status()).toBe(403)
				})
			})
		})

		test.describe('logged in (without TOTP)', () => {
			test.beforeAll(async ({ helpers }) => {
				await helpers.login({
					page,
					baseURL,
					email: 'human@domain.com',
					password: '123456',
				})

				await page.waitForURL(/^(.*?)\/admin\/verify-totp/g)
			})

			test.describe('authors', () => {
				test('should allow read', async () => {
					const res = await page.request.get(`${baseURL}/api/authors`)
					expect(res.ok()).toBeTruthy()
					expect(res.status()).toBe(200)
				})

				test('should allow create', async () => {
					const res = await page.request.post(`${baseURL}/api/authors`, {
						data: {
							firstname: 'Ferdinand',
							lastname: 'de Saussure	',
						},
					})
					expect(res.ok()).toBeTruthy()
					expect(res.status()).toBe(201)
				})

				test('should allow update', async () => {
					const res = await page.request.patch(`${baseURL}/api/authors/${authorId}`, {
						data: {
							firstname: 'Ferdinand',
							lastname: 'de Saussure	',
						},
					})
					expect(res.ok()).toBeTruthy()
					expect(res.status()).toBe(200)
				})

				test('should allow delete', async () => {
					const res = await page.request.delete(`${baseURL}/api/authors/${authorId}`)
					expect(res.ok()).toBeTruthy()
					expect(res.status()).toBe(200)
				})
			})

			test.describe('posts', () => {
				test('should allow create', async () => {
					const res = await page.request.post(`${baseURL}/api/posts`, {
						data: {
							title: 'Post title',
							content: 'Post content',
						},
					})
					expect(res.ok()).toBeTruthy()
					expect(res.status()).toBe(201)
				})

				test('should allow read', async () => {
					const res = await page.request.get(`${baseURL}/api/posts`)
					expect(res.ok()).toBeTruthy()
					expect(res.status()).toBe(200)
				})

				test('should allow update', async () => {
					const res = await page.request.patch(`${baseURL}/api/posts/${postId}`, {
						data: {
							title: 'Post title',
							content: 'Post content',
						},
					})
					expect(res.ok()).toBeTruthy()
					expect(res.status()).toBe(200)
				})

				test('should allow delete', async () => {
					const res = await page.request.delete(`${baseURL}/api/posts/${postId}`)
					expect(res.ok()).toBeTruthy()
					expect(res.status()).toBe(200)
				})
			})

			test.describe('settings', () => {
				test('should allow read', async () => {
					const res = await page.request.get(`${baseURL}/api/globals/settings`)
					expect(res.ok()).toBeTruthy()
					expect(res.status()).toBe(200)
				})

				test('should allow update', async () => {
					const res = await page.request.post(`${baseURL}/api/globals/settings`, {
						data: {
							darkMode: false,
							maintenance: false,
						},
					})
					expect(res.ok()).toBeTruthy()
					expect(res.status()).toBe(200)
				})
			})
		})
	})
})
