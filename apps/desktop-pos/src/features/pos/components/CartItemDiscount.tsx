import { useRef, useEffect } from 'react';
import { Button } from '@repo/ui/components/ui/button';
import { formatCurrency } from '../../../lib/utils';
import { useNumericInput } from '../../../hooks/use-numeric-input';

interface CartItemDiscountProps {
  currentDiscount: number;
  maxDiscount: number; // in cents
  quantity?: number;
  onUpdate: (discount: number) => void;
}

export function CartItemDiscount({
  currentDiscount,
  maxDiscount,
  quantity = 1,
  onUpdate,
}: CartItemDiscountProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const { displayValue, isEditing, handleChange, handleBlur, startEditing, cancelEditing } =
    useNumericInput({
      min: 0,
      max: maxDiscount / 100, // Convert cents to currency units for the UI
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
    startEditing(currentDiscount > 0 ? currentDiscount / 100 : 0);
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
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          placeholder="0.00/unit"
          title="Discount per unit (Rs.)"
          className="w-18 text-right text-xs font-medium border border-input rounded-md px-1.5 h-7 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      </div>
    );
  }

  const discountTitle =
    currentDiscount > 0
      ? quantity > 1
        ? `Discount: ${formatCurrency(currentDiscount)}/unit (Total: -${formatCurrency(currentDiscount * quantity)})`
        : `Discount: -${formatCurrency(currentDiscount)}`
      : 'Add Discount per unit';

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-7 w-7 rounded-md transition-colors ${
        currentDiscount > 0
          ? 'text-green-600 bg-green-500/10 hover:bg-green-500/20 font-bold'
          : 'text-muted-foreground hover:bg-secondary/80'
      }`}
      onClick={handleClick}
      title={discountTitle}
    >
      <span className="text-sm font-semibold font-mono">%</span>
    </Button>
  );
}
