/* eslint-disable no-restricted-exports */

'use client'

import { useState } from 'react'

type Args = {
	button: {
		className: string
		text: string
	}
	secret: React.ReactNode
}

export default function ShowSecretClient({ button, secret }: Args) {
	const [show, setShow] = useState(false)

	const onClick = () => setShow(true)

	if (show) {
		return secret
	} else {
		return (
			<button className={button.className} onClick={onClick} type="button">
				{button.text}
			</button>
		)
	}
}
