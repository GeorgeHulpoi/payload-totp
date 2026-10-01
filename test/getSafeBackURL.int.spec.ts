/**
 * Reproduction for the unvalidated `back` parameter.
 *
 * The verify and setup forms called `location.replace(back)` with `back` taken straight
 * from the query string. `/admin/verify-totp?back=javascript:alert(document.domain)`,
 * reachable through Payload's login redirect, ran script in the admin origin as soon as
 * a valid code was entered, and an absolute `back` made the same flow an open redirect.
 */

import { getSafeBackURL } from '../src/utilities/getSafeBackURL'

const origin = 'https://cms.example.com'
const resolve = (back?: string, adminRoute = '/admin') =>
	getSafeBackURL({ adminRoute, back, origin })

describe('getSafeBackURL', () => {
	test.each([
		['/admin', 'https://cms.example.com/admin'],
		['/admin/', 'https://cms.example.com/admin/'],
		[
			'/admin/collections/users?page=2#top',
			'https://cms.example.com/admin/collections/users?page=2#top',
		],
		['https://cms.example.com/admin/account', 'https://cms.example.com/admin/account'],
	])('keeps %s', (back, expected) => {
		expect(resolve(back)).toBe(expected)
	})

	test.each([
		'javascript:alert(document.domain)',
		'JavaScript:alert(1)',
		' javascript:alert(1)',
		'java\tscript:alert(1)',
		'\njavascript:alert(1)',
		'data:text/html,<script>alert(1)</script>',
		'blob:https://cms.example.com/0b5ec5bb-6f5d-4ad4-9b4f-2b0b9c1d3b42',
		'https://evil.example/admin',
		'http://cms.example.com/admin',
		'https://user:pass@cms.example.com/admin',
		'//evil.example/admin',
		'/\\evil.example/admin',
		'\\\\evil.example/admin',
		'/admin/../api/users',
		'/admin/%2e%2e/api/users',
		'/admin\\..\\api',
		'/administrator',
		'/',
		'/api/users/me',
		'http://[',
	])('replaces %j with the admin root', (back) => {
		expect(resolve(back)).toBe('https://cms.example.com/admin')
	})

	test('falls back to the admin root without a destination', () => {
		expect(resolve(undefined)).toBe('https://cms.example.com/admin')
		expect(resolve('')).toBe('https://cms.example.com/admin')
	})

	describe('custom admin route', () => {
		test('rejects the default route', () => {
			expect(resolve('/admin', '/admin2')).toBe('https://cms.example.com/admin2')
		})

		test('keeps paths under it, ignoring a trailing slash on the route', () => {
			expect(resolve('/admin2/account', '/admin2/')).toBe(
				'https://cms.example.com/admin2/account',
			)
		})
	})

	describe('admin mounted at /', () => {
		test('keeps any same-origin path', () => {
			expect(resolve('/collections/users', '/')).toBe(
				'https://cms.example.com/collections/users',
			)
		})

		test('still rejects other origins and schemes', () => {
			expect(resolve('//evil.example/', '/')).toBe('https://cms.example.com/')
			expect(resolve('javascript:alert(1)', '/')).toBe('https://cms.example.com/')
			expect(resolve('blob:https://cms.example.com/x', '/')).toBe('https://cms.example.com/')
		})

		test('stays on the origin when the path normalises to "//"', () => {
			expect(new URL(resolve('/.//evil.example/', '/')).origin).toBe(origin)
		})
	})
})
