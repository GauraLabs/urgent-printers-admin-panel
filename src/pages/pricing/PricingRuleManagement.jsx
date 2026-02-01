/**
 * Pricing Rule Management Page
 * Manage dynamic pricing rules and discounts
 */

import { useMemo, useState } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import {
  useGetPricingRulesQuery,
  useCreatePricingRuleMutation,
  useUpdatePricingRuleMutation,
  useDeletePricingRuleMutation,
  useTogglePricingRuleStatusMutation,
  useGetProductsQuery,
  useGetCategoriesQuery,
} from '@/store/api/apiSlice';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import StatusBadge from '@/components/common/StatusBadge';
import { ROUTES } from '@/constants/routes';
import { Plus, Edit, Trash2, Percent, Power } from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const PricingRuleManagement = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const { data: rules, isLoading } = useGetPricingRulesQuery({});
  const { data: productsData } = useGetProductsQuery({ page: 1, limit: 100 });
  const { data: categoriesData } = useGetCategoriesQuery();

  const [createRule] = useCreatePricingRuleMutation();
  const [updateRule] = useUpdatePricingRuleMutation();
  const [deleteRule] = useDeletePricingRuleMutation();
  const [toggleStatus] = useTogglePricingRuleStatusMutation();

  const [formData, setFormData] = useState({
    rule_type: 'quantity_based',
    discount_type: 'percentage',
    discount_value: 0,
    min_quantity: 1,
    max_quantity: undefined,
    product_id: '',
    category_id: '',
    valid_from: '',
    valid_until: '',
    priority: 0,
    is_active: true,
  });

  const products = productsData?.items || [];
  const categories = categoriesData?.categories || [];

  const handleCreate = () => {
    setEditingRule(null);
    setFormData({
      rule_type: 'quantity_based',
      discount_type: 'percentage',
      discount_value: 0,
      min_quantity: 1,
      max_quantity: undefined,
      product_id: '',
      category_id: '',
      valid_from: '',
      valid_until: '',
      priority: 0,
      is_active: true,
    });
    setIsFormOpen(true);
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      rule_type: rule.rule_type,
      discount_type: rule.discount_type,
      discount_value: rule.discount_value,
      min_quantity: rule.min_quantity || 1,
      max_quantity: rule.max_quantity || undefined,
      product_id: rule.product_id || '',
      category_id: rule.category_id || '',
      valid_from: rule.valid_from ? rule.valid_from.split('T')[0] : '',
      valid_until: rule.valid_until ? rule.valid_until.split('T')[0] : '',
      priority: rule.priority || 0,
      is_active: rule.is_active,
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (ruleId) => {
    if (window.confirm('Are you sure you want to delete this pricing rule?')) {
      try {
        await deleteRule(ruleId).unwrap();
        toast.success('Pricing rule deleted successfully');
      } catch (error) {
        toast.error(error.data?.detail || 'Failed to delete pricing rule');
      }
    }
  };

  const handleToggleStatus = async (ruleId, currentStatus) => {
    try {
      await toggleStatus({ id: ruleId, is_active: !currentStatus }).unwrap();
      toast.success(`Pricing rule ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error(error.data?.detail || 'Failed to toggle pricing rule status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        discount_value: Number(formData.discount_value),
        min_quantity: formData.min_quantity ? Number(formData.min_quantity) : undefined,
        max_quantity: formData.max_quantity ? Number(formData.max_quantity) : undefined,
        priority: Number(formData.priority),
        product_id: formData.product_id || undefined,
        category_id: formData.category_id || undefined,
        valid_from: formData.valid_from || undefined,
        valid_until: formData.valid_until || undefined,
      };

      if (editingRule) {
        await updateRule({ id: editingRule.id, ...payload }).unwrap();
        toast.success('Pricing rule updated successfully');
      } else {
        await createRule(payload).unwrap();
        toast.success('Pricing rule created successfully');
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error('Failed to save pricing rule:', error);
      toast.error(error.data?.detail || 'Failed to save pricing rule');
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'rule_type',
        header: 'Rule Type',
        size: 150,
        Cell: ({ cell }) => {
          const type = cell.getValue();
          const labels = {
            quantity_based: 'Quantity Based',
            product_specific: 'Product Specific',
            category_wide: 'Category Wide',
          };
          return (
            <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
              {labels[type] || type}
            </span>
          );
        },
      },
      {
        accessorFn: (row) => {
          if (row.rule_type === 'product_specific' && row.product) {
            return row.product.name;
          } else if (row.rule_type === 'category_wide' && row.category) {
            return row.category.name;
          }
          return 'All Products';
        },
        id: 'scope',
        header: 'Scope',
        size: 150,
      },
      {
        accessorFn: (row) => {
          const { discount_type, discount_value } = row;
          if (discount_type === 'percentage') {
            return `${discount_value}% off`;
          } else if (discount_type === 'fixed_amount') {
            return `₹${discount_value} off`;
          } else {
            return `₹${discount_value} fixed`;
          }
        },
        id: 'discount',
        header: 'Discount',
        size: 120,
      },
      {
        accessorFn: (row) => {
          if (row.min_quantity || row.max_quantity) {
            return `${row.min_quantity || 1} - ${row.max_quantity || '∞'}`;
          }
          return 'Any quantity';
        },
        id: 'quantity_range',
        header: 'Quantity Range',
        size: 120,
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        size: 80,
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        size: 100,
        Cell: ({ cell }) => (
          <StatusBadge status={cell.getValue() ? 'active' : 'inactive'} />
        ),
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: rules?.items || [],
    enableRowActions: true,
    positionActionsColumn: 'last',
    renderRowActions: ({ row }) => (
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleToggleStatus(row.original.id, row.original.is_active)}
          className={`rounded p-1.5 ${
            row.original.is_active
              ? 'text-muted-foreground hover:bg-accent hover:text-foreground'
              : 'text-green-600 hover:bg-green-50'
          }`}
          title={row.original.is_active ? 'Deactivate' : 'Activate'}
        >
          <Power className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleEdit(row.original)}
          className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleDelete(row.original.id)}
          className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    ),
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        borderRadius: '0.75rem',
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      },
    },
    muiTableHeadCellProps: {
      sx: {
        fontWeight: 600,
      },
    },
    muiTableBodyCellProps: {
      sx: {
        color: 'text.primary',
      },
    },
    state: {
      isLoading,
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing Rules"
        description="Configure dynamic pricing and discount rules"
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Pricing Rules' },
        ]}
      >
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Pricing Rule
        </Button>
      </PageHeader>

      <MaterialReactTable table={table} />

      {/* Pricing Rule Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Edit Pricing Rule' : 'Create Pricing Rule'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rule Configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Rule Configuration</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rule_type">
                    Rule Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.rule_type}
                    onValueChange={(value) => setFormData({ ...formData, rule_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quantity_based">Quantity Based</SelectItem>
                      <SelectItem value="product_specific">Product Specific</SelectItem>
                      <SelectItem value="category_wide">Category Wide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_type">
                    Discount Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed_amount">Fixed Amount (₹)</SelectItem>
                      <SelectItem value="price_override">Price Override</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="discount_value">
                    Discount Value <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.discount_type === 'percentage' && 'Percentage discount (e.g., 10 for 10%)'}
                    {formData.discount_type === 'fixed_amount' && 'Fixed amount discount in ₹'}
                    {formData.discount_type === 'price_override' && 'Override price in ₹'}
                  </p>
                </div>
              </div>
            </div>

            {/* Scope */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Scope</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {formData.rule_type === 'product_specific' && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="product_id">Product</Label>
                    <Select
                      value={formData.product_id}
                      onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.rule_type === 'category_wide' && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="category_id">Category</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
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
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="min_quantity">Min Quantity</Label>
                  <Input
                    id="min_quantity"
                    type="number"
                    value={formData.min_quantity}
                    onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_quantity">Max Quantity</Label>
                  <Input
                    id="max_quantity"
                    type="number"
                    value={formData.max_quantity || ''}
                    onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
                    placeholder="No limit"
                  />
                </div>
              </div>
            </div>

            {/* Validity */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Validity Period</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="valid_from">Valid From</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valid_until">Valid Until</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Settings</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher values = higher priority
                  </p>
                </div>

                <div className="flex items-center space-x-2 pt-8">
                  <input
                    id="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="is_active" className="font-normal">
                    Active
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingRule ? 'Update Rule' : 'Create Rule'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingRuleManagement;
