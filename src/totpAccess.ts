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

		// A disabled plugin has to be transparent, so a `totpAccess` applied by hand
		// behaves like the function it wraps -- including for anonymous requests, which
		// is what a collection with public `read` access relies on. Without an inner
		// function it falls back to Payload's own default rather than opening up.
		if (pluginOptions.disabled) {
			return innerAccess ? innerAccess(args) : Boolean(user)
		}

		if (!user) {
			return false
		}

		if (pluginOptions.disableAccessWrapper) {
			return innerAccess ? innerAccess(args) : true
		}

		if (
			(pluginOptions.forceSetup && user._strategy === 'totp') ||
			user._strategy === 'api-key'
		) {
			return innerAccess ? innerAccess(args) : true
		} else {
			if (user.hasTotp) {
				if (user._strategy === 'totp') {
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
