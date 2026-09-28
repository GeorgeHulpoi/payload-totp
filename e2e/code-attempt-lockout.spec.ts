import type { I18nOptions } from '@payloadcms/translations'

import { type APIResponse, expect, type Page } from '@playwright/test'
import { Secret, TOTP } from 'otpauth'

import { i18n as i18nFn } from '../src/i18n/index.js'
import { type CustomTranslationsObject } from '../src/i18n/types.js'
import { test } from './fixtures'

const i18n = i18nFn() as I18nOptions<CustomTranslationsObject>

/** Payload's default `maxLoginAttempts`, which the dev users collection keeps. */
const MAX_LOGIN_ATTEMPTS = 5

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
		label: 'human@domain.com',
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

const body = async (res: APIResponse) => {
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

			let page: Page
			let teardown: VoidFunction
			let baseURL: string
			let totpSecret: string

			const verify = (token: string) =>
				page.request.post(`${baseURL}/api/verify-totp`, { data: { token } })

			test.beforeAll(async ({ setup, browser, helpers }) => {
				const setupResult = await setup({ forceSetup: true })
				teardown = setupResult.teardown
				baseURL = setupResult.baseURL
				const context = await browser.newContext()
				page = await context.newPage()

				await helpers.createFirstUser({ page, baseURL })
				await page.waitForURL(/^(.*?)\/admin\/setup-totp(\?back=.*?)?$/g)
				totpSecret = (await helpers.setupTotp({ page, baseURL })).totpSecret

				await helpers.logout({ page })
				await helpers.login({
					page,
					baseURL,
					email: 'human@domain.com',
					password: '123456',
				})
				await page.waitForURL(/^(.*?)\/admin\/verify-totp(\?back=.*?)?$/g)
			})

			test.afterAll(async () => {
				await teardown()
				await page.close()
			})

			test('should lock the user after the allowed wrong codes', async () => {
				for (let attempt = 1; attempt <= MAX_LOGIN_ATTEMPTS; attempt++) {
					expect(await body(await verify(wrongCode(totpSecret)))).toEqual(INCORRECT)
				}

				expect(await body(await verify(wrongCode(totpSecret)))).toEqual(LOCKED)
			})

			test('should refuse a correct code while locked', async () => {
				expect(await body(await verify(totpFor(totpSecret).generate()))).toEqual(LOCKED)
			})

			test('should show the lock on the form', async () => {
				await page
					.locator('css=input:first-child[type="text"]')
					.pressSequentially(totpFor(totpSecret).generate(), { delay: 300 })

				await expect(page.getByText(LOCKED.message)).toBeVisible()
				await expect(page).toHaveURL(/^(.*?)\/admin\/verify-totp(\?back=.*?)?$/g)
			})

			test('should refuse the password too, as the lock is the one Payload keeps', async ({
				browser,
			}) => {
				const context = await browser.newContext()
				const res = await context.request.post(`${baseURL}/api/users/login`, {
					data: { email: 'human@domain.com', password: '123456' },
				})

				expect(res.status()).toBe(401)
				expect((await res.json()).errors[0].message).toBe(LOCKED.message)
				await context.close()
			})
		})

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
					expect(await body(await verify(wrongCode(totpSecret)))).toEqual(INCORRECT)
				}

				expect(await body(await verify(totpFor(totpSecret).generate()))).toEqual({
					ok: true,
				})

				// Had the count survived, the second of these would be refused as locked.
				expect(await body(await verify(wrongCode(totpSecret)))).toEqual(INCORRECT)
				expect(await body(await verify(wrongCode(totpSecret)))).toEqual(INCORRECT)

				expect(await body(await verify(totpFor(totpSecret).generate()))).toEqual({
					ok: true,
				})
			})

			test('should check no more than the allowed codes of a parallel burst', async () => {
				const token = wrongCode(totpSecret)
				const replies = await Promise.all(
					Array.from({ length: MAX_LOGIN_ATTEMPTS * 2 }, async () =>
						body(await remove(token)),
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
				expect(await body(await remove(totpFor(totpSecret).generate()))).toEqual(LOCKED)

				const me = await body(await page.request.get(`${baseURL}/api/users/me`))
				expect(me?.user?.hasTotp).toBeTruthy()
			})
		})
	},
)
