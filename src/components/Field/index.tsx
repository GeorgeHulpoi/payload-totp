import type { I18nClient } from '@payloadcms/translations'
import type { TextFieldServerProps } from 'payload'

import type { CustomTranslationsKeys, CustomTranslationsObject } from '../../i18n/types.js'
import type { PayloadTOTPConfig, UserWithTotp } from '../../types.js'

import styles from './index.module.css'
import Remove from './Remove.js'
import Setup from './Setup.js'

type Args = {
	pluginOptions: PayloadTOTPConfig
} & TextFieldServerProps

export const TOTPField = (args: Args) => {
	const pluginOptions = args.pluginOptions
	const i18n = args.i18n as I18nClient<CustomTranslationsObject, CustomTranslationsKeys>
	const {
		data: { id },
		payload,
		req: { url },
		user: _user,
	} = args

	const user = _user as unknown as UserWithTotp
	const forceTotp = !user?.forceTotp && !pluginOptions.forceSetup

	if (!user || user.id !== id) {
		return null
	}

	return (
		<div className={styles.root} id="totp-ui-field">
			<svg aria-hidden="true" height="24" version="1.1" viewBox="0 0 24 24" width="24">
				<path d="M10.25 5.25A.75.75 0 0 1 11 4.5h2A.75.75 0 0 1 13 6h-2a.75.75 0 0 1-.75-.75ZM12 19.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"></path>
				<path d="M4 2.75C4 1.784 4.784 1 5.75 1h12.5c.966 0 1.75.784 1.75 1.75v18.5A1.75 1.75 0 0 1 18.25 23H5.75A1.75 1.75 0 0 1 4 21.25Zm1.75-.25a.25.25 0 0 0-.25.25v18.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25Z"></path>
			</svg>
			<div className={styles.text}>
				<label className="field-label">
					{i18n.t('totpPlugin:authApp')}
					{user.hasTotp && (
						<span className={styles.status}>{i18n.t('totpPlugin:configured')}</span>
					)}
				</label>
				<span className={styles.description}>{i18n.t('totpPlugin:fieldDescription')}</span>
			</div>
			<div className={styles.action}>
				{user.hasTotp && forceTotp && (
					<Remove
						i18n={i18n}
						payload={payload}
						pluginOptions={pluginOptions}
						user={user}
					/>
				)}
				{!user.hasTotp && forceTotp && (
					<Setup backUrl={url} i18n={i18n} payload={payload} />
				)}
			</div>
		</div>
	)
}
