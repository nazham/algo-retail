import * as React from 'react';
import { Input } from '@repo/ui/components/ui/input';
import { cn } from '@repo/ui/lib/utils';

interface EditableCellProps {
  value: string | number;
  onSave: (value: string | number) => void;
  type?: 'text' | 'number';
  className?: string;
}

export function EditableCell({
  value: initialValue,
  onSave,
  type = 'text',
  className,
}: EditableCellProps) {
  const [value, setValue] = React.useState(initialValue);
  const [isEditing, setIsEditing] = React.useState(false);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const onBlur = () => {
    setIsEditing(false);
    if (value !== initialValue) {
      onSave(type === 'number' ? parseFloat(String(value)) : value);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
    if (e.key === 'Escape') {
      setValue(initialValue);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        type={type}
        className={cn('h-8 px-2 py-1 text-sm', className)}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        'cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors truncate min-h-8 flex items-center',
        className,
      )}
    >
      {type === 'number' && typeof value === 'number'
        ? (value / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })
        : value}
    </div>
  );
}
