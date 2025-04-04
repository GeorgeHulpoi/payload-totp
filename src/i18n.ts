import type {
	DefaultTranslationsObject,
	I18nOptions,
	NestedKeysStripped,
} from '@payloadcms/translations'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const i18n = (incomingI18n?: I18nOptions<{} | DefaultTranslationsObject>) =>
	({
		...(incomingI18n || {}),
		translations: {
			...(incomingI18n?.translations || {}),
			en: {
				...(incomingI18n?.translations?.en || {}),
				totpPlugin: {
					authApp: 'Authenticator app',
					configured: 'Configured',
					errors: {
						alreadySet: 'You already have TOTP configured.',
					},
					fieldDescription:
						'Use an authentication app or browser extension to get two-factor authentication codes when prompted.',
					setup: {
						addCodeManually: 'Add code manually',
						button: 'Setup',
						description:
							'You will need a two-factor authentication app such as <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> to complete this process. After installing one, scan the QR code below using your application.',
						enterCode:
							'Enter the {digits}-digit authentication code generated by your app:',
						incorrectCode:
							'Incorrect code. If this error persists, rescan the QR code.',
						title: 'Setup Two-Factor Authentication',
					},
					verify: {
						title: 'Verification',
					},
				},
			},
		},
	}) as I18nOptions<DefaultTranslationsObject | I18n>

type I18n = {
	totpPlugin: {
		authApp: string
		configured: string
		errors: {
			alreadySet: string
		}
		fieldDescription: string
		setup: {
			addCodeManually: string
			button: string
			description: string
			enterCode: string
			incorrectCode: string
			title: string
		}
		verify: {
			title: string
		}
	}
}

export type CustomTranslationsObject = I18n
export type CustomTranslationsKeys = NestedKeysStripped<CustomTranslationsObject>
