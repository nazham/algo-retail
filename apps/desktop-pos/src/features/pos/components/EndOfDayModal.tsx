import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@repo/ui/components/ui/button';
import { Loader2, Printer, XCircle } from 'lucide-react';
import { useReport, usePrintReport } from '../../reports/hooks/use-report';

interface ZReportData {
  shopName: string;
  generatedAt: string;
  date: string;
  shiftStart: string | null;
  shiftEnd: string | null;
  totalOrders: number;
  grossSales: number;
  totalDiscounts: number;
  totalTax: number;
  netSales: number;
  paymentBreakdown: {
    method: string;
    amount: number;
    count: number;
  }[];
}

interface EndOfDayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EndOfDayModal = ({ isOpen, onClose }: EndOfDayModalProps) => {
  const [reportData, setReportData] = useState<ZReportData | null>(null);

  // Use hooks instead of direct API calls
  const { getReportData, isLoading } = useReport();
  const { printReport, isPrinting } = usePrintReport();

  // Fetch report data when modal opens
  useEffect(() => {
    if (isOpen && !reportData) {
      fetchReportData();
    }
  }, [isOpen]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setReportData(null);
    }
  }, [isOpen]);

  const fetchReportData = async () => {
    const result = await getReportData();
    if (result.success && result.data) {
      setReportData(result.data);
    } else {
      toast.error('Failed to fetch report data');
      onClose();
    }
  };

  const handlePrintZReport = async () => {
    const result = await printReport();

    if (result.success) {
      toast.success('Z-Report Printed Successfully');
      onClose();
    } else {
      toast.error('Printer Error: ' + result.error);
    }
  };

  const formatCurrency = (cents: number) => `Rs. ${(cents / 100).toFixed(2)}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background w-full max-w-lg rounded-xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="bg-secondary/50 px-6 py-4 border-b border-border">
          <h2 className="text-xl font-bold">End of Day Report</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review today's shift summary before printing
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Generating report...</p>
            </div>
          ) : reportData ? (
            <div className="space-y-4">
              {/* Report Info */}
              <div className="bg-secondary/50 rounded-lg p-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Report Date:</span>
                  <span className="font-medium">{reportData.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Generated At:</span>
                  <span className="font-medium">{reportData.generatedAt}</span>
                </div>
                {reportData.shiftStart && reportData.shiftEnd && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shift Hours:</span>
                    <span className="font-medium">
                      {reportData.shiftStart} - {reportData.shiftEnd}
                    </span>
                  </div>
                )}
              </div>

              {/* Sales Summary */}
              <div className="border border-border rounded-lg p-4">
                <h3 className="font-bold mb-3 text-base">Sales Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Orders:</span>
                    <span className="font-medium">{reportData.totalOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gross Sales:</span>
                    <span className="font-medium">{formatCurrency(reportData.grossSales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discounts:</span>
                    <span className="font-medium text-destructive">
                      -{formatCurrency(reportData.totalDiscounts)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax:</span>
                    <span className="font-medium">{formatCurrency(reportData.totalTax)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="font-bold">Net Sales:</span>
                    <span className="font-bold text-primary text-lg">
                      {formatCurrency(reportData.netSales)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="border border-border rounded-lg p-4">
                <h3 className="font-bold mb-3 text-base">Payment Breakdown</h3>
                <div className="space-y-2">
                  {reportData.paymentBreakdown.map((payment) => (
                    <div
                      key={payment.method}
                      className="flex justify-between items-center text-sm bg-secondary/30 px-3 py-2 rounded"
                    >
                      <span className="font-medium">{payment.method}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground text-xs">
                          {payment.count} {payment.count === 1 ? 'order' : 'orders'}
                        </span>
                        <span className="font-medium w-24 text-right">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-secondary/50 border-t border-border flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={isPrinting}>
            <XCircle className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handlePrintZReport}
            disabled={isLoading || !reportData || isPrinting}
            className="flex-1"
          >
            {isPrinting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Printing...
              </>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                Print Z-Report
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
