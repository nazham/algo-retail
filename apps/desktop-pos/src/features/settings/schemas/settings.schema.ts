import { z } from 'zod';

export const shopConfigSchema = z.object({
  name: z.string().min(1, 'Store name is required').max(100, 'Name too long'),
  addressLine1: z.string().min(1, 'Address is required').max(100, 'Address too long'),
  addressLine2: z.string().min(1, 'Address line 2 is required').max(100, 'Address too long'),
  phone1: z.string().min(1, 'Phone number is required').max(20, 'Phone too long'),
  phone2: z.string().max(20, 'Phone too long'),
  email: z.string().email('Invalid email format').or(z.literal('')),
});

export const printerConfigSchema = z.object({
  mode: z.enum(['auto', 'manual']),
  printerName: z.string().optional(),
});

export type ShopConfig = z.infer<typeof shopConfigSchema>;
export type PrinterConfig = z.infer<typeof printerConfigSchema>;
