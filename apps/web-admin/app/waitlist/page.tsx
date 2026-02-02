'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/components/ui/button';
import { RefreshCw, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { signOutAndRedirect, getCurrentRole } from '@/lib/auth-utils';

export default function WaitlistPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      const role = await getCurrentRole();

      if (role !== 'waitlist') {
        toast.success(
          'Your account has been approved! Please log out and log back in to access the dashboard.',
        );
        // Note: The HTTP-only cookie is set during login. To get the updated cookie,
        // the user needs to logout and login again.
      } else {
        toast.info('Still on waitlist. Please check back later.');
      }
    } catch (error) {
      toast.error('Failed to check status. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOutAndRedirect('/login');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background border-t-4 border-primary">
      <div className="max-w-md w-full p-8 text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter">You are on the Waitlist</h1>
          <p className="text-muted-foreground">
            Thank you for signing up early! We are currently in a closed pilot phase.
          </p>
        </div>

        <div className="p-4 bg-secondary/50 rounded-lg text-sm text-secondary-foreground border border-border">
          <p>We will notify you via email as soon as your account is approved.</p>
        </div>

        <div className="flex flex-col space-y-3">
          <Button onClick={handleRefreshStatus} disabled={refreshing} variant="default">
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Check My Status
          </Button>
          <Button onClick={handleLogout} disabled={loggingOut} variant="outline">
            {loggingOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
