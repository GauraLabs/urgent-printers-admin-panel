/**
 * Product Create/Edit Form
 * Form for creating and updating products with all necessary fields
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetCategoriesQuery,
  useGetSpecificationsByTypeQuery,
} from '@/store/api/apiSlice';
import PageHeader from '@/components/common/PageHeader';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { Save, X, Loader2 } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import FormBuilder from '@/components/products/FormBuilder';
import ImageUpload from '@/components/products/ImageUpload';

// Form validation schema
const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Name is too long'),
  slug: z.string().optional(),
  short_description: z.string().max(500, 'Short description is too long').optional(),
  long_description: z.string().optional(),
  category_id: z.string().uuid('Invalid category').optional(),
  base_price: z.coerce.number().min(0, 'Price must be positive'),
  price_calculation_type: z.enum(['variant', 'quantity_based', 'area_based']),

  // Product Type & Customization
  product_type: z.enum(['custom', 'template']).default('custom'),
  requires_customer_artwork: z.boolean().default(true),
  template_file_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  template_form_fields: z.string().optional(), // JSON string for template products only
  print_sides_options: z.string().default('single_side,double_side'),

  // Artwork Requirements
  min_dpi: z.coerce.number().int().min(72, 'Minimum DPI is 72').max(600, 'Maximum DPI is 600').default(300),
  accepted_formats: z.string().default('PDF,AI,PSD,EPS'),
  requires_bleed: z.boolean().default(false),
  bleed_size_mm: z.coerce.number().min(0).max(10).default(3),
  color_mode: z.enum(['CMYK', 'RGB', 'Both']).default('CMYK'),

  // Settings
  is_featured: z.boolean().default(false),
  display_order: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const { data: categoriesData, isLoading: loadingCategories } = useGetCategoriesQuery();
  const { data: specificationsData, isLoading: loadingSpecs } = useGetSpecificationsByTypeQuery({ is_active: true });
  const { data: productData, isLoading: loadingProduct } = useGetProductQuery(id, {
    skip: !isEditMode,
  });

  // State for selected specifications
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedFinishes, setSelectedFinishes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedPrintSides, setSelectedPrintSides] = useState([]);

  // State for template form fields
  const [templateFormFields, setTemplateFormFields] = useState([]);

  // State for product media
  const [productImages, setProductImages] = useState([]);
  const [productVideos, setProductVideos] = useState([]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      slug: '',
      short_description: '',
      long_description: '',
      category_id: '',
      base_price: 0,
      price_calculation_type: 'variant',
      product_type: 'custom',
      requires_customer_artwork: true,
      template_file_url: '',
      template_form_fields: '',
      print_sides_options: 'single_side,double_side',
      min_dpi: 300,
      accepted_formats: 'PDF,AI,PSD,EPS',
      requires_bleed: false,
      bleed_size_mm: 3,
      color_mode: 'CMYK',
      is_featured: false,
      display_order: 0,
      is_active: true,
    },
  });

  const requiresBleed = watch('requires_bleed');
  const productType = watch('product_type');

  // Auto-generate slug from name
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'name' && !isEditMode) {
        const slug = value.name
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        setValue('slug', slug);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue, isEditMode]);

  // Load product data in edit mode
  useEffect(() => {
    if (isEditMode && productData) {
      const product = productData.product || productData;
      setValue('name', product.name || '');
      setValue('slug', product.slug || '');
      setValue('short_description', product.short_description || '');
      setValue('long_description', product.long_description || '');
      setValue('category_id', product.category_id || '');
      setValue('base_price', product.base_price || 0);
      setValue('price_calculation_type', product.price_calculation_type || 'variant');

      // Artwork requirements
      if (product.artwork_requirements) {
        setValue('min_dpi', product.artwork_requirements.min_dpi || 300);
        setValue('accepted_formats', product.artwork_requirements.accepted_formats?.join(',') || 'PDF,AI,PSD,EPS');
        setValue('requires_bleed', product.artwork_requirements.requires_bleed || false);
        setValue('bleed_size_mm', product.artwork_requirements.bleed_size_mm || 3);
        setValue('color_mode', product.artwork_requirements.color_mode || 'CMYK');
      }

      // Settings
      setValue('is_featured', product.is_featured || false);
      setValue('display_order', product.display_order || 0);
      setValue('is_active', product.is_active !== undefined ? product.is_active : true);

      // Template form fields
      if (product.template_form_fields) {
        setTemplateFormFields(product.template_form_fields);
      }
    }
  }, [isEditMode, productData, setValue]);

  const onSubmit = async (data) => {
    try {
      // Validate at least one specification is selected
      const allSelectedSpecs = [
        ...selectedMaterials,
        ...selectedSizes,
        ...selectedFinishes,
        ...selectedColors,
        ...selectedPrintSides,
      ];

      if (allSelectedSpecs.length === 0) {
        toast.error('Please select at least one specification for this product');
        return;
      }

      // Extract image and video URLs
      const imageUrls = productImages.map(img => img.variants?.medium || img.url).filter(Boolean);
      const thumbnailUrl = productImages.length > 0 ? (productImages[0].variants?.thumbnail || productImages[0].url) : undefined;
      const templatePreviewUrls = productImages.slice(0, 3).map(img => img.variants?.large || img.url).filter(Boolean);

      // Transform data to match API schema
      const payload = {
        name: data.name,
        slug: data.slug || undefined,
        short_description: data.short_description || undefined,
        description: data.long_description || undefined,
        category_id: data.category_id || undefined,
        base_price: data.base_price,
        price_calculation_type: data.price_calculation_type,
        product_type: data.product_type,
        requires_customer_artwork: data.requires_customer_artwork,
        template_file_url: data.product_type === 'template' ? data.template_file_url || undefined : undefined,
        template_preview_urls: data.product_type === 'template' ? templatePreviewUrls : [],
        template_form_fields: data.product_type === 'template' && templateFormFields.length > 0 ? templateFormFields : undefined,
        specification_ids: allSelectedSpecs, // Send selected specification IDs
        min_dpi: data.min_dpi,
        accepted_formats: data.accepted_formats.split(',').map(f => f.trim()),
        requires_bleed: data.requires_bleed,
        bleed_size_mm: data.bleed_size_mm,
        color_mode: data.color_mode,
        thumbnail_url: thumbnailUrl,
        images: imageUrls,
        is_featured: data.is_featured,
        display_order: data.display_order,
        is_active: data.is_active,
      };

      if (isEditMode) {
        await updateProduct({ id, ...payload }).unwrap();
        toast.success('Product updated successfully');
      } else {
        await createProduct(payload).unwrap();
        toast.success('Product created successfully');
      }

      navigate(ROUTES.PRODUCTS);
    } catch (error) {
      console.error('Failed to save product:', error);
      toast.error(error.data?.detail || 'Failed to save product');
    }
  };

  if (loadingProduct || loadingCategories || loadingSpecs) {
    return <LoadingSpinner />;
  }

  const categories = categoriesData?.categories || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditMode ? 'Edit Product' : 'Create Product'}
        description={isEditMode ? 'Update product details' : 'Add a new product to your catalog'}
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Products', href: ROUTES.PRODUCTS },
          { label: isEditMode ? 'Edit' : 'Create' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Basic Information</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Premium Business Cards"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                {...register('slug')}
                placeholder="auto-generated-from-name"
                disabled={isEditMode}
              />
              {errors.slug && (
                <p className="text-sm text-destructive">{errors.slug.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {isEditMode ? 'Slug cannot be changed after creation' : 'Auto-generated from product name'}
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="short_description">Short Description</Label>
              <Textarea
                id="short_description"
                {...register('short_description')}
                placeholder="Brief description for product listings"
                rows={2}
              />
              {errors.short_description && (
                <p className="text-sm text-destructive">{errors.short_description.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="long_description">Full Description</Label>
              <Textarea
                id="long_description"
                {...register('long_description')}
                placeholder="Detailed product description"
                rows={4}
              />
              {errors.long_description && (
                <p className="text-sm text-destructive">{errors.long_description.message}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Product Media */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Product Media</h2>
          <div className="space-y-6">
            {/* Product Images */}
            <div className="space-y-2">
              <Label className="text-base">Product Images</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Upload product images. They will be automatically resized to 5 different sizes for optimal performance.
              </p>
              <ImageUpload
                type="image"
                maxFiles={5}
                productId={id}
                onUploadComplete={(files) => {
                  setProductImages(files);
                  // Extract image URLs for form submission
                  const imageUrls = files.map(f => f.variants?.medium || f.url).filter(Boolean);
                  setValue('images', imageUrls);
                }}
              />
            </div>

            {/* Product Videos */}
            <div className="space-y-2">
              <Label className="text-base">Product Videos</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Upload product demonstration videos (optional).
              </p>
              <ImageUpload
                type="video"
                maxFiles={2}
                productId={id}
                onUploadComplete={(files) => {
                  setProductVideos(files);
                  // Extract video URLs for form submission
                  const videoUrls = files.map(f => f.url).filter(Boolean);
                  setValue('video_urls', videoUrls);
                }}
              />
            </div>
          </div>
        </Card>

        {/* Product Type */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Product Type</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product_type">
                Product Type <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="product_type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">
                        Custom Product (Customer provides design/text)
                      </SelectItem>
                      <SelectItem value="template">
                        Ready-Made Template (Pre-designed, ready to print)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.product_type && (
                <p className="text-sm text-destructive">{errors.product_type.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {productType === 'custom'
                  ? 'Customer will customize this product with their own text, logo, or design'
                  : 'This product uses a pre-designed template that is ready to print'}
              </p>
            </div>

            {/* Template-specific fields */}
            {productType === 'template' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="template_file_url">
                    Template Design File URL
                  </Label>
                  <Input
                    id="template_file_url"
                    {...register('template_file_url')}
                    placeholder="https://cdn.example.com/templates/design.pdf"
                  />
                  {errors.template_file_url && (
                    <p className="text-sm text-destructive">{errors.template_file_url.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    URL to the print-ready design file (PDF, AI, etc.)
                  </p>
                </div>

                <div className="space-y-2">
                  <FormBuilder
                    value={templateFormFields}
                    onChange={setTemplateFormFields}
                  />
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm text-amber-900">
                    <strong>Template Products:</strong> These are pre-designed products like "Sale 50% Off Stickers" or "Grand Opening Banners" that don't require customer customization.
                  </p>
                </div>
              </>
            )}

            {/* Specifications & Pricing (All Products) */}
            <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="font-medium">Product Specifications</h3>
              <p className="text-xs text-muted-foreground">
                Select available options for this product. Prices are managed centrally in{' '}
                <a href="/products/specifications" className="text-blue-600 underline">
                  Specifications Management
                </a>
              </p>

              {/* Materials */}
              <div className="space-y-2">
                <Label>Available Materials</Label>
                <div className="grid grid-cols-2 gap-2">
                  {specificationsData?.materials?.map((spec) => (
                    <div key={spec.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`material_${spec.id}`}
                        checked={selectedMaterials.includes(spec.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMaterials([...selectedMaterials, spec.id]);
                          } else {
                            setSelectedMaterials(selectedMaterials.filter((id) => id !== spec.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor={`material_${spec.id}`} className="text-sm cursor-pointer">
                        {spec.name} (₹{spec.price_value}/{spec.unit || 'unit'})
                      </label>
                    </div>
                  ))}
                </div>
                {!specificationsData?.materials?.length && (
                  <p className="text-xs text-gray-500">
                    No materials available.{' '}
                    <a href="/products/specifications" className="text-blue-600 underline">
                      Add materials first
                    </a>
                  </p>
                )}
              </div>

              {/* Sizes */}
              <div className="space-y-2">
                <Label>Available Sizes</Label>
                <div className="grid grid-cols-2 gap-2">
                  {specificationsData?.sizes?.map((spec) => (
                    <div key={spec.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`size_${spec.id}`}
                        checked={selectedSizes.includes(spec.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSizes([...selectedSizes, spec.id]);
                          } else {
                            setSelectedSizes(selectedSizes.filter((id) => id !== spec.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor={`size_${spec.id}`} className="text-sm cursor-pointer">
                        {spec.name} (₹{spec.price_value})
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Finishes */}
              <div className="space-y-2">
                <Label>Available Finishes</Label>
                <div className="grid grid-cols-2 gap-2">
                  {specificationsData?.finishes?.map((spec) => (
                    <div key={spec.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`finish_${spec.id}`}
                        checked={selectedFinishes.includes(spec.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFinishes([...selectedFinishes, spec.id]);
                          } else {
                            setSelectedFinishes(selectedFinishes.filter((id) => id !== spec.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor={`finish_${spec.id}`} className="text-sm cursor-pointer">
                        {spec.name} ({spec.price_value}×)
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="space-y-2">
                <Label>Available Colors</Label>
                <div className="grid grid-cols-2 gap-2">
                  {specificationsData?.colors?.map((spec) => (
                    <div key={spec.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`color_${spec.id}`}
                        checked={selectedColors.includes(spec.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedColors([...selectedColors, spec.id]);
                          } else {
                            setSelectedColors(selectedColors.filter((id) => id !== spec.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor={`color_${spec.id}`} className="text-sm cursor-pointer">
                        {spec.name} ({spec.price_value}×)
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Print Sides */}
              <div className="space-y-2">
                <Label>Available Print Sides</Label>
                <div className="grid grid-cols-2 gap-2">
                  {specificationsData?.print_sides?.map((spec) => (
                    <div key={spec.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`print_side_${spec.id}`}
                        checked={selectedPrintSides.includes(spec.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPrintSides([...selectedPrintSides, spec.id]);
                          } else {
                            setSelectedPrintSides(selectedPrintSides.filter((id) => id !== spec.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor={`print_side_${spec.id}`} className="text-sm cursor-pointer">
                        {spec.name} ({spec.price_value}×)
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom-specific fields */}
            {productType === 'custom' && (
              <>
                <div className="flex items-center space-x-2">
                  <input
                    id="requires_customer_artwork"
                    type="checkbox"
                    {...register('requires_customer_artwork')}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="requires_customer_artwork" className="font-normal">
                    Customer must upload their own artwork file
                  </Label>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Custom Products:</strong> Examples include Business Cards (customer provides name, title, contact), Brochures (customer uploads their design), etc.
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Category & Pricing */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Category & Pricing</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <Controller
                name="category_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category_id && (
                <p className="text-sm text-destructive">{errors.category_id.message}</p>
              )}
            </div>

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
              <Label htmlFor="price_calculation_type">
                Price Calculation Type <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="price_calculation_type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="variant">Variant-based</SelectItem>
                      <SelectItem value="quantity_based">Quantity-based</SelectItem>
                      <SelectItem value="area_based">Area-based</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.price_calculation_type && (
                <p className="text-sm text-destructive">{errors.price_calculation_type.message}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Artwork Requirements */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Artwork Requirements</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="min_dpi">Minimum DPI</Label>
              <Input
                id="min_dpi"
                type="number"
                {...register('min_dpi')}
                placeholder="300"
              />
              {errors.min_dpi && (
                <p className="text-sm text-destructive">{errors.min_dpi.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="color_mode">Color Mode</Label>
              <Controller
                name="color_mode"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CMYK">CMYK</SelectItem>
                      <SelectItem value="RGB">RGB</SelectItem>
                      <SelectItem value="Both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="accepted_formats">Accepted File Formats</Label>
              <Input
                id="accepted_formats"
                {...register('accepted_formats')}
                placeholder="PDF,AI,PSD,EPS"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list of file formats
              </p>
            </div>

            <div className="flex items-center space-x-2 md:col-span-2">
              <input
                id="requires_bleed"
                type="checkbox"
                {...register('requires_bleed')}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="requires_bleed" className="font-normal">
                Requires Bleed
              </Label>
            </div>

            {requiresBleed && (
              <div className="space-y-2">
                <Label htmlFor="bleed_size_mm">Bleed Size (mm)</Label>
                <Input
                  id="bleed_size_mm"
                  type="number"
                  step="0.1"
                  {...register('bleed_size_mm')}
                  placeholder="3"
                />
                {errors.bleed_size_mm && (
                  <p className="text-sm text-destructive">{errors.bleed_size_mm.message}</p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Settings */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Settings</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                {...register('display_order')}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Higher numbers appear first
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  id="is_featured"
                  type="checkbox"
                  {...register('is_featured')}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="is_featured" className="font-normal">
                  Featured Product
                </Label>
              </div>

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
          </div>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(ROUTES.PRODUCTS)}
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
                {isEditMode ? 'Update Product' : 'Create Product'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
