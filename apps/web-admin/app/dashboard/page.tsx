'use client';

import { useSession } from '@/lib/auth-client';
import { Button } from '@repo/ui/components/ui/button';
import { useRouter } from 'next/navigation';
import { signOutAndRedirect } from '@/lib/auth-utils';
import { useEffect } from 'react';
import { DashboardContainer } from '@/components/dashboard-container';

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // Handle redirect in useEffect to avoid setState during render
  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
  }, [isPending, session, router]);

  const handleSignOut = () => {
    signOutAndRedirect('/login');
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Redirecting...</p>
      </div>
    );
  }

  return (
    <DashboardContainer size="narrow">
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-lg shadow-sm">
          <div className="p-6 border-b border-border">
            <h1 className="text-2xl font-bold">Welcome, {session.user.name}!</h1>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{session.user.email}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">User ID</p>
              <p className="font-mono text-sm">{session.user.id}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm text-muted-foreground">Active Products</p>
                <p className="text-2xl font-bold">---</p>
              </div>
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm text-muted-foreground">Today's Orders</p>
                <p className="text-2xl font-bold">---</p>
              </div>
            </div>
            <Button onClick={handleSignOut} variant="destructive">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </DashboardContainer>
  );
}
