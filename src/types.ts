import type { TOTP } from 'otpauth'
import type { AuthStrategyResult, CollectionSlug } from 'payload'

export type PayloadTOTPConfig = {
	collection: CollectionSlug
	disableAccessWrapper?: boolean
	disabled?: boolean
	forceSetup?: boolean
	forceWhiteBackgroundOnQrCode?: boolean
	totp?: Partial<Pick<TOTP, 'algorithm' | 'digits' | 'issuer' | 'period'>>
}

/**
 * The authenticated user as Payload hands it to a request.
 *
 * Payload sets `_strategy` on that user at runtime but, on 3.x, types it only on what a
 * strategy returns -- not on `TypedUser`/`PayloadRequest['user']`. Borrowing the shape
 * from `AuthStrategyResult` keeps the field name checked against Payload instead of
 * re-declared here, where a misspelling would silently read as `undefined`.
 *
 * Payload 4 exports this same type under this same name and types `req.user` as it, so
 * once the peer dependency moves to 4.x this alias becomes a direct import.
 */
export type AuthenticatedUser = NonNullable<AuthStrategyResult['user']>

export type UserWithTotp = {
	hasTotp: boolean
} & AuthenticatedUser

export type TotpTokenPayload = {
	originalStrategy: string
	userId: number | string
}
