import { test as base, type Page } from '@playwright/test'
import { spawn } from 'child_process'
import { mkdir, rm } from 'fs/promises'
import getPort, { portNumbers } from 'get-port'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { platform } from 'node:os'
import { Secret, TOTP } from 'otpauth'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'

import { createFirstUser } from './helpers/create-first-user'
import { login } from './helpers/login'
import { logout } from './helpers/logout'
import { promptTotp } from './helpers/prompt-totp'
import type { ISetupArgs, ISetupResult } from './types'

// `dev/payload.config.ts` reads PAYLOAD_SECRET, falling back to its own default.
// `dev/.env` is gitignored, so a developer's local value is absent on CI and the
// two runs would disagree. Pinning it here makes the secret the same everywhere,
// which specs that sign their own cookies depend on.
export const PAYLOAD_SECRET = 'e2e-payload-secret'

export const test = base.extend<
	{
		helpers: {
			createFirstUser: typeof createFirstUser
			logout: typeof logout
			login: typeof login
			promptTotp: typeof promptTotp
			setupTotp: (args: {
				page: Page
				baseURL: string
				adminRoute?: string
			}) => Promise<{ totpSecret: string }>
		}
	},
	{
		setup: (args?: ISetupArgs) => ISetupResult
	}
>({
	setup: [
		async ({}, use) => {
			await use(
				async ({
					forceSetup,
					disableAccessWrapper,
					forceWhiteBackgroundOnQrCode,
					autoRefresh,
					overrideBaseURL,
					overridePort,
					adminRoute = '/admin',
					apiRoute = '/api',
					serverURL = '',
					tokenExpiration,
				}: ISetupArgs = {}) => {
					const port = overridePort || (await getPort({ port: portNumbers(3000, 3099) }))
					const dbName = `payload-totp-${uuidv4()}`
					const dbPath = `./tmp/${dbName}`
					await mkdir(dbPath, { recursive: true })
					const baseURL = overrideBaseURL || `http://localhost:${port}`

					const mongod = await MongoMemoryServer.create({
						instance: {
							dbName,
							dbPath,
							port: await getPort({ port: portNumbers(27017, 27117) }),
						},
					})

					const child = spawn('pnpm', ['dev:start'], {
						stdio: 'inherit',
						cwd: path.join(path.dirname(fileURLToPath(import.meta.url)), '..'),
						shell: platform() === 'win32',
						env: {
							...process.env,
							NODE_ENV: 'production',
							PAYLOAD_SECRET,
							PORT: port.toString(),
							FORCE_SETUP: forceSetup ? '1' : undefined,
							DISABLE_ACCESS_WRAPPER: disableAccessWrapper ? '1' : undefined,
							DATABASE_URI: `${mongod.getUri()}&retryWrites=true`,
							ADMIN_ROUTE: adminRoute,
							API_ROUTE: apiRoute,
							AUTO_REFRESH: autoRefresh ? '1' : undefined,
							// Payload appends `serverURL` to `config.csrf`, and since 3.80
							// a non-empty csrf allowlist makes cookie auth reject any request
							// that sends neither `Origin` nor a same-origin `Sec-Fetch-Site`.
							// Playwright's `page.request` is a Node HTTP client that sends
							// neither, so leaving `serverURL` unset keeps Payload's default
							// posture and lets the specs authenticate over cookies. Specs that
							// need an explicit serverURL still pass one, and make no API calls.
							SERVER_URL:
								overridePort && serverURL && port === overridePort
									? serverURL
									: undefined,
							TOKEN_EXPIRATION:
								typeof tokenExpiration === 'number'
									? tokenExpiration.toString()
									: undefined,
							FORCE_WHITE_BACKGROUND_ON_QR_CODE: forceWhiteBackgroundOnQrCode
								? '1'
								: undefined,
						},
					})

					await new Promise((resolve, reject) => {
						const timeout = setTimeout(() => reject(new Error('Server timeout')), 10000)

						const interval = setInterval(async () => {
							try {
								const response = await fetch(`${baseURL}${adminRoute}`)
								if (response.ok) {
									clearTimeout(timeout)
									clearInterval(interval)
									resolve(null)
								}
							} catch (err) {}
						}, 500)
					})

					return {
						port,
						baseURL,
						teardown: async () => {
							await new Promise((resolve, reject) => {
								child.on('close', resolve)
								child.on('error', reject)
								child.kill()
							})

							if (mongod) {
								await mongod.stop()
							}

							rm(path.resolve(dbPath), { recursive: true })
						},
					}
				},
			)
		},
		{ scope: 'worker' },
	],
	helpers: async ({}, use) => {
		await use({
			createFirstUser,
			logout,
			login,
			promptTotp,
			setupTotp: async ({
				page,
				baseURL,
				back = '/admin',
				adminRoute = '/admin',
			}: {
				page: Page
				baseURL: string
				back?: string
				adminRoute?: string
			}) => {
				await page.goto(`${baseURL}${adminRoute}/setup-totp?back=${encodeURI(back)}`)
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
				await page
					.locator('css=input:first-child[type="text"]')
					.pressSequentially(token, { delay: 300 })
				await page.waitForURL(`${baseURL}${back}`)

				return { totpSecret }
			},
		})
	},
})
