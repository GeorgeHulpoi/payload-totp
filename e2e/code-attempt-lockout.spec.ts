import type { I18nOptions } from '@payloadcms/translations'

import { type APIResponse, type BrowserContext, expect, type Page } from '@playwright/test'
import { Secret, TOTP } from 'otpauth'

import { i18n as i18nFn } from '../src/i18n/index.js'
import { type CustomTranslationsObject } from '../src/i18n/types.js'
import { test } from './fixtures'

const i18n = i18nFn() as I18nOptions<CustomTranslationsObject>

/** Payload's default `maxLoginAttempts`, which the dev users collection keeps. */
const MAX_LOGIN_ATTEMPTS = 5

const CREDENTIALS = { email: 'human@domain.com', password: '123456' }

const INCORRECT = {
	message: i18n.translations?.en?.totpPlugin.setup.incorrectCode,
	ok: false,
}
const LOCKED = {
	message: 'This user is locked due to having too many failed login attempts.',
	ok: false,
}

const totpFor = (totpSecret: string) =>
	new TOTP({
		algorithm: 'SHA1',
		digits: 6,
		issuer: 'Payload',
		label: CREDENTIALS.email,
		period: 30,
		secret: Secret.fromBase32(totpSecret),
	})

/** A code outside the steps the endpoints accept, now and for the next few minutes. */
function wrongCode(totpSecret: string) {
	const totp = totpFor(totpSecret)
	const accepted = new Set<string>()

	for (let step = -2; step <= 10; step++) {
		accepted.add(totp.generate({ timestamp: Date.now() + step * 30_000 }))
	}

	let code = 0

	while (accepted.has(code.toString().padStart(6, '0'))) {
		code++
	}

	return code.toString().padStart(6, '0')
}

/** The endpoints answer 200 whatever the outcome, which is in the body. */
const okBody = async (res: APIResponse) => {
	expect(res.ok()).toBeTruthy()
	return res.json()
}

