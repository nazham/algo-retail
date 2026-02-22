import { useState, useEffect } from 'react';
import { Label } from '@repo/ui/components/ui/label';
import { Input } from '@repo/ui/components/ui/input';
import { Button } from '@repo/ui/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/components/ui/alert-dialog';
import { useStoreSettingsStore } from '../../../stores/store-settings.store';
import { cn } from '@repo/ui/lib/utils';

export function GeneralSettingsTab() {
  const storeConfig = useStoreSettingsStore((state) => state.storeConfig);
  const hasChanges = useStoreSettingsStore((state) => state.hasChanges);
  const isLoading = useStoreSettingsStore((state) => state.isLoading);
  const validationErrors = useStoreSettingsStore((state) => state.validationErrors);
  const isValid = useStoreSettingsStore((state) => state.isValid);
  const updateField = useStoreSettingsStore((state) => state.updateField);
  const saveConfig = useStoreSettingsStore((state) => state.saveConfig);
  const resetToDefaults = useStoreSettingsStore((state) => state.resetToDefaults);
  const initialize = useStoreSettingsStore((state) => state.initialize);
  const setupConfigListener = useStoreSettingsStore((state) => state.setupConfigListener);

  const [showResetDialog, setShowResetDialog] = useState(false);

  // Initialize store and config listener on mount
  useEffect(() => {
    initialize();
    const cleanup = setupConfigListener();
    return cleanup;
  }, [initialize, setupConfigListener]);

  const handleResetConfirm = async () => {
    await resetToDefaults();
    setShowResetDialog(false);
  };

  if (isLoading || !storeConfig) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold">Store Information</h3>
        <p className="text-sm text-muted-foreground">Configure your store details for receipts</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Store Name *</Label>
          <Input
            id="name"
            value={storeConfig.name}
            onChange={(e) => updateField('name', e.target.value)}
            className={cn('mt-1.5', validationErrors.name && 'border-destructive')}
          />
          {validationErrors.name && (
            <p className="text-destructive text-xs mt-1">{validationErrors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="address1">Address Line 1 *</Label>
          <Input
            id="address1"
            value={storeConfig.addressLine1}
            onChange={(e) => updateField('addressLine1', e.target.value)}
            placeholder="123 Main Street"
            className={cn('mt-1.5', validationErrors.addressLine1 && 'border-destructive')}
          />
          {validationErrors.addressLine1 && (
            <p className="text-destructive text-xs mt-1">{validationErrors.addressLine1}</p>
          )}
        </div>

        <div>
          <Label htmlFor="address2">Address Line 2 *</Label>
          <Input
            id="address2"
            value={storeConfig.addressLine2}
            onChange={(e) => updateField('addressLine2', e.target.value)}
            placeholder="City, Postal Code"
            className={cn('mt-1.5', validationErrors.addressLine2 && 'border-destructive')}
          />
          {validationErrors.addressLine2 && (
            <p className="text-destructive text-xs mt-1">{validationErrors.addressLine2}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone1">Phone Number 1 *</Label>
            <Input
              id="phone1"
              value={storeConfig.phone1}
              onChange={(e) => updateField('phone1', e.target.value)}
              placeholder="077-1234567"
              className={cn('mt-1.5', validationErrors.phone1 && 'border-destructive')}
            />
            {validationErrors.phone1 && (
              <p className="text-destructive text-xs mt-1">{validationErrors.phone1}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone2">Phone Number 2</Label>
            <Input
              id="phone2"
              value={storeConfig.phone2}
              onChange={(e) => updateField('phone2', e.target.value)}
              placeholder="032-1234567"
              className={cn('mt-1.5', validationErrors.phone2 && 'border-destructive')}
            />
            {validationErrors.phone2 && (
              <p className="text-destructive text-xs mt-1">{validationErrors.phone2}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={storeConfig.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="info@yourshop.com"
            className={cn('mt-1.5', validationErrors.email && 'border-destructive')}
          />
          {validationErrors.email && (
            <p className="text-destructive text-xs mt-1">{validationErrors.email}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={saveConfig} disabled={!hasChanges || !isValid}>
          Save Changes
        </Button>
        <Button variant="outline" onClick={() => setShowResetDialog(true)}>
          Reset to Defaults
        </Button>
      </div>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all store information to default values from environment variables.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetConfirm}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
