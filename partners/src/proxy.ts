import { NextResponse, type NextRequest } from 'next/server';

// Optimistic routing only: real authorisation happens on the API for every request.
// Partners use /dashboard, My Captain operations use /admin.
const home = (role?: string) => (role === 'admin' ? '/admin' : '/dashboard');

export function proxy(req: NextRequest) {
  const signedIn = req.cookies.has('mcp_rt');
  const role = req.cookies.get('mcp_role')?.value;
  const { pathname } = req.nextUrl;
  const area = pathname.startsWith('/admin') ? 'admin' : pathname.startsWith('/dashboard') ? 'partner' : null;

  if (area && !signedIn) {
    const url = new URL('/sign-in', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  if (area && role && role !== area) return NextResponse.redirect(new URL(home(role), req.url));
  if (pathname === '/sign-in' && signedIn) return NextResponse.redirect(new URL(home(role), req.url));
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*', '/admin/:path*', '/sign-in'] };
