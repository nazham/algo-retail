import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { printerConfigSchema } from '../features/settings/schemas/settings.schema';
import { toast } from 'sonner';

export interface PrinterConfig {
  mode: 'auto' | 'manual';
  printerName?: string;
}

interface PrinterSettingsState {
  printers: Electron.PrinterInfo[];
  config: PrinterConfig;
  originalConfig: PrinterConfig;
  isLoading: boolean;
  status: 'connected' | 'disconnected' | 'unknown';
  hasChanges: boolean;

  // Actions
  initialize: () => Promise<void>;
  loadPrinters: () => Promise<void>;
  selectPrinter: (printerName: string) => void;
  setAutoMode: () => void;
  setManualMode: () => void;
  saveConfig: () => Promise<boolean>;
  testPrint: () => Promise<void>;
}

export const usePrinterSettingsStore = create<PrinterSettingsState>()(
  persist(
    (set, get) => ({
      printers: [],
      config: { mode: 'auto' },
      originalConfig: { mode: 'auto' },
      isLoading: false,
      status: 'unknown',
      hasChanges: false,

      initialize: async () => {
        // Load printers on initialization
        await get().loadPrinters();
      },

      loadPrinters: async () => {
        set({ isLoading: true });
        try {
          const availablePrinters = await window.api.invoke('printer:get-printers');
          set({ printers: availablePrinters });

          // Update status
          const { config } = get();
          if (config.mode === 'manual' && config.printerName) {
            const exists = availablePrinters.some(
              (p: Electron.PrinterInfo) => p.name === config.printerName,
            );
            set({ status: exists ? 'connected' : 'disconnected' });
          } else if (config.mode === 'auto') {
            set({ status: availablePrinters.length > 0 ? 'connected' : 'disconnected' });
          }
        } catch (error) {
          console.error('Failed to load printers:', error);
          toast.error('Failed to load available printers');
        } finally {
          set({ isLoading: false });
        }
      },

      selectPrinter: (printerName) => {
        const newConfig = { mode: 'manual' as const, printerName };
        set({
          config: newConfig,
          hasChanges: JSON.stringify(newConfig) !== JSON.stringify(get().originalConfig),
        });
      },

      setAutoMode: () => {
        const newConfig = { mode: 'auto' as const };
        set({
          config: newConfig,
          hasChanges: JSON.stringify(newConfig) !== JSON.stringify(get().originalConfig),
        });
      },

      setManualMode: () => {
        const { config } = get();
        const newConfig = { mode: 'manual' as const, printerName: config.printerName };
        set({
          config: newConfig,
          hasChanges: JSON.stringify(newConfig) !== JSON.stringify(get().originalConfig),
        });
      },

      saveConfig: async () => {
        const { config } = get();
        // Persist middleware will save to localStorage automatically
        set({ originalConfig: config, hasChanges: false });
        toast.success('Printer settings saved successfully');
        return true;
      },

      testPrint: async () => {
        try {
          const { config } = get();
          const printerName = config.mode === 'manual' ? config.printerName : undefined;

          // Read saved store config for test print (from persisted Zustand store)
          const shopConfigRaw = localStorage.getItem('app:store:config');
          let shopConfig = null;

          if (shopConfigRaw) {
            try {
              const parsed = JSON.parse(shopConfigRaw);
              shopConfig = parsed.state?.storeConfig || null;
            } catch (e) {
              console.warn('Failed to parse store config');
            }
          }

          const result = await window.api.invoke('printer:test-print', {
            printerName,
            shopConfig: shopConfig || undefined,
          });

          if (result.success) {
            toast.success('Test print sent successfully');
          } else {
            toast.error(`Print failed: ${result.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.error('Test print failed:', error);
          toast.error('Test print failed');
        }
      },
    }),
    {
      name: 'app:printer:selected',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        config: state.config,
        originalConfig: state.originalConfig,
      }),
      onRehydrateStorage: () => (state) => {
        // Validate on load
        if (state?.config) {
          const result = printerConfigSchema.safeParse(state.config);
          if (!result.success) {
            console.warn('Invalid printer config in localStorage, resetting to auto');
            state.config = { mode: 'auto' };
            state.originalConfig = { mode: 'auto' };
          }
        }
      },
    },
  ),
);
