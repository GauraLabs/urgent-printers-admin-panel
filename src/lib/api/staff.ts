import type { AdminUser, ActivityLog } from '@/types';
import type { StaffListResponse, ActivityLogListResponse, CreateStaffRequest, UpdateStaffRequest } from '@/types/staff';

function delay(ms = 400): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 400));
}

export async function getStaff(): Promise<StaffListResponse> {
  await delay();
  const items: AdminUser[] = [
    { id: 'admin-1', email: 'admin@urgentprinters.com', name: 'Raj Kumar', role: 'super_admin', permissions: [], avatar: null, last_login: new Date().toISOString(), is_active: true, created_at: '2025-01-01T00:00:00Z' },
    { id: 'admin-2', email: 'ops@urgentprinters.com', name: 'Sunita Verma', role: 'operations_manager', permissions: [], avatar: null, last_login: new Date(Date.now() - 3600000).toISOString(), is_active: true, created_at: '2025-02-15T00:00:00Z' },
    { id: 'admin-3', email: 'support@urgentprinters.com', name: 'Kiran Patel', role: 'customer_support', permissions: [], avatar: null, last_login: new Date(Date.now() - 7200000).toISOString(), is_active: true, created_at: '2025-03-01T00:00:00Z' },
    { id: 'admin-4', email: 'catalogue@urgentprinters.com', name: 'Meera Joshi', role: 'catalogue_manager', permissions: [], avatar: null, last_login: null, is_active: false, created_at: '2025-04-01T00:00:00Z' },
  ];
  return { items, total: 4, page: 1, page_size: 20, total_pages: 1 };
}

export async function getStaffMember(id: string): Promise<AdminUser> {
  await delay(300);
  const list = await getStaff();
  return list.items.find((s) => s.id === id) ?? list.items[0];
}

export async function createStaffMember(data: CreateStaffRequest): Promise<AdminUser> {
  await delay();
  return { id: `admin-${Date.now()}`, email: data.email, name: data.name, role: data.role, permissions: data.permissions ?? [], avatar: null, last_login: null, is_active: true, created_at: new Date().toISOString() };
}

export async function updateStaffMember(id: string, data: UpdateStaffRequest): Promise<AdminUser> {
  await delay();
  return getStaffMember(id);
}

export async function deleteStaffMember(id: string): Promise<{ success: boolean }> {
  await delay();
  return { success: true };
}

export async function getActivityLog(filters: { page?: number; admin_id?: string; entity_type?: string } = {}): Promise<ActivityLogListResponse> {
  await delay();
  const items: ActivityLog[] = Array.from({ length: 20 }, (_, i) => ({
    id: `log-${i + 1}`,
    admin_id: `admin-${(i % 3) + 1}`,
    admin_name: ['Raj Kumar', 'Sunita Verma', 'Kiran Patel'][i % 3],
    admin_role: (['super_admin', 'operations_manager', 'customer_support'] as const)[i % 3],
    action: ['update_status', 'create_product', 'issue_refund', 'ban_customer', 'update_settings'][i % 5],
    entity_type: ['order', 'product', 'payment', 'customer', 'settings'][i % 5],
    entity_id: `entity-${i + 1}`,
    entity_label: [`ORD-${2900 - i}`, `Business Cards`, `PAY-${i}`, `Rahul Sharma`, `General Settings`][i % 5],
    before_value: null,
    after_value: { status: 'updated' },
    ip_address: '192.168.1.1',
    created_at: new Date(Date.now() - i * 1000 * 60 * 30).toISOString(),
  }));
  return { items, total: 4820, page: filters.page ?? 1, page_size: 20, total_pages: 241 };
}
