import { BrowserWindow, WebContentsPrintOptions } from 'electron';

export class NativePrinterService {
  /**
   * Get a list of all available printers on the system.
   * @returns Promise resolving to an array of printer objects with name, description, status, etc.
   */
  static async getPrinters(): Promise<Electron.PrinterInfo[]> {
    try {
      const win = new BrowserWindow({ show: false });
      const printers = await win.webContents.getPrintersAsync();
      win.close();
      console.log('🖨️ Available printers:', printers.map((p) => p.name).join(', '));
      return printers;
    } catch (error: any) {
      console.error('❌ Failed to get printers:', error);
      return [];
    }
  }

  /**
   * Validate if a printer with the given name exists on the system.
   * @param printerName The name of the printer to validate.
   * @returns Promise resolving to true if the printer exists, false otherwise.
   */
  static async validatePrinter(printerName: string): Promise<boolean> {
    const printers = await this.getPrinters();
    const exists = printers.some((p) => p.name === printerName);
    if (exists) {
      console.log(`✅ Printer "${printerName}" found`);
    } else {
      console.warn(`⚠️ Printer "${printerName}" not found`);
    }
    return exists;
  }

  /**
   * Get the system's default printer.
   * @returns Promise resolving to the default printer info, or null if no default is set.
   */
  static async getDefaultPrinter(): Promise<Electron.PrinterInfo | null> {
    const printers = await this.getPrinters();
    if (printers.length === 0) {
      console.warn('⚠️ No printers found on system');
      return null;
    }

    // In Electron, there's no direct isDefault property exposed in PrinterInfo type
    // We'll use the first printer as default, or you can configure via env var
    const defaultPrinter = printers[0];
    console.log(`🖨️ Using printer as default: ${defaultPrinter.name}`);
    return defaultPrinter;
  }

  /**
   * Renders a template with the given data and prints it using Electron's native printing API.
   * This method is generic and can be used with any data structure and corresponding template.
   *
   * @param template A function that takes a data object and returns an HTML string.
   * @param data The data to be passed to the template function.
   * @param options Optional print options that override the defaults.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  static async print<T>(
    template: (data: T) => string,
    data: T,
    options?: WebContentsPrintOptions,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Render the HTML content using the provided template and data
      const htmlContent = template(data);

      const previewMode = process.env.PREVIEW_MODE === 'true';

      // 2. Create a browser window to load the HTML with narrow receipt dimensions
      const printWindow = new BrowserWindow({
        width: 360,
        height: 640,
        title: 'Print Preview',
        show: previewMode,
        autoHideMenuBar: true,
        useContentSize: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      // 3. Load the generated HTML into the window
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

      console.log('🖨️ HTML loaded, waiting for content to render...');
      await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for render

      if (previewMode) {
        console.log('👁️ Preview mode enabled. Skipping actual print.');
        // Leave the window open for preview until the user closes it manually.
        return { success: true };
      }

      console.log('🖨️ Attempting to print with native Electron API...');

      // 4. Determine printer to use
      const requestedPrinter = options?.deviceName || process.env.PRINTER_NAME || 'XP-80C';
      let targetPrinter = requestedPrinter;

      // Validate printer and fallback to default if not found
      const printerExists = await this.validatePrinter(requestedPrinter);
      if (!printerExists) {
        console.warn(
          `⚠️ Requested printer "${requestedPrinter}" not available, attempting fallback...`,
        );
        const defaultPrinter = await this.getDefaultPrinter();
        if (defaultPrinter) {
          targetPrinter = defaultPrinter.name;
          console.log(`🔄 Falling back to default printer: ${targetPrinter}`);
        } else {
          // If no default printer, still attempt with requested name (user might see print dialog)
          console.warn('⚠️ No default printer found. Print may fail or show dialog.');
        }
      }

      // 5. Define print options, merging defaults with any provided overrides
      const printOptions: WebContentsPrintOptions = {
        silent: true,
        printBackground: true,
        deviceName: targetPrinter,
        pageSize: { width: 78000, height: 200000 },
        margins: { marginType: 'none' },
        ...options,
      };

      // 6. Execute the print job
      return new Promise((resolve) => {
        printWindow.webContents.print(printOptions, (success, errorType) => {
          // Clean up the print window after a short delay
          setTimeout(() => printWindow.close(), 1000);

          if (success) {
            console.log('✅ Print job sent successfully');
            resolve({ success: true });
          } else {
            const errorMessage = errorType || 'Print failed';
            console.log('❌ Print job failed or was cancelled:', errorMessage);
            resolve({ success: false, error: errorMessage });
          }
        });
      });
    } catch (error: any) {
      console.error('❌ Fatal error during printing process:', error);
      return { success: false, error: error?.message || String(error) };
    }
  }
}
