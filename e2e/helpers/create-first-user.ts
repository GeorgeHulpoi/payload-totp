import { Page } from '@playwright/test'

type Args = {
	page: Page
	baseURL: string
	adminRoute?: string
	forceTotp?: boolean
}

export async function createFirstUser({ page, baseURL, adminRoute = '/admin', forceTotp }: Args) {
	await page.goto(`${baseURL}${adminRoute}/create-first-user`)
	await page.getByLabel('Email').pressSequentially('human@domain.com')
	await page.getByLabel('New Password').pressSequentially('123456')
	await page.getByLabel('Confirm Password').pressSequentially('123456')
	if (forceTotp) await page.getByLabel('Force TOTP').check()

	await page.getByRole('button', { name: 'Create' }).click({ delay: 1000 })
}
