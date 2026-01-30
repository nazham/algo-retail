import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    // Check for session token in cookies
    // better-auth uses 'better-auth.session_token' by default, or similar.
    // We check for the likely cookie names.
    const sessionToken =
      request.cookies.get('better-auth.session_token') || request.cookies.get('session_token');

    if (!sessionToken) {
      const loginUrl = new URL('/login', request.url);
      // Optional: Add ?callbackUrl=... if needed
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
