import { type Page } from '@playwright/test'
import { Secret, TOTP } from 'otpauth'

type Args = {
	page: Page
}

/** Reads the secret off the setup view it is on and types the code it generates. */
export async function enterSetupCode({ page }: Args) {
	await page.getByRole('button', { name: 'Add code manually' }).click()
	const rawSecret = await page.getByRole('code').textContent()
	const totpSecret = rawSecret?.replace(/\s/g, '') ?? ''

	const totp = new TOTP({
		algorithm: 'SHA1',
		digits: 6,
		issuer: 'Payload',
		label: 'human@domain.com',
		period: 30,
		secret: Secret.fromBase32(totpSecret),
	})

	const token = totp.generate()

	await page.locator('css=input:first-child[type="text"]').focus()
	await page.locator('css=input:first-child[type="text"]').pressSequentially(token, { delay: 300 })

	return { totpSecret }
}
