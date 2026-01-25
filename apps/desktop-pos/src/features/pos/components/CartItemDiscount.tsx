import { useState, useRef, useEffect } from 'react';
import { Button } from '@repo/ui/components/ui/button';

interface CartItemDiscountProps {
  currentDiscount: number;
  onUpdate: (discount: number) => void;
}

export function CartItemDiscount({ currentDiscount, onUpdate }: CartItemDiscountProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleClick = () => {
    setIsEditing(true);
    setTempValue(currentDiscount ? (currentDiscount / 100).toString() : '');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setTempValue(value);
    }
  };

  const handleSave = () => {
    const parsed = parseFloat(tempValue);
    if (!isNaN(parsed)) {
      onUpdate(parsed * 100); // Convert to cents
    } else {
      onUpdate(0);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
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
          value={tempValue}
          onChange={handleChange}
          onBlur={handleSave}
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
