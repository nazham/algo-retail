import { Button } from '@repo/ui/components/ui/button';
import { Minus, Plus, Trash2 } from 'lucide-react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { formatCurrency } from '../../../lib/utils';
import type { CartItem } from '../../../stores/cart.store';
import { CartItemDiscount } from './CartItemDiscount';

export interface CartItemRowProps {
  item: CartItem;
  isEditingQuantity: boolean;
  quantityDisplayValue: string;
  onQuantityChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onQuantityBlur: () => void;
  onQuantityKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onStartEditQuantity: () => void;
  onUpdateQuantity: (delta: number) => void;
  onSetDiscount: (discount: number) => void;
  onRemove: () => void;
}

export function CartItemRow({
  item,
  isEditingQuantity,
  quantityDisplayValue,
  onQuantityChange,
  onQuantityBlur,
  onQuantityKeyDown,
  onStartEditQuantity,
  onUpdateQuantity,
  onSetDiscount,
  onRemove,
}: CartItemRowProps) {
  const discountAmt = item.discount ?? 0;
  const hasDiscount = discountAmt > 0;
  const grossLineTotal = item.price * item.quantity;
  const netUnitPrice = item.price - discountAmt;
  const netLineTotal = netUnitPrice * item.quantity;
  const totalLineDiscount = discountAmt * item.quantity;

  return (
    <div className="group bg-card border border-border/80 hover:border-border p-3 rounded-lg shadow-sm flex flex-col gap-2.5 transition-colors">
      {/* ROW 1: Name & Net Total */}
      <div className="flex justify-between items-start gap-3">
        <div
          className="font-medium text-sm text-card-foreground line-clamp-2 leading-snug flex-1"
          title={item.name}
        >
          {item.name}
        </div>
        <div className="text-right shrink-0">
          <div className="font-bold text-base text-primary whitespace-nowrap leading-none">
            {formatCurrency(netLineTotal)}
          </div>
          {hasDiscount && (
            <div className="text-[11px] text-muted-foreground line-through mt-0.5 whitespace-nowrap font-mono">
              {formatCurrency(grossLineTotal)}
            </div>
          )}
        </div>
      </div>

      {/* ROW 2: Derivation Equation + Total Discount */}
      <div className="flex items-center justify-between gap-2 text-[11px] font-mono leading-none">
        {/* Left: formula (no result — shown top-right already) */}
        <div className="flex items-center flex-wrap gap-x-1 gap-y-0.5">
          {hasDiscount ? (
            <>
              {item.quantity > 1 && <span className="text-muted-foreground/60">(</span>}
              <span className="text-muted-foreground">{formatCurrency(item.price)}</span>
              <span className="text-muted-foreground/60 px-0.5">−</span>
              <span className="text-green-600 dark:text-green-400">
                {formatCurrency(discountAmt)}
              </span>
              {item.quantity > 1 && (
                <>
                  <span className="text-muted-foreground/60">)</span>
                  <span className="text-muted-foreground/60 px-0.5">×</span>
                  <span className="text-muted-foreground">{item.quantity}</span>
                </>
              )}
            </>
          ) : (
            <>
              <span className="text-muted-foreground">{formatCurrency(item.price)}</span>
              <span className="text-muted-foreground/60 px-0.5">×</span>
              <span className="text-muted-foreground">{item.quantity}</span>
            </>
          )}
        </div>

        {/* Right: total discount badge */}
        {hasDiscount && (
          <span className="shrink-0 px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 font-medium">
            −{formatCurrency(totalLineDiscount)}
          </span>
        )}
      </div>

      {/* ROW 3: Quantity Controls & Actions */}
      <div className="flex justify-between items-center pt-1 border-t border-border/40">
        {/* Quantity Controls Pill */}
        <div className="flex items-center bg-secondary/60 rounded-md h-7 overflow-hidden border border-border/30">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-secondary shrink-0 rounded-none"
            onClick={() => onUpdateQuantity(-1)}
          >
            <Minus size={13} />
          </Button>

          {isEditingQuantity ? (
            <input
              autoFocus
              type="text"
              className="w-12 text-center text-xs font-bold bg-transparent border-none focus:outline-none p-0 mx-0.5"
              value={quantityDisplayValue}
              onChange={onQuantityChange}
              onBlur={onQuantityBlur}
              onKeyDown={onQuantityKeyDown}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="min-w-6 max-w-20 px-1 text-center text-xs font-bold cursor-pointer select-none truncate"
              onClick={onStartEditQuantity}
              title={item.quantity.toString()}
            >
              {item.quantity}
            </span>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-secondary shrink-0 rounded-none"
            onClick={() => onUpdateQuantity(1)}
          >
            <Plus size={13} />
          </Button>
        </div>

        {/* Actions (Discount & Trash) */}
        <div className="flex items-center gap-1">
          <CartItemDiscount
            currentDiscount={discountAmt}
            maxDiscount={item.price}
            quantity={item.quantity}
            onUpdate={onSetDiscount}
          />

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            onClick={onRemove}
            title="Remove item"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
