import { useState, useEffect } from 'react';

export type SyncState = 'IDLE' | 'SYNCING' | 'ERROR' | 'OFFLINE';

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncState>('IDLE');
  const [message, setMessage] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  useEffect(() => {
    // Listen for IPC messages
    // The bridge exposes .on(channel, callback(data))
    // So the callback receives 'data' directly, NOT (event, data)
    const removeListener = window.api.on(
      'sync:status',
      (data: { state: SyncState; message?: string }) => {
        console.log('Sync Status Hook Received:', data);

        if (data && data.state) {
          setStatus(data.state);

          if (data.message) {
            setMessage(data.message);
            // Extract time if it's an IDLE state update with specific format
            if (data.state === 'IDLE') {
              setLastSyncTime(data.message.replace('Last sync: ', ''));
            }
          }
        }
      },
    );

    return () => {
      if (removeListener) removeListener();
    };
  }, []);

  return { status, message, lastSyncTime };
}
