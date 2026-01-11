import { useState } from 'react';
import { Button } from '@repo/ui/components/ui/button';

export default function SettingsPage() {
  const [shouldCrash, setShouldCrash] = useState(false);

  // 1. Throw error when state is true
  if (shouldCrash) {
    throw new Error('💥 Boom! This is a simulated crash.');
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="p-6 border border-red-200 rounded-xl bg-red-50 space-y-2">
        <h2 className="font-bold text-red-900">Developer Tools</h2>
        <p className="text-sm text-red-700">
          Clicking this button will crash the React Render cycle to test the Error Boundary.
        </p>

        <Button variant="destructive" onClick={() => setShouldCrash(true)}>
          Trigger Crash
        </Button>
      </div>
    </div>
  );
}
