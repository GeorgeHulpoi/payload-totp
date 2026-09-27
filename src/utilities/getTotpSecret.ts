import type { Payload, TypedUser } from 'payload'

type Args = {
	collection: string
	payload: Payload
	user: TypedUser
}

export async function getTotpSecret({
	collection,
	payload,
	user,
}: Args): Promise<string | undefined> {
	if (!user) {
		return undefined
	}

	let totpSecret: string | undefined

	try {
		const result = (await payload.findByID({
			id: user.id,
			collection,
			overrideAccess: true,
			select: {
				totpSecret: true,
			},
			showHiddenFields: true,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any)) as { totpSecret?: null | string } // TODO: Report this to Payload
		totpSecret = result.totpSecret === null ? undefined : result.totpSecret
		// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-empty
	} catch (err) {}

	return totpSecret
}
