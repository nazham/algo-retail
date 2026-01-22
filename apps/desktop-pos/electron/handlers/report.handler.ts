import { ipcMain } from 'electron';
import { ReportService } from '../services/report.service';

export const registerReportHandlers = (reportService: ReportService) => {
  // Get report data for preview (without printing)
  ipcMain.handle('reports:get-daily-data', async (event, payload) => {
    const date = payload?.date ? new Date(payload.date) : new Date();
    return await reportService.getReportData(date);
  });

  // Print the report
  ipcMain.handle('reports:print-daily', async (event, payload) => {
    const date = payload?.date ? new Date(payload.date) : new Date();
    return await reportService.printDailyReport(date);
  });
};
