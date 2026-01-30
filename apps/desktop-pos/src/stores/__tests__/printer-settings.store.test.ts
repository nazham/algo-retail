import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePrinterSettingsStore } from '../printer-settings.store';

// Mock window.api
global.window = {
  api: {
    invoke: vi.fn(),
  },
} as any;

describe('usePrinterSettingsStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    usePrinterSettingsStore.setState({
      printers: [],
      config: { mode: 'auto' },
      originalConfig: { mode: 'auto' },
      isLoading: false,
      status: 'unknown',
      hasChanges: false,
    });
    vi.clearAllMocks();
  });

  describe('loadPrinters', () => {
    it('should load available printers', async () => {
      const mockPrinters = [
        { name: 'Printer 1', displayName: 'Printer 1', status: 0, isDefault: true, options: {} },
        { name: 'Printer 2', displayName: 'Printer 2', status: 0, isDefault: false, options: {} },
      ];

      (window.api.invoke as any).mockResolvedValue(mockPrinters);

      const { loadPrinters } = usePrinterSettingsStore.getState();
      await loadPrinters();

      const state = usePrinterSettingsStore.getState();
      expect(state.printers).toEqual(mockPrinters);
      expect(state.isLoading).toBe(false);
    });

    it('should update status to connected when printers available in auto mode', async () => {
      const mockPrinters = [
        { name: 'Printer 1', displayName: 'Printer 1', status: 0, isDefault: true, options: {} },
      ];

      (window.api.invoke as any).mockResolvedValue(mockPrinters);
      usePrinterSettingsStore.setState({ config: { mode: 'auto' } });

      const { loadPrinters } = usePrinterSettingsStore.getState();
      await loadPrinters();

      expect(usePrinterSettingsStore.getState().status).toBe('connected');
    });

    it('should update status to connected when selected printer exists', async () => {
      const mockPrinters = [
        { name: 'My Printer', displayName: 'My Printer', status: 0, isDefault: true, options: {} },
      ];

      (window.api.invoke as any).mockResolvedValue(mockPrinters);
      usePrinterSettingsStore.setState({
        config: { mode: 'manual', printerName: 'My Printer' },
      });

      const { loadPrinters } = usePrinterSettingsStore.getState();
      await loadPrinters();

      expect(usePrinterSettingsStore.getState().status).toBe('connected');
    });

    it('should update status to disconnected when selected printer does not exist', async () => {
      const mockPrinters = [
        {
          name: 'Other Printer',
          displayName: 'Other Printer',
          status: 0,
          isDefault: true,
          options: {},
        },
      ];

      (window.api.invoke as any).mockResolvedValue(mockPrinters);
      usePrinterSettingsStore.setState({
        config: { mode: 'manual', printerName: 'My Printer' },
      });

      const { loadPrinters } = usePrinterSettingsStore.getState();
      await loadPrinters();

      expect(usePrinterSettingsStore.getState().status).toBe('disconnected');
    });
  });

  describe('selectPrinter', () => {
    it('should select printer and set hasChanges', () => {
      const { selectPrinter } = usePrinterSettingsStore.getState();
      selectPrinter('My Printer');

      const state = usePrinterSettingsStore.getState();
      expect(state.config).toEqual({ mode: 'manual', printerName: 'My Printer' });
      expect(state.hasChanges).toBe(true);
    });
  });

  describe('setAutoMode', () => {
    it('should set mode to auto and mark as changed', () => {
      usePrinterSettingsStore.setState({
        config: { mode: 'manual', printerName: 'Printer' },
        originalConfig: { mode: 'manual', printerName: 'Printer' },
      });

      const { setAutoMode } = usePrinterSettingsStore.getState();
      setAutoMode();

      const state = usePrinterSettingsStore.getState();
      expect(state.config).toEqual({ mode: 'auto' });
      expect(state.hasChanges).toBe(true);
    });
  });

  describe('setManualMode', () => {
    it('should set mode to manual and preserve printer name', () => {
      usePrinterSettingsStore.setState({
        config: { mode: 'auto' },
        originalConfig: { mode: 'auto' },
      });

      const { setManualMode } = usePrinterSettingsStore.getState();
      setManualMode();

      const state = usePrinterSettingsStore.getState();
      expect(state.config.mode).toBe('manual');
      expect(state.hasChanges).toBe(true);
    });
  });

  describe('saveConfig', () => {
    it('should return true and reset hasChanges', async () => {
      usePrinterSettingsStore.setState({
        config: { mode: 'manual', printerName: 'Test Printer' },
        hasChanges: true,
      });

      const { saveConfig } = usePrinterSettingsStore.getState();
      const result = await saveConfig();

      expect(result).toBe(true);
      const state = usePrinterSettingsStore.getState();
      expect(state.hasChanges).toBe(false);
      expect(state.originalConfig).toEqual({ mode: 'manual', printerName: 'Test Printer' });
    });
  });

  describe('testPrint', () => {
    it('should call printer:test-print with correct parameters', async () => {
      (window.api.invoke as any).mockResolvedValue({ success: true });

      usePrinterSettingsStore.setState({
        config: { mode: 'manual', printerName: 'Test Printer' },
      });

      const { testPrint } = usePrinterSettingsStore.getState();
      await testPrint();

      expect(window.api.invoke).toHaveBeenCalledWith(
        'printer:test-print',
        expect.objectContaining({
          printerName: 'Test Printer',
        }),
      );
    });

    it('should use undefined printer name in auto mode', async () => {
      (window.api.invoke as any).mockResolvedValue({ success: true });

      usePrinterSettingsStore.setState({
        config: { mode: 'auto' },
      });

      const { testPrint } = usePrinterSettingsStore.getState();
      await testPrint();

      expect(window.api.invoke).toHaveBeenCalledWith(
        'printer:test-print',
        expect.objectContaining({
          printerName: undefined,
        }),
      );
    });
  });
});
