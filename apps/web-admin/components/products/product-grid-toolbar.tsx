'use client';

import * as React from 'react';
import { Search, AlertTriangle, Clock } from 'lucide-react';
import { Input } from '@repo/ui/components/ui/input';
import { Button } from '@repo/ui/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/ui/select';
import { cn } from '@repo/ui/lib/utils';
import { Combobox } from '../ui/combobox';
import { useCategories } from '@/hooks/use-categories';
import { ExportDialog } from './export-dialog';

interface ProductGridToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  categoryId: string | undefined;
  onCategoryChange: (value: string | undefined) => void;
  status: string | undefined;
  onStatusChange: (value: string | undefined) => void;
  isLowStock: boolean;
  onLowStockToggle: (value: boolean) => void;
  isExpiringSoon: boolean;
  onExpiringSoonToggle: (value: boolean) => void;
  onReset: () => void;
}

export function ProductGridToolbar({
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
  status,
  onStatusChange,
  isLowStock,
  onLowStockToggle,
  isExpiringSoon,
  onExpiringSoonToggle,
  onReset,
}: ProductGridToolbarProps) {
  const { categories } = useCategories();

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-muted/30 p-2 rounded-lg border">
      {/* Search - Full width on mobile/tablet, fixed on desktop */}
      <div className="relative w-full lg:w-auto lg:flex-1 lg:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search name or SKU..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-background w-full"
        />
      </div>

      {/* Filters - Grid on mobile, Flex on desktop */}
      <div className="grid grid-cols-2 md:flex items-center gap-3 w-full lg:w-auto">
        {/* Category Filter */}
        <div className="col-span-1 md:w-auto">
          <div className="flex items-center gap-2">
            <Combobox
              placeholder="All Categories"
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
              value={categoryId}
              onValueChange={onCategoryChange}
              className="w-full md:w-48"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="col-span-1 md:w-auto">
          <Select
            value={status || 'all'}
            onValueChange={(val) => onStatusChange(val === 'all' ? undefined : val)}
          >
            <SelectTrigger className="w-full md:w-[130px] bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Filters */}
        <div className="col-span-2 md:col-span-auto flex gap-2 w-full md:w-auto">
          <Button
            variant={isLowStock ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => onLowStockToggle(!isLowStock)}
            className={cn(
              'flex-1 md:flex-none h-10 border-dashed gap-1.5',
              isLowStock &&
                'bg-orange-100 text-orange-900 border-orange-200 border-solid hover:bg-orange-200',
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Low Stock</span>
          </Button>
          <Button
            variant={isExpiringSoon ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => onExpiringSoonToggle(!isExpiringSoon)}
            className={cn(
              'flex-1 md:flex-none h-10 border-dashed gap-1.5',
              isExpiringSoon &&
                'bg-red-100 text-red-900 border-red-200 border-solid hover:bg-red-200',
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Expiring</span>
          </Button>
        </div>

        {/* Action Buttons - Full row on small mobile, auto on larger */}
        <div className="col-span-2 md:col-span-auto flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
          <Button variant="outline" className="flex-1 md:flex-none" onClick={onReset}>
            Reset
          </Button>
          <div className="flex-1 md:flex-none">
            <ExportDialog />
          </div>
        </div>
      </div>
    </div>
  );
}
