import { Page } from '@playwright/test'

type Args = {
	page: Page
}

export async function logout({ page }: Args) {
	await page.getByRole('button', { name: 'Open Menu' }).click()
	await page.getByRole('link', { name: 'Log out' }).click()
	await page.waitForURL(/^(.*?)\/admin\/login$/g)
}
