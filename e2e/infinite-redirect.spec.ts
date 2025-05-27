import type { I18nOptions } from '@payloadcms/translations'
import { Page, expect } from '@playwright/test'

import { i18n as i18nFn } from '../src/i18n/index.js'
import { type CustomTranslationsObject } from '../src/i18n/types.js'
import { test } from './fixtures'

test.describe.configure({ mode: 'serial' })
const i18n = i18nFn() as I18nOptions<CustomTranslationsObject>

test.describe(
	'Infinite redirect',
	{
		annotation: {
			type: 'issue',
			description: 'https://github.com/GeorgeHulpoi/payload-totp/issues/35',
		},
	},
	() => {
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

			await helpers.logout({ page })
			await helpers.login({ page, baseURL, email: 'human@domain.com', password: '123456' })
			await page.waitForURL(/^(.*?)\/admin\/verify-totp(\?back=.*?)?$/g)
		})

		test.afterAll(async () => {
			await teardown()
			await page.close()
		})

		test('should not redirect', async () => {
			await page.reload()
			await expect(page).toHaveURL(/^(.*?)\/admin\/verify-totp(\?back=.*?)?$/g)
		})
	},
)
