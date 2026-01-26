import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ShopConfig } from '@algo/types';
import { shopConfigSchema } from '../features/settings/schemas/settings.schema';
import { toast } from 'sonner';

interface StoreSettingsState {
  storeConfig: ShopConfig | null;
  originalConfig: ShopConfig | null;
  isLoading: boolean;
  validationErrors: Record<string, string>;
  hasChanges: boolean;
  isValid: boolean;

  // Actions
  initialize: () => Promise<void>;
  updateField: (field: keyof ShopConfig, value: string) => void;
  saveConfig: () => Promise<boolean>;
  resetToDefaults: () => Promise<void>;
  setValidationErrors: (errors: Record<string, string>) => void;
}

export const useStoreSettingsStore = create<StoreSettingsState>()(
  persist(
    (set, get) => ({
      storeConfig: null,
      originalConfig: null,
      isLoading: false,
      validationErrors: {},
      hasChanges: false,
      isValid: true,

      initialize: async () => {
        // Only initialize if not already loaded
        if (get().storeConfig) return;

        set({ isLoading: true });
        try {
          const defaults = await window.api.invoke('config:get-defaults');
          set({
            storeConfig: defaults,
            originalConfig: defaults,
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to load defaults:', error);
          toast.error('Failed to load store settings');
          set({ isLoading: false });
        }
      },

      updateField: (field, value) => {
        const { storeConfig, originalConfig } = get();
        if (!storeConfig) return;

        const newConfig = { ...storeConfig, [field]: value };
        const hasChanges =
          newConfig && originalConfig
            ? JSON.stringify(newConfig) !== JSON.stringify(originalConfig)
            : false;

        // Validate field
        const fieldSchema = shopConfigSchema.shape[field];
        const result = fieldSchema.safeParse(value);

        if (!result.success) {
          set((state) => ({
            storeConfig: newConfig,
            hasChanges,
            validationErrors: {
              ...state.validationErrors,
              [field]: result.error.issues[0].message,
            },
            isValid: false,
          }));
        } else {
          set((state) => {
            const { [field]: _, ...rest } = state.validationErrors;
            return {
              storeConfig: newConfig,
              hasChanges,
              validationErrors: rest,
              isValid: Object.keys(rest).length === 0,
            };
          });
        }
      },

      saveConfig: async () => {
        const { storeConfig } = get();
        if (!storeConfig) return false;

        // Validate all fields
        const result = shopConfigSchema.safeParse(storeConfig);
        if (!result.success) {
          const errors: Record<string, string> = {};
          result.error.issues.forEach((err) => {
            if (err.path[0]) {
              errors[err.path[0] as string] = err.message;
            }
          });
          set({ validationErrors: errors, isValid: false });
          toast.error('Please fix validation errors before saving');
          return false;
        }

        // Mark as original (persist middleware will save to localStorage)
        set({ originalConfig: storeConfig, hasChanges: false });
        toast.success('Store settings saved successfully');
        return true;
      },

      resetToDefaults: async () => {
        try {
          const defaults = await window.api.invoke('config:get-defaults');
          set({
            storeConfig: defaults,
            validationErrors: {},
            isValid: true,
            hasChanges: true, // Mark as changed so user can save
          });
          toast.info('Settings reset to defaults (click Save to confirm)');
        } catch (error) {
          console.error('Failed to reset to defaults:', error);
          toast.error('Failed to reset settings');
        }
      },

      setValidationErrors: (errors) => {
        set({ validationErrors: errors, isValid: Object.keys(errors).length === 0 });
      },
    }),
    {
      name: 'app:store:config',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        storeConfig: state.storeConfig,
        originalConfig: state.originalConfig,
      }),
      onRehydrateStorage: () => (state) => {
        // Validate on load
        if (state?.storeConfig) {
          const result = shopConfigSchema.safeParse(state.storeConfig);
          if (!result.success) {
            console.warn('Invalid store config in localStorage, will load defaults');
            state.storeConfig = null;
            state.originalConfig = null;
          }
        }
      },
    },
  ),
);
