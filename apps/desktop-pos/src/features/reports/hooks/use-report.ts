import { useState } from 'react';

export function useReport() {
  const [isLoading, setIsLoading] = useState(false);

  const getReportData = async (date?: Date) => {
    setIsLoading(true);
    try {
      const payload = date ? { date: date.toISOString() } : undefined;
      const data = await window.api.invoke('reports:get-daily-data', payload);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      setIsLoading(false);
    }
  };

  return { getReportData, isLoading };
}

export function usePrintReport() {
  const [isPrinting, setIsPrinting] = useState(false);

  const printReport = async (date?: Date) => {
    setIsPrinting(true);
    try {
      const payload = date ? { date: date.toISOString() } : undefined;
      const result = await window.api.invoke('reports:print-daily', payload);
      return result;
    } catch (error) {
      console.error('Failed to print report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      setIsPrinting(false);
    }
  };

  return { printReport, isPrinting };
}
