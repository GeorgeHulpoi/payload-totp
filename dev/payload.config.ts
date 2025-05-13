import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { payloadTotp } from 'payload-totp'
import { fileURLToPath } from 'url'

import { users } from './collections/users.js'
import { posts } from './collections/posts.js'
import { authors } from './collections/authors.js'
import { settings } from './globals/settings.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.ROOT_DIR) {
	process.env.ROOT_DIR = dirname
}

// eslint-disable-next-line no-restricted-exports
export default buildConfig({
	admin: {
		importMap: {
			baseDir: path.resolve(dirname),
		},
	},
	routes: {
		admin: process.env.ADMIN_ROUTE || '/admin',
		api: process.env.API_ROUTE || '/api',
	},
	serverURL: process.env.SERVER_URL || '',
	collections: [users, authors, posts],
	globals: [settings],
	db: mongooseAdapter({
		url: process.env.DATABASE_URI || '',
	}),
	editor: lexicalEditor(),
	plugins: [
		payloadTotp({
			collection: 'users',
			forceSetup: process.env.FORCE_SETUP === '1',
			disableAccessWrapper: process.env.DISABLE_ACCESS_WRAPPER === '1',
			userSpecificForceTotpField: {
				enabled: true,
			},
		}),
	],
	secret: process.env.PAYLOAD_SECRET || 'test-secret_key',
	typescript: {
		outputFile: path.resolve(dirname, 'payload-types.ts'),
	},
})
