import type {
	CollectionConfig,
	CollectionSlug,
	Payload,
	PayloadRequest,
	SanitizedCollectionConfig,
	TypedUser,
} from 'payload'

// Cast: `CollectionSlug` is narrowed to the slugs of whichever app generated types.
const TOTP_ATTEMPTS_SLUG = 'totp-attempts' as CollectionSlug

/**
 * One document per user who has submitted a code: the count of codes since the last correct
 * one, and the lock that count leads to. Its ID is the user's, so the primary key is what
 * keeps two first codes sent in parallel from each starting a count.
 *
 * It is a collection of its own because nothing on the user document survives: Payload's
 * login, refresh and logout write back the whole user document they read when they started
 * (https://github.com/payloadcms/payload/pull/17596), so a count or a lock kept there is put
 * back to an older value by someone who knows the password. Only the plugin reads and writes
 * this one, through the database adapter.
 *
 * It stays registered while the plugin is disabled, like `totpSecret`, so that toggling the
 * option leaves the database schema alone.
 */
export const totpAttemptsCollection: CollectionConfig = {
	slug: TOTP_ATTEMPTS_SLUG,
	access: {
		create: () => false,
		delete: () => false,
		read: () => false,
		update: () => false,
	},
	admin: {
		hidden: true,
	},
	fields: [
		// The user's ID, as text whatever the ID type of the auth collection.
		{ name: 'id', type: 'text', required: true },
		{ name: 'attempts', type: 'number', defaultValue: 0, required: true },
		{ name: 'lockUntil', type: 'date' },
	],
	graphQL: false,
	lockDocuments: false,
	timestamps: false,
}

type Attempts = {
	attempts?: null | number
	id: string
	lockUntil?: null | string
}

type Args = {
	collection: SanitizedCollectionConfig
	payload: Payload
	req: PayloadRequest
	user: TypedUser
}

const isLocked = (row: Attempts | null) =>
	Boolean(row?.lockUntil) && new Date(row!.lockUntil!) > new Date()

const uncounted = { refusal: undefined, reset: async () => {} }

// No `req` on any of these calls: a transaction would hide the count from parallel requests.
const findAttempts = (payload: Payload, userID: number | string) =>
	payload.db.findOne<Attempts>({
		collection: TOTP_ATTEMPTS_SLUG,
		where: { id: { equals: String(userID) } },
	})

const updateAttempts = (
	payload: Payload,
	userID: number | string,
	data: Record<string, unknown>,
) =>
	// The adapter types the row after the app's collections, which the plugin cannot know.
	payload.db.updateOne({
		id: String(userID),
		collection: TOTP_ATTEMPTS_SLUG,
		data,
	}) as unknown as Promise<Attempts | null>

/**
 * The user's document, created on their first code. A parallel first code may create it
 * between the read and the write: the primary key refuses the second one, and the document
 * is then there to be read.
 */
async function findOrCreateAttempts(payload: Payload, userID: number | string): Promise<Attempts> {
	const existing = await findAttempts(payload, userID)

	if (existing) {
		return existing
	}

	try {
		return (await payload.db.create({
			collection: TOTP_ATTEMPTS_SLUG,
			data: { id: String(userID), attempts: 0 },
		})) as Attempts
	} catch (error) {
		const created = await findAttempts(payload, userID)

		if (!created) {
			throw error
		}

		return created
	}
}

/**
 * Counts a submitted TOTP code, so codes cannot be brute-forced: after `maxLoginAttempts`
 * codes without a correct one, further codes are refused for `lockTime`. Both are the
 * collection's own login lockout settings; `maxLoginAttempts: 0` turns it off, as it does
 * for passwords.
 *
 * The `totp-attempts` document alone decides whether a code is refused. The lock is also
 * copied to the user's `lockUntil`, so the password login is refused with it, but that copy
 * is not relied on (see `totpAttemptsCollection`).
 *
 * The code is counted *before* it is checked, through an atomic increment, so a burst of
 * parallel guesses is bounded to `maxLoginAttempts` checks.
 */
export async function countCodeAttempt({ collection, payload, req, user }: Args) {
	const { lockTime, maxLoginAttempts } = collection.auth

	if (maxLoginAttempts <= 0) {
		return uncounted
	}

	const refused = {
		refusal: Response.json({ message: req.t('error:userLocked'), ok: false }),
		reset: uncounted.reset,
	}

	const row = await findOrCreateAttempts(payload, user.id)

	if (isLocked(row)) {
		return refused
	}

	const update = (data: Record<string, unknown>) => updateAttempts(payload, user.id, data)
	const lockUser = (lockUntil: null | string) =>
		payload.db.updateOne({
			id: user.id,
			collection: collection.slug,
			data: { lockUntil },
			returning: false,
		})

	const counted = await update({ attempts: { $inc: 1 } })

	// An attempt that could not be counted is not checked.
	if (typeof counted?.attempts !== 'number') {
		return refused
	}

	const { attempts } = counted

	// Locked by a parallel request since the read. The lock starts the count over, so this
	// attempt must not be left on it.
	if (isLocked(counted)) {
		await update({ attempts: 0 })

		return refused
	}

	if (attempts >= maxLoginAttempts) {
		const lockUntil = new Date(Date.now() + lockTime).toISOString()

		await update({ attempts: 0, lockUntil })
		await lockUser(lockUntil)
	}

	// Past the limit: parallel requests already used the last allowed attempt.
	if (attempts > maxLoginAttempts) {
		return refused
	}

	return {
		refusal: undefined,
		// The last allowed attempt locked the account before its code was checked.
		reset: async () => {
			if (attempts === maxLoginAttempts) {
				await update({ attempts: 0, lockUntil: null })
				await lockUser(null)
			} else {
				await update({ attempts: 0 })
			}
		},
	}
}

/** Clears a user's count and lock, when Payload's unlock operation has lifted its own. */
export async function resetCodeAttempts(payload: Payload, userID: number | string) {
	if (await findAttempts(payload, userID)) {
		await updateAttempts(payload, userID, { attempts: 0, lockUntil: null })
	}
}
