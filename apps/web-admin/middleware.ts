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

    console.log('Middleware: Checking cookies for path:', pathname);
    console.log(
      'Middleware: Available cookies:',
      request.cookies
        .getAll()
        .map((c) => c.name)
        .join(', '),
    );

    const sessionToken = cookieNames.find((name) => request.cookies.get(name));

    if (!sessionToken) {
      console.log('Middleware: No session token found. Redirecting to login.');
      const loginUrl = new URL('/login', request.url);
      // Pass the current path as a callback
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    console.log('Middleware: Session token found. Proceeding.');
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
