import { type Page } from '@playwright/test'
import { Secret, TOTP } from 'otpauth'

type Args = {
	page: Page
	totpSecret: string
}

export async function promptTotp({ page, totpSecret }: Args) {
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
		.locator('css=input:first-child[type="text"]')
		.pressSequentially(token, { delay: 300 })

	await page.waitForURL(/^(.*?)\/admin$/g)
}
