/**
 * Specification Management Page
 * Centralized management for materials, sizes, finishes, colors, and print sides
 */

import { useState } from 'react';
import { toast } from 'sonner';
import {
  useGetSpecificationsByTypeQuery,
  useCreateSpecificationMutation,
  useUpdateSpecificationMutation,
  useDeleteSpecificationMutation,
} from '@/store/api/apiSlice';
import PageHeader from '@/components/common/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROUTES } from '@/constants/routes';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const SPEC_TYPES = [
  { value: 'material', label: 'Materials', description: 'Paper types, vinyl, canvas, etc.' },
  { value: 'size', label: 'Sizes', description: 'A4, A3, business card sizes, etc.' },
  { value: 'finish', label: 'Finishes', description: 'Glossy, matte, laminated, etc.' },
  { value: 'color', label: 'Colors', description: 'CMYK, B&W, Pantone, etc.' },
  { value: 'print_sides', label: 'Print Sides', description: 'Single or double sided' },
  { value: 'quantity_tier', label: 'Quantity Tiers', description: 'Bulk pricing tiers' },
];

const PRICE_TYPES = [
  { value: 'base_price', label: 'Base Price (₹)', description: 'Fixed price amount' },
  { value: 'multiplier', label: 'Multiplier (×)', description: 'Multiply final price' },
  { value: 'percentage', label: 'Percentage (%)', description: 'Percentage off/on' },
  { value: 'per_unit', label: 'Per Unit (₹/unit)', description: 'Price per unit' },
];

