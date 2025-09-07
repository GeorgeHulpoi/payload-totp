import type { TOTP } from 'otpauth'
import type { CollectionSlug, TypedUser } from 'payload'

export type PayloadTOTPConfig = {
	collection: CollectionSlug
	disableAccessWrapper?: boolean
	disabled?: boolean
	forceSetup?: boolean
	totp?: Partial<Pick<TOTP, 'algorithm' | 'digits' | 'issuer' | 'period'>>
}

export type UserWithTotp = {
	hasTotp: boolean
} & TypedUser
