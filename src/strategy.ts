import type { AuthStrategy } from 'payload'

import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers.js'

import type { TotpTokenPayload } from './types.js'

import { TOTP_STRATEGY_NAME } from './constants.js'

export const strategy: AuthStrategy = {
	name: TOTP_STRATEGY_NAME,
	authenticate: async (args) => {
		const { payload } = args
		const cookieStore = await cookies()
		const token = cookieStore.get(`${payload.config.cookiePrefix}-totp`)

		if (!token) {
			return {
				user: null,
			}
		}

		let userId: number | string
		let originalStrategyName: string

		try {
			const result = jwt.verify(token.value, payload.secret) as TotpTokenPayload

			userId = result.userId
			originalStrategyName = result.originalStrategy
		} catch (err) {
			payload.logger.warn({ err }, 'Rejecting TOTP cookie: token could not be verified.')

			return {
				user: null,
			}
		}

		// A cookie naming this strategy would make it delegate to itself with the same
		// args, without a termination condition, until the heap is exhausted.
		if (originalStrategyName === TOTP_STRATEGY_NAME) {
			payload.logger.warn(
				`Rejecting TOTP cookie: it names "${TOTP_STRATEGY_NAME}" as its original strategy, which would recurse until the heap is exhausted.`,
			)

			return {
				user: null,
			}
		}

		const originalStrategy = payload.authStrategies.find(
			(strategy) => strategy.name === originalStrategyName,
		)

		if (!originalStrategy) {
			return {
				user: null,
			}
		}

		const originalStrategyResult = await originalStrategy.authenticate(args)

		if (originalStrategyResult.user?.id === userId) {
			return {
				user: {
					...originalStrategyResult.user,
					_strategy: 'totp',
				},
			}
		} else {
			return {
				user: null,
			}
		}
	},
}
