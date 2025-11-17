import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { nextUrl, headers } = request;
  const host = headers.get('host') || '';
  const pathname = nextUrl.pathname;

  // Only redirect requests to root (/) on localhost (127.0.0.1 or localhost)
  // Also exclude Next.js internals and API routes
  if ((host.startsWith('localhost') || host.startsWith('127.0.0.1')) && pathname === '/') {
    const url = nextUrl.clone();
    url.pathname = '/marketplace';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/',
};
