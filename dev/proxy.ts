import { NextResponse } from 'next/server.js'
import type { NextRequest } from 'next/server.js'

export function proxy(request: NextRequest) {
	const pathname = request.nextUrl.pathname
	const response = NextResponse.next()

	response.headers.append('x-pathname', pathname)

	return response
}
