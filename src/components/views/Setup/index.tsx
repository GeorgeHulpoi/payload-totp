import type { I18nClient } from '@payloadcms/translations'
import type { AdminViewProps, ServerComponentProps } from 'payload'

import { MinimalTemplate } from '@payloadcms/next/templates'
import { formatAdminURL } from '@payloadcms/ui/shared'
import { redirect } from 'next/navigation.js'
import { Secret, TOTP } from 'otpauth'

import type { CustomTranslationsKeys, CustomTranslationsObject } from '../../../i18n.js'
import type { PayloadTOTPConfig } from '../../../types.js'

import { getTotpSecret } from '../../../utilities/getTotpSecret.js'
import QRCode from '../../QRCode/index.js'
import Form from './Form.js'
import styles from './index.module.css'
import ShowSecret from './ShowSecret/index.js'

type Args = {
	pluginOptions: PayloadTOTPConfig
} & AdminViewProps &
	ServerComponentProps

export const TOTPSetup: React.FC<Args> = async (args) => {
	const i18n = args.i18n as I18nClient<CustomTranslationsObject, CustomTranslationsKeys>
	const {
		initPageResult: {
			req: { payload, user },
		},
		pluginOptions,
		searchParams: { back },
	} = args

	if (!user) {
		const url = formatAdminURL({
			adminRoute: payload.config.routes.admin,
			path: '/login',
		})

		redirect(url)
	}

	const totpSecret = await getTotpSecret(user, payload)

	if (totpSecret) {
		const url = formatAdminURL({
			adminRoute: payload.config.routes.admin,
			path: '/',
		})

		redirect(url)
	}

	const secret = new Secret({
		size: 32,
	})

	const totp = new TOTP({
		algorithm: pluginOptions.totp?.algorithm || 'SHA1',
		digits: pluginOptions.totp?.digits || 6,
		issuer: pluginOptions.totp?.issuer || 'Payload',
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		label: user.email || user.username,
		period: pluginOptions.totp?.period || 30,
		secret,
	})

	return (
		<MinimalTemplate className={styles.root}>
			<h1>{i18n.t('totpPlugin:setup:title')}</h1>
			<p
				dangerouslySetInnerHTML={{
					__html: i18n.t('totpPlugin:setup:description'),
				}}
			></p>
			<div className={styles.qr}>
				<QRCode totp={totp} />
				<ShowSecret i18n={i18n} secret={secret.base32} />
			</div>
			<div className={styles.code}>
				<p>
					{i18n
						.t('totpPlugin:setup:enterCode')
						.replace('{digits}', (pluginOptions.totp?.digits || 6).toString())}
				</p>
				<Form
					back={(typeof back === 'string' && back) || undefined}
					length={pluginOptions.totp?.digits}
					secret={secret.base32}
				/>
			</div>
		</MinimalTemplate>
	)
}
