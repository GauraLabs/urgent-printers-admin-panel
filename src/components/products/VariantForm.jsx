/**
 * Variant Form Component
 * Form for creating and editing product variants
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  useCreateProductVariantMutation,
  useUpdateProductVariantMutation,
} from '@/store/api/apiSlice';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Save, X, Loader2 } from 'lucide-react';

// Form validation schema
const variantSchema = z.object({
  name: z.string().min(1, 'Variant name is required').max(200),
  sku: z.string().optional(),
  size: z.string().optional(),
  material: z.string().optional(),
  finish: z.string().optional(),
  color_sides: z.string().optional(),
  min_quantity: z.coerce.number().int().min(1).default(1),
  max_quantity: z.coerce.number().int().min(1).optional(),
  quantity_step: z.coerce.number().int().min(1).default(1),
  base_price: z.coerce.number().min(0, 'Base price is required'),
  price_per_unit: z.coerce.number().min(0).optional(),
  setup_fee: z.coerce.number().min(0).optional(),
  hsn_code: z.string().optional(),
  gst_rate: z.coerce.number().min(0).max(100).default(18),
  production_time_days: z.coerce.number().int().min(0).optional(),
  is_custom: z.boolean().default(false),
  track_inventory: z.boolean().default(false),
  stock_quantity: z.coerce.number().int().min(0).optional(),
  low_stock_threshold: z.coerce.number().int().min(0).optional(),
  is_active: z.boolean().default(true),
});

const VariantForm = ({ productId, variant, onSuccess, onCancel }) => {
  const isEditMode = Boolean(variant);

  const [createVariant, { isLoading: isCreating }] = useCreateProductVariantMutation();
  const [updateVariant, { isLoading: isUpdating }] = useUpdateProductVariantMutation();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      name: '',
      sku: '',
      size: '',
      material: '',
      finish: '',
      color_sides: 'single',
      min_quantity: 1,
      max_quantity: undefined,
      quantity_step: 1,
      base_price: 0,
      price_per_unit: undefined,
      setup_fee: undefined,
      hsn_code: '',
      gst_rate: 18,
      production_time_days: undefined,
      is_custom: false,
      track_inventory: false,
      stock_quantity: undefined,
      low_stock_threshold: undefined,
      is_active: true,
    },
  });

  const trackInventory = watch('track_inventory');

  // Load variant data in edit mode
  useEffect(() => {
    if (isEditMode && variant) {
      Object.keys(variant).forEach((key) => {
        if (variant[key] !== undefined && variant[key] !== null) {
          setValue(key, variant[key]);
        }
      });
    }
  }, [isEditMode, variant, setValue]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        productId,
        // Convert empty strings to undefined
        sku: data.sku || undefined,
        size: data.size || undefined,
        material: data.material || undefined,
        finish: data.finish || undefined,
        color_sides: data.color_sides || undefined,
        hsn_code: data.hsn_code || undefined,
        max_quantity: data.max_quantity || undefined,
        price_per_unit: data.price_per_unit || undefined,
        setup_fee: data.setup_fee || undefined,
        production_time_days: data.production_time_days || undefined,
        stock_quantity: data.track_inventory ? data.stock_quantity : undefined,
        low_stock_threshold: data.track_inventory ? data.low_stock_threshold : undefined,
      };

      if (isEditMode) {
        await updateVariant({
          productId,
          variantId: variant.id,
          ...payload,
        }).unwrap();
        toast.success('Variant updated successfully');
      } else {
        await createVariant(payload).unwrap();
        toast.success('Variant created successfully');
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to save variant:', error);
      toast.error(error.data?.detail || 'Failed to save variant');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Basic Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">
              Variant Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., A4 Glossy - 100 pcs"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              {...register('sku')}
              placeholder="Auto-generated if empty"
            />
            {errors.sku && (
              <p className="text-sm text-destructive">{errors.sku.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Physical Specifications */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Physical Specifications</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="size">Size</Label>
            <Input
              id="size"
              {...register('size')}
              placeholder="e.g., A4, 85x55mm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="material">Material</Label>
            <Input
              id="material"
              {...register('material')}
              placeholder="e.g., 300gsm Art Card"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="finish">Finish</Label>
            <Controller
              name="finish"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select finish" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="glossy">Glossy</SelectItem>
                    <SelectItem value="matte">Matte</SelectItem>
                    <SelectItem value="laminated">Laminated</SelectItem>
                    <SelectItem value="uncoated">Uncoated</SelectItem>
                    <SelectItem value="textured">Textured</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color_sides">Color Sides</Label>
            <Controller
              name="color_sides"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Side</SelectItem>
                    <SelectItem value="double">Double Sided</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </div>

      {/* Quantity Constraints */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Quantity Constraints</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="min_quantity">Min Quantity</Label>
            <Input
              id="min_quantity"
              type="number"
              {...register('min_quantity')}
              placeholder="1"
            />
            {errors.min_quantity && (
              <p className="text-sm text-destructive">{errors.min_quantity.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_quantity">Max Quantity</Label>
            <Input
              id="max_quantity"
              type="number"
              {...register('max_quantity')}
              placeholder="No limit"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity_step">Quantity Step</Label>
            <Input
              id="quantity_step"
              type="number"
              {...register('quantity_step')}
              placeholder="1"
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Pricing</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="base_price">
              Base Price (₹) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="base_price"
              type="number"
              step="0.01"
              {...register('base_price')}
              placeholder="0.00"
            />
            {errors.base_price && (
              <p className="text-sm text-destructive">{errors.base_price.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price_per_unit">Price Per Unit (₹)</Label>
            <Input
              id="price_per_unit"
              type="number"
              step="0.01"
              {...register('price_per_unit')}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="setup_fee">Setup Fee (₹)</Label>
            <Input
              id="setup_fee"
              type="number"
              step="0.01"
              {...register('setup_fee')}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* GST/Tax */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">GST & Tax</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hsn_code">HSN Code</Label>
            <Input
              id="hsn_code"
              {...register('hsn_code')}
              placeholder="e.g., 4911"
              maxLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gst_rate">
              GST Rate (%) <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="gst_rate"
              control={control}
              render={({ field }) => (
                <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="12">12%</SelectItem>
                    <SelectItem value="18">18%</SelectItem>
                    <SelectItem value="28">28%</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </div>

      {/* Production */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Production</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="production_time_days">Production Time (days)</Label>
            <Input
              id="production_time_days"
              type="number"
              {...register('production_time_days')}
              placeholder="e.g., 3"
            />
          </div>

          <div className="flex items-center space-x-2 pt-8">
            <input
              id="is_custom"
              type="checkbox"
              {...register('is_custom')}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="is_custom" className="font-normal">
              Requires Custom Quote
            </Label>
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Inventory</h3>
        <div className="flex items-center space-x-2">
          <input
            id="track_inventory"
            type="checkbox"
            {...register('track_inventory')}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="track_inventory" className="font-normal">
            Track Inventory
          </Label>
        </div>

        {trackInventory && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Stock Quantity</Label>
              <Input
                id="stock_quantity"
                type="number"
                {...register('stock_quantity')}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
              <Input
                id="low_stock_threshold"
                type="number"
                {...register('low_stock_threshold')}
                placeholder="10"
              />
            </div>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Status</h3>
        <div className="flex items-center space-x-2">
          <input
            id="is_active"
            type="checkbox"
            {...register('is_active')}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="is_active" className="font-normal">
            Active
          </Label>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isCreating || isUpdating}
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button type="submit" disabled={isCreating || isUpdating}>
          {(isCreating || isUpdating) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {isEditMode ? 'Update Variant' : 'Create Variant'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default VariantForm;
