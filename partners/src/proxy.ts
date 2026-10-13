import { NextResponse, type NextRequest } from 'next/server';

// Optimistic check only: real authorisation happens on the API for every request.
export function proxy(req: NextRequest) {
  const signedIn = req.cookies.has('mcp_rt');
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/dashboard') && !signedIn) {
    const url = new URL('/sign-in', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  if (pathname === '/sign-in' && signedIn) return NextResponse.redirect(new URL('/dashboard', req.url));
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*', '/sign-in'] };
