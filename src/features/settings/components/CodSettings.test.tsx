import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CodSettings } from './CodSettings';
import * as api from '@/lib/api/codSettings';
import { parseCodAmounts } from '@/lib/api/codSettings';
import type { CodSettings as CodData } from '@/lib/api/codSettings';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn() }) }));
vi.mock('@/lib/api/codSettings', async (orig) => {
  const actual = await orig<typeof import('@/lib/api/codSettings')>();
  return { ...actual, getCodSettings: vi.fn(), updateCodSettings: vi.fn() };
});

const perms = { canViewSettings: true, canManageSettings: true };
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => perms }));

const mocked = vi.mocked(api);
const DATA: CodData = { id: '1', is_enabled: true, min_order_amount: 500, max_order_amount: 5000, updated_by_admin_id: '2', created_at: null, updated_at: null };

function renderCod() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(<QueryClientProvider client={qc}><CodSettings /></QueryClientProvider>);
}

const minInput = () => screen.findByLabelText('Minimum order amount (₹)');
const maxInput = () => screen.getByLabelText('Maximum order amount (₹)');
const saveBtn = () => screen.getByRole('button', { name: 'Save COD settings' });

beforeEach(() => {
  vi.clearAllMocks();
  perms.canViewSettings = true;
  perms.canManageSettings = true;
  mocked.getCodSettings.mockResolvedValue(DATA);
});

describe('parseCodAmounts', () => {
  it('maps blank to null and numbers through', () => {
    expect(parseCodAmounts({ min: '', max: ' ' })).toMatchObject({ min: null, max: null });
    expect(parseCodAmounts({ min: '0', max: '99.5' })).toMatchObject({ min: 0, max: 99.5, minError: undefined });
  });
  it('flags negatives, non-numbers and min > max', () => {
    expect(parseCodAmounts({ min: '-1', max: '' }).minError).toMatch(/negative/);
    expect(parseCodAmounts({ min: 'abc', max: '' }).minError).toMatch(/number/);
    expect(parseCodAmounts({ min: '10', max: '5' }).minError).toMatch(/greater/);
  });
});

describe('CodSettings', () => {
  it('shows helper text and loaded values', async () => {
    renderCod();
    expect(await minInput()).toHaveValue(500);
    expect(maxInput()).toHaveValue(5000);
    expect(screen.getByText(/final payable amount/)).toBeInTheDocument();
  });

  it('sends null (not NaN/0) for blank fields and toasts success', async () => {
    mocked.updateCodSettings.mockResolvedValue({ ...DATA, min_order_amount: null, max_order_amount: null });
    renderCod();
    fireEvent.change(await minInput(), { target: { value: '' } });
    fireEvent.change(maxInput(), { target: { value: '' } });
    fireEvent.click(saveBtn());
    await waitFor(() => expect(mocked.updateCodSettings).toHaveBeenCalledWith({ is_enabled: true, min_order_amount: null, max_order_amount: null }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('COD settings saved'));
  });

  it('blocks save and shows an error when min > max', async () => {
    renderCod();
    fireEvent.change(await minInput(), { target: { value: '9000' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/cannot be greater/);
    expect(saveBtn()).toBeDisabled();
    expect(mocked.updateCodSettings).not.toHaveBeenCalled();
  });

  it('ignores invalid hidden amounts when COD is switched off and keeps the saved values', async () => {
    mocked.updateCodSettings.mockResolvedValue({ ...DATA, is_enabled: false });
    renderCod();
    fireEvent.change(await minInput(), { target: { value: '9000' } });
    expect(saveBtn()).toBeDisabled();
    fireEvent.click(screen.getByLabelText('Enable COD'));
    await waitFor(() => expect(screen.queryByLabelText('Minimum order amount (₹)')).toBeNull());
    expect(saveBtn()).toBeEnabled();
    fireEvent.click(saveBtn());
    await waitFor(() => expect(mocked.updateCodSettings).toHaveBeenCalledWith({ is_enabled: false, min_order_amount: 500, max_order_amount: 5000 }));
  });

  it('blocks save on negative amounts', async () => {
    renderCod();
    fireEvent.change(await minInput(), { target: { value: '-5' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/negative/);
    expect(saveBtn()).toBeDisabled();
  });

  it('shows the backend 422 message inline and toasts an error', async () => {
    const msg = 'min_order_amount cannot be greater than max_order_amount';
    mocked.updateCodSettings.mockRejectedValue({ status: 422, message: msg });
    renderCod();
    fireEvent.change(await minInput(), { target: { value: '100' } });
    fireEvent.click(saveBtn());
    expect(await screen.findByTestId('cod-server-error')).toHaveTextContent(msg);
    expect(toast.error).toHaveBeenCalledWith(msg);
  });

  it('toasts a generic error for non-422 failures', async () => {
    mocked.updateCodSettings.mockRejectedValue({ status: 500, message: 'boom' });
    renderCod();
    fireEvent.change(await minInput(), { target: { value: '100' } });
    fireEvent.click(saveBtn());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to save COD settings'));
    expect(screen.queryByTestId('cod-server-error')).toBeNull();
  });

  it('toasts a permission message on save 403', async () => {
    mocked.updateCodSettings.mockRejectedValue({ status: 403, message: 'Forbidden' });
    renderCod();
    fireEvent.change(await minInput(), { target: { value: '100' } });
    fireEvent.click(saveBtn());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('You do not have permission to change COD settings'));
  });

  it('is read-only without settings.manage', async () => {
    perms.canManageSettings = false;
    renderCod();
    expect(await minInput()).toBeDisabled();
    expect(maxInput()).toBeDisabled();
    expect(screen.getByLabelText('Enable COD')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByRole('button', { name: 'Save COD settings' })).toBeNull();
  });

  it('shows no-access notice when GET returns 403', async () => {
    mocked.getCodSettings.mockRejectedValue({ status: 403, message: 'Forbidden' });
    renderCod();
    expect(await screen.findByText(/do not have permission to view COD settings/)).toBeInTheDocument();
  });

  it('does not fetch or render fields without settings.view', () => {
    perms.canViewSettings = false;
    renderCod();
    expect(screen.getByText(/do not have permission to view COD settings/)).toBeInTheDocument();
    expect(mocked.getCodSettings).not.toHaveBeenCalled();
  });

  it('hides amount inputs when COD is disabled', async () => {
    mocked.getCodSettings.mockResolvedValue({ ...DATA, is_enabled: false });
    renderCod();
    await screen.findByLabelText('Enable COD');
    await waitFor(() => expect(screen.queryByLabelText('Minimum order amount (₹)')).toBeNull());
  });
});
