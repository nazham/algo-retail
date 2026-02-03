'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { useSession } from '@/lib/auth-client';
import { cn } from '@repo/ui/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load persisted state on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) setSidebarCollapsed(saved === 'true');
  }, []);

  const toggleSidebar = (value?: boolean) => {
    const newState = value ?? !isSidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      router.replace('/login');
      return;
    }

    // Verify role from actual session (server source of truth)
    const user = session.user as any;
    const role = user?.role || 'waitlist';

    if (role === 'waitlist') {
      router.replace('/waitlist');
      return;
    }

    setIsAuthorized(true);
  }, [session, isPending, router]);

  // Show loading while verifying authorization
  if (isPending || !isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={() => toggleSidebar()} />
      <main
        className={cn(
          'flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-300 ease-in-out mt-14 md:mt-0',
          isSidebarCollapsed ? 'md:ml-[70px]' : 'md:ml-64',
        )}
      >
        {children}
      </main>
    </div>
  );
}
