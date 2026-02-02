'use client';

import { FileText, Clock } from 'lucide-react';
import { DashboardContainer } from '@/components/dashboard-container';

export default function OrdersPage() {
  return (
    <DashboardContainer size="wide">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders History</h1>
          <p className="text-muted-foreground mt-2">
            View and manage sales orders and transactions.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-xl bg-muted/20 mt-8">
        <div className="bg-background p-4 rounded-full shadow-sm mb-4">
          <Clock className="h-10 w-10 text-primary animate-pulse" />
        </div>
        <h2 className="text-xl font-semibold">Orders Module Coming Soon</h2>
        <p className="text-muted-foreground text-center max-w-md mt-2">
          We are currently refining the order management interface. Real-time order tracking and
          invoice generation will be available in the next update.
        </p>
      </div>
    </DashboardContainer>
  );
}
