/**
 * Category Management Page
 * Manage product categories in a tree view
 */

import { useState } from 'react';
import { useGetCategoriesQuery } from '@/store/api/apiSlice';
import PageHeader from '@/components/common/PageHeader';
import { ROUTES } from '@/constants/routes';
import { Plus, Edit, Trash2, ChevronRight, ChevronDown, FolderTree, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const CategoryItem = ({ category, level = 0, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          'flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-accent',
          level > 0 && 'ml-6'
        )}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn('p-1', !hasChildren && 'invisible')}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {expanded ? (
            <FolderOpen className="h-5 w-5 text-primary" />
          ) : (
            <Folder className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium">{category.name}</p>
            <p className="text-xs text-muted-foreground">
              {category.product_count || 0} products • /{category.slug}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(category)}
            className="rounded p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {expanded && hasChildren && (
        <div className="border-l border-border ml-5">
          {category.children.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CategoryManagement = () => {
  const { data: categoriesData, isLoading } = useGetCategoriesQuery({ include_inactive: true });

  const categories = categoriesData || [];

  const handleEdit = (category) => {
    console.log('Edit category:', category);
  };

  const handleDelete = (category) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      console.log('Delete category:', category);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Organize your products into categories"
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Products', href: ROUTES.PRODUCTS },
          { label: 'Categories' },
        ]}
      >
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </PageHeader>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-3">
            <FolderTree className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Category Tree</h3>
          </div>
        </div>
        <div className="p-4">
          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderTree className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">No categories yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by creating your first product category
              </p>
              <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                <Plus className="h-4 w-4" />
                Create First Category
              </button>
            </div>
          ) : (
            categories.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;
