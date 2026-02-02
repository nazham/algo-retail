import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    // Check for session token in cookies
    // Better-auth uses 'better-auth.session_token' or '__Secure-better-auth.session_token' in prod
    const cookieNames = [
      'better-auth.session_token',
      '__Secure-better-auth.session_token',
      'session_token',
    ];

    const sessionToken = cookieNames.find((name) => request.cookies.get(name));

    if (!sessionToken) {
      const loginUrl = new URL('/login', request.url);
      // Pass the current path as a callback
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
