'use client';

import { forwardRef, ReactNode } from 'react';
import { FieldError } from 'react-hook-form';
import { Label } from '@repo/ui/components/ui/label';
import { Input } from '@repo/ui/components/ui/input';
import { cn } from '@repo/ui/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface FormFieldProps {
  /** Field identifier and input id */
  name: string;
  /** Field label text */
  label: string;
  /** Whether field is required (shows asterisk) */
  required?: boolean;
  /** Field error from react-hook-form */
  error?: FieldError;
  /** Helper text shown below field */
  helperText?: string;
  /** Additional class names for container */
  className?: string;
  /** Custom content (replaces Input) */
  children?: ReactNode;
}

interface FormInputFieldProps extends FormFieldProps {
  /** Input type */
  type?: 'text' | 'number' | 'date' | 'email' | 'password';
  /** Placeholder text */
  placeholder?: string;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Step for number inputs */
  step?: string;
  /** Title tooltip */
  title?: string;
  /** Register props from react-hook-form */
  register?: object;
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Reusable form field wrapper with label, error display, and helper text.
 * Use `children` prop for custom inputs (Select, Combobox, etc.)
 */
export function FormField({
  name,
  label,
  required,
  error,
  helperText,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name}>
        {label}
        {required && ' *'}
      </Label>

      {children}

      {error?.message && <p className="text-xs text-destructive">{error.message}</p>}

      {helperText && !error && <p className="text-xs text-muted-foreground">{helperText}</p>}
    </div>
  );
}

/**
 * Form field with built-in Input component.
 * For simple text/number/date inputs.
 */
export const FormInputField = forwardRef<HTMLInputElement, FormInputFieldProps>(
  function FormInputField(
    {
      name,
      label,
      required,
      error,
      helperText,
      className,
      type = 'text',
      placeholder,
      disabled,
      step,
      title,
      register,
    },
    ref,
  ) {
    return (
      <FormField
        name={name}
        label={label}
        required={required}
        error={error}
        helperText={helperText}
        className={className}
      >
        <Input
          id={name}
          ref={ref}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          step={step}
          title={title}
          className={cn(disabled && 'bg-muted')}
          {...register}
        />
      </FormField>
    );
  },
);

/**
 * Read-only display field for metadata that shouldn't be edited.
 */
export function ReadOnlyField({
  label,
  value,
  className,
}: {
  label: string;
  value: string | number | null | undefined;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-muted-foreground">{label}</Label>
      <div className="px-3 py-2 rounded-md border bg-muted text-sm">{value ?? '-'}</div>
    </div>
  );
}

/**
 * Section header for grouping form fields.
 */
export function FormSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-4', className)}>
      <h4 className="text-sm font-semibold leading-none border-b pb-2">{title}</h4>
      {children}
    </section>
  );
}
