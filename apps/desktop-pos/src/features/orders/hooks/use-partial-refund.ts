import { useState } from 'react';
import { toast } from 'sonner';
import type { PartialRefundDto } from '@algo/types';
import { ORDER_CHANNELS } from '../ipc-channels';

interface UsePartialRefundProps {
  onSuccess: () => void;
}

export function usePartialRefund({ onSuccess }: UsePartialRefundProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitPartialRefund = async (payload: PartialRefundDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await window.api.invoke(ORDER_CHANNELS.PARTIAL_REFUND, payload);

      if (result.success) {
        toast.success('Partial refund processed successfully');
        onSuccess();
      } else {
        const errorMessage = result.error ?? 'Refund failed';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Refund failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return { submitPartialRefund, isLoading, error };
}
