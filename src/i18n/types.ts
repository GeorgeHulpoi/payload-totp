import type { NestedKeysStripped } from '@payloadcms/translations'

type I18n = {
	totpPlugin: {
		authApp: string
		configured: string
		errors: {
			alreadySet: string
		}
		fieldDescription: string
		forceTotp: {
			description: string
			label: string
		}
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
