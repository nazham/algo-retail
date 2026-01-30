# Generic Numeric Input Hook

The `useNumericInput` hook provides a reusable solution for all numeric input validation across the app.

## Features

✅ **Configurable constraints** (min, max, decimal places)  
✅ **Real-time validation** (prevents typing invalid values)  
✅ **Error handling** (toast notifications)  
✅ **Edge case handling** (empty, decimals only, etc.)  
✅ **Zero boilerplate** in your components

---

## Basic Usage

```tsx
import { useNumericInput } from '../hooks/use-numeric-input';

function MyComponent() {
  const quantityInput = useNumericInput({
    min: 0.01,
    max: 100000,
    decimalPlaces: 2,
    onValidChange: (value) => {
      // Called when user commits a valid value
      updateQuantity(value);
    },
  });

  return (
    <input
      value={quantityInput.displayValue}
      onChange={quantityInput.handleChange}
      onBlur={quantityInput.handleBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter') quantityInput.handleBlur();
        if (e.key === 'Escape') quantityInput.cancelEditing();
      }}
    />
  );
}
```

---

## Configuration Options

| Option           | Type                      | Default                   | Description                             |
| ---------------- | ------------------------- | ------------------------- | --------------------------------------- |
| `min`            | `number`                  | `0`                       | Minimum allowed value                   |
| `max`            | `number`                  | `Number.MAX_SAFE_INTEGER` | Maximum allowed value                   |
| `decimalPlaces`  | `number`                  | `0`                       | Number of decimal places allowed        |
| `allowZero`      | `boolean`                 | `false`                   | Whether zero is a valid value           |
| `onValidChange`  | `(value: number) => void` | -                         | Callback when valid value is committed  |
| `onInvalidInput` | `(error: string) => void` | -                         | Callback when invalid input is detected |

---

## Common Use Cases

### 1. **Quantity Input** (with decimals)

```tsx
const quantity = useNumericInput({
  min: 0.01,
  max: 100000,
  decimalPlaces: 2,
  onValidChange: (val) => setQuantity(productId, val),
});
```

### 2. **Price Input** (currency)

```tsx
const price = useNumericInput({
  min: 0,
  max: 999999.99,
  decimalPlaces: 2,
  allowZero: true,
  onValidChange: (val) => updatePrice(val),
});
```

### 3. **Age/Count Input** (integers only)

```tsx
const age = useNumericInput({
  min: 1,
  max: 120,
  decimalPlaces: 0,
  onValidChange: (val) => setAge(val),
});
```

### 4. **Discount Percentage** (0-100%)

```tsx
const discount = useNumericInput({
  min: 0,
  max: 100,
  decimalPlaces: 2,
  allowZero: true,
  onValidChange: (val) => applyDiscount(val),
});
```

---

## API Reference

### Returned Methods

- **`displayValue: string`** - Current input value
- **`isEditing: boolean`** - Whether input is in edit mode
- **`handleChange(e)`** - Handle onChange event
- **`handleBlur()`** - Validate and commit value
- **`startEditing(value)`** - Programmatically start editing
- **`cancelEditing()`** - Cancel editing without saving

---

## Migration Guide

**Before** (manual validation):

```tsx
const [value, setValue] = useState('');

const handleChange = (e) => {
  if (/^\d*\.?\d{0,2}$/.test(e.target.value)) {
    setValue(e.target.value);
  }
};

const handleBlur = () => {
  const parsed = parseFloat(value);
  if (isNaN(parsed) || parsed < 0.01 || parsed > 100000) {
    toast.error('Invalid value');
    return;
  }
  updateValue(parsed);
};
```

**After** (using hook):

```tsx
const input = useNumericInput({
  min: 0.01,
  max: 100000,
  decimalPlaces: 2,
  onValidChange: updateValue,
});

// Use: input.displayValue, input.handleChange, input.handleBlur
```

✅ **Result**: 15+ lines → 6 lines
