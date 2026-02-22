import { authClient } from './auth-client';
import { toast } from 'sonner';

type ApiClientOptions = RequestInit & {
  // Add any custom options here if needed
};

function getBaseUrl() {
  // 🟢 Client-side: Proxy through Next.js to attach cookies
  if (typeof window !== 'undefined') {
    return '/api';
  }

  // Server-side: Direct connection to backend
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEXT_PUBLIC_API_URL is not defined in production environment');
    }
    // Fallback for local development only
    return 'http://localhost:8080';
  }
  return baseUrl;
}

// Define the session user type based on Better-Auth and our extensions
interface SessionUser {
  id: string;
  email: string;
  name: string;
  tenantId?: string;
}

// ============= SESSION CACHE =============
// Cache session to avoid duplicate getSession calls across parallel API requests
// TTL of 30 seconds balances security with performance
const SESSION_CACHE_TTL = 30_000; // 30 seconds

interface CachedSession {
  data: { session?: { token?: string }; user?: SessionUser } | null;
  timestamp: number;
}

let sessionCache: CachedSession | null = null;
let pendingSessionRequest: Promise<CachedSession['data']> | null = null;

async function getCachedSession(): Promise<CachedSession['data']> {
  const now = Date.now();

  // Return cached session if still valid
  if (sessionCache && now - sessionCache.timestamp < SESSION_CACHE_TTL) {
    return sessionCache.data;
  }

  // If a request is already in flight, wait for it (deduplication)
  if (pendingSessionRequest) {
    return pendingSessionRequest;
  }

  // Fetch new session and cache it
  pendingSessionRequest = authClient
    .getSession()
    .then((result) => {
      sessionCache = {
        data: result?.data ?? null,
        timestamp: Date.now(),
      };
      return sessionCache.data;
    })
    .finally(() => {
      pendingSessionRequest = null;
    });

  return pendingSessionRequest;
}

// Export for manual cache invalidation (e.g., after login/logout)
export function invalidateSessionCache() {
  sessionCache = null;
  pendingSessionRequest = null;
}
// =========================================

export async function apiClient<T>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
  const { headers, ...rest } = options;
  const baseUrl = getBaseUrl();

  // Normalize endpoint to ensuring leading slash or not matching base
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  // Get session token and user info if available (using cached session)
  const session = await getCachedSession();
  const token = session?.session?.token;
  const user = session?.user as SessionUser | undefined;
  const tenantId = user?.tenantId;

  // Prepare headers
  const defaultHeaders: HeadersInit = {
    // 'Content-Type': 'application/json', // Let browser set content-type for FormData
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    // Use dynamic Tenant ID from session
    ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
    ...headers,
  } as HeadersInit;

  // If body is not FormData, add Content-Type: application/json
  if (options.body && !(options.body instanceof FormData)) {
    (defaultHeaders as any)['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      headers: defaultHeaders,
      credentials: 'include', // Ensure cookies are sent (Critical for Better-Auth)
      ...rest,
    });

    if (!response.ok) {
      // Try to parse error message
      let errorMessage = 'An error occurred';
      try {
        const errorData = await response.json();
        const rawMessage = errorData.message || errorData.error || errorMessage;
        errorMessage = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
      } catch (e) {
        errorMessage = response.statusText;
      }

      // Handle auth errors
      if (response.status === 401) {
        console.error(`[API] 401 Unauthorized at ${response.url}`);
        // Session expired - redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        toast.error('Session expired. Please login again.');
      }

      if (response.status === 403) {
        console.error(`[API] 403 Forbidden at ${response.url}`);
        toast.error('Access Denied: Your account is on the waitlist.');
        // Redirect to waitlist page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/waitlist')) {
          window.location.href = '/waitlist';
        }
      }

      throw new Error(errorMessage);
    }

    // Parse success response
    // If 204 No Content, return null
    if (response.status === 204) {
      return null as T;
    }

    return await response.json();
  } catch (error) {
    console.error('API Request Failed:', error);
    throw error;
  }
}
