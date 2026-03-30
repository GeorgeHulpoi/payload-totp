/* eslint-disable no-restricted-exports */

import type { I18nClient } from '@payloadcms/translations'
import type { BasePayload } from 'payload'

import { Button } from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'

import type { CustomTranslationsKeys, CustomTranslationsObject } from '../../i18n/types.js'

type Args = {
	backUrl?: string
	i18n: I18nClient<CustomTranslationsObject, CustomTranslationsKeys>
	payload: BasePayload
}

export default function Setup({ backUrl, i18n, payload }: Args) {
	let url = formatAdminURL({
		adminRoute: payload.config.routes.admin,
		path: '/setup-totp',
		serverURL: payload.config.serverURL,
	})

	if (backUrl) {
		url += `?back=${encodeURIComponent(backUrl)}`
	}

	return (
		<Button
			buttonStyle="secondary"
			el="link"
			size="small"
			url={url}
		>
			{i18n.t('totpPlugin:setup:button')}
		</Button>
	)
}
