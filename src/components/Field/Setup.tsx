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
		// `req.url` is absolute and, without a `serverURL`, always `http://<host>`, so on an HTTPS
		// site its origin is not the page's and the setup view would refuse to come back to it.
		const { pathname, search } = new URL(backUrl, 'http://localhost')
		url += `?back=${encodeURIComponent(`${pathname}${search}`)}`
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
