'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProductFormData } from '@/lib/product-form.schema';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Store for persisting product form draft data.
 * Uses localStorage to survive page refreshes and accidental navigation.
 */
interface ProductFormDraftStore {
  /** The draft form data */
  draft: ProductFormData | null;
  /** ID of product being edited (null = new product) */
  editingProductId: string | null;
  /** Timestamp of last save */
  lastSavedAt: number | null;

  /** Save draft form data */
  saveDraft: (data: ProductFormData, productId?: string) => void;
  /** Clear the draft (call after successful save) */
  clearDraft: () => void;
  /** Check and clear expired draft (call on app init) */
  checkAndClearExpired: () => void;
  /** Check if there's a valid pending draft (pure selector, no side effects) */
  hasDraft: () => boolean;
}

export const useProductFormDraftStore = create<ProductFormDraftStore>()(
  persist(
    (set, get) => ({
      draft: null,
      editingProductId: null,
      lastSavedAt: null,

      saveDraft: (data, productId) => {
        set({
          draft: data,
          editingProductId: productId ?? null,
          lastSavedAt: Date.now(),
        });
      },

      clearDraft: () => {
        set({
          draft: null,
          editingProductId: null,
          lastSavedAt: null,
        });
      },

      checkAndClearExpired: () => {
        const { lastSavedAt } = get();
        if (lastSavedAt && Date.now() - lastSavedAt > ONE_DAY_MS) {
          get().clearDraft();
        }
      },

      hasDraft: () => {
        const { draft, lastSavedAt } = get();
        if (!draft || !lastSavedAt) return false;

        // Check if expired (but don't clear here - pure selector)
        if (Date.now() - lastSavedAt > ONE_DAY_MS) return false;

        // Check if draft has meaningful content
        return draft.name.trim().length > 0 || draft.price > 0;
      },
    }),
    {
      name: 'product-form-draft',
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Failed to rehydrate draft store:', error);
        } else if (state) {
          // Clear expired drafts on hydration
          state.checkAndClearExpired();
        }
      },
    },
  ),
);
