'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/query-client';
import { Toaster } from 'sonner';

import { ThemeProvider } from '@repo/ui/components/theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
