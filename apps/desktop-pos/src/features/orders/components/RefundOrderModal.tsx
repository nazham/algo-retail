import React, { useState } from 'react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@repo/ui/components/ui/dialog';
import { toast } from 'sonner';
import { ORDER_CHANNELS } from '../ipc-channels';

// Custom hook for IPC communication (Architectural Rule: No direct window.api in components)
function useRefundOrder() {
  const [isLoading, setIsLoading] = useState(false);

  const processRefund = async (originalOrderId: string, adminPin: string, _reason: string) => {
    setIsLoading(true);
    try {
      // Reason is collected but currently only logged or discarded as backend doesn't take it yet
      const result = await window.api.invoke(ORDER_CHANNELS.REFUND, { originalOrderId, adminPin });
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  return { processRefund, isLoading };
}

type RefundOrderModalProps = {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function RefundOrderModal({ orderId, isOpen, onClose, onSuccess }: RefundOrderModalProps) {
  const [adminPin, setAdminPin] = useState('');
  const [reason, setReason] = useState('');

  const { processRefund, isLoading } = useRefundOrder();

  // Reset form when modal closes/opens
  React.useEffect(() => {
    if (isOpen) {
      setAdminPin('');
      setReason('');
    }
  }, [isOpen]);

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderId) {
      toast.error('No order selected for refund.');
      return;
    }

    if (!adminPin) {
      toast.error('Admin PIN is required.');
      return;
    }

    try {
      await processRefund(orderId, adminPin, reason);
      toast.success('Order refunded successfully.');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      const message = error?.message || 'Failed to process refund.';
      toast.error(message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">Process Refund</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            This action will create a mirror order to negate the financials. Please provide the
            Admin PIN to authorize.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleRefund} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="adminPin">Admin PIN</Label>
            <Input
              id="adminPin"
              type="password"
              placeholder="Enter Admin PIN"
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Refund Reason</Label>
            <Input
              id="reason"
              type="text"
              placeholder="e.g. Customer requested refund"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Confirm Refund'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
