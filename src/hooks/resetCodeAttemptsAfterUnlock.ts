import type { CollectionAfterOperationHook, Where } from 'payload'

import { getLoginOptions } from 'payload'

import { resetCodeAttempts } from '../utilities/codeAttempts.js'

/**
 * Payload's unlock (the admin's Force Unlock, `/api/<collection>/unlock`) clears the lock on
 * the user document. Codes are refused from the `totp-attempts` document, so that one is
 * cleared with it.
 *
 * Except when users unlock themselves: Payload's default `unlock` access is any logged-in
 * user, which would let a session guess a few codes, unlock itself, and start over.
 */
export const resetCodeAttemptsAfterUnlock: CollectionAfterOperationHook = async ({
	args,
	collection,
	operation,
	req: { payload, user: caller },
	result,
}) => {
	if (operation !== 'unlock' || !result) {
		return result
	}

	// The operation finds the user by these and returns only `true`, so look them up again,
	// the same way it does.
	const data = args.data as { email?: unknown; username?: unknown }
	const { canLoginWithEmail, canLoginWithUsername } = getLoginOptions(
		collection.auth.loginWithUsername,
	)
	const email = canLoginWithEmail && typeof data.email === 'string' && data.email
	const username = canLoginWithUsername && typeof data.username === 'string' && data.username

	let where: undefined | Where

	if (email) {
		where = { email: { equals: email.toLowerCase().trim() } }
	} else if (username) {
		where = { username: { equals: username.toLowerCase().trim() } }
	}

	if (!where) {
		return result
	}

	const user = await payload.db.findOne<{ id: number | string }>({
		collection: collection.slug,
		where,
	})

	const ownAccount =
		caller?.collection === collection.slug && String(caller.id) === String(user?.id)

	if (user && !ownAccount) {
		await resetCodeAttempts(payload, user.id)
	}

	return result
}
