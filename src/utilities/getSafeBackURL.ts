import { normalizePathname } from './normalizePathname.js'

type Args = {
	adminRoute: string
	back?: string
	origin: string
}

/**
 * The URL the verify and setup forms send the user to once their code is accepted.
 *
 * `back` comes from the query string, so anyone can put it in a link in front of an
 * administrator: a `javascript:` URL would run in the admin origin with the freshly
 * verified session, and an absolute URL would turn the form into an open redirect. It
 * is resolved against the page's origin and kept only when it stays on that origin, over
 * HTTP(S), inside the admin route; anything else lands on the admin root.
 *
 * The parsed URL is returned rather than `back` itself, so the browser navigates to
 * exactly what was checked.
 */
export function getSafeBackURL({ adminRoute, back, origin }: Args): string {
	const adminRoot = new URL(adminRoute, origin).href

	if (!back) {
		return adminRoot
	}

	let url: URL

	try {
		url = new URL(back, origin)
	} catch {
		return adminRoot
	}

	// `blob:` URLs report the origin that created them, hence the protocol check. Credentials
	// leave the origin as it is, but have no business in a link back into the admin.
	if (
		url.origin !== origin ||
		!['http:', 'https:'].includes(url.protocol) ||
		url.username ||
		url.password
	) {
		return adminRoot
	}

	const adminPath = normalizePathname(adminRoute)
	const insideAdmin =
		adminPath === '/' || url.pathname === adminPath || url.pathname.startsWith(`${adminPath}/`)

	return insideAdmin ? url.href : adminRoot
}
