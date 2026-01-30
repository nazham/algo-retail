import { useState, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Configuration for numeric input validation
 */
export interface NumericInputConfig {
  min?: number;
  max?: number;
  decimalPlaces?: number;
  allowZero?: boolean;
  onValidChange?: (value: number) => void;
  onInvalidInput?: (error: string) => void;
}

/**
 * Validation result
 */
interface ValidationResult {
  isValid: boolean;
  value: number;
  error?: string;
}

/**
 * Generic hook for handling numeric input with validation
 *
 * @example
 * ```tsx
 * const quantity = useNumericInput({
 *   min: 0.01,
 *   max: 100000,
 *   decimalPlaces: 2,
 *   onValidChange: (val) => updateCart(productId, val)
 * });
 *
 * <input
 *   value={quantity.displayValue}
 *   onChange={quantity.handleChange}
 *   onBlur={quantity.handleBlur}
 *   onKeyDown={(e) => e.key === 'Enter' && quantity.handleBlur()}
 * />
 * ```
 */
export function useNumericInput(config: NumericInputConfig) {
  const {
    min = 0,
    max = Number.MAX_SAFE_INTEGER,
    decimalPlaces = 0,
    allowZero = false,
    onValidChange,
    onInvalidInput,
  } = config;

  const [displayValue, setDisplayValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  /**
   * Validates if input can be typed (real-time)
   */
  const canType = useCallback(
    (input: string): boolean => {
      // Allow empty
      if (input === '') return true;

      // Build regex based on decimal places
      const decimalPattern = decimalPlaces > 0 ? `\\.?\\d{0,${decimalPlaces}}` : '';
      const regex = new RegExp(`^\\d*${decimalPattern}$`);

      if (!regex.test(input)) {
        return false;
      }

      // Check max limit during typing
      if (input !== '.' && input !== '') {
        const parsed = parseFloat(input);
        if (!isNaN(parsed) && parsed > max) {
          return false;
        }
      }

      return true;
    },
    [max, decimalPlaces],
  );

  /**
   * Validates final value (on blur/enter)
   */
  const validate = useCallback(
    (input: string): ValidationResult => {
      const trimmed = input.trim();

      // Empty or just a decimal point
      if (trimmed === '' || trimmed === '.') {
        return {
          isValid: false,
          value: 0,
          error: 'Value cannot be empty',
        };
      }

      const parsed = parseFloat(trimmed);

      if (isNaN(parsed)) {
        return {
          isValid: false,
          value: 0,
          error: 'Invalid number',
        };
      }

      // Check minimum
      const effectiveMin = allowZero ? 0 : min;
      if (parsed < effectiveMin) {
        return {
          isValid: false,
          value: 0,
          error: `Minimum value is ${effectiveMin}`,
        };
      }

      // Check maximum
      if (parsed > max) {
        return {
          isValid: false,
          value: max,
          error: `Maximum value is ${max.toLocaleString()}`,
        };
      }

      // Round to decimal places
      const rounded = Number(parsed.toFixed(decimalPlaces));

      return {
        isValid: true,
        value: rounded,
      };
    },
    [min, max, decimalPlaces, allowZero],
  );

  /**
   * Handle input change during typing
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (canType(value)) {
        setDisplayValue(value);
      }
    },
    [canType],
  );

  /**
   * Handle blur event (validate and commit)
   */
  const handleBlur = useCallback(() => {
    if (displayValue.trim() === '' || displayValue === '.') {
      setDisplayValue('');
      setIsEditing(false);
      return;
    }

    const result = validate(displayValue);

    if (result.isValid) {
      onValidChange?.(result.value);
      setDisplayValue('');
      setIsEditing(false);
    } else {
      const errorMsg = result.error || 'Invalid input';
      onInvalidInput?.(errorMsg);
      toast.error(errorMsg);
      setDisplayValue('');
      setIsEditing(false);
    }
  }, [displayValue, validate, onValidChange, onInvalidInput]);

  /**
   * Start editing with initial value
   */
  const startEditing = useCallback((initialValue: number) => {
    setIsEditing(true);
    setDisplayValue(initialValue.toString());
  }, []);

  /**
   * Cancel editing
   */
  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setDisplayValue('');
  }, []);

  return {
    displayValue,
    isEditing,
    handleChange,
    handleBlur,
    startEditing,
    cancelEditing,
    validate,
    canType,
  };
}
