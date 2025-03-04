import type { FieldHook, User } from 'payload'

import type { PayloadTOTPConfig } from '../types.js'

import { getTotpSecret } from '../utilities/getTotpSecret.js'

export const setHasTotp: (pluginOptions: PayloadTOTPConfig) => FieldHook =
	(pluginOptions) =>
	async ({ collection, data, req: { payload, user } }) => {
		console.log(data?.id, user?.id)
		if (user && data && user.id !== data.id) {
			return undefined
		}

		const totpSecret = await getTotpSecret({
			collection: collection?.slug || pluginOptions.collection,
			payload,
			user: data as User,
		})

		return Boolean(totpSecret)
	}
