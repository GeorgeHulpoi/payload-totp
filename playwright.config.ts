import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: true ? 1 : undefined,
	reporter: 'html',
	use: {
		trace: 'on-first-retry',
		permissions: ['clipboard-read', 'clipboard-write'],
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
})
