import { NextResponse, type NextRequest } from 'next/server'

/**
 * Capture fbclid at landing and build fbc = fb.1.{ms}.{fbclid} into a first-party HttpOnly cookie
 * (§13.6). Safari ITP kills the Pixel's _fbp within 7 days — the DB (carts/orders.attribution) is
 * the durable store; this cookie is the convenience that seeds it. Purchase reads the DB, not cookies (#8).
 *
 * Next 16 renamed the `middleware` file convention to `proxy`; same edge runtime, same matcher.
 */
export function proxy(req: NextRequest) {
  const res = NextResponse.next()
  const fbclid = req.nextUrl.searchParams.get('fbclid')
  if (fbclid && !req.cookies.get('dkb_fbc')) {
    res.cookies.set('dkb_fbc', `fb.1.${Date.now()}.${fbclid}`, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 90 })
    res.cookies.set('dkb_fbclid', fbclid, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 90 })
  }
  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|admin|favicon.ico).*)'],
}
