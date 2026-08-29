import type { Payload, User } from 'payload'

import { TOTP_STRATEGY_NAME } from '../constants.js'
import { readTotpCookie } from './readTotpCookie.js'

type Args = {
	payload: Payload
	user: User
}

/**
 * The strategy to record in a freshly written TOTP cookie.
 *
 * Prefers the strategy that authenticated the current request. When that is the TOTP
 * strategy itself, the underlying strategy is recovered from the existing cookie, so
 * the new cookie can never point back at the TOTP strategy.
 */
export async function resolveOriginalStrategy({
	payload,
	user,
}: Args): Promise<string | undefined> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const strategyName = (<any>user)?._strategy

	if (typeof strategyName === 'string' && strategyName && strategyName !== TOTP_STRATEGY_NAME) {
		return strategyName
	}

	return (await readTotpCookie({ payload, user }))?.originalStrategy
}
