import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@repo/ui/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/ui/tabs';
import { GeneralSettingsTab } from '../features/settings/components/GeneralSettingsTab';
import { PrinterSettingsTab } from '../features/settings/components/PrinterSettingsTab';
import { UnsavedChangesDialog } from '../features/settings/components/UnsavedChangesDialog';
import { useStoreSettingsStore } from '../stores/store-settings.store';
import { usePrinterSettingsStore } from '../stores/printer-settings.store';

export default function SettingsPage() {
  const [shouldCrash, setShouldCrash] = useState(false);
  const [currentTab, setCurrentTab] = useState('general');
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showNavigationDialog, setShowNavigationDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Get shared state from Zustand stores
  const generalHasChanges = useStoreSettingsStore((state) => state.hasChanges);
  const printerHasChanges = usePrinterSettingsStore((state) => state.hasChanges);

  // Check if any settings have unsaved changes
  const hasAnyUnsavedChanges = generalHasChanges || printerHasChanges;

  // Intercept browser back/forward and sidebar clicks
  useEffect(() => {
    if (!hasAnyUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Chrome requires returnValue to be set
    };

    // Add listener for browser close/refresh
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Intercept clicks on navigation links
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;

      if (link && hasAnyUnsavedChanges) {
        const href = link.getAttribute('href');

        // Check if it's a router link (starts with # for HashRouter)
        if (href && href.startsWith('#')) {
          const path = href.substring(1); // Remove the #

          // If navigating away from settings, show dialog
          if (path !== location.pathname && !path.startsWith('/settings')) {
            e.preventDefault();
            e.stopPropagation();
            setPendingNavigation(path);
            setShowNavigationDialog(true);
          }
        }
      }
    };

    document.addEventListener('click', handleLinkClick, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleLinkClick, true);
    };
  }, [hasAnyUnsavedChanges, location.pathname]);

  // Throw error when state is true
  if (shouldCrash) {
    throw new Error('💥 Boom! This is a simulated crash.');
  }

  const handleTabChange = (newTab: string) => {
    // Check if current tab has unsaved changes
    const hasUnsavedChanges =
      (currentTab === 'general' && generalHasChanges) ||
      (currentTab === 'printer' && printerHasChanges);

    if (hasUnsavedChanges && newTab !== currentTab) {
      setPendingTab(newTab);
      setShowUnsavedDialog(true);
    } else {
      setCurrentTab(newTab);
    }
  };

  const confirmTabChange = () => {
    if (pendingTab) {
      setCurrentTab(pendingTab);
    }
    setShowUnsavedDialog(false);
    setPendingTab(null);
  };

  const cancelTabChange = () => {
    setShowUnsavedDialog(false);
    setPendingTab(null);
  };

  const confirmNavigation = () => {
    setShowNavigationDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const cancelNavigation = () => {
    setShowNavigationDialog(false);
    setPendingNavigation(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="printer">Printer</TabsTrigger>
          <TabsTrigger value="developer">Developer</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <GeneralSettingsTab />
        </TabsContent>

        <TabsContent value="printer" className="space-y-4">
          <PrinterSettingsTab />
        </TabsContent>

        <TabsContent value="developer" className="space-y-4">
          <div className="p-6 border border-red-200 rounded-xl bg-destructive/10 space-y-2 max-w-2xl">
            <h2 className="font-bold text-red-900">Developer Tools</h2>
            <p className="text-sm text-red-700">
              Clicking this button will crash the React Render cycle to test the Error Boundary.
            </p>

            <Button variant="destructive" onClick={() => setShouldCrash(true)}>
              Trigger Crash
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Tab switching dialog */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onConfirm={confirmTabChange}
        onCancel={cancelTabChange}
      />

      {/* Page navigation dialog */}
      <UnsavedChangesDialog
        open={showNavigationDialog}
        onConfirm={confirmNavigation}
        onCancel={cancelNavigation}
      />
    </div>
  );
}
