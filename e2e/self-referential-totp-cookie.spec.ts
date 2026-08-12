import { expect, type Page } from '@playwright/test'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

import { test } from './fixtures'

test.describe.configure({ mode: 'serial' })

// `dev/.env` sets PAYLOAD_SECRET=secret, and `e2e/fixtures.ts` does not override it.
// Payload does not sign with that value directly — it derives `payload.secret` from
// it, so a cookie signed with the raw value would be rejected as malformed and this
// test would pass without ever exercising the self-reference guard.
const PAYLOAD_SECRET = crypto.createHash('sha256').update('secret').digest('hex').slice(0, 32)

test.describe('self-referential totp cookie', () => {
	let page: Page
	let teardown: VoidFunction
	let baseURL: string
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
	})

	test.afterAll(async () => {
		await teardown()
		await page.close()
	})

	test('should reject a cookie naming the TOTP strategy instead of hanging', async ({
		helpers,
	}) => {
		const context = page.context()
		const meBefore = await page.request.get(`${baseURL}/api/users/me`)
		const userId = (await meBefore.json()).user.id

		await context.clearCookies({ name: 'payload-totp' })
		await context.addCookies([
			{
				name: 'payload-totp',
				url: baseURL,
				value: jwt.sign({ originalStrategy: 'totp', userId }, PAYLOAD_SECRET, {
					expiresIn: 7200,
				}),
			},
		])

		// Without a self-reference guard this never returns: the strategy delegates
		// to itself with the same args until the heap is exhausted. Guarded, the
		// cookie authenticates nobody and access is denied promptly instead.
		const me = await page.request.get(`${baseURL}/api/users/me`, { timeout: 15000 })
		expect(me.status()).toBe(403)

		// The rejected cookie falls back to local-jwt, so the session is no longer
		// TOTP-verified and access is withheld until the user verifies again.
		await page.goto(`${baseURL}/admin`)
		await expect(page).toHaveURL(/^(.*?)\/admin\/verify-totp(\?back=.*?)?$/g)

		// Verifying again must mint a healthy cookie, not another self-referential one.
		await helpers.promptTotp({ page, totpSecret })

		const totpCookie = (await context.cookies()).find(
			(cookie) => cookie.name === 'payload-totp',
		)
		expect(totpCookie).toBeDefined()

		const decoded = jwt.verify(totpCookie!.value, PAYLOAD_SECRET) as {
			originalStrategy: string
		}
		expect(decoded.originalStrategy).not.toBe('totp')
	})
})
