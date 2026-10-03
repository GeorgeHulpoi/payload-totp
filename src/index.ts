import type {
	Access,
	CheckboxField,
	CollectionConfig,
	Config,
	Payload,
	TextField,
	UIField,
} from 'payload'

import type { PayloadTOTPConfig } from './types.js'

import { removeEndpointHandler } from './api/remove.js'
import { setSecret } from './api/setSecret.js'
import { verifyToken } from './api/verifyToken.js'
import { deleteCookieAfterLogout } from './hooks/deleteCookieAfterLogout.js'
import { refreshTotpCookieAfterRefresh } from './hooks/refreshTotpCookieAfterRefresh.js'
import { resetCodeAttemptsAfterUnlock } from './hooks/resetCodeAttemptsAfterUnlock.js'
import { setHasTotp } from './hooks/setHasTotp.js'
import { i18n } from './i18n/index.js'
import { strategy } from './strategy.js'
import { totpAccess, type TotpAccessOptions } from './totpAccess.js'
import { totpAttemptsCollection } from './utilities/codeAttempts.js'

const collectionOperations = [
	'create',
	'delete',
	'read',
	'readVersions',
	'unlock',
	'update',
] as const
const globalOperations = ['read', 'readVersions', 'update'] as const

/**
 * Wraps each of `operations` in `totpAccess`, except those the collection or global opts out
 * of through `custom.totp.disableAccessWrapper`. Structural, so it takes the incoming configs
 * in `payloadTotp` and the sanitized ones in `onInit` alike.
 */
function wrapAccess<TAccess>(
	pluginOptions: PayloadTOTPConfig,
	entity: { access?: TAccess; custom?: CollectionConfig['custom'] },
	operations: readonly string[],
	options: Record<string, TotpAccessOptions> = {},
): TAccess {
	if (pluginOptions.disableAccessWrapper) {
		return entity.access as TAccess
	}

	const access = (entity.access || {}) as Record<string, Access | undefined>

	return {
		...access,
		...Object.fromEntries(
			operations.map((operation) => [
				operation,
				entity.custom?.totp?.disableAccessWrapper?.[operation]
					? access[operation]
					: totpAccess(access[operation], options[operation]),
			]),
		),
	} as TAccess
}

const wrappedConfigs = new WeakSet<object>()

/**
 * Payload appends some collections of its own after every plugin has run, so the wrapping in
 * `payloadTotp` never sees them. These hold what a session that still owes a code must not
 * reach: jobs (whose inputs and outputs are stored, and creating one queues it) and the global
 * their schedules are computed from, folders and saved list filters. Locks can't be written
 * either, but reading them stays open: the dashboard reads them with access enforced and no
 * error handling, and it renders right after login, before the redirect to the verify or
 * setup view lands.
 *
 * Collections of plugins listed after this one are left alone; their public access would
 * break. Payload's dev-mode reload swaps the config without calling `onInit`, so this pass
 * does not survive it there.
 */
function wrapPayloadCollections(payload: Payload, pluginOptions: PayloadTOTPConfig) {
	const { config } = payload

	if (wrappedConfigs.has(config)) {
		return
	}

	wrappedConfigs.add(config)

	const operationsBySlug: Record<string, readonly string[]> = {
		'payload-jobs': collectionOperations,
		'payload-locked-documents': collectionOperations.filter((operation) => operation !== 'read'),
		'payload-query-presets': collectionOperations,
	}

	if (config.folders) {
		operationsBySlug[config.folders.slug] = collectionOperations
	}

	for (const collection of config.collections) {
		const operations = operationsBySlug[collection.slug]

		if (operations) {
			collection.access = wrapAccess(pluginOptions, collection, operations)
		}
	}

	for (const global of config.globals) {
		if (global.slug === 'payload-jobs-stats') {
			global.access = wrapAccess(pluginOptions, global, globalOperations)
		}
	}
}

