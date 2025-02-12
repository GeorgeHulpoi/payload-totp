import type { I18nClient } from '@payloadcms/translations'
import type { PayloadHandler } from 'payload'

import { Secret, TOTP } from 'otpauth'

import type { CustomTranslationsKeys, CustomTranslationsObject } from '../i18n.js'
import type { PayloadTOTPConfig } from '../types.js'

import { setCookie } from '../setCookie.js'
import { getTotpSecret } from '../utilities/getTotpSecret.js'

export function setSecret(pluginOptions: PayloadTOTPConfig) {
	const handler: PayloadHandler = async (req) => {
		const { payload, user } = req
		const i18n = req.i18n as unknown as I18nClient<
			CustomTranslationsObject,
			CustomTranslationsKeys
		>

		if (!user) {
			return Response.json({ message: i18n.t('error:unauthorized'), ok: false })
		}

		const totpSecret = await getTotpSecret(user, payload)

		if (totpSecret) {
			return Response.json({ message: i18n.t('totpPlugin:errors:alreadySet'), ok: false })
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let data: any

		try {
			data = req.json && (await req.json())
			// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-empty
		} catch (err) {}

		// TODO: Better validation
		if (
			typeof data !== 'object' ||
			typeof data['token'] !== 'string' ||
			typeof data['secret'] !== 'string'
		) {
			return Response.json({ message: i18n.t('error:unspecific'), ok: false })
		}

		const totp = new TOTP({
			algorithm: pluginOptions.totp?.algorithm || 'SHA1',
			digits: pluginOptions.totp?.digits || 6,
			issuer: pluginOptions.totp?.issuer || 'Payload',
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			label: user.email || user.username,
			period: pluginOptions.totp?.period || 30,
			secret: Secret.fromBase32(data['secret']),
		})

		const delta = totp.validate({ token: data['token'].toString(), window: 1 })

		if (delta === null) {
			return Response.json({ message: i18n.t('totpPlugin:setup:incorrectCode'), ok: false })
		}

		await payload.update({
			id: user.id,
			collection: user.collection,
			data: {
				totpSecret: data['secret'],
			},
			overrideAccess: true,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any) // TODO: Report this to Payload

		const collection = payload.collections[user.collection]

		await setCookie({
			authConfig: collection.config.auth,
			cookiePrefix: payload.config.cookiePrefix,
			secret: payload.secret,
			user,
		})

		return Response.json({ ok: true })
	}

	return handler
}

export interface IResponse {
	message?: string
	ok: boolean
}
