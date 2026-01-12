import type { AuthStrategy } from 'payload'

import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers.js'

import type { TotpTokenPayload } from './types.js'

export const strategy: AuthStrategy = {
	name: 'totp',
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
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (err) {
			// TODO: Log it
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