const payloadTotp =
	(pluginOptions: PayloadTOTPConfig) =>
	(config: Config): Config => {
		// Holds the secret of an enrolled user. It stays on the collection even when
		// the plugin is disabled, so that toggling the option doesn't drop the column
		// and force everyone who had set TOTP up to enroll again.
		const totpSecretField = {
			name: 'totpSecret',
			type: 'text',
			access: {
				create: () => false,
				read: () => false,
				update: () => false,
			},
			admin: {
				disableBulkEdit: true,
				disableListColumn: true,
				disableListFilter: true,
				hidden: true,
			},
			disableBulkEdit: true,
			disableListColumn: true,
			disableListFilter: true,
		} as TextField

		// A `totpAccess` applied by hand, as documented in the README, reads the
		// options back from here, so they stay on the config even while disabled.
		const custom = {
			...(config.custom || {}),
			totp: {
				pluginOptions,
			},
		}

		// Disabled keeps the schema but adds none of the behaviour: no access
		// wrappers, auth strategy, admin provider, views, endpoints or hooks.
		if (pluginOptions.disabled) {
			return {
				...config,
				collections: [
					...(config.collections || []).map((collection) =>
						collection.slug === pluginOptions.collection
							? {
									...collection,
									fields: [...(collection.fields || []), totpSecretField],
								}
							: collection,
					),
					totpAttemptsCollection,
				],
				custom,
			}
		}

		return {
			...config,
			admin: {
				...(config.admin || {}),
				components: {
					...(config.admin?.components || {}),
					providers: [
						...(config.admin?.components?.providers || []),
						{
							path: 'payload-totp/rsc#TOTPProvider',
							serverProps: {
								pluginOptions,
							},
						},
					],
					views: {
						// Backslash versions are standard and works in general.
						// But it doesn't work well when you're using PayloadCMS
						// without `/admin`, but `/`.
						SetupTOTP: {
							Component: {
								path: 'payload-totp/rsc#TOTPSetup',
								serverProps: {
									pluginOptions,
								},
							},
							exact: true,
							path: '/setup-totp',
							sensitive: false,
							strict: true,
						},
						SetupTOTPBackslash: {
							Component: {
								path: 'payload-totp/rsc#TOTPSetup',
								serverProps: {
									pluginOptions,
								},
							},
							exact: true,
							path: '/setup-totp',
							sensitive: false,
							strict: true,
						},
						VerifyTOTP: {
							Component: {
								path: 'payload-totp/rsc#TOTPVerify',
								serverProps: {
									pluginOptions,
								},
							},
							exact: true,
							path: '/verify-totp',
							sensitive: false,
							strict: true,
						},
						VerifyTOTPBackslash: {
							Component: {
								path: 'payload-totp/rsc#TOTPVerify',
								serverProps: {
									pluginOptions,
								},
							},
							exact: true,
							path: '/verify-totp',
							sensitive: false,
							strict: true,
						},
						// Fix for https://github.com/GeorgeHulpoi/payload-totp/issues/46
						// The order is important!
						...(config.admin?.components?.views || {}),
					},
				},
			},
			collections: [
				...(config.collections || []).map((collection) => {
					if (collection.slug === pluginOptions.collection) {
						return {
							...collection,
							access: wrapAccess(pluginOptions, collection, collectionOperations, {
								read: { allowOwnDocumentDuringSetup: true },
							}),
							auth: {
								...(typeof collection.auth === 'object' ? collection.auth : {}),
								strategies: [
									strategy,
									...(typeof collection.auth === 'object'
										? collection.auth?.strategies || []
										: []),
								],
							},
							fields: [
								...(collection.fields || []),
								totpSecretField,
								{
									name: 'totpSecretUI',
									type: 'ui',
									admin: {
										components: {
											Field: {
												path: 'payload-totp/rsc#TOTPField',
												serverProps: {
													pluginOptions,
												},
											},
										},
										disableListColumn: true,
									},
								} as UIField,
								{
									name: 'hasTotp',
									type: 'checkbox',
									access: {
										read: ({ data, req: { user } }) =>
											data && user && data?.id === user?.id,
									},
									admin: {
										disableBulkEdit: true,
										disableListColumn: true,
										disableListFilter: true,
										hidden: true,
									},
									hooks: {
										afterRead: [setHasTotp(pluginOptions)],
									},
									virtual: true,
								} as CheckboxField,
							],
							hooks: {
								...(collection.hooks || {}),
								afterLogout: [
									...(collection.hooks?.afterLogout || []),
									deleteCookieAfterLogout,
								],
								afterOperation: [
									...(collection.hooks?.afterOperation || []),
									resetCodeAttemptsAfterUnlock,
								],
								afterRefresh: [
									...(collection.hooks?.afterRefresh || []),
									refreshTotpCookieAfterRefresh,
								],
							},
						}
					} else {
						return {
							...collection,
							access: wrapAccess(pluginOptions, collection, collectionOperations),
						}
					}
				}),
				// Added unwrapped: nobody is given access to it.
				totpAttemptsCollection,
			],
			custom,
			endpoints: [
				...(config.endpoints || []),
				{
					handler: setSecret(pluginOptions),
					method: 'post',
					path: '/setup-totp',
				},
				{
					handler: verifyToken(pluginOptions),
					method: 'post',
					path: '/verify-totp',
				},
				{
					handler: removeEndpointHandler(pluginOptions),
					method: 'post',
					path: '/remove-totp',
				},
			],
			globals: [
				...(config.globals || []).map((global) => {
					return {
						...global,
						access: wrapAccess(pluginOptions, global, globalOperations),
					}
				}),
			],
			i18n: i18n(config.i18n),
			onInit: async (payload) => {
				wrapPayloadCollections(payload, pluginOptions)

				await config.onInit?.(payload)
			},
		}
	}

export { payloadTotp, totpAccess }
export type { TotpAccessOptions }
