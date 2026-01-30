import { useRef, useEffect } from 'react';
import { Button } from '@repo/ui/components/ui/button';
import { useNumericInput } from '../../../hooks/use-numeric-input';

interface CartItemDiscountProps {
  currentDiscount: number;
  onUpdate: (discount: number) => void;
}

export function CartItemDiscount({ currentDiscount, onUpdate }: CartItemDiscountProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const { displayValue, isEditing, handleChange, handleBlur, startEditing, cancelEditing } =
    useNumericInput({
      min: 0,
      max: 1000000,
      decimalPlaces: 2,
      onValidChange: (val) => onUpdate(val * 100), // Convert back to cents
    });

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleClick = () => {
    // Initialize with current discount (converted from cents to currency units)
    startEditing(currentDiscount ? currentDiscount / 100 : 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  if (isEditing) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="0.00"
          className="w-16 text-right text-xs border rounded px-1 h-7"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-8 w-8 hover:bg-secondary ${
        currentDiscount ? 'text-green-600 font-bold' : 'text-muted-foreground'
      }`}
      onClick={handleClick}
      title={
        currentDiscount ? `Discount: Rs. ${(currentDiscount / 100).toFixed(2)}` : 'Add Discount'
      }
    >
      <span className="text-lg font-mono">%</span>
    </Button>
  );
}
