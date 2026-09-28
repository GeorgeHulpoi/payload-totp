import type { Payload, PayloadRequest, SanitizedCollectionConfig, TypedUser } from 'payload'

import { incrementLoginAttempts, resetLoginAttempts } from 'payload'

// `Record`: Payload's reset takes an indexable document, which a generated `User` type is not.
type Account = {
	lockUntil?: null | string
	loginAttempts?: null | number
} & Record<string, unknown> &
	TypedUser

type Args = {
	collection: SanitizedCollectionConfig
	payload: Payload
	req: PayloadRequest
	user: TypedUser
}

/**
 * Counts a submitted TOTP code toward the collection's login lockout, so codes
 * cannot be brute-forced. Reuses `maxLoginAttempts`, `lockTime`, the `lockUntil`
 * and `loginAttempts` fields and the admin unlock action; `maxLoginAttempts: 0`
 * turns it off, as it does for passwords.
 *
 * The code is counted *before* it is checked, through Payload's atomic increment,
 * so a burst of parallel guesses is bounded to `maxLoginAttempts` checks.
 */
export async function countCodeAttempt({ collection, payload, req, user }: Args) {
	const { maxLoginAttempts } = collection.auth
	const refusal = () => Response.json({ message: req.t('error:userLocked'), ok: false })

	if (maxLoginAttempts <= 0) {
		return { refusal: undefined, reset: async () => {} }
	}

	// The lockout columns are hidden fields, so they are absent from `req.user`.
	// No `req`: the read must see increments made by parallel requests.
	const account = await payload.db.findOne<Account>({
		collection: collection.slug,
		select: { lockUntil: true, loginAttempts: true },
		where: { id: { equals: user.id } },
	})

	if (!account) {
		return { refusal: undefined, reset: async () => {} }
	}

	if (account.lockUntil && new Date(account.lockUntil) > new Date()) {
		return { refusal: refusal(), reset: async () => {} }
	}

	await incrementLoginAttempts({ collection, payload, user: account })

	// `loginAttempts` is now the count before this guess; at or past the limit
	// means parallel requests already used the last allowed one.
	const exhausted = (account.loginAttempts ?? 0) >= maxLoginAttempts

	return {
		refusal: exhausted ? refusal() : undefined,
		reset: () => resetLoginAttempts({ collection, doc: account, payload, req }),
	}
}
