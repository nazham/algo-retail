import { authClient } from './auth-client';
import { invalidateSessionCache } from './api-client';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  tenantId?: string;
}

/**
 * Centralized auth utilities for consistent behavior across the app.
 *
 * IMPORTANT: The auth-role cookie is HTTP-only and set by the backend.
 * These utilities should NOT attempt to set/clear the auth-role cookie client-side.
 */

/**
 * Sign out: calls authClient.signOut and redirects.
 * The backend will clear the HTTP-only auth-role cookie.
 */
export async function signOutAndRedirect(redirectTo = '/login') {
  try {
    // Clear cached session immediately for security
    invalidateSessionCache();
    await authClient.signOut();
  } catch (e) {
    // Ignore signout errors
  }
  if (typeof window !== 'undefined') {
    window.location.href = redirectTo;
  }
}

/**
 * Get current user role from session.
 * This is for UI decisions only - actual access control is enforced by backend.
 */
export async function getCurrentRole(): Promise<string> {
  const session = await authClient.getSession();
  const user = session.data?.user as SessionUser | undefined;
  return user?.role || 'waitlist';
}

/**
 * Redirect user based on their role.
 * Respects callbackUrl if provided (useful for deep linking).
 */
export async function redirectByRole(
  router: { push: (url: string) => void },
  callbackUrl?: string | null,
) {
  const role = await getCurrentRole();

  if (role === 'waitlist') {
    router.push('/waitlist');
  } else if (callbackUrl) {
    router.push(callbackUrl);
  } else {
    router.push('/dashboard');
  }
}
