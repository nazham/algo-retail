'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Loader2, Store } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { invalidateSessionCache } from '@/lib/api-client';

interface ProvisionResponse {
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Business name is required.');
      return;
    }

    setLoading(true);
    try {
      await apiClient<ProvisionResponse>('/tenants/provision', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim(),
          phone1: phone1.trim(),
          phone2: phone2.trim(),
          email: email.trim(),
        }),
      });

      toast.success('Business created successfully!');

      // Invalidate session cache so the next API call picks up the new tenantId
      invalidateSessionCache();

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create business. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-lg shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Set Up Your Business</h2>
              <p className="text-sm text-muted-foreground">
                These details will appear on receipts and sync with your POS terminals.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Business Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Business Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="name"
              type="text"
              placeholder="E.g. Fresh Mart Colombo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="addressLine1" className="text-sm font-medium">
                Address Line 1
              </label>
              <Input
                id="addressLine1"
                type="text"
                placeholder="123 Main Street"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="addressLine2" className="text-sm font-medium">
                City & Postal Code
              </label>
              <Input
                id="addressLine2"
                type="text"
                placeholder="Colombo 03, 00300"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
              />
            </div>
          </div>

          {/* Phone Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="phone1" className="text-sm font-medium">
                Phone 1
              </label>
              <Input
                id="phone1"
                type="tel"
                placeholder="077-1234567"
                value={phone1}
                onChange={(e) => setPhone1(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone2" className="text-sm font-medium">
                Phone 2
              </label>
              <Input
                id="phone2"
                type="tel"
                placeholder="032-1234567"
                value={phone2}
                onChange={(e) => setPhone2(e.target.value)}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Business Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="info@yourshop.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Business...
              </>
            ) : (
              'Create My Business'
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            You can update these details later from Settings.
          </p>
        </form>
      </div>
    </div>
  );
}
