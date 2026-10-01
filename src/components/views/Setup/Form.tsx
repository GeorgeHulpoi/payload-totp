/* eslint-disable no-restricted-exports */

'use client'

import { toast } from '@payloadcms/ui'
import React, { useCallback, useRef, useState } from 'react'

import type { IResponse } from '../../../api/setSecret.js'

import { getSafeBackURL } from '../../../utilities/getSafeBackURL.js'
import OTPInput from '../../OTPInput/index.js'

type Args = {
	adminRoute: string
	apiRoute: string
	back?: string
	length?: number
	secret: string
	serverURL: string
}

export default function OTPForm({ adminRoute, apiRoute, back, length, secret, serverURL }: Args) {
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

			const res = await fetch(`${serverURL}${apiRoute}/setup-totp`, {
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
						// Use location, auth strategy must run again
						location.replace(
							getSafeBackURL({ adminRoute, back, origin: window.location.origin }),
						)
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
		[adminRoute, back, asyncOperation],
	)

	return (
		<form onSubmit={handleSubmit} ref={form}>
			<input defaultValue={secret} name="secret" type="hidden" />
			<OTPInput disabled={isPending} length={length} name="token" onFilled={onFilled} />
		</form>
	)
}
