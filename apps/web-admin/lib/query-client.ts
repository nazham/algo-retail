import { QueryClient } from '@tanstack/react-query';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

// Browser: Create one singleton that lives for the app lifetime
let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  // Server: Always create a new client (requests are isolated)
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }

  // Browser: Reuse existing client to preserve cache
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

// Legacy export for compatibility (deprecated - use getQueryClient())
export const queryClient =
  typeof window === 'undefined' ? makeQueryClient() : (browserQueryClient ??= makeQueryClient());
