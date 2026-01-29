import { Loader2, CheckCircle2, AlertCircle, CloudOff } from 'lucide-react';
import { useSyncStatus } from '../features/sync/hooks/use-sync-status';

export function SyncStatus() {
  const { status, lastSyncTime } = useSyncStatus();

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
    </div>
  );
}
