import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers.js'
import { getCookieExpiration, type IncomingAuthType, type User } from 'payload'

import type { TotpTokenPayload } from './types.js'

import { TOTP_STRATEGY_NAME } from './constants.js'

type Args = {
	authConfig: Omit<IncomingAuthType, 'cookies'> & Required<Pick<IncomingAuthType, 'cookies'>>
	cookiePrefix: string
	originalStrategy?: string
	secret: string
	user: User
}

export async function setCookie({
	authConfig,
	cookiePrefix,
	originalStrategy,
	secret,
	user,
}: Args) {
	const originalStrategyName = originalStrategy ?? (<any>user)._strategy

	// Both cases would produce a cookie that cannot authenticate anyone: the TOTP
	// strategy would either delegate to itself without a termination condition, or
	// find no strategy at all. Leave the cookie alone and let the user verify again.
	if (!originalStrategyName || originalStrategyName === TOTP_STRATEGY_NAME) {
		return
	}

	const token = jwt.sign(
		{
			originalStrategy: originalStrategyName,
			userId: user.id,
		} satisfies TotpTokenPayload,
		secret,
		{
			expiresIn: authConfig.tokenExpiration || 7200,
		},
	)

	const sameSite =
		typeof authConfig.cookies.sameSite === 'string'
			? (authConfig.cookies.sameSite.toLocaleLowerCase() as 'lax' | 'none' | 'strict')
			: authConfig.cookies.sameSite
				? 'strict'
				: undefined

	const cookieStore = await cookies()

	cookieStore.set(`${cookiePrefix}-totp`, token, {
		domain: authConfig.cookies.domain ?? undefined,
		expires: getCookieExpiration({
			seconds: authConfig.tokenExpiration || 7200,
		}),
		httpOnly: true,
		path: '/',
		sameSite,
		secure: authConfig.cookies.secure,
	})
}
