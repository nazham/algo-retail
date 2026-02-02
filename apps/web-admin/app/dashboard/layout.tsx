'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { useSession } from '@/lib/auth-client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isAuthorized, setIsAuthorized] = useState(false);

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
      <AppSidebar />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
