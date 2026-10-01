/**
 * Reproduction for the TOTP endpoints trusting any authenticated user.
 *
 * `/setup-totp` wrote `totpSecret` with `id: user.id` into the plugin's collection without
 * checking which collection the user came from. With a second auth collection and integer
 * IDs, its users could overwrite the TOTP secret of the plugin-collection user sharing their
 * ID -- locking that user out, or bypassing their second factor with a known password.
 */

import { Secret, TOTP } from 'otpauth'

jest.mock('next/headers.js', () => ({
	cookies: async () => ({ delete: jest.fn(), get: jest.fn(), set: jest.fn() }),
}))

import { removeEndpointHandler } from '../src/api/remove'
import { setSecret } from '../src/api/setSecret'
import { verifyToken } from '../src/api/verifyToken'

const pluginOptions = { collection: 'users' } as never
const customer = { id: 1, _strategy: 'local-jwt', collection: 'customers', hasTotp: false }

function request(user: unknown, body: unknown) {
	const payload = {
		collections: { users: { config: { auth: { cookies: {} } } } },
		config: { cookiePrefix: 'payload' },
		findByID: jest.fn(),
		secret: 'test-secret',
		update: jest.fn(),
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const req: any = { i18n: { t: (key: string) => key }, json: async () => body, payload, user }

	return { payload, req }
}

function validSetup() {
	const secret = new Secret({ size: 32 })
	const totp = new TOTP({
		algorithm: 'SHA1',
		digits: 6,
		issuer: 'Payload',
		label: '',
		period: 30,
		secret,
	})

	return { secret: secret.base32, token: totp.generate() }
}

test.each([
	['setup-totp', setSecret],
	['verify-totp', verifyToken],
	['remove-totp', removeEndpointHandler],
])('/%s refuses a user of another auth collection', async (_, endpoint) => {
	const { payload, req } = request({ ...customer, hasTotp: endpoint !== setSecret }, validSetup())

	const res = await endpoint(pluginOptions)(req)

	expect(await res.json()).toEqual({ message: 'error:unauthorized', ok: false })
	expect(payload.update).not.toHaveBeenCalled()
	expect(payload.findByID).not.toHaveBeenCalled()
})
