/**
 * Tag Management Page
 * Manage product tags organized by categories
 */

import { useMemo, useState } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import {
  useGetTagsQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
} from '@/store/api/apiSlice';
import PageHeader from '@/components/common/PageHeader';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ROUTES } from '@/constants/routes';
import { Plus, Edit, Trash2, Tag as TagIcon } from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const TAG_CATEGORIES = [
  { value: 'industry', label: 'Industry' },
  { value: 'style', label: 'Style' },
  { value: 'occasion', label: 'Occasion' },
  { value: 'material', label: 'Material' },
  { value: 'other', label: 'Other' },
];

const TagManagement = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: tags, isLoading } = useGetTagsQuery({ category: categoryFilter === 'all' ? '' : categoryFilter });
  const [createTag] = useCreateTagMutation();
  const [updateTag] = useUpdateTagMutation();
  const [deleteTag] = useDeleteTagMutation();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'industry',
    description: '',
  });

  const handleCreate = () => {
    setEditingTag(null);
    setFormData({
      name: '',
      slug: '',
      category: 'industry',
      description: '',
    });
    setIsFormOpen(true);
  };

  const handleEdit = (tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      slug: tag.slug,
      category: tag.category,
      description: tag.description || '',
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (tagId, tagName) => {
    if (window.confirm(`Are you sure you want to delete the tag "${tagName}"?`)) {
      try {
        await deleteTag(tagId).unwrap();
        toast.success('Tag deleted successfully');
      } catch (error) {
        toast.error(error.data?.detail || 'Failed to delete tag');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTag) {
        await updateTag({ id: editingTag.id, ...formData }).unwrap();
        toast.success('Tag updated successfully');
      } else {
        await createTag(formData).unwrap();
        toast.success('Tag created successfully');
      }
      setIsFormOpen(false);
      setFormData({
        name: '',
        slug: '',
        category: 'industry',
        description: '',
      });
    } catch (error) {
      console.error('Failed to save tag:', error);
      toast.error(error.data?.detail || 'Failed to save tag');
    }
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    }));
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Tag Name',
        size: 200,
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
              <TagIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">{row.original.slug}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        size: 120,
        Cell: ({ cell }) => {
          const category = TAG_CATEGORIES.find((c) => c.value === cell.getValue());
          return (
            <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              {category?.label || cell.getValue()}
            </span>
          );
        },
      },
      {
        accessorKey: 'description',
        header: 'Description',
        size: 300,
        Cell: ({ cell }) => (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {cell.getValue() || '-'}
          </p>
        ),
      },
      {
        accessorFn: (row) => row.product_count || 0,
        id: 'product_count',
        header: 'Products',
        size: 100,
        Cell: ({ cell }) => (
          <span className="text-sm font-medium">{cell.getValue()}</span>
        ),
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: tags || [],
    enableRowActions: true,
    positionActionsColumn: 'last',
    renderRowActions: ({ row }) => (
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleEdit(row.original)}
          className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleDelete(row.original.id, row.original.name)}
          className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    ),
    renderTopToolbarCustomActions: () => (
      <div className="flex items-center gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {TAG_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        title="Tag Management"
        description="Organize products with tags by category"
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Tags' },
        ]}
      >
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Tag
        </Button>
      </PageHeader>

      <MaterialReactTable table={table} />

      {/* Tag Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTag ? 'Edit Tag' : 'Create Tag'}
            </DialogTitle>
            <DialogDescription>
              {editingTag ? 'Update tag information and category' : 'Add a new tag to organize products'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Tag Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="e.g., Corporate"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="auto-generated-from-name"
                disabled={!!editingTag}
              />
              <p className="text-xs text-muted-foreground">
                {editingTag ? 'Slug cannot be changed after creation' : 'Auto-generated from tag name'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAG_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this tag"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingTag ? 'Update Tag' : 'Create Tag'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TagManagement;
