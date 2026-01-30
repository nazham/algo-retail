import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStoreSettingsStore } from '../store-settings.store';

// Mock window.api
global.window = {
  api: {
    invoke: vi.fn(),
  },
} as any;

describe('useStoreSettingsStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useStoreSettingsStore.setState({
      storeConfig: null,
      originalConfig: null,
      isLoading: false,
      validationErrors: {},
      hasChanges: false,
      isValid: true,
    });
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('should load defaults when no saved config exists', async () => {
      const mockDefaults = {
        name: 'Test Store',
        addressLine1: '123 Main St',
        addressLine2: 'City, ZIP',
        phone1: '123-456-7890',
        phone2: '',
        email: '',
      };

      (window.api.invoke as any).mockResolvedValue(mockDefaults);

      const { initialize } = useStoreSettingsStore.getState();
      await initialize();

      const state = useStoreSettingsStore.getState();
      expect(state.storeConfig).toEqual(mockDefaults);
      expect(state.originalConfig).toEqual(mockDefaults);
      expect(state.isLoading).toBe(false);
    });

    it('should not re-initialize if already loaded', async () => {
      const existingConfig = {
        name: 'Existing Store',
        addressLine1: '456 Elm St',
        addressLine2: 'Town, ZIP',
        phone1: '987-654-3210',
        phone2: '',
        email: '',
      };

      useStoreSettingsStore.setState({ storeConfig: existingConfig });

      const { initialize } = useStoreSettingsStore.getState();
      await initialize();

      expect(window.api.invoke).not.toHaveBeenCalled();
    });
  });

  describe('updateField', () => {
    beforeEach(async () => {
      const mockConfig = {
        name: 'Test Store',
        addressLine1: '123 Main St',
        addressLine2: 'City, ZIP',
        phone1: '123-456-7890',
        phone2: '',
        email: '',
      };

      useStoreSettingsStore.setState({
        storeConfig: mockConfig,
        originalConfig: mockConfig,
      });
    });

    it('should update field and set hasChanges to true', () => {
      const { updateField } = useStoreSettingsStore.getState();
      updateField('name', 'New Store Name');

      const state = useStoreSettingsStore.getState();
      expect(state.storeConfig?.name).toBe('New Store Name');
      expect(state.hasChanges).toBe(true);
    });

    it('should validate field and set error for invalid input', () => {
      const { updateField } = useStoreSettingsStore.getState();
      updateField('name', ''); // Empty name is invalid

      const state = useStoreSettingsStore.getState();
      expect(state.validationErrors.name).toBeDefined();
      expect(state.isValid).toBe(false);
    });

    it('should clear error when field becomes valid', () => {
      const { updateField } = useStoreSettingsStore.getState();

      // Set invalid
      updateField('name', '');
      expect(useStoreSettingsStore.getState().validationErrors.name).toBeDefined();

      // Set valid
      updateField('name', 'Valid Name');
      expect(useStoreSettingsStore.getState().validationErrors.name).toBeUndefined();
      expect(useStoreSettingsStore.getState().isValid).toBe(true);
    });

    it('should validate email format', () => {
      const { updateField } = useStoreSettingsStore.getState();

      // Invalid email
      updateField('email', 'invalid-email');
      expect(useStoreSettingsStore.getState().validationErrors.email).toBeDefined();

      // Valid email
      updateField('email', 'test@example.com');
      expect(useStoreSettingsStore.getState().validationErrors.email).toBeUndefined();

      // Empty email (allowed)
      updateField('email', '');
      expect(useStoreSettingsStore.getState().validationErrors.email).toBeUndefined();
    });
  });

  describe('saveConfig', () => {
    it('should return false if validation fails', async () => {
      useStoreSettingsStore.setState({
        storeConfig: {
          name: '', // Invalid
          addressLine1: '123 Main St',
          addressLine2: 'City',
          phone1: '123-456-7890',
          phone2: '',
          email: '',
        },
      });

      const { saveConfig } = useStoreSettingsStore.getState();
      const result = await saveConfig();

      expect(result).toBe(false);
      expect(useStoreSettingsStore.getState().validationErrors).toBeDefined();
    });

    it('should return true and reset hasChanges on successful save', async () => {
      const validConfig = {
        name: 'Test Store',
        addressLine1: '123 Main St',
        addressLine2: 'City, ZIP',
        phone1: '123-456-7890',
        phone2: '',
        email: '',
      };

      useStoreSettingsStore.setState({
        storeConfig: validConfig,
        originalConfig: { ...validConfig, name: 'Old Name' },
        hasChanges: true,
      });

      const { saveConfig } = useStoreSettingsStore.getState();
      const result = await saveConfig();

      expect(result).toBe(true);
      expect(useStoreSettingsStore.getState().hasChanges).toBe(false);
      expect(useStoreSettingsStore.getState().originalConfig).toEqual(validConfig);
    });
  });

  describe('resetToDefaults', () => {
    it('should load defaults and mark as changed', async () => {
      const mockDefaults = {
        name: 'Default Store',
        addressLine1: 'Default Address',
        addressLine2: 'Default City',
        phone1: '000-000-0000',
        phone2: '',
        email: '',
      };

      (window.api.invoke as any).mockResolvedValue(mockDefaults);

      const { resetToDefaults } = useStoreSettingsStore.getState();
      await resetToDefaults();

      const state = useStoreSettingsStore.getState();
      expect(state.storeConfig).toEqual(mockDefaults);
      expect(state.hasChanges).toBe(true);
      expect(state.validationErrors).toEqual({});
      expect(state.isValid).toBe(true);
    });
  });
});
