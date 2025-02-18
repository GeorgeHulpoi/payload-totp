import type { APIResponse, Page } from '@playwright/test'

type Args = {
	page: Page
	email: string
	password: string
	baseURL: string
	data?: Record<string, string | number | boolean>
}

export async function createUser({
	page,
	email,
	password,
	baseURL,
	data,
}: Args): Promise<APIResponse> {
	const res = await page.request.post(`${baseURL}/api/users`, {
		data: {
			email,
			password,
			...(data || {}),
		},
	})

	return res
}
