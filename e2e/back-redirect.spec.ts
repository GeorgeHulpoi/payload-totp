import { type Page, expect } from '@playwright/test'

import { test } from './fixtures'

test.describe.configure({ mode: 'parallel' })

/**
 * The verify and setup forms used to call `location.replace(back)` with `back` straight
 * from the query string. Through Payload's login redirect, a link to
 * `/admin/login?redirect=/admin/verify-totp?back=javascript:…` ran script in the admin
 * origin as soon as a valid code was entered, and an absolute `back` was an open redirect.
 */
const xss = 'javascript:alert(document.domain)'

function recordDialogs(page: Page) {
	const dialogs: string[] = []

	page.on('dialog', async (dialog) => {
		dialogs.push(dialog.message())
		await dialog.dismiss()
	})

	return dialogs
}

test.describe('back parameter on the verify view', () => {
	// Each test logs in again, so they don't depend on one another; a failure restarts the
	// worker and the next test gets a fresh server.
	test.describe.configure({ mode: 'default' })

	let page: Page
	let teardown: VoidFunction
	let baseURL: string
	let totpSecret: string
	let dialogs: string[]

	test.beforeAll(async ({ setup, browser, helpers }) => {
		const setupResult = await setup()
		teardown = setupResult.teardown
		baseURL = setupResult.baseURL
		page = await (await browser.newContext()).newPage()
		dialogs = recordDialogs(page)

		await helpers.createFirstUser({ page, baseURL })
		await page.waitForURL(/^(.*?)\/admin$/g)
		;({ totpSecret } = await helpers.setupTotp({ page, baseURL }))
	})

	test.beforeEach(() => {
		dialogs.length = 0
	})

	test.afterAll(async () => {
		await teardown()
		await page.close()
	})

	test('does not run a javascript: back', async ({ helpers }) => {
		await helpers.logout({ page })
		await helpers.login({ page, baseURL, email: 'human@domain.com', password: '123456' })
		await page.waitForURL(/\/admin\/verify-totp/)
		await page.goto(`${baseURL}/admin/verify-totp?back=${encodeURIComponent(xss)}`)

		await helpers.promptTotp({ page, totpSecret })
		expect(dialogs).toEqual([])
	})

	test('does not redirect to another site', async ({ helpers }) => {
		await helpers.logout({ page })
		await helpers.login({ page, baseURL, email: 'human@domain.com', password: '123456' })
		await page.waitForURL(/\/admin\/verify-totp/)
		await page.goto(
			`${baseURL}/admin/verify-totp?back=${encodeURIComponent('https://example.invalid/')}`,
		)

		await helpers.promptTotp({ page, totpSecret })
	})

	test('without a back goes to the admin root, not the previous page', async ({ helpers }) => {
		await helpers.logout({ page })
		await helpers.login({ page, baseURL, email: 'human@domain.com', password: '123456' })
		await page.waitForURL(/\/admin\/verify-totp/)
		await page.goto('about:blank')
		await page.goto(`${baseURL}/admin/verify-totp`)

		await helpers.promptTotp({ page, totpSecret })
	})

	test('still returns to an admin page', async ({ helpers }) => {
		await helpers.logout({ page })
		await helpers.login({ page, baseURL, email: 'human@domain.com', password: '123456' })
		await page.waitForURL(/\/admin\/verify-totp/)
		await page.goto(
			`${baseURL}/admin/verify-totp?back=${encodeURIComponent('/admin/account')}`,
		)

		await helpers.promptTotp({ page, totpSecret, expectedURL: `${baseURL}/admin/account` })
	})
})

test.describe('back parameter on the setup view', () => {
	let page: Page
	let teardown: VoidFunction
	let baseURL: string

	test.beforeAll(async ({ setup, browser, helpers }) => {
		const setupResult = await setup()
		teardown = setupResult.teardown
		baseURL = setupResult.baseURL
		page = await (await browser.newContext()).newPage()

		await helpers.createFirstUser({ page, baseURL })
		await page.waitForURL(/^(.*?)\/admin$/g)
	})

	test.afterAll(async () => {
		await teardown()
		await page.close()
	})

	test('does not run a javascript: back', async ({ helpers }) => {
		const dialogs = recordDialogs(page)

		await helpers.setupTotp({ page, baseURL, back: xss, expectedURL: `${baseURL}/admin` })

		expect(dialogs).toEqual([])
	})
})

test.describe('setup started from the account page', () => {
	let page: Page
	let teardown: VoidFunction
	let baseURL: string

	test.beforeAll(async ({ setup, browser, helpers }) => {
		const setupResult = await setup()
		teardown = setupResult.teardown
		baseURL = setupResult.baseURL
		page = await (await browser.newContext()).newPage()

		await helpers.createFirstUser({ page, baseURL })
		await page.waitForURL(/^(.*?)\/admin$/g)
	})

	test.afterAll(async () => {
		await teardown()
		await page.close()
	})

	test('returns to the account page', async ({ helpers }) => {
		await page.goto(`${baseURL}/admin/account`)
		await page.getByRole('link', { name: 'Setup' }).click({ force: true })
		await page.waitForURL(/\/admin\/setup-totp\?back=%2Fadmin%2Faccount$/)

		await helpers.enterSetupCode({ page })
		await page.waitForURL(`${baseURL}/admin/account`)
	})
})
