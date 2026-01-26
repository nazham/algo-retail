import { useEffect } from 'react';
import { Label } from '@repo/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@repo/ui/components/ui/radio-group';
import { Button } from '@repo/ui/components/ui/button';
import { usePrinterSettingsStore } from '../../../stores/printer-settings.store';

export function PrinterSettingsTab() {
  const printers = usePrinterSettingsStore((state) => state.printers);
  const config = usePrinterSettingsStore((state) => state.config);
  const isLoading = usePrinterSettingsStore((state) => state.isLoading);
  const status = usePrinterSettingsStore((state) => state.status);
  const hasChanges = usePrinterSettingsStore((state) => state.hasChanges);
  const initialize = usePrinterSettingsStore((state) => state.initialize);
  const loadPrinters = usePrinterSettingsStore((state) => state.loadPrinters);
  const selectPrinter = usePrinterSettingsStore((state) => state.selectPrinter);
  const setAutoMode = usePrinterSettingsStore((state) => state.setAutoMode);
  const setManualMode = usePrinterSettingsStore((state) => state.setManualMode);
  const saveConfig = usePrinterSettingsStore((state) => state.saveConfig);
  const testPrint = usePrinterSettingsStore((state) => state.testPrint);

  // Initialize store on mount (loads config from localStorage and fetches printers)
  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading printers...</p>
      </div>
    );
  }

  const selectedPrinter = config.mode === 'manual' ? config.printerName : null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold">Printer Configuration</h3>
        <p className="text-sm text-muted-foreground">Select your preferred printer for receipts</p>
      </div>

      <div className="space-y-4">
        {/* Mode Selection */}
        <div className="space-y-3">
          <Label>Printer Selection Mode</Label>
          <RadioGroup
            value={config.mode}
            onValueChange={(value) => {
              if (value === 'auto') {
                setAutoMode();
              } else if (value === 'manual') {
                setManualMode();
              }
            }}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="auto" id="auto" />
              <Label htmlFor="auto" className="font-normal cursor-pointer">
                Auto-detect (Use default printer)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="manual" id="manual" />
              <Label htmlFor="manual" className="font-normal cursor-pointer">
                Manual Selection
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Printer Dropdown (only shown in manual mode) */}
        {config.mode === 'manual' && (
          <div className="space-y-2">
            <Label htmlFor="printer">Select Printer</Label>
            <Select value={selectedPrinter || ''} onValueChange={selectPrinter}>
              <SelectTrigger id="printer">
                <SelectValue placeholder="Choose a printer" />
              </SelectTrigger>
              <SelectContent>
                {printers.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No printers found</div>
                ) : (
                  printers.map((printer) => (
                    <SelectItem key={printer.name} value={printer.name}>
                      {printer.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Status:</span>
          {status === 'connected' ? (
            <span className="text-green-600 font-medium">● Connected</span>
          ) : status === 'disconnected' ? (
            <span className="text-red-600 font-medium">● Disconnected</span>
          ) : (
            <span className="text-gray-600 font-medium">● Unknown</span>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={saveConfig} disabled={!hasChanges}>
          Save Changes
        </Button>
        <Button variant="outline" onClick={testPrint}>
          Test Print
        </Button>
        <Button variant="outline" onClick={loadPrinters}>
          Refresh Printers
        </Button>
      </div>
    </div>
  );
}
