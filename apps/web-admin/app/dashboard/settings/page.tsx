'use client';

import { Store, Info } from 'lucide-react';
import { Label } from '@repo/ui/components/ui/label';
import { Input } from '@repo/ui/components/ui/input';
import { useTenant } from '@/hooks/use-tenant';

interface ShopConfig {
  name: string;
  addressLine1: string;
  addressLine2: string;
  phone1: string;
  phone2: string;
  email: string;
}

export default function SettingsPage() {
  const { tenant, isLoading: tenantLoading } = useTenant();

  // Guard: extract config or fallback
  const config = tenant?.config as ShopConfig | undefined;

  const form: ShopConfig = {
    name: config?.name || tenant?.name || '',
    addressLine1: config?.addressLine1 || '',
    addressLine2: config?.addressLine2 || '',
    phone1: config?.phone1 || '',
    phone2: config?.phone2 || '',
    email: config?.email || '',
  };

  if (tenantLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-sm">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Store className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Business Settings</h1>
          <p className="text-sm text-muted-foreground">
            View your business details. To make changes, please use the Desktop POS application.
          </p>
        </div>
      </div>

      {/* Read Only Banner */}
      <div className="bg-primary/10 border border-primary/20 text-primary-foreground rounded-lg p-4 flex gap-3 text-sm">
        <Info className="h-5 w-5 text-primary shrink-0" />
        <div className="text-foreground">
          <p className="font-medium text-primary mb-1">Editing disabled in Web Admin</p>
          <p className="text-muted-foreground">
            For security and synchronization reasons, business settings can only be modified
            directly from your Algo Retail Desktop POS application. Changes made there will sync
            here automatically.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4 rounded-lg border border-border p-6 bg-card">
        <div>
          <Label htmlFor="name">Business Name *</Label>
          <Input
            id="name"
            value={form.name}
            readOnly
            className="mt-1.5 bg-muted/50 cursor-default"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="addressLine1">Address Line 1</Label>
            <Input
              id="addressLine1"
              value={form.addressLine1}
              readOnly
              className="mt-1.5 bg-muted/50 cursor-default"
            />
          </div>
          <div>
            <Label htmlFor="addressLine2">City & Postal Code</Label>
            <Input
              id="addressLine2"
              value={form.addressLine2}
              readOnly
              className="mt-1.5 bg-muted/50 cursor-default"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone1">Phone 1</Label>
            <Input
              id="phone1"
              value={form.phone1}
              readOnly
              className="mt-1.5 bg-muted/50 cursor-default"
            />
          </div>
          <div>
            <Label htmlFor="phone2">Phone 2</Label>
            <Input
              id="phone2"
              value={form.phone2}
              readOnly
              className="mt-1.5 bg-muted/50 cursor-default"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Business Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            readOnly
            className="mt-1.5 bg-muted/50 cursor-default"
          />
        </div>
      </div>
    </div>
  );
}
