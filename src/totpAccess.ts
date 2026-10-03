import type { Access, BasePayload, Where } from 'payload'

import type { UserWithTotp } from './types.js'

export type TotpAccessOptions = {
	/**
	 * With `forceSetup`, a user who has not set TOTP up yet is denied everything. This keeps
	 * their own document readable, for the TOTP collection's `read`: Payload's `me` operation
	 * reads it with access enforced, and the admin needs `me` to show the setup view.
	 */
	allowOwnDocumentDuringSetup?: boolean
}

export const totpAccess: (innerAccess?: Access, options?: TotpAccessOptions) => Access = (
	innerAccess,
	options = {},
) => {
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

		// Verified with a code in this session, or authenticated by an API key, which TOTP
		// does not apply to.
		if (user._strategy === 'totp' || user._strategy === 'api-key') {
			return innerAccess ? innerAccess(args) : true
		}

		// Enrolled, but this session has not entered a code yet.
		if (user.hasTotp) {
			return false
		}

		// Not enrolled. Without `forceSetup` that is up to the user, and a user of another auth
		// collection cannot enroll at all. One whose collection is unknown is held back.
		const otherCollection =
			Boolean(user.collection) && user.collection !== pluginOptions.collection

		if (!pluginOptions.forceSetup || otherCollection) {
			return innerAccess ? innerAccess(args) : true
		}

		// Held back until TOTP is set up -- the setup endpoint writes the secret with access
		// overridden -- except for their own document where that is allowed.
		if (!options.allowOwnDocumentDuringSetup) {
			return false
		}

		const result = innerAccess ? await innerAccess(args) : true
		const ownDocument: Where = { id: { equals: user.id } }

		if (!result) {
			return false
		}

		return result === true ? ownDocument : { and: [result, ownDocument] }
	}
}
