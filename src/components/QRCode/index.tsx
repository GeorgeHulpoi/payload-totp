/* eslint-disable no-restricted-exports */

import type { TOTP } from 'otpauth'

import { toDataURL } from 'qrcode'

import styles from './index.module.css'

type Args = {
	totp: TOTP
}

export default async function QRCode({ totp }: Args) {
	const src = await toDataURL(totp.toString(), {
		color: {
			dark: '#000',
			light: '#fff',
		},
		margin: 0,
	})

	return <img alt="2FA QR Code" className={styles.root} height={228} src={src} width={228} />
}
