import type { TOTP } from 'otpauth'
import type { CollectionSlug, User } from 'payload'

export type PayloadTOTPConfig = {
	collection: CollectionSlug
	disableAccessWrapper?: boolean
	disabled?: boolean
	forceSetup?: boolean
	totp?: Partial<Pick<TOTP, 'algorithm' | 'digits' | 'issuer' | 'period'>>
}

export type UserWithTotp = {
	forceTotp: boolean
	hasTotp: boolean
} & User
