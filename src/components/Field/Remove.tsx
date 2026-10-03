/* eslint-disable no-restricted-exports */

import type { I18nClient } from '@payloadcms/translations'
import type { Payload, TypedUser } from 'payload'

import { Modal } from '@payloadcms/ui'

import type { CustomTranslationsKeys, CustomTranslationsObject } from '../../i18n/types.js'
import type { PayloadTOTPConfig } from '../../types.js'

import { Remove as RemoveView } from '../views/Remove/index.js'
import RemoveButton from './RemoveButton.js'

const modalSlug = 'remove-totp'

type Args = {
	i18n: I18nClient<CustomTranslationsObject, CustomTranslationsKeys>
	payload: Payload
	pluginOptions: PayloadTOTPConfig
	user: TypedUser
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
