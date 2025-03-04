import { Page } from '@playwright/test'

type Args = {
	page: Page
	baseURL: string
	adminRoute?: string
	email: string
	password: string
}

export async function login({ page, baseURL, adminRoute = '/admin', email, password }: Args) {
	await page.goto(`${baseURL}${adminRoute}/login`)
	await page.getByLabel('Email').pressSequentially(email)
	await page.getByLabel('Password').pressSequentially(password)
	await page.getByRole('button', { name: 'Login' }).click({ delay: 1000 })
}
