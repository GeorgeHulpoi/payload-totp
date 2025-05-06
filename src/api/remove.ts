import type { I18nClient } from '@payloadcms/translations'
import type { BasePayload, PayloadHandler } from 'payload'

import { Secret, TOTP } from 'otpauth'

import type { CustomTranslationsKeys, CustomTranslationsObject } from '../i18n/types.js'
import type { PayloadTOTPConfig, UserWithTotp } from '../types.js'

import { getTotpSecret } from '../utilities/getTotpSecret.js'
import { removeCookie } from '../utilities/removeCookie.js'

export function removeEndpointHandler(pluginOptions: PayloadTOTPConfig) {
	const handler: PayloadHandler = async (req) => {
		const { payload, user } = req as unknown as { payload: BasePayload; user: UserWithTotp }
		const i18n = req.i18n as unknown as I18nClient<
			CustomTranslationsObject,
			CustomTranslationsKeys
		>

		if (!user) {
			return Response.json({ message: i18n.t('error:unauthorized'), ok: false })
		}

		if (!user.hasTotp || user.forceTotp || pluginOptions.forceSetup) {
			return Response.json({ message: i18n.t('error:unauthorized'), ok: false })
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let data: any

		try {
			data = req.json && (await req.json())
			// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-empty
		} catch (err) {}

		// TODO: A better validation
		if (typeof data !== 'object' || typeof data['token'] !== 'string') {
			return Response.json({ message: i18n.t('error:unspecific'), ok: false })
		}

		const totpSecret = await getTotpSecret({
			collection: pluginOptions.collection,
			payload,
			user,
		})

		const totp = new TOTP({
			algorithm: pluginOptions.totp?.algorithm || 'SHA1',
			digits: pluginOptions.totp?.digits || 6,
			issuer: pluginOptions.totp?.issuer || 'Payload',
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			label: user.email || user.username,
			period: pluginOptions.totp?.period || 30,
			secret: Secret.fromBase32(totpSecret!),
		})

		const delta = totp.validate({ token: data['token'].toString(), window: 1 })

		if (delta === null) {
			return Response.json({ message: i18n.t('totpPlugin:setup:incorrectCode'), ok: false })
		}

		await payload.update({
			id: user.id,
			collection: user.collection,
			data: {
				totpSecret: null,
			},
			overrideAccess: true,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any) // TODO: Report this to Payload

		await removeCookie(payload.config.cookiePrefix)

		return Response.json({ ok: true })
	}

	return handler
}

export interface IResponse {
	message?: string
	ok: boolean
}
