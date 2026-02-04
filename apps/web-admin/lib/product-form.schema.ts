import * as z from 'zod';
import { ProductWithCategoryDto } from '@algo/types';

// ============================================================================
// SCHEMA HELPERS
// ============================================================================

/**
 * Max values to prevent PostgreSQL integer overflow (max: 2,147,483,647)
 * PostgreSQL INT4 max is 2,147,483,647
 */
const MAX_INT = 2_147_483_647; // PostgreSQL int4 max
const MAX_PRICE = MAX_INT; // Use actual DB limit for prices
const MAX_STOCK = 99_999_999; // ~100 million items (practical limit)

/**
 * Preprocessor for price fields - required, min 0, max limited
 */
const coercePrice = z.preprocess(
  (val) => (val === '' || val === undefined ? undefined : Number(val)),
  z
    .number()
    .min(0, 'Must be 0 or greater')
    .max(MAX_PRICE, `Maximum price is ${MAX_PRICE.toLocaleString()}`),
);

/**
 * Preprocessor for optional price fields
 */
const coerceOptionalPrice = z.preprocess(
  (val) => (val === '' || val === undefined ? undefined : Number(val)),
  z
    .number()
    .min(0, 'Must be 0 or greater')
    .max(MAX_PRICE, `Maximum price is ${MAX_PRICE.toLocaleString()}`)
    .optional(),
);

/**
 * Preprocessor for stock/quantity fields (optional)
 */
const coerceStock = z.preprocess(
  (val) => (val === '' || val === undefined ? undefined : Number(val)),
  z
    .number()
    .min(0, 'Must be 0 or greater')
    .max(MAX_STOCK, `Maximum stock is ${MAX_STOCK.toLocaleString()}`)
    .optional(),
);

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

export const productFormSchema = z
  .object({
    // Basic Info
    name: z.string().min(1, 'Product name is required'),
    sku: z.string().optional(),
    autoGenerateSku: z.boolean().default(false),
    categoryId: z.string().min(1, 'Category is required'),

    // Pricing
    price: coercePrice,
    costPrice: coerceOptionalPrice,
    wholesalePrice: coerceOptionalPrice,

    // Inventory
    stock: coerceStock,
    reorderPoint: coerceStock,
    safetyStock: coerceStock,

    // Details
    location: z.string().optional(),
    uom: z.string().default('pc'),
    isActive: z.boolean().default(true),

    // Dates
    expiryDate: z.string().optional().or(z.literal('')),
    mfgDate: z.string().optional().or(z.literal('')),
    expiryPeriod: z.string().optional(), // Frontend-only
  })
  .refine(
    (data) => {
      // Cost price must be <= selling price
      if (data.costPrice != null && data.price != null && data.costPrice > data.price) {
        return false;
      }
      return true;
    },
    {
      message: 'Cost price cannot exceed selling price (MRP)',
      path: ['costPrice'],
    },
  )
  .refine(
    (data) => {
      // Manufacturing date must be before expiry date
      if (data.mfgDate && data.expiryDate) {
        return new Date(data.mfgDate) < new Date(data.expiryDate);
      }
      return true;
    },
    {
      message: 'Manufacturing date must be before expiry date',
      path: ['expiryDate'],
    },
  );

// ============================================================================
// TYPES
// ============================================================================

/**
 * Form data type - explicitly defined to work around Zod v4 type inference.
 */
export interface ProductFormData {
  name: string;
  sku?: string;
  autoGenerateSku: boolean;
  categoryId: string;
  price: number;
  costPrice?: number;
  wholesalePrice?: number;
  stock?: number;
  reorderPoint?: number;
  safetyStock?: number;
  location?: string;
  uom: string;
  isActive: boolean;
  expiryDate?: string;
  mfgDate?: string;
  expiryPeriod?: string;
}

/**
 * API payload type - excludes frontend-only fields.
 */
