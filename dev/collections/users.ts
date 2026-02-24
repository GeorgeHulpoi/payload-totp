import type { CollectionConfig } from 'payload'

const tokenExpiration = Number(process.env.TOKEN_EXPIRATION)

export const users: CollectionConfig = {
	slug: 'users',
	fields: [],
	admin: {
		defaultColumns: ['email', 'updatedAt'],
	},
	auth: {
		useAPIKey: true,
		tokenExpiration: Number.isFinite(tokenExpiration) ? tokenExpiration : undefined,
	},
}
