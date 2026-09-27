import type { I18nClient } from '@payloadcms/translations'
import type { AdminViewProps, ServerComponentProps } from 'payload'

import { MinimalTemplate } from '@payloadcms/next/templates'
import { formatAdminURL } from '@payloadcms/ui/shared'
import { redirect } from 'next/navigation.js'

import type { CustomTranslationsKeys, CustomTranslationsObject } from '../../../i18n/types.js'
import type { PayloadTOTPConfig, UserWithTotp } from '../../../types.js'

import Form from './Form.js'
import styles from './index.module.css'

type Args = {
	pluginOptions: PayloadTOTPConfig
} & AdminViewProps &
	ServerComponentProps

export const TOTPVerify: React.FC<Args> = (args) => {
	const i18n = args.i18n as I18nClient<CustomTranslationsObject, CustomTranslationsKeys>
	const {
		initPageResult: {
			req: {
				payload: {
					config: {
						routes: { admin: adminRoute, api: apiRoute },
						serverURL,
					},
				},
				user: _user,
			},
		},
		pluginOptions,
		searchParams: { back } = {},
	} = args

	const user = _user as unknown as UserWithTotp

	if (!user) {
		const url = formatAdminURL({
			adminRoute,
			path: '/login',
			serverURL,
		})

		redirect(url)
	}

	if (!user.hasTotp || (user.hasTotp && user._strategy === 'totp')) {
		const url = formatAdminURL({
			adminRoute,
			path: '/',
			serverURL,
		})

		redirect(url)
	}

	return (
		<MinimalTemplate className={styles.root}>
			<h1>{i18n.t('totpPlugin:verify:title')}</h1>
			<p>
				{i18n
					.t('totpPlugin:setup:enterCode')
					.replace('{digits}', (pluginOptions.totp?.digits || 6).toString())}
			</p>
			<Form
				apiRoute={apiRoute}
				back={(typeof back === 'string' && back) || undefined}
				length={pluginOptions.totp?.digits}
				serverURL={serverURL}
			/>
		</MinimalTemplate>
	)
}
