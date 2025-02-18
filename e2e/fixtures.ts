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

import { createUser } from './helpers/create-user'
import { getUsersCollection } from './helpers/get-users-collection'

type ISetupResult = Promise<{
	port: number
	baseURL: string
	teardown: () => Promise<void>
	mongoUri: string
}>

export const test = base.extend<
	{
		helpers: {
			createFirstUser: (args: { page: Page; baseURL: string }) => Promise<void>
			setupTotp: (args: { page: Page; baseURL: string }) => Promise<{ totpSecret: string }>
			createUser: typeof createUser
			getUsersCollection: typeof getUsersCollection
		}
	},
	{
		setup: (args?: { forceSetup?: boolean }) => ISetupResult
	}
>({
	setup: [
		async ({}, use) => {
			await use(async ({ forceSetup }: any = {}) => {
				const port = await getPort({ port: portNumbers(3000, 3100) })
				const dbName = `payload-totp-${uuidv4()}`
				const dbPath = `./tmp/${dbName}`
				await mkdir(dbPath, { recursive: true })
				const baseURL = `http://localhost:${port}`

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
						DATABASE_URI: mongod.getUri(),
					},
				})

				await new Promise((resolve, reject) => {
					const timeout = setTimeout(() => reject(new Error('Server timeout')), 10000)

					const interval = setInterval(async () => {
						try {
							const response = await fetch(`${baseURL}/admin`)
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
					mongoUri: mongod.getUri(),
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
			})
		},
		{ scope: 'worker' },
	],
	helpers: async ({}, use) => {
		await use({
			createFirstUser: async ({ page, baseURL }: { page: Page; baseURL: string }) => {
				await page.goto(`${baseURL}/admin/create-first-user`)
				await page.getByLabel('Email').pressSequentially('human@domain.com')
				await page.getByLabel('New Password').pressSequentially('123456')
				await page.getByLabel('Confirm Password').pressSequentially('123456')

				await page.getByRole('button', { name: 'Create' }).click({ delay: 1000 })

				await page.waitForURL(`${baseURL}/admin`)
			},
			setupTotp: async ({
				page,
				baseURL,
				back = '/admin',
			}: {
				page: Page
				baseURL: string
				back?: string
			}) => {
				await page.goto(`${baseURL}/admin/setup-totp?back=${encodeURI(back)}`)
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
			createUser,
			getUsersCollection,
		})
	},
})
