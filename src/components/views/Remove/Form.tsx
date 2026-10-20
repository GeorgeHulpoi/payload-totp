/* eslint-disable no-restricted-exports */

'use client'

import { toast } from '@payloadcms/ui'
import React, { useCallback, useRef, useState } from 'react'

import type { IResponse } from '../../../api/verifyToken.js'

import OTPInput from '../../OTPInput/index.js'

type Args = {
	apiRoute: string
	length?: number
	serverURL: string
}

export default function OTPForm({ apiRoute, length, serverURL }: Args) {
	const [isPending, setIsPending] = useState(false)
	const form = useRef<HTMLFormElement>(null)

	const onFilled = () => {
		if (form.current) {
			form.current.requestSubmit()
		}
	}

	const asyncOperation = useCallback(
		async (event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault()
			event.stopPropagation()

			setIsPending(true)

			const formData = new FormData(event.target as HTMLFormElement)

			const res = await fetch(`${serverURL}${apiRoute}/remove-totp`, {
				body: JSON.stringify(Object.fromEntries(formData)),
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
				method: 'post',
			})

			const data = (await res.json()) as IResponse

			if (!data.ok && data.message) {
				toast.error(data.message)
				return false
			}

			return true
		},
		[apiRoute, serverURL],
	)

	const handleSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
		(event) => {
			asyncOperation(event)
				.then((ok) => {
					if (ok) {
						location.reload()
					} else {
						form.current?.reset()
					}
					setIsPending(false)
				})
				.catch((err) => {
					// eslint-disable-next-line no-console
					console.error(err)
					toast.error('Something went wrong')
					setIsPending(false)
				})
		},
		[asyncOperation],
	)

	return (
		<form onSubmit={handleSubmit} ref={form}>
			<OTPInput disabled={isPending} length={length} name="token" onFilled={onFilled} />
		</form>
	)
}
