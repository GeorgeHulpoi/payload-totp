/* eslint-disable no-restricted-exports */

import type { I18nClient } from '@payloadcms/translations'
import type { Payload, User } from 'payload'
import type { CustomTranslationsKeys, CustomTranslationsObject } from 'src/i18n.js'
import type { PayloadTOTPConfig } from 'src/types.js'

import { Modal } from '@payloadcms/ui'

import { Remove as RemoveView } from '../views/Remove/index.js'
import RemoveButton from './RemoveButton.js'

const modalSlug = 'remove-totp'

type Args = {
	i18n: I18nClient<CustomTranslationsObject, CustomTranslationsKeys>
	payload: Payload
	pluginOptions: PayloadTOTPConfig
	user: User
}

export default function Remove({ i18n, payload, pluginOptions, user }: Args) {
	return (
		<>
			<RemoveButton modalSlug={modalSlug}>{i18n.t('general:remove')}</RemoveButton>
			<Modal slug={modalSlug}>
				<RemoveView
					i18n={i18n}
					payload={payload}
					pluginOptions={pluginOptions}
					user={user}
				/>
			</Modal>
		</>
	)
}
