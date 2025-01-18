import type { I18nClient } from '@payloadcms/translations'
import type { Payload, User } from 'payload'

import { MinimalTemplate } from '@payloadcms/next/templates'

import type { CustomTranslationsKeys, CustomTranslationsObject } from '../../../i18n.js'
import type { PayloadTOTPConfig } from '../../../types.js'

import Form from './Form.js'
import styles from './index.module.css'

type Args = {
	i18n: I18nClient<CustomTranslationsObject, CustomTranslationsKeys>
	payload: Payload
	pluginOptions: PayloadTOTPConfig
	user: User
}

export const Remove: React.FC<Args> = (args) => {
	const { i18n, pluginOptions } = args

	return (
		<MinimalTemplate className={styles.root}>
			<h1>{i18n.t('totpPlugin:verify:title')}</h1>
			<p>
				{i18n
					.t('totpPlugin:setup:enterCode')
					.replace('{digits}', (pluginOptions.totp?.digits || 6).toString())}
			</p>
			<Form length={pluginOptions.totp?.digits} />
		</MinimalTemplate>
	)
}
