import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StaffForm } from './StaffForm';

const createAsync = vi.fn();
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('sonner', () => ({ toast }));
vi.mock('../hooks/useStaff', () => ({
  useCreateStaff: () => ({ mutateAsync: createAsync, isPending: false }),
  useUpdateStaff: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('./PermissionEditor', () => ({ PermissionEditor: () => null }));

function fill() {
  fireEvent.change(screen.getByPlaceholderText('Raj Kumar'), { target: { value: 'Asha' } });
  fireEvent.change(screen.getByPlaceholderText('raj@urgentprinters.com'), { target: { value: 'asha@example.com' } });
}

beforeEach(() => { createAsync.mockReset(); createAsync.mockResolvedValue({}); toast.success.mockReset(); });

describe('StaffForm create', () => {
  it('invites by email without a password by default', async () => {
    render(<StaffForm onSuccess={vi.fn()} onCancel={vi.fn()} />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Send Invite' }));
    await waitFor(() => expect(createAsync).toHaveBeenCalled());
    expect(createAsync.mock.calls[0][0]).not.toHaveProperty('password');
  });

  it('enforces 12 characters when setting a password now', async () => {
    render(<StaffForm onSuccess={vi.fn()} onCancel={vi.fn()} />);
    fill();
    fireEvent.click(screen.getByLabelText('Set a password now'));
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Member' }));
    expect(await screen.findByText('Min 12 characters')).toBeInTheDocument();
    expect(createAsync).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'a-long-enough-pw1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Member' }));
    await waitFor(() => expect(createAsync).toHaveBeenCalled());
    expect(createAsync.mock.calls[0][0]).toMatchObject({ password: 'a-long-enough-pw1' });
  });
});
