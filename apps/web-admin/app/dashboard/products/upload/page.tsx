'use client';

import { CSVUploader } from '@/components/csv-uploader';
import { Button } from '@repo/ui/components/ui/button';
import { Download, Info } from 'lucide-react';

export default function UploadPage() {
  const handleDownloadTemplate = () => {
    // Create a CSV template
    const headers = [
      'Product Name',
      'Barcode/SKU',
      'MRP',
      'Stock Quantity',
      'Batch NO',
      'Wholesale Price',
      'Tax rate',
      'UOM',
      'Reorder Point',
      'Safety stock',
      'Supplier',
      'Brand',
      'Expiry date', // Optional
      'Manufacture Date', // Optional
      'Inventory Location', // Optional
    ];

    // Create a sample row
    const sample = [
      'Sample Product',
      '', // Empty SKU for auto-generation
      '150.00', // Price
      '50', // Stock
      'BATCH001', // Batch
      '120.00', // Wholesale
      '0', // Tax
      'pcs', // UOM
      '10', // Reorder
      '5', // Safety
      'Local Supplier',
      'House Brand',
      '2026-12-31',
      '2026-01-01',
      'Aisle 1',
    ];

    const csvContent = [headers.join(','), sample.join(',')].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'products_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Cleanup to prevent memory leaks
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Upload Products</h1>
          <p className="text-muted-foreground mt-2">
            Import products from CSV file. Batches will be automatically handled.
          </p>
        </div>
        <Button onClick={handleDownloadTemplate} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Download Template
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Main Upload Area */}
        <div className="space-y-6">
          <CSVUploader />
        </div>

        {/* Info / Instructions */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="flex items-center gap-2 font-semibold mb-4">
              <Info className="h-5 w-5 text-primary" />
              Instructions
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground list-disc pl-4">
              <li>
                <span className="font-medium text-foreground">File Format:</span> CSV files only
                (max 10MB).
              </li>
              <li>
                <span className="font-medium text-foreground">Auto-SKU:</span> Leave{' '}
                <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">Barcode/SKU</code>{' '}
                empty to auto-generate proper barcodes.
              </li>
              <li>
                <span className="font-medium text-foreground">Batches:</span> Different batches for
                the same product name will be linked automatically.
              </li>
              <li>
                <span className="font-medium text-foreground">Required:</span> Product Name and MRP
                are mandatory.
              </li>
              <li>
                <span className="font-medium text-foreground">Duplicates:</span> Products with
                existing SKUs will be skipped to prevent overwrites.
              </li>
            </ul>
          </div>

          <div className="rounded-xl border bg-blue-50/50 dark:bg-blue-900/10 p-6">
            <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
              EAN-13 Compatibility
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Auto-generated SKUs follow the{' '}
              <code className="font-mono text-xs">99YYMMDD#####</code> format, which is fully
              compatible with standard barcode scanners (EAN-13 / UPC).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
