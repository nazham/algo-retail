import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle, CloudOff } from 'lucide-react';
import { useSyncStatus } from '../features/sync/hooks/use-sync-status';

export function SyncStatus() {
  const { status, lastSyncTime } = useSyncStatus();
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSyncClick = () => {
    if (cooldown > 0 || status === 'SYNCING') return;

    window.api.invoke('sync:trigger-manual');
    setCooldown(30); // 30s Lockout
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-xs font-medium border border-border">
      {status === 'SYNCING' && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
          <span>Syncing...</span>
        </>
      )}

      {status === 'IDLE' && (
        <>
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          <span>Synced {lastSyncTime}</span>
        </>
      )}

      {status === 'ERROR' && (
        <>
          <AlertCircle className="h-3 w-3 text-red-500" />
          <span className="text-red-600">Sync Error</span>
        </>
      )}

      {status === 'OFFLINE' && (
        <>
          <CloudOff className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Offline</span>
        </>
      )}

      {/* Vertical Separator */}
      <div className="w-px h-3 bg-border mx-1" />

      {/* Manual Sync Trigger */}
      <button
        onClick={handleSyncClick}
        disabled={status === 'SYNCING' || cooldown > 0}
        className="text-xs text-primary hover:underline hover:text-primary/80 disabled:opacity-50 disabled:no-underline cursor-pointer min-w-[60px]"
        title={cooldown > 0 ? `Wait ${cooldown}s` : 'Force manual sync'}
      >
        {cooldown > 0 ? `Wait ${cooldown}s` : 'Sync Now'}
      </button>
    </div>
  );
}
