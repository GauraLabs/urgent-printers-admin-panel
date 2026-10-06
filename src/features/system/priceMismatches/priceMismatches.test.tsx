import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PriceMismatch, PriceMismatchFilters } from '@/lib/api/priceMismatches';
import { CauseBadge } from './CauseBadge';
import { CAUSE_META } from './causes';
import { PriceMismatchDrawer } from './PriceMismatchDrawer';
import { PriceMismatchTable } from './PriceMismatchTable';
import { PriceMismatchesView } from './PriceMismatchesView';
import { formatIst } from '@/lib/utils/istDate';
import { formatSignedMoney, diffClass, diffLabel } from './format';

const mocks = vi.hoisted(() => ({
  role: 'super_admin' as string,
  user: { id: '1', role: 'super_admin', permissions: [] as string[] } as { id: string; role: string; permissions: string[] } | null,
  resolve: vi.fn(),
  lastFilters: null as unknown,
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('next/link', () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));
vi.mock('@/store/authStore', () => ({
  useAuthStore: (sel: (s: { user: unknown }) => unknown) => sel({ user: mocks.user }),
}));
vi.mock('@/lib/api/priceMismatches', async (orig) => {
  const actual = await orig<typeof import('@/lib/api/priceMismatches')>();
  return {
    ...actual,
    getPriceMismatches: vi.fn(async (f: PriceMismatchFilters) => {
      mocks.lastFilters = f;
      return { items: [ITEM, { ...ITEM, id: '2', product_id: null, product_slug: null, diff_total: null }], total: 2, offset: 0, limit: 25 };
    }),
    getPriceMismatchSummary: vi.fn(async () => ({
      by_cause: { product_updated: 1, discount_window_boundary: 2, price_changed_at_checkout: 3, unexplained: 4 },
      unexplained_unresolved: 4, last_unexplained_at: '2026-10-03T08:15:00Z',
    })),
    resolvePriceMismatch: (...a: unknown[]) => mocks.resolve(...a),
  };
});

const ITEM: PriceMismatch = {
  id: '1', created_at: '2026-10-03T08:15:00Z', stage: 'preview', user_id: '3', product_id: '4',
  product_slug: 'premium-cards', quantity: 500, options: { paper: 7 },
  client_unit: 1.5, server_unit: 1.6, client_mrp: null, server_mrp: 2, client_total: 750, server_total: 800, diff_total: -50,
  likely_cause: 'unexplained', context: { user_agent: 'UA-String', added_at: '2026-10-02T10:00:00Z', added_at_source: 'client' },
  resolved_at: null, resolved_by: null, note: null,
};

function wrap(ui: React.ReactElement) {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  mocks.user = { id: '1', role: 'super_admin', permissions: [] };
  mocks.resolve.mockReset();
  mocks.resolve.mockResolvedValue(ITEM);
});

describe('cause badges and help text', () => {
  it.each(Object.entries(CAUSE_META))('%s renders label', (cause, meta) => {
    wrap(<CauseBadge cause={cause as PriceMismatch['likely_cause']} />);
    expect(screen.getByText(meta.label)).toBeInTheDocument();
  });
  it('has the specified help lines', () => {
    expect(CAUSE_META.product_updated.help).toMatch(/admin changed the price after the item was added/);
    expect(CAUSE_META.discount_window_boundary.help).toMatch(/sale started or ended/);
    expect(CAUSE_META.price_changed_at_checkout.help).toMatch(/refused and the customer re-confirmed/);
    expect(CAUSE_META.unexplained.help).toMatch(/calculation bug, investigate/);
  });
  it('makes unexplained visually distinct', () => {
    expect(CAUSE_META.unexplained.badgeCls).toContain('font-semibold');
    expect(CAUSE_META.product_updated.badgeCls).not.toContain('font-semibold');
  });
});

describe('IST formatting', () => {
  it('shows IST wall clock with label', () => {
    expect(formatIst('2026-10-03T20:00:00Z')).toBe('2026-10-04 01:30 IST');
  });
  it('table header and cells are IST', async () => {
    wrap(<PriceMismatchTable />);
    expect(screen.getByText('Time (IST)')).toBeInTheDocument();
    expect(await screen.findAllByText('2026-10-03 13:45 IST')).toHaveLength(2);
  });
  it('signs diffs', () => {
    expect(formatSignedMoney(-50)).toBe('-₹50');
    expect(formatSignedMoney(50)).toBe('+₹50');
    expect(formatSignedMoney(null)).toBe('—');
  });
});

describe('diff label and colour', () => {
  it('labels negative as lower and positive as higher', () => {
    expect(diffLabel(-50)).toBe('Shown ₹50 lower than charged');
    expect(diffLabel(50)).toBe('Shown ₹50 higher than charged');
    expect(diffLabel(0)).toBeNull();
    expect(diffLabel(null)).toBeNull();
  });
  it('negative is red, positive is amber', () => {
    expect(diffClass(-1)).toContain('red');
    expect(diffClass(1)).toContain('amber');
  });
  it('drawer shows the label', () => {
    wrap(<PriceMismatchDrawer item={ITEM} onClose={vi.fn()} />);
    expect(screen.getByText('Shown ₹50 lower than charged')).toBeInTheDocument();
  });
});

describe('added_at source in drawer', () => {
  it.each([
    ['client', '2 Oct, 15:30 IST (from browser)'],
    ['server_cart', '2 Oct, 15:30 IST (from server cart)'],
    [null, '2 Oct, 15:30 IST (unknown)'],
  ] as const)('%s', (source, text) => {
    wrap(<PriceMismatchDrawer item={{ ...ITEM, context: { ...ITEM.context, added_at_source: source } }} onClose={vi.fn()} />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});

describe('table', () => {
  it('queries with default filters (unexplained, unresolved)', async () => {
    wrap(<PriceMismatchTable />);
    await screen.findAllByText('Unexplained');
    expect(mocks.lastFilters).toMatchObject({ cause: 'unexplained', resolved: 'unresolved', stage: 'all', offset: 0 });
  });
  it('links the slug to the product edit page only when product_id exists', async () => {
    wrap(<PriceMismatchTable />);
    const link = await screen.findByRole('link', { name: 'premium-cards' });
    expect(link).toHaveAttribute('href', '/products/4');
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
});

describe('resolve flow', () => {
  it('marks resolved with a note', async () => {
    const onClose = vi.fn();
    wrap(<PriceMismatchDrawer item={ITEM} onClose={onClose} />);
    expect(screen.getByText('UA-String')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Note/), { target: { value: 'rounding' } });
    fireEvent.click(screen.getByRole('button', { name: 'Mark resolved' }));
    await waitFor(() => expect(mocks.resolve).toHaveBeenCalledWith('1', { resolved: true, note: 'rounding' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
  it('sends note "" when an existing note is emptied', async () => {
    wrap(<PriceMismatchDrawer item={{ ...ITEM, note: 'old' }} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Note/), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Mark resolved' }));
    await waitFor(() => expect(mocks.resolve).toHaveBeenCalledWith('1', { resolved: true, note: '' }));
  });
  it('omits the note when it was not touched', async () => {
    wrap(<PriceMismatchDrawer item={{ ...ITEM, note: 'old' }} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark resolved' }));
    await waitFor(() => expect(mocks.resolve).toHaveBeenCalledWith('1', { resolved: true }));
  });
  it('offers Unresolve for a resolved item', async () => {
    const resolved: PriceMismatch = { ...ITEM, resolved_at: '2026-10-03T12:00:00Z', resolved_by: { id: '2', name: 'Asha' } };
    wrap(<PriceMismatchDrawer item={resolved} onClose={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Mark resolved' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Unresolve' }));
    await waitFor(() => expect(mocks.resolve).toHaveBeenCalledWith('1', { resolved: false }));
  });
});

describe('resolve controls gating', () => {
  it('hides Mark resolved and Unresolve for system.view only, still showing the record', () => {
    mocks.user = { id: '2', role: 'operations_manager', permissions: ['system.view'] };
    wrap(<PriceMismatchDrawer item={ITEM} onClose={vi.fn()} />);
    expect(screen.getByText('UA-String')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark resolved' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Unresolve' })).toBeNull();
    expect(screen.queryByLabelText(/Note/)).toBeNull();
  });
  it('shows controls for system.manage', () => {
    mocks.user = { id: '2', role: 'operations_manager', permissions: ['system.view', 'system.manage'] };
    wrap(<PriceMismatchDrawer item={ITEM} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Mark resolved' })).toBeInTheDocument();
  });
});

describe('multi-item order_create', () => {
  const multi: PriceMismatch = { ...ITEM, stage: 'order_create', product_id: null, product_slug: null, quantity: null, options: {} };
  it('renders Multiple items in the drawer', () => {
    wrap(<PriceMismatchDrawer item={multi} onClose={vi.fn()} />);
    expect(screen.getAllByText('Multiple items').length).toBeGreaterThanOrEqual(2);
  });
  it('renders null option values as a dash', () => {
    wrap(<PriceMismatchDrawer item={{ ...ITEM, options: { finish_id: null } }} onClose={vi.fn()} />);
    expect(screen.getByText('finish_id')).toBeInTheDocument();
    expect(screen.queryByText('null')).toBeNull();
  });
});

describe('summary labels', () => {
  it('labels windowed vs all-time figures', async () => {
    wrap(<PriceMismatchesView />);
    expect(await screen.findAllByText('Last 7 days')).not.toHaveLength(0);
    expect(await screen.findByText(/Open \(all time\)/)).toBeInTheDocument();
    expect(screen.getByText(/Last unexplained \(all time\)/)).toBeInTheDocument();
  });
});

describe('permission gating', () => {
  it('shows the view for system.view', async () => {
    mocks.user = { id: '2', role: 'operations_manager', permissions: ['system.view'] };
    wrap(<PriceMismatchesView />);
    expect((await screen.findAllByText('Last 7 days')).length).toBeGreaterThan(0);
  });
  it('hides the view without system.view', () => {
    mocks.user = { id: '3', role: 'customer_support', permissions: ['orders.view'] };
    wrap(<PriceMismatchesView />);
    expect(screen.queryByText('Last 7 days')).toBeNull();
    expect(screen.getByText(/do not have permission/)).toBeInTheDocument();
  });
});
