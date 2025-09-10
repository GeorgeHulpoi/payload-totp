/* eslint-disable no-restricted-exports */

import type { TOTP } from 'otpauth'

import { toDataURL } from 'qrcode'

import { cn } from '../../utilities/cn.js'
import styles from './index.module.css'

type Args = {
	forceWhiteBackgroundOnQrCode?: boolean
	totp: TOTP
}

export default async function QRCode({ forceWhiteBackgroundOnQrCode, totp }: Args) {
	const src = await toDataURL(totp.toString(), {
		color: {
			dark: '#fff',
			light: '#000',
		},
		margin: 0,
	})

	return (
		<img
			alt="2FA QR Code"
			className={cn(styles.root, forceWhiteBackgroundOnQrCode && styles.forceWhiteBackground)}
			height={228}
			src={src}
			width={228}
		/>
	)
}
