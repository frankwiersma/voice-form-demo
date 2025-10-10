import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const PROTECTED_PASSWORD = process.env.APP_PASSWORD

  if (!PROTECTED_PASSWORD) {
    return NextResponse.json(
      { success: false, error: 'Server configuration error' },
      { status: 500 }
    )
  }
  try {
    const { password } = await request.json()

    if (password === PROTECTED_PASSWORD) {
      const response = NextResponse.json({ success: true })

      // Set authentication cookie for 7 days
      response.cookies.set('auth-session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })

      return response
    }

    return NextResponse.json(
      { success: false, error: 'Invalid password' },
      { status: 401 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
