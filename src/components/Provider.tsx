import type { ServerComponentProps } from 'payload'

import { formatAdminURL } from '@payloadcms/ui/shared'

import type { PayloadTOTPConfig, UserWithTotp } from '../types.js'

import Redirect from './Redirect.js'

type Args = {
	children: React.ReactNode
	pluginOptions: PayloadTOTPConfig
	user: UserWithTotp
} & Pick<ServerComponentProps, 'payload'>

export const TOTPProvider = async (args: Args) => {
	const { children, payload, pluginOptions, user } = args

	if (user && user.hasTotp && user._strategy !== 'totp') {
		const url = formatAdminURL({
			adminRoute: payload.config.routes.admin,
			path: '/verify-totp',
		})

		return (
			<Redirect includeBack={true} redirect={url}>
				{children}
			</Redirect>
		)
	} else if (user && !user.hasTotp && pluginOptions.forceSetup) {
		const url = formatAdminURL({
			adminRoute: payload.config.routes.admin,
			path: '/setup-totp',
		})

		return (
			<Redirect includeBack={true} redirect={url}>
				{children}
			</Redirect>
		)
	} else {
		return children
	}
}
