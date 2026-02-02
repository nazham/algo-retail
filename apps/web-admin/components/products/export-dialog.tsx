'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@repo/ui/components/ui/alert-dialog';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Switch } from '@repo/ui/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/ui/table';
import { Download, Loader2, Settings2, Eye, Tag } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { useCategories } from '@/hooks/use-categories';
import { Combobox } from '../ui/combobox';

interface ExportPreviewItem {
  name: string;
  price: number;
  sku: string;
  stock: number;
}

export function ExportDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [minStock, setMinStock] = React.useState(1);
  const [minPrice, setMinPrice] = React.useState(1);
  const [isActive, setIsActive] = React.useState(true);
  const [categoryId, setCategoryId] = React.useState<string | undefined>(undefined);
  const [onlyAutoSkus, setOnlyAutoSkus] = React.useState(true);
  const [previewData, setPreviewData] = React.useState<ExportPreviewItem[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const { categories = [] } = useCategories();

  const fetchPreview = React.useCallback(async () => {
    setIsLoadingPreview(true);
    try {
      const query = new URLSearchParams({
        minStock: minStock.toString(),
        minPrice: (minPrice * 100).toString(), // Convert Rs to Cents
        onlyAutoSkus: onlyAutoSkus.toString(),
        isActive: isActive.toString(),
      });
      if (categoryId) query.append('categoryId', categoryId);

      const data = await apiClient<ExportPreviewItem[]>(`/products/export?${query.toString()}`);
      setPreviewData(data.slice(0, 5));
    } catch (error) {
      console.error('Preview error:', error);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [minStock, minPrice, onlyAutoSkus, isActive, categoryId]);

  React.useEffect(() => {
    if (isOpen) {
      fetchPreview();
    }
  }, [isOpen, fetchPreview]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const query = new URLSearchParams({
        minStock: minStock.toString(),
        minPrice: (minPrice * 100).toString(),
        onlyAutoSkus: onlyAutoSkus.toString(),
        isActive: isActive.toString(),
      });
      if (categoryId) query.append('categoryId', categoryId);

      const data = await apiClient<ExportPreviewItem[]>(`/products/export?${query.toString()}`);

      if (data.length === 0) {
        toast.info('No items match the current filters');
        return;
      }

      const csvContent =
        '\uFEFF' +
        [
          'Product Name,Price,SKU',
          ...data.map((item) => `"${item.name}",${(item.price / 100).toFixed(2)},${item.sku}`),
        ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `bartender_export_${new Date().toISOString().split('T')[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${data.length} items to CSV`);
      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-primary/5 border-primary/20 hover:bg-primary/10 text-primary"
        >
          <Download className="h-4 w-4 mr-2" />
          Export for BarTender
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            BarTender Export Configuration
          </AlertDialogTitle>
          <AlertDialogDescription>
            Filter inventory to extract precisely what you need for barcode printing.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-4">
          <div className="space-y-4">
            <div className="space-y-3 p-3 border rounded-md bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs">Auto-Generated Only (99*)</Label>
                  <p className="text-[10px] text-muted-foreground">Recommended for BarTender</p>
                </div>
                <Switch checked={onlyAutoSkus} onCheckedChange={setOnlyAutoSkus} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs">Active Products Only</Label>
                  <p className="text-[10px] text-muted-foreground">Excludes disabled inventory</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <Tag className="h-3 w-3" /> Filter by Category
              </Label>
              <Combobox
                placeholder="All Categories"
                options={[
                  { label: 'All Categories', value: 'all' },
                  ...categories.map((c) => ({ label: c.name, value: c.id })),
                ]}
                value={categoryId || 'all'}
                onValueChange={(val) => setCategoryId(val === 'all' ? undefined : val)}
                className="w-full h-8"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                  Min Stock
                </Label>
                <Input
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                  Min Price (Rs.)
                </Label>
                <Input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(parseInt(e.target.value) || 0)}
                  className="h-8"
                />
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-[10px]"
              onClick={() => {
                setMinStock(1);
                setMinPrice(1);
                setCategoryId(undefined);
                setIsActive(true);
                setOnlyAutoSkus(true);
              }}
            >
              Reset to Recommended
            </Button>
          </div>

          <div className="border rounded-md overflow-hidden bg-background flex flex-col h-[300px]">
            <div className="bg-muted px-3 py-2 text-[10px] font-semibold flex items-center justify-between border-b">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" /> PREVIEW (Top 5)
              </div>
              {isLoadingPreview && <Loader2 className="h-3 w-3 animate-spin" />}
            </div>
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0">
                  <TableRow>
                    <TableHead className="h-7 text-[10px] px-2">SKU</TableHead>
                    <TableHead className="h-7 text-[10px] px-2">Name</TableHead>
                    <TableHead className="h-7 text-[10px] px-2 text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.length === 0 && !isLoadingPreview ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-8 text-[10px] text-muted-foreground"
                      >
                        No matches
                      </TableCell>
                    </TableRow>
                  ) : (
                    previewData.map((item, idx) => (
                      <TableRow key={idx} className="h-7 hover:bg-muted/50 transition-colors">
                        <TableCell className="py-1 px-2 text-[10px] font-mono text-primary">
                          {item.sku}
                        </TableCell>
                        <TableCell className="py-1 px-2 text-[10px] truncate max-w-[140px]">
                          {item.name}
                        </TableCell>
                        <TableCell className="py-1 px-2 text-[10px] text-right">
                          {(item.price / 100).toFixed(0)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="border-t pt-4">
          <AlertDialogCancel onClick={() => setIsOpen(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={(e) => {
                e.preventDefault();
                handleExport();
              }}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                'Generate BarTender CSV'
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
