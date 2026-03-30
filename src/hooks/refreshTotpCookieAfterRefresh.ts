import type { CollectionAfterRefreshHook } from 'payload'

import jwt, { type JwtPayload } from 'jsonwebtoken'
import { cookies } from 'next/headers.js'

import type { TotpTokenPayload } from '../types.js'

import { setCookie } from '../setCookie.js'

export const refreshTotpCookieAfterRefresh: CollectionAfterRefreshHook = async ({
	collection,
	req,
}) => {
	const user = req.user

	if (!user) {
		return
	}

	const cookiePrefix = req.payload.config.cookiePrefix
	const cookieStore = await cookies()
	const totpCookie = cookieStore.get(`${cookiePrefix}-totp`)

	if (!totpCookie?.value) {
		return
	}

	let decoded: JwtPayload & Partial<TotpTokenPayload>

	try {
		decoded = jwt.verify(totpCookie.value, req.payload.secret) as JwtPayload &
			Partial<TotpTokenPayload>
	} catch {
		return
	}

	if (typeof decoded.userId !== 'string' && typeof decoded.userId !== 'number') {
		return
	}

	if (String(decoded.userId) !== String(user.id)) {
		return
	}

	if (!decoded.originalStrategy || decoded.originalStrategy === 'totp') {
		return
	}

	await setCookie({
		authConfig: collection.auth,
		cookiePrefix,
		originalStrategy: decoded.originalStrategy,
		secret: req.payload.secret,
		user,
	})
}