export interface CreateProductPayload {
  name: string;
  sku?: string;
  categoryId: string;
  price: number;
  costPrice?: number;
  wholesalePrice?: number;
  stock?: number;
  reorderPoint?: number;
  safetyStock?: number;
  location?: string;
  uom?: string;
  isActive: boolean;
  expiryDate?: string;
  mfgDate?: string;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

/**
 * Initial/default values for the product form.
 * Used when creating a new product or resetting the form.
 */
export const INITIAL_FORM_VALUES: ProductFormData = {
  name: '',
  sku: '',
  autoGenerateSku: true,
  categoryId: '',
  price: 0,
  costPrice: 0,
  wholesalePrice: 0,
  stock: 0,
  reorderPoint: 0,
  safetyStock: 0,
  location: '',
  uom: 'pc',
  isActive: true,
  expiryDate: '',
  mfgDate: '',
  expiryPeriod: '',
};

// ============================================================================
// CONVERTERS
// ============================================================================

/**
 * Maps product data (from API) to form values.
 */
export function productToFormData(product: ProductWithCategoryDto): ProductFormData {
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    try {
      const d = date instanceof Date ? date : new Date(date);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Convert cents to display units (divide by 100)
  return {
    name: product.name,
    sku: product.sku || '',
    autoGenerateSku: !product.sku,
    categoryId: product.categoryId || '',
    price: product.price / 100,
    costPrice: (product.costPrice ?? 0) / 100,
    wholesalePrice: (product.wholesalePrice ?? 0) / 100,
    stock: product.stock,
    reorderPoint: product.reorderPoint ?? 0,
    safetyStock: product.safetyStock ?? 0,
    location: product.location || '',
    uom: product.uom || 'pc',
    isActive: product.isActive,
    expiryDate: formatDate(product.expiryDate),
    mfgDate: formatDate(product.mfgDate),
    expiryPeriod: '',
  };
}

/**
 * Maps form data to API payload.
 * Excludes frontend-only fields and handles optional field logic.
 */
export function formDataToPayload(
  data: ProductFormData,
  options: { isUpdate?: boolean } = {},
): CreateProductPayload {
  // Convert display units to cents (multiply by 100)
  const priceInCents = Math.round(data.price * 100);
  const costPriceInCents = data.costPrice != null ? Math.round(data.costPrice * 100) : undefined;
  const wholesalePriceInCents =
    data.wholesalePrice != null ? Math.round(data.wholesalePrice * 100) : undefined;

  // Auto-inactive logic: if stock=0 OR price=0, set inactive
  const stock = data.stock ?? 0;
  const shouldBeInactive = stock === 0 || priceInCents === 0;
  const isActive = shouldBeInactive ? false : data.isActive;

  const payload: CreateProductPayload = {
    name: data.name,
    categoryId: data.categoryId,
    price: priceInCents,
    isActive,
  };

  // SKU - only include if not auto-generating
  if (!data.autoGenerateSku && data.sku) {
    payload.sku = data.sku;
  }

  // Numeric fields - include if defined (including 0)
  if (costPriceInCents != null) payload.costPrice = costPriceInCents;
  if (wholesalePriceInCents != null) payload.wholesalePrice = wholesalePriceInCents;

  // IMPORTANT: Only include stock for CREATE operations.
  // Updates must go through inventory ledger endpoints to maintain history.
  if (!options.isUpdate && data.stock != null) {
    payload.stock = data.stock;
  }

  if (data.reorderPoint != null) payload.reorderPoint = data.reorderPoint;
  if (data.safetyStock != null) payload.safetyStock = data.safetyStock;

  // String fields - include if non-empty
  if (data.location) payload.location = data.location;
  if (data.uom) payload.uom = data.uom;
  if (data.expiryDate) payload.expiryDate = data.expiryDate;
  if (data.mfgDate) payload.mfgDate = data.mfgDate;

  return payload;
}
