import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bulkMoveProductsToCategory, getCategory, updateCategory } from './categories';
import { getProducts } from './products';
import * as client from './client';

vi.mock('./client');
const mocked = vi.mocked(client);

beforeEach(() => vi.clearAllMocks());

describe('categories API', () => {
  it('normalises ids and defaults new fields for older payloads', async () => {
    mocked.get.mockResolvedValue({ id: 4, parent_id: 2, name: 'Essentials', product_count: 7, image_keys: [], images: [] });
    const c = await getCategory('4');
    expect(c).toMatchObject({ id: '4', parent_id: '2', faqs: [], noindex: false, total_product_count: 7, children_count: 0, path: 'Essentials' });
  });

  it('normalises ancestors', async () => {
    mocked.get.mockResolvedValue({
      id: 4, parent_id: 2, name: 'E', product_count: 1, image_keys: [], images: [],
      ancestors: [{ id: 2, name: 'Wedding', slug: 'wedding' }], path: 'Wedding > E', total_product_count: 1, children_count: 0,
    });
    const c = await getCategory('4');
    expect(c.ancestors).toEqual([{ id: '2', name: 'Wedding', slug: 'wedding' }]);
  });

  it('forwards an explicit null parent_id on PATCH', async () => {
    mocked.patch.mockResolvedValue({ id: 4, parent_id: null, name: 'E', product_count: 0, image_keys: [], images: [] });
    await updateCategory('4', { parent_id: null, faqs: [] });
    expect(mocked.patch).toHaveBeenCalledWith('/admin/categories/4', { parent_id: null, faqs: [] });
  });

  it('bulk move sends numeric ids and normalises the result', async () => {
    mocked.patch.mockResolvedValue({ category_id: 5, moved: 1, unchanged: 1, moved_product_ids: [10] });
    const res = await bulkMoveProductsToCategory(['10', '11'], '5');
    expect(mocked.patch).toHaveBeenCalledWith('/admin/products/bulk-category', { product_ids: [10, 11], category_id: 5 });
    expect(res).toEqual({ category_id: '5', moved: 1, unchanged: 1, moved_product_ids: ['10'] });
  });
});

describe('products list category filter', () => {
  it('includes descendants when filtering by category', async () => {
    mocked.get.mockResolvedValue({ items: [], page: 1, page_size: 20, total: 0, total_pages: 0 });
    await getProducts({ category_id: '2' });
    expect(mocked.get).toHaveBeenCalledWith('/admin/products', expect.objectContaining({ category_id: 2, include_descendants: true }));
  });
  it('omits it without a category', async () => {
    mocked.get.mockResolvedValue({ items: [], page: 1, page_size: 20, total: 0, total_pages: 0 });
    await getProducts({});
    expect(mocked.get.mock.calls[0][1]).not.toHaveProperty('include_descendants');
  });
});
