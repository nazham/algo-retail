'use client';

import { X } from 'lucide-react';

import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/ui/select';
import { DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '../ui/date-range-picker';

interface DataTableToolbarProps<TData> {
  search: string;
  onSearchChange: (value: string) => void;
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  status: string | undefined;
  onStatusChange: (status: string | undefined) => void;
  onReset: () => void;
}

export function DataTableToolbar<TData>({
  search,
  onSearchChange,
  date,
  onDateChange,
  status,
  onStatusChange,
  onReset,
}: DataTableToolbarProps<TData>) {
  const isFiltered = !!search || !!status || (!!date?.from && !!date?.to); // Basic check

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter orders..."
          value={search ?? ''}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />

        <DatePickerWithRange date={date} setDate={onDateChange} className="h-8" />

        <Select
          value={status || 'ALL'}
          onValueChange={(value) => onStatusChange(value === 'ALL' ? undefined : value)}
        >
          <SelectTrigger className="h-8 w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {isFiltered && (
          <Button variant="ghost" onClick={onReset} className="h-8 px-2 lg:px-3">
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
