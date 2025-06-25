import type { ServerComponentProps } from 'payload'

import { formatAdminURL } from '@payloadcms/ui/shared'
import { headers } from 'next/headers.js'
import { redirect } from 'next/navigation.js'

import type { PayloadTOTPConfig, UserWithTotp } from '../../types.js'

import TOTPProviderClient from './index.client.js'

type Args = {
	children: React.ReactNode
	pluginOptions: PayloadTOTPConfig
} & ServerComponentProps

export const TOTPProvider = async (args: Args) => {
	const { children, payload, pluginOptions, user: _user } = args
	const user = _user as UserWithTotp
	const headersList = await headers()
	const pathname = headersList.get('x-pathname') || '/'

	const verifyUrl = formatAdminURL({
		adminRoute: payload.config.routes.admin,
		path: '/verify-totp',
	})

	const setupUrl = formatAdminURL({
		adminRoute: payload.config.routes.admin,
		path: '/setup-totp',
	})

	if (
		user &&
		user.hasTotp &&
		!['api-key', 'totp'].includes(user._strategy) &&
		pathname !== verifyUrl
	) {
		redirect(`${payload.config.serverURL}${verifyUrl}?back=${encodeURIComponent(pathname)}`)
	} else if (
		user &&
		!user.hasTotp &&
		pluginOptions.forceSetup &&
		pathname !== setupUrl &&
		user._strategy !== 'api-key'
	) {
		redirect(`${payload.config.serverURL}${setupUrl}?back=${encodeURIComponent(pathname)}`)
	} else {
		return (
			<TOTPProviderClient
				forceSetup={pluginOptions.forceSetup}
				setupUrl={setupUrl}
				verifyUrl={verifyUrl}
			>
				{children}
			</TOTPProviderClient>
		)
	}
}
