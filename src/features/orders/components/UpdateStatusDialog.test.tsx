import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UpdateStatusDialog } from './UpdateStatusDialog';

const mutateAsync = vi.fn();
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('sonner', () => ({ toast }));
vi.mock('../hooks/useOrders', () => ({ useUpdateOrderStatus: () => ({ mutateAsync, isPending: false }) }));
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) => (
    <select aria-label="Status" value={value} onChange={(e) => onValueChange(e.target.value)}>
      <option value="">Select</option>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => <option value={value}>{children}</option>,
}));

beforeEach(() => { mutateAsync.mockReset(); toast.success.mockReset(); toast.error.mockReset(); });

describe('UpdateStatusDialog', () => {
  it('sends the note with the status change', async () => {
    mutateAsync.mockResolvedValue({ success: true });
    render(<UpdateStatusDialog open onOpenChange={vi.fn()} orderId="9" orderNumber="UP-9" currentStatus="confirmed" />);
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'printing' } });
    fireEvent.change(screen.getByPlaceholderText(/internal note/), { target: { value: 'rush job' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update Status' }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync).toHaveBeenCalledWith({ id: '9', status: 'printing', trackingNumber: undefined, note: 'rush job' });
  });

  it('does not offer confirmed -> shipped', () => {
    render(<UpdateStatusDialog open onOpenChange={vi.fn()} orderId="9" orderNumber="UP-9" currentStatus="confirmed" />);
    expect(screen.queryByRole('option', { name: 'Shipped' })).toBeNull();
  });

  it('mark-shipped mode requires a tracking number and sends it', async () => {
    mutateAsync.mockResolvedValue({ success: true });
    render(<UpdateStatusDialog open onOpenChange={vi.fn()} orderId="9" orderNumber="UP-9" currentStatus="printing" initialStatus="shipped" requireTrackingForShipped />);
    fireEvent.click(screen.getByRole('button', { name: 'Update Status' }));
    expect(await screen.findByText('Enter the tracking number')).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Tracking number/), { target: { value: ' TRK123 ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update Status' }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync).toHaveBeenCalledWith({ id: '9', status: 'shipped', trackingNumber: 'TRK123', note: '' });
  });

  it.each([
    ['payment_required', "Order isn't paid."],
    ['tracking_number_in_use', 'This tracking number is already used by another order.'],
  ])('toasts %s', async (code, text) => {
    mutateAsync.mockRejectedValue({ status: 409, code, message: 'raw' });
    render(<UpdateStatusDialog open onOpenChange={vi.fn()} orderId="9" orderNumber="UP-9" currentStatus="placed" />);
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'confirmed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update Status' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(text));
  });
});
