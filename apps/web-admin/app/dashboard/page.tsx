'use client';

import { useSession } from '@/lib/auth-client';
import { Button } from '@repo/ui/components/ui/button';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // Handle redirect in useEffect to avoid setState during render
  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
  }, [isPending, session, router]);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push('/login');
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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
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
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Session</p>
              <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
            <Button onClick={handleSignOut} variant="destructive">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
