import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if user has valid session cookie
  const authCookie = request.cookies.get('auth-session')

  if (authCookie?.value === 'authenticated') {
    return NextResponse.next()
  }

  // Check if this is a password submission
  const url = request.nextUrl.clone()
  if (url.pathname === '/api/auth') {
    return NextResponse.next()
  }

  // Redirect to password page if not authenticated
  if (url.pathname !== '/password') {
    url.pathname = '/password'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
