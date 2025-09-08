import type { Access, BasePayload } from 'payload'

import type { UserWithTotp } from './types.js'

export const totpAccess: (innerAccess?: Access) => Access = (innerAccess) => {
	return async (args) => {
		const {
			req: {
				payload: {
					config: {
						custom: {
							totp: { pluginOptions },
						},
					},
				},
				user,
			},
		} = args as unknown as { req: { payload: BasePayload; user: UserWithTotp } }

		if (!user) {
			return false
		}

		if (pluginOptions.disableAccessWrapper) {
			return innerAccess ? innerAccess(args) : true
		}

		if (
			(pluginOptions.forceSetup && (<any>user)._strategy === 'totp') ||
			(<any>user)._strategy === 'api-key'
		) {
			return innerAccess ? innerAccess(args) : true
		} else {
			if (user.hasTotp) {
				if ((<any>user)._strategy === 'totp') {
					return innerAccess ? innerAccess(args) : true
				} else {
					return false
				}
			} else {
				return innerAccess ? innerAccess(args) : true
			}
		}
	}
}
