/* eslint-disable no-restricted-exports */

'use client'

import type { FormEvent } from 'react'

import { useCallback, useRef } from 'react'

import { cn } from '../../utilities/cn.js'
import styles from './index.module.scss'

type Args = {
	disabled?: boolean
	length?: number
	name?: string
	onFilled?: (value: string) => void
}

export default function OTPInput({ name, disabled, length = 6, onFilled }: Args) {
	const inputs = useRef<HTMLInputElement[]>(Array(length).fill(null))
	const hiddenInput = useRef<HTMLInputElement>(null)
	const isFilled = hiddenInput.current?.value.length === length

	const moveToPrev = (currentIndex: number) => {
		if (currentIndex > 0) {
			const prevInput = inputs.current[currentIndex - 1]
			if (prevInput) {
				focusAndSelectInput(prevInput)
			}
		}
	}

	const moveToNext = useCallback(
		(currentIndex: number) => {
			if (currentIndex < length - 1) {
				const nextInput = inputs.current[currentIndex + 1]
				if (nextInput) {
					focusAndSelectInput(nextInput)
				}
			}
		},
		[length],
	)

	const updateInputValue = useCallback(() => {
		if (hiddenInput.current) {
			const value = inputs.current
				.filter(Boolean)
				.map((e) => e.value)
				.join('')

			hiddenInput.current.value = value

			if (onFilled && value.length === length) {
				onFilled(value)
			}
		}
	}, [onFilled, length])

	const onInput = (event: FormEvent<HTMLInputElement>, index: number) => {
		const nativeEvent = event.nativeEvent as InputEvent

		if (nativeEvent.inputType === 'deleteContentBackward') {
			moveToPrev(index)
		} else if (
			nativeEvent.inputType === 'insertText' ||
			nativeEvent.inputType === 'deleteContentForward'
		) {
			moveToNext(index)
		}

		updateInputValue()
	}

	const onKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
			if (event.nativeEvent.altKey || event.ctrlKey || event.metaKey) {
				return
			}

			const target = event.target as HTMLInputElement

			switch (event.key) {
				case 'ArrowDown':
				case 'ArrowUp':
					event.preventDefault()
					break
				case 'ArrowLeft':
					moveToPrev(index)
					event.preventDefault()
					break

				case 'ArrowRight':
					moveToNext(index)
					event.preventDefault()
					break

				case 'Backspace':
					if (target.value.length === 0) {
						moveToPrev(index)
						updateInputValue()
						event.preventDefault()
					} else if (target.selectionStart === 0) {
						target.value = ''
						moveToPrev(index)
						updateInputValue()
						event.preventDefault()
					}

					break

				default:
					if (
						!(
							(event.code.startsWith('Digit') || event.code.startsWith('Numpad')) &&
							Number(event.key) >= 0 &&
							Number(event.key) <= 9
						)
					) {
						event.preventDefault()
					}

					if (target.value.length >= 1) {
						event.preventDefault()
						target.value = event.key
						moveToNext(index)
					}

					break
			}
		},
		[moveToNext, updateInputValue],
	)

	const onPaste = useCallback(
		(event: React.ClipboardEvent) => {
			event.preventDefault()

			if (!disabled) {
				let paste = event.clipboardData
					.getData('text')
					.trim()
					.split('')
					.filter((ch) => !isNaN(parseInt(ch)))

				if (paste.length > length) {
					paste = paste.slice(0, length)
				}

				paste.forEach((char, index) => {
					const el = inputs.current[index]
					if (el) {
						el.value = char
					}
				})

				focusAndSelectInput(inputs.current[paste.length - 1])
				updateInputValue()
			}
		},
		[length, disabled, updateInputValue],
	)

	const onHiddenInput = useCallback(
		(event: FormEvent<HTMLInputElement>) => {
			if (disabled) {
				return
			}

			const rawValue = event.currentTarget.value

			let sanitizedValue = rawValue
				.trim()
				.split('')
				.filter((ch) => !isNaN(parseInt(ch)))

			if (sanitizedValue.length > length) {
				sanitizedValue = sanitizedValue.slice(0, length)
			}

			sanitizedValue.forEach((char, index) => {
				const el = inputs.current[index]
				if (el) {
					el.value = char
				}
			})

			focusAndSelectInput(inputs.current[sanitizedValue.length - 1])

			if (onFilled && sanitizedValue.length === length) {
				onFilled(sanitizedValue.join(''))
			}
		},
		[length, disabled, onFilled],
	)

	return (
		<>
			{/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
			<input
				autoComplete="one-time-code"
				name={name}
				onInput={(e) => onHiddenInput(e)}
				ref={hiddenInput}
				style={{
					border: 0,
					clip: 'rect(0,0,0,0)',
					height: '1px',
					margin: '-1px',
					overflow: 'hidden',
					padding: 0,
					position: 'absolute',
					width: '1px',
				}}
			/>
			<div className={cn(styles.root, disabled && styles.disabled)}>
				{Array.from({ length }, (_, index) => index).map((i) => (
					// eslint-disable-next-line jsx-a11y/control-has-associated-label
					<input
						// eslint-disable-next-line jsx-a11y/no-autofocus
						autoFocus={i === 0}
						// Tell 1password to ignore this input
						// https://developer.1password.com/docs/web/compatible-website-design
						data-1p-ignore={true}
						disabled={disabled}
						key={i}
						maxLength={1}
						onInput={(e) => onInput(e, i)}
						onKeyDown={(e) => onKeyDown(e, i)}
						onPaste={(e) => onPaste(e)}
						ref={(el) => {
							if (el) {
								inputs.current[i] = el
							}
						}}
						type="text"
					/>
				))}
				<div className={styles.focus}></div>
				<div className={cn(styles.glow, isFilled && styles.expandGlow)}>
					{Array.from({ length }, (_, index) => index).map((i) => (
						<div key={i}></div>
					))}
				</div>
			</div>
		</>
	)
}

function focusAndSelectInput(element: HTMLInputElement): void {
	element.focus()
	element.select()
}
