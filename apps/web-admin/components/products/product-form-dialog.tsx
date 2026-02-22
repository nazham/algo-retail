'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm, FieldErrors, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useProducts } from '@/hooks/use-products';
import { useCategories } from '@/hooks/use-categories';
import { ProductWithCategoryDto } from '@algo/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Schema, types, and converters
import {
  productFormSchema,
  ProductFormData,
  INITIAL_FORM_VALUES,
  productToFormData,
  formDataToPayload,
} from '@/lib/product-form.schema';

// Utilities
import {
  EXPIRY_PERIODS,
  UOM_OPTIONS,
  calculateExpiryDate,
  formatDateForInput,
  getApiErrorMessage,
} from '@/lib/product-form.utils';

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/ui/dialog';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/ui/select';
import { Switch } from '@repo/ui/components/ui/switch';
import { Checkbox } from '@repo/ui/components/ui/checkbox';
import { Calendar } from '@repo/ui/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/ui/popover';
import { Plus, Loader2, CalendarIcon } from 'lucide-react';
import { ScrollArea } from '@repo/ui/components/ui/scroll-area';
import { Combobox } from '@/components/ui/combobox';
import { cn } from '@repo/ui/lib/utils';
import { FormField, FormSection, ReadOnlyField } from '@/components/ui/form-field';
import { useProductFormDraftStore } from '@/stores/product-form-draft.store';

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface ProductFormDialogProps {
  /** Product to edit (undefined = create mode) */
  product?: ProductWithCategoryDto;
  /** Custom trigger element */
  trigger?: React.ReactNode;
  /** Controlled open state */
  open?: boolean;
  /** Controlled open state handler */
  onOpenChange?: (open: boolean) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductFormDialog({
  product,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: ProductFormDialogProps) {
  // ========================================================================
  // STATE
  // ========================================================================
  const [internalOpen, setInternalOpen] = useState(false);
  const [expiryCalendarOpen, setExpiryCalendarOpen] = useState(false);

  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  const isEditMode = !!product;

  // ========================================================================
  // HOOKS
  // ========================================================================
  const { createProduct, isCreating, updateProduct, isUpdating } = useProducts({ enabled: false });
  const { categories, isLoading: categoriesLoading } = useCategories();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: INITIAL_FORM_VALUES,
  });

  // Draft persistence store
  const { draft, editingProductId, saveDraft, clearDraft, hasDraft } = useProductFormDraftStore();

  // Consolidated watch - better performance than multiple watch() calls
  const watchedFields = useWatch({
    control: form.control,
    name: [
      'sku',
      'stock',
      'mfgDate',
      'expiryPeriod',
      'expiryDate',
      'autoGenerateSku',
      'categoryId',
      'uom',
      'isActive',
    ],
  });

  const [
    watchSku,
    watchStock,
    watchMfgDate,
    watchExpiryPeriod,
    watchExpiryDate,
    watchAutoGenerateSku,
    watchCategoryId,
    watchUom,
    watchIsActive,
  ] = watchedFields;

  // Derived state
  const isLoading = isCreating || isUpdating;
  const isExpiryAutoCalculated =
    !!watchMfgDate && !!watchExpiryPeriod && watchExpiryPeriod !== 'custom';
  const isBatchManaged = isEditMode && !!product?.parentId;

  // Category options for combobox
  const categoryOptions = useMemo(
    () => categories.map((c) => ({ label: c.name, value: c.id })),
    [categories],
  );

  // ========================================================================
  // EFFECTS
  // ========================================================================

  // Auto-check SKU generation when SKU field is empty
  useEffect(() => {
    if (!watchSku || watchSku.trim() === '') {
      form.setValue('autoGenerateSku', true);
    }
  }, [watchSku, form]);

  // Auto-disable product when stock reaches 0
  useEffect(() => {
    if (watchStock === 0) {
      form.setValue('isActive', false);
    }
  }, [watchStock, form]);

  // Calculate expiry date from mfg date + period
  useEffect(() => {
    if (watchMfgDate && watchExpiryPeriod && watchExpiryPeriod !== 'custom') {
      const expiryDate = calculateExpiryDate(watchMfgDate, watchExpiryPeriod as any);
      if (expiryDate) {
        form.setValue('expiryDate', formatDateForInput(expiryDate));
      }
    }
  }, [watchMfgDate, watchExpiryPeriod, form]);

  // Reset form when dialog opens or product changes
  // Use a ref to track if we've already initialized for this open session
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      // Only check draft on initial open, not on subsequent re-renders
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;

        // Check for draft first (only for matching context)
        const storedDraft = useProductFormDraftStore.getState().draft;
        const storedEditingId = useProductFormDraftStore.getState().editingProductId;
        const draftMatchesContext =
          (isEditMode && product?.id === storedEditingId) || (!isEditMode && !storedEditingId);

        if (useProductFormDraftStore.getState().hasDraft() && draftMatchesContext && storedDraft) {
          form.reset(storedDraft);
          toast.info('Restored unsaved draft');
        } else {
          form.reset(product ? productToFormData(product) : INITIAL_FORM_VALUES);
        }
      }
    } else {
      // Reset the flag when dialog closes
      hasInitializedRef.current = false;
    }
  }, [isOpen, product, form, isEditMode]);

  // Auto-save draft on form changes (debounced to reduce localStorage writes)
  const draftSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const subscription = form.watch((data) => {
      // Clear any pending save
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
      }

      // Debounce: wait 500ms before saving
      draftSaveTimeoutRef.current = setTimeout(() => {
        // Only save if there's meaningful content
        if (data.name || (data.price && data.price > 0)) {
          saveDraft(data as ProductFormData, isEditMode ? product?.id : undefined);
        }
      }, 500);
    });

    return () => {
      subscription.unsubscribe();
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
      }
    };
  }, [isOpen, form, saveDraft, isEditMode, product?.id]);

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleValidationErrors = useCallback((errors: FieldErrors<ProductFormData>) => {
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      toast.error(firstError.message as string);
    }
  }, []);

  const onSubmit = useCallback(
    (data: ProductFormData) => {
      const payload = formDataToPayload(data, { isUpdate: isEditMode });

      if (isEditMode && product) {
        updateProduct(
          { id: product.id, data: payload },
          {
            onSuccess: () => {
              clearDraft(); // Clear draft on success
              setIsOpen(false);
            },
          },
        );
      } else {
        createProduct(payload, {
          onSuccess: () => {
            clearDraft(); // Clear draft on success
            setIsOpen(false);
          },
        });
      }
    },
    [isEditMode, product, createProduct, updateProduct, setIsOpen, clearDraft],
  );

  // ========================================================================
  // RENDER HELPERS
  // ========================================================================

  const renderTimestamps = () => {
    if (!isEditMode || !product) return null;

    return (
      <div className="bg-muted/30 p-2 rounded-md text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Created:</span>
          <span>{new Date(product.createdAt).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Last Updated:</span>
          <span>{new Date(product.updatedAt).toLocaleString()}</span>
        </div>
      </div>
    );
  };

  const renderExpiryDateField = () => {
    if (watchExpiryPeriod === 'custom') {
      return (
        <Popover open={expiryCalendarOpen} onOpenChange={setExpiryCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !watchExpiryDate && 'text-muted-foreground',
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {watchExpiryDate ? format(new Date(watchExpiryDate), 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={watchExpiryDate ? new Date(watchExpiryDate) : undefined}
              onSelect={(date) => {
                if (date) {
                  form.setValue('expiryDate', formatDateForInput(date));
                  setExpiryCalendarOpen(false);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <Input
        id="expiryDate"
        type="date"
        {...form.register('expiryDate')}
        disabled={isExpiryAutoCalculated}
        className={cn(isExpiryAutoCalculated && 'bg-muted')}
      />
    );
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="sm:max-w-[700px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex flex-row justify-between items-start px-6 pt-6 gap-4">
          <div className="space-y-1">
            <DialogTitle>{isEditMode ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? `Update details for ${product?.name}`
                : 'Create a new product inventory item.'}
            </DialogDescription>
          </div>
          {renderTimestamps()}
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-6">
          <ScrollArea className="h-full">
            <form
              id="product-form"
              onSubmit={form.handleSubmit(onSubmit, handleValidationErrors)}
              className="space-y-5 pr-4 pb-4 pl-2"
            >
              {/* ============================================ */}
              {/* BASIC INFORMATION SECTION */}
              {/* ============================================ */}
              <FormSection title="Basic Information">
                {/* Product Name */}
                <FormField
                  name="name"
                  label="Product Name"
                  required
                  error={form.formState.errors.name}
                >
                  <Input
                    id="name"
                    placeholder="e.g., Basmati Rice 5kg"
                    {...form.register('name')}
                  />
                </FormField>

                {/* Category */}
                <FormField
                  name="categoryId"
                  label="Category"
                  required
                  error={form.formState.errors.categoryId}
                >
                  {categoriesLoading ? (
                    <div className="h-10 w-full rounded-md border bg-muted animate-pulse" />
                  ) : (
                    <Combobox
                      className="w-full"
                      placeholder="Select Category"
                      options={categoryOptions}
                      value={watchCategoryId}
                      onValueChange={(val) => form.setValue('categoryId', val)}
                    />
                  )}
                </FormField>

                {/* SKU */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sku">SKU / Barcode</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="autoGenerateSku"
                        checked={watchAutoGenerateSku}
                        onCheckedChange={(checked) => form.setValue('autoGenerateSku', !!checked)}
                      />
                      <Label
                        htmlFor="autoGenerateSku"
                        className="text-xs font-normal cursor-pointer"
                      >
                        Auto-generate
                      </Label>
                    </div>
                  </div>
                  <Input
                    id="sku"
                    placeholder={watchAutoGenerateSku ? 'Will be auto-generated' : 'Enter SKU'}
                    {...form.register('sku')}
                    disabled={watchAutoGenerateSku}
                    className={cn(watchAutoGenerateSku && 'bg-muted')}
                  />
                </div>
              </FormSection>

              {/* ============================================ */}
              {/* PRICING SECTION */}
              {/* ============================================ */}
              <FormSection title="Pricing">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    name="price"
                    label="Selling Price (MRP)"
                    required
                    error={form.formState.errors.price}
                  >
                    <Input id="price" type="number" step="0.01" {...form.register('price')} />
                  </FormField>

                  <FormField
                    name="costPrice"
                    label="Cost Price"
                    error={form.formState.errors.costPrice}
                  >
                    <Input
                      id="costPrice"
                      type="number"
                      step="0.01"
                      {...form.register('costPrice')}
                    />
                  </FormField>

                  <FormField name="wholesalePrice" label="Wholesale Price">
                    <Input
                      id="wholesalePrice"
                      type="number"
                      step="0.01"
                      {...form.register('wholesalePrice')}
                      disabled
                      className="bg-muted"
                    />
                  </FormField>
                </div>
              </FormSection>

              {/* ============================================ */}
              {/* INVENTORY SECTION */}
              {/* ============================================ */}
              <FormSection title="Inventory">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    name="stock"
                    label="Stock"
                    helperText={
                      isBatchManaged
                        ? 'Managed by batches'
                        : isEditMode
                          ? 'Manage via Inventory'
                          : undefined
                    }
                  >
                    <Input
                      id="stock"
                      type="number"
                      {...form.register('stock')}
                      disabled={isBatchManaged || isEditMode}
                      title={
                        isBatchManaged
                          ? 'Stock is managed by batches'
                          : isEditMode
                            ? 'Use Add/Adjust Stock to change inventory'
                            : undefined
                      }
                      className={cn((isBatchManaged || isEditMode) && 'bg-muted')}
                    />
                  </FormField>

                  <FormField
                    name="reorderPoint"
                    label="Reorder Point"
                    error={form.formState.errors.reorderPoint}
                  >
                    <Input id="reorderPoint" type="number" {...form.register('reorderPoint')} />
                  </FormField>

                  <FormField
                    name="safetyStock"
                    label="Safety Stock"
                    error={form.formState.errors.safetyStock}
                  >
                    <Input id="safetyStock" type="number" {...form.register('safetyStock')} />
                  </FormField>
                </div>
              </FormSection>

              {/* ============================================ */}
              {/* DETAILS & META SECTION */}
              {/* ============================================ */}
              <FormSection title="Details & Meta">
                <div className="grid grid-cols-2 gap-4">
                  <FormField name="location" label="Location / Aisle">
                    <Input
                      id="location"
                      placeholder="e.g. Aisle-4-B"
                      {...form.register('location')}
                    />
                  </FormField>

                  <FormField name="uom" label="Unit of Measure">
                    <Select value={watchUom} onValueChange={(val) => form.setValue('uom', val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {UOM_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>

                {/* Date Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    name="mfgDate"
                    label="Manufacturing Date"
                    helperText="Set this to enable expiry period calculator"
                  >
                    <Input id="mfgDate" type="date" {...form.register('mfgDate')} />
                  </FormField>

                  {watchMfgDate && (
                    <FormField name="expiryPeriod" label="Expiry Period">
                      <Select
                        value={watchExpiryPeriod}
                        onValueChange={(val) => form.setValue('expiryPeriod', val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Period" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPIRY_PERIODS.map((period) => (
                            <SelectItem key={period.value} value={period.value}>
                              {period.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  )}
                </div>

                {/* Expiry Date */}
                <FormField
                  name="expiryDate"
                  label="Expiry Date"
                  error={form.formState.errors.expiryDate}
                >
                  {renderExpiryDateField()}
                </FormField>

                {/* Metadata (Read-only) */}
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <ReadOnlyField label="Supplier" value={product?.supplier} />
                  <ReadOnlyField label="Brand" value={product?.brand} />
                  <ReadOnlyField label="Batch No" value={product?.batchNo} />
                </div>

                {/* Active Status Toggle */}
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="isActive"
                    checked={watchIsActive}
                    onCheckedChange={(checked) => form.setValue('isActive', checked)}
                    disabled={watchStock === 0}
                  />
                  <Label htmlFor="isActive">
                    Product is Active (Visible on POS)
                    {watchStock === 0 && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (Auto-disabled: stock is 0)
                      </span>
                    )}
                  </Label>
                </div>
              </FormSection>
            </form>
          </ScrollArea>
        </div>

        <DialogFooter className="px-6 pb-6 pt-4">
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Save Changes' : 'Create Product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
