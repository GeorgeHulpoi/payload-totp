import { test as base, Page } from '@playwright/test'
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
import type { ISetupArgs, ISetupResult } from './types'
import { logout } from './helpers/logout'
import { login } from './helpers/login'

export const test = base.extend<
	{
		helpers: {
			createFirstUser: typeof createFirstUser
			logout: typeof logout
			login: typeof login
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
					overrideBaseURL,
					overridePort,
					adminRoute = '/admin',
					apiRoute = '/api',
					serverURL = '',
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
							PORT: port.toString(),
							FORCE_SETUP: forceSetup ? '1' : undefined,
							DATABASE_URI: `${mongod.getUri()}&retryWrites=true`,
							ADMIN_ROUTE: adminRoute,
							API_ROUTE: apiRoute,
							SERVER_URL: serverURL,
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
				const totpSecret = await page.getByRole('code').textContent()

				const totp = new TOTP({
					algorithm: 'SHA1',
					digits: 6,
					issuer: 'Payload',
					label: 'human@domain.com',
					period: 30,
					secret: Secret.fromBase32(totpSecret || ''),
				})

				const token = totp.generate()

				await page.locator('css=input:first-child[type="text"]').focus()
				await page
					.locator('css=input:first-child[type="text"]')
					.pressSequentially(token, { delay: 300 })
				await page.waitForURL(`${baseURL}${back}`)

				return { totpSecret: totpSecret || '' }
			},
		})
	},
})