const SpecificationManagement = () => {
  const [activeTab, setActiveTab] = useState('material');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState(null);

  const { data: specsData, isLoading } = useGetSpecificationsByTypeQuery({ is_active: undefined });
  const [createSpec, { isLoading: isCreating }] = useCreateSpecificationMutation();
  const [updateSpec, { isLoading: isUpdating }] = useUpdateSpecificationMutation();
  const [deleteSpec] = useDeleteSpecificationMutation();

  const [formData, setFormData] = useState({
    type: 'material',
    name: '',
    code: '',
    description: '',
    price_type: 'per_unit',
    price_value: '',
    unit: '',
    is_active: true,
    display_order: 0,
  });

  const handleCreateSpec = async (e) => {
    e.preventDefault();
    try {
      await createSpec({
        ...formData,
        price_value: parseFloat(formData.price_value),
        display_order: parseInt(formData.display_order),
      }).unwrap();
      toast.success('Specification created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error.data?.detail || 'Failed to create specification');
    }
  };

  const handleUpdateSpec = async (e) => {
    e.preventDefault();
    try {
      await updateSpec({
        id: editingSpec.id,
        ...formData,
        price_value: parseFloat(formData.price_value),
        display_order: parseInt(formData.display_order),
      }).unwrap();
      toast.success('Specification updated successfully');
      setIsEditDialogOpen(false);
      setEditingSpec(null);
      resetForm();
    } catch (error) {
      toast.error(error.data?.detail || 'Failed to update specification');
    }
  };

  const handleDeleteSpec = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will remove it from all products.`)) {
      return;
    }
    try {
      await deleteSpec(id).unwrap();
      toast.success('Specification deleted successfully');
    } catch (error) {
      toast.error(error.data?.detail || 'Failed to delete specification');
    }
  };

  const openCreateDialog = (type) => {
    setFormData({ ...formData, type });
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (spec) => {
    setEditingSpec(spec);
    setFormData({
      type: spec.type,
      name: spec.name,
      code: spec.code,
      description: spec.description || '',
      price_type: spec.price_type,
      price_value: spec.price_value.toString(),
      unit: spec.unit || '',
      is_active: spec.is_active,
      display_order: spec.display_order,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'material',
      name: '',
      code: '',
      description: '',
      price_type: 'per_unit',
      price_value: '',
      unit: '',
      is_active: true,
      display_order: 0,
    });
  };

  const generateCode = (name) => {
    return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  };

  const handleNameChange = (name) => {
    setFormData({
      ...formData,
      name,
      code: generateCode(name),
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const renderSpecList = (type) => {
    const specs = specsData?.[`${type}s`] || [];

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {SPEC_TYPES.find((t) => t.value === type)?.description}
          </p>
          <Button onClick={() => openCreateDialog(type)}>
            <Plus className="mr-2 h-4 w-4" />
            Add {SPEC_TYPES.find((t) => t.value === type)?.label.slice(0, -1)}
          </Button>
        </div>

        {specs.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No {SPEC_TYPES.find((t) => t.value === type)?.label.toLowerCase()} yet.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => openCreateDialog(type)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First {SPEC_TYPES.find((t) => t.value === type)?.label.slice(0, -1)}
            </Button>
          </Card>
        ) : (
          <div className="grid gap-3">
            {specs.map((spec) => (
              <Card key={spec.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{spec.name}</h3>
                      {!spec.is_active && (
                        <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Code: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{spec.code}</code>
                      {spec.description && ` • ${spec.description}`}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <span className="font-medium text-primary">
                        {spec.price_type === 'base_price' && `₹${spec.price_value}`}
                        {spec.price_type === 'multiplier' && `${spec.price_value}×`}
                        {spec.price_type === 'percentage' && `${spec.price_value}%`}
                        {spec.price_type === 'per_unit' && `₹${spec.price_value}/${spec.unit || 'unit'}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({PRICE_TYPES.find((t) => t.value === spec.price_type)?.label})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(spec)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSpec(spec.id, spec.name)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSpecForm = (isEdit = false) => (
    <form onSubmit={isEdit ? handleUpdateSpec : handleCreateSpec} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g., 300gsm Art Card"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">
            Code <span className="text-destructive">*</span>
          </Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="auto-generated"
            required
          />
          <p className="text-xs text-muted-foreground">Auto-generated from name</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Optional description"
          rows={2}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="price_type">
            Price Type <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.price_type}
            onValueChange={(value) => setFormData({ ...formData, price_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRICE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {PRICE_TYPES.find((t) => t.value === formData.price_type)?.description}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price_value">
            Price Value <span className="text-destructive">*</span>
          </Label>
          <Input
            id="price_value"
            type="number"
            step="0.01"
            min="0"
            value={formData.price_value}
            onChange={(e) => setFormData({ ...formData, price_value: e.target.value })}
            placeholder="e.g., 5.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Input
            id="unit"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            placeholder="e.g., gsm, mm, sqft"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="display_order">Display Order</Label>
          <Input
            id="display_order"
            type="number"
            min="0"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="is_active">Status</Label>
          <Select
            value={formData.is_active ? 'active' : 'inactive'}
            onValueChange={(value) => setFormData({ ...formData, is_active: value === 'active' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Active
                </div>
              </SelectItem>
              <SelectItem value="inactive">
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-gray-600" />
                  Inactive
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isCreating || isUpdating}>
          {isCreating || isUpdating ? 'Saving...' : isEdit ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Specifications Management"
        description="Manage materials, sizes, finishes, colors, and pricing centrally. Price changes update all products automatically."
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Products', href: ROUTES.PRODUCTS },
          { label: 'Specifications' },
        ]}
      />

      <Card className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 w-full">
            {SPEC_TYPES.map((type) => (
              <TabsTrigger key={type.value} value={type.value}>
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {SPEC_TYPES.map((type) => (
            <TabsContent key={type.value} value={type.value} className="mt-6">
              {renderSpecList(type.value)}
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Create {SPEC_TYPES.find((t) => t.value === formData.type)?.label.slice(0, -1)}
            </DialogTitle>
            <DialogDescription>
              Add a new specification that can be used across all products.
            </DialogDescription>
          </DialogHeader>
          {renderSpecForm(false)}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Specification</DialogTitle>
            <DialogDescription>
              Update specification. Price changes will affect all products using this specification.
            </DialogDescription>
          </DialogHeader>
          {renderSpecForm(true)}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SpecificationManagement;
