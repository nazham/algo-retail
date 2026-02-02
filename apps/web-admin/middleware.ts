import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for session token in cookies
  const sessionTokenNames = [
    'better-auth.session_token',
    '__Secure-better-auth.session_token',
    'session_token',
  ];
  const hasSession = sessionTokenNames.some((name) => request.cookies.get(name));

  // Get role from our auth-role cookie
  const authRole = request.cookies.get('auth-role')?.value;

  // --- Route Protection Logic ---

  // 1. Protect /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    // No session -> redirect to login
    if (!hasSession) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Has session but waitlisted -> redirect to /waitlist
    if (authRole === 'waitlist') {
      return NextResponse.redirect(new URL('/waitlist', request.url));
    }
  }

  // 2. /waitlist page: If user is NOT waitlisted (e.g., admin), redirect to dashboard
  if (pathname === '/waitlist') {
    if (hasSession && authRole && authRole !== 'waitlist') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/waitlist'],
};
