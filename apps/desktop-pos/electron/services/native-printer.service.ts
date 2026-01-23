import { BrowserWindow, WebContentsPrintOptions } from 'electron';

export class NativePrinterService {
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

      // 2. Create a hidden browser window to load the HTML
      const printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      // 3. Load the generated HTML into the window
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

      console.log('🖨️ HTML loaded, waiting for content to render...');
      await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for render

      console.log('🖨️ Attempting to print with native Electron API...');

      // 4. Define print options, merging defaults with any provided overrides
      const printOptions: WebContentsPrintOptions = {
        silent: true,
        printBackground: true,
        deviceName: process.env.PRINTER_NAME || 'XP-80C',
        pageSize: { width: 78000, height: 200000 },
        margins: { marginType: 'none' },
        ...options,
      };

      // 5. Execute the print job
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
