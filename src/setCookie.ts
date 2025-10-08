import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers.js'
import { getCookieExpiration, type IncomingAuthType, type User } from 'payload'

type Args = {
	authConfig: Omit<IncomingAuthType, 'cookies'> & Required<Pick<IncomingAuthType, 'cookies'>>
	cookiePrefix: string
	secret: string
	user: User
}

export async function setCookie({ authConfig, cookiePrefix, secret, user }: Args) {
	const token = jwt.sign(
		{
			originalStrategy: (<any>user)._strategy,
			userId: user.id,
		},
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
