import { getToken } from 'next-auth/jwt'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (token) {
    return NextResponse.next()
  }

  if (
    req.nextUrl.pathname.startsWith('/api/reservations') ||
    req.nextUrl.pathname.startsWith('/api/admin')
  ) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 })
  }

  const url = req.nextUrl.clone()
  url.pathname = '/'
  url.search = ''
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    '/agenda/:path*',
    '/minhas-reservas/:path*',
    '/admin/:path*',
    '/api/reservations/:path*',
    '/api/admin/:path*',
  ],
}
