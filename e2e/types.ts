export interface ISetupArgs {
	forceSetup?: boolean
	disableAccessWrapper?: boolean
	forceWhiteBackgroundOnQrCode?: boolean
	overrideBaseURL?: string
	overridePort?: number
	adminRoute?: string
	apiRoute?: string
	serverURL?: string
}

export type ISetupResult = Promise<{
	port: number
	baseURL: string
	teardown: () => Promise<void>
}>