test.describe(
	'code attempt lockout',
	{
		annotation: {
			type: 'issue',
			description: 'https://github.com/GeorgeHulpoi/payload-totp/issues/73',
		},
	},
	() => {
		test.describe('on the verify screen', () => {
			test.describe.configure({ mode: 'serial' })

			let context: BrowserContext
			let page: Page
			let teardown: VoidFunction
			let baseURL: string
			let totpSecret: string

			const verify = (token: string) =>
				context.request.post(`${baseURL}/api/verify-totp`, { data: { token } })
			const login = () =>
				context.request.post(`${baseURL}/api/users/login`, { data: CREDENTIALS })

			test.beforeAll(async ({ setup, browser, helpers }) => {
				const setupResult = await setup({ forceSetup: true })
				teardown = setupResult.teardown
				baseURL = setupResult.baseURL
				context = await browser.newContext()
				page = await context.newPage()

				await helpers.createFirstUser({ page, baseURL })
				await page.waitForURL(/^(.*?)\/admin\/setup-totp(\?back=.*?)?$/g)
				totpSecret = (await helpers.setupTotp({ page, baseURL })).totpSecret

				await helpers.logout({ page })
				await helpers.login({ page, baseURL, ...CREDENTIALS })
				await page.waitForURL(/^(.*?)\/admin\/verify-totp(\?back=.*?)?$/g)
			})

			test.afterAll(async () => {
				await teardown()
				await page.close()
			})

			test('should keep the count through a refresh and a new login', async () => {
				for (let attempt = 1; attempt < MAX_LOGIN_ATTEMPTS; attempt++) {
					expect(await okBody(await verify(wrongCode(totpSecret)))).toEqual(INCORRECT)
				}

				// Both write the whole user document back, and the login clears Payload's
				// own count of wrong passwords.
				expect(
					(await context.request.post(`${baseURL}/api/users/refresh-token`)).ok(),
				).toBeTruthy()
				expect((await login()).ok()).toBeTruthy()

				expect(await okBody(await verify(wrongCode(totpSecret)))).toEqual(INCORRECT)
				expect(await okBody(await verify(wrongCode(totpSecret)))).toEqual(LOCKED)
			})

			test('should refuse a correct code while locked', async () => {
				expect(await okBody(await verify(totpFor(totpSecret).generate()))).toEqual(LOCKED)
			})

			test('should show the lock on the form', async () => {
				await page
					.locator('css=input:first-child[type="text"]')
					.pressSequentially(totpFor(totpSecret).generate(), { delay: 300 })

				await expect(page.getByText(LOCKED.message)).toBeVisible()
				await expect(page).toHaveURL(/^(.*?)\/admin\/verify-totp(\?back=.*?)?$/g)
			})

			test('should refuse the password too', async () => {
				const res = await login()

				expect(res.status()).toBe(401)
				expect((await res.json()).errors[0].message).toBe(LOCKED.message)
			})
		})

		test.describe('while logins overlap the codes', () => {
			let context: BrowserContext
			let page: Page
			let teardown: VoidFunction
			let baseURL: string
			let totpSecret: string

			test.beforeAll(async ({ setup, browser, helpers }) => {
				const setupResult = await setup({ forceSetup: true })
				teardown = setupResult.teardown
				baseURL = setupResult.baseURL
				context = await browser.newContext()
				page = await context.newPage()

				await helpers.createFirstUser({ page, baseURL })
				await page.waitForURL(/^(.*?)\/admin\/setup-totp(\?back=.*?)?$/g)
				totpSecret = (await helpers.setupTotp({ page, baseURL })).totpSecret

				await helpers.logout({ page })
				await helpers.login({ page, baseURL, ...CREDENTIALS })
				await page.waitForURL(/^(.*?)\/admin\/verify-totp(\?back=.*?)?$/g)
			})

			test.afterAll(async () => {
				await teardown()
				await page.close()
			})

			// Payload's login, refresh and logout write back the whole user document they
			// read when they started, so a count kept on it is put back by each of them. These
			// are also the user's first codes, sent at once.
			test('should check no more than the allowed codes', async () => {
				const token = wrongCode(totpSecret)
				const post = (path: string, data?: object) =>
					context.request.post(`${baseURL}/api${path}`, { data })

				const replies = await Promise.all(
					Array.from({ length: MAX_LOGIN_ATTEMPTS * 4 }, async () => {
						const [code] = await Promise.all([
							post('/verify-totp', { token }),
							post('/users/login', CREDENTIALS),
							post('/users/refresh-token'),
						])

						return okBody(code)
					}),
				)

				expect(replies.filter((reply) => reply.message === INCORRECT.message)).toHaveLength(
					MAX_LOGIN_ATTEMPTS,
				)
				expect(
					await okBody(await post('/verify-totp', { token: totpFor(totpSecret).generate() })),
				).toEqual(LOCKED)
			})
		})

		// Each test here starts from the count or the lock the one before it left.
		test.describe('with a verified session', () => {
			test.describe.configure({ mode: 'serial' })

			let page: Page
			let teardown: VoidFunction
			let baseURL: string
			let totpSecret: string

			const verify = (token: string) =>
				page.request.post(`${baseURL}/api/verify-totp`, { data: { token } })
			const remove = (token: string) =>
				page.request.post(`${baseURL}/api/remove-totp`, { data: { token } })

			test.beforeAll(async ({ setup, browser, helpers }) => {
				const setupResult = await setup()
				teardown = setupResult.teardown
				baseURL = setupResult.baseURL
				const context = await browser.newContext()
				page = await context.newPage()

				await helpers.createFirstUser({ page, baseURL })
				await page.waitForURL(/^(.*?)\/admin$/g)
				totpSecret = (await helpers.setupTotp({ page, baseURL })).totpSecret
			})

			test.afterAll(async () => {
				await teardown()
				await page.close()
			})

			test('should clear the count after a correct code', async () => {
				for (let attempt = 1; attempt < MAX_LOGIN_ATTEMPTS; attempt++) {
					expect(await okBody(await verify(wrongCode(totpSecret)))).toEqual(INCORRECT)
				}

				expect(await okBody(await verify(totpFor(totpSecret).generate()))).toEqual({
					ok: true,
				})

				// Had the count survived, the second of these would be refused as locked.
				expect(await okBody(await verify(wrongCode(totpSecret)))).toEqual(INCORRECT)
				expect(await okBody(await verify(wrongCode(totpSecret)))).toEqual(INCORRECT)

				expect(await okBody(await verify(totpFor(totpSecret).generate()))).toEqual({
					ok: true,
				})
			})

			test('should accept a correct code on the last allowed attempt', async () => {
				for (let attempt = 1; attempt < MAX_LOGIN_ATTEMPTS; attempt++) {
					expect(await okBody(await remove(wrongCode(totpSecret)))).toEqual(INCORRECT)
				}

				expect(await okBody(await verify(totpFor(totpSecret).generate()))).toEqual({
					ok: true,
				})
			})

			test('should check no more than the allowed codes of a parallel burst', async () => {
				const token = wrongCode(totpSecret)
				const replies = await Promise.all(
					Array.from({ length: MAX_LOGIN_ATTEMPTS * 2 }, async () =>
						okBody(await remove(token)),
					),
				)

				expect(replies.filter((reply) => reply.message === INCORRECT.message)).toHaveLength(
					MAX_LOGIN_ATTEMPTS,
				)
				expect(replies.filter((reply) => reply.message === LOCKED.message)).toHaveLength(
					MAX_LOGIN_ATTEMPTS,
				)
			})

			test('should keep TOTP when a correct code arrives while locked', async () => {
				expect(await okBody(await remove(totpFor(totpSecret).generate()))).toEqual(LOCKED)

				const me = await okBody(await page.request.get(`${baseURL}/api/users/me`))
				expect(me?.user?.hasTotp).toBeTruthy()
			})

			test('should stay locked when the user unlocks their own account', async () => {
				// Payload lets any logged-in user unlock by default.
				const unlock = await page.request.post(`${baseURL}/api/users/unlock`, {
					data: { email: CREDENTIALS.email },
				})
				expect(unlock.ok()).toBeTruthy()

				expect(await okBody(await verify(totpFor(totpSecret).generate()))).toEqual(LOCKED)
			})

			test('should accept codes again once another user unlocks the account', async ({
				browser,
			}) => {
				const colleague = { email: 'colleague@domain.com', password: '123456' }
				const created = await page.request.post(`${baseURL}/api/users`, { data: colleague })
				expect(created.ok()).toBeTruthy()

				const { request } = await browser.newContext()
				expect(
					(await request.post(`${baseURL}/api/users/login`, { data: colleague })).ok(),
				).toBeTruthy()
				expect(
					(
						await request.post(`${baseURL}/api/users/unlock`, {
							data: { email: CREDENTIALS.email },
						})
					).ok(),
				).toBeTruthy()

				expect(await okBody(await verify(totpFor(totpSecret).generate()))).toEqual({
					ok: true,
				})
			})
		})
	},
)
