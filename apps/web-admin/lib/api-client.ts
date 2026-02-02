import { authClient } from './auth-client';
import { toast } from 'sonner';

type ApiClientOptions = RequestInit & {
  // Add any custom options here if needed
};

// MVP: Hardcoded tenant ID until auth is fully multi-tenant
// In production this will be extracted from the user's session

function getBaseUrl() {
  // Get the base URL from env
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

export async function apiClient<T>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
  const { headers, ...rest } = options;
  const baseUrl = getBaseUrl();

  // Normalize endpoint to ensuring leading slash or not matching base
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  // Get session token and user info if available
  const session = await authClient.getSession();
  const token = session?.data?.session?.token;
  const user = session?.data?.user as SessionUser | undefined;
  const tenantId = user?.tenantId;

  // Prepare headers
  const defaultHeaders: HeadersInit = {
    // 'Content-Type': 'application/json', // Let browser set content-type for FormData
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    // Use dynamic Tenant ID if available, otherwise fallback (or fail if strict)
    // Falling back to the MVP ID only if we really must, but usually we want to respect the user's tenant
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
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = response.statusText;
      }

      // Handle auth errors
      if (response.status === 401) {
        console.error(`[API] 401 Unauthorized at ${response.url}`);
        // Redirect to login or show toast
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        toast.error('Session expired. Please login again.');
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
