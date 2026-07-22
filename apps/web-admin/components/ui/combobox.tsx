'use client';

import * as React from 'react';
import { Search, Check, ChevronDown } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { Button } from '@repo/ui/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/ui/popover';
import { Input } from '@repo/ui/components/ui/input';

interface ComboboxProps {
  options: { label: string; value: string }[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = 'Select option...',
  emptyText = 'No results found.',
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  // ⚡ Bolt: Memoize filtered options to prevent unnecessary recalculations,
  // and hoist toLowerCase() out of the loop.
  const filteredOptions = React.useMemo(() => {
    const query = search.toLowerCase();
    if (!query) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  }, [options, search]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-[200px] justify-between bg-background', className)}
        >
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 border-0 focus-visible:ring-0 px-0"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-1">
          {filteredOptions.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">{emptyText}</div>
          )}
          {filteredOptions.map((option) => (
            <div
              key={option.value}
              className={cn(
                'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                value === option.value && 'bg-accent text-accent-foreground',
              )}
              onClick={() => {
                onValueChange(option.value);
                setOpen(false);
              }}
            >
              <Check
                className={cn('mr-2 h-4 w-4', value === option.value ? 'opacity-100' : 'opacity-0')}
              />
              {option.label}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
