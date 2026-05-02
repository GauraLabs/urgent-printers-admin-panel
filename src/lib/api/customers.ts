import type { Customer, CustomerWithDetails, CustomersListResponse, CustomerFilters, CustomerActivity } from '@/types';

function delay(ms = 400): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 400));
}

const NAMES = ['Rahul Sharma', 'Priya Singh', 'Amit Kumar', 'Sneha Patel', 'Vikram Rao', 'Neha Gupta', 'Arjun Mehta', 'Kavita Joshi', 'Suresh Iyer', 'Deepa Nair'];
const CITIES = ['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Ahmedabad', 'Kolkata'];

function makeCustomer(i: number): Customer {
  const name = NAMES[i % NAMES.length];
  return {
    id: `cust-${i + 1}`,
    name,
    email: `${name.toLowerCase().replace(' ', '.')}${i}@example.com`,
    phone: `+91 ${9800000000 + i}`,
    status: (['active', 'active', 'active', 'active', 'inactive', 'banned'] as const)[i % 6],
    avatar_url: null,
    total_orders: Math.floor(1 + (i * 7) % 25),
    total_spent: Math.floor(2000 + (i * 4127) % 80000),
    avg_order_value: Math.floor(1500 + (i * 317) % 8000),
    last_order_at: new Date(Date.now() - (i * 1000 * 60 * 60 * 24 * 3)).toISOString(),
    email_verified: i % 8 !== 0,
    joined_at: new Date(Date.now() - (i * 1000 * 60 * 60 * 24 * 30)).toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function getCustomers(filters: CustomerFilters = {}): Promise<CustomersListResponse> {
  await delay();
  const page = filters.page ?? 1;
  const pageSize = filters.page_size ?? 20;
  const total = 1847;
  const items = Array.from({ length: Math.min(pageSize, total - (page - 1) * pageSize) }, (_, i) =>
    makeCustomer((page - 1) * pageSize + i)
  );
  return { items, total, page, page_size: pageSize, total_pages: Math.ceil(total / pageSize) };
}

export async function getCustomer(id: string): Promise<CustomerWithDetails> {
  await delay();
  const i = parseInt(id.replace('cust-', '') || '1') - 1;
  return {
    ...makeCustomer(i),
    addresses: [
      {
        id: 'addr-1',
        name: NAMES[i % NAMES.length],
        phone: `+91 ${9800000000 + i}`,
        line1: `${i + 1}, MG Road`,
        line2: null,
        city: CITIES[i % CITIES.length],
        state: 'Karnataka',
        pincode: '560034',
        country: 'India',
        is_default: true,
      },
    ],
    notes: null,
    referral_source: 'Google',
  };
}

export async function getCustomerActivity(id: string): Promise<CustomerActivity[]> {
  await delay(300);
  return Array.from({ length: 10 }, (_, i) => ({
    id: `act-${i}`,
    type: (['order_placed', 'login', 'profile_updated', 'review_posted'] as const)[i % 4],
    description: ['Placed order ORD-2847', 'Logged in', 'Updated profile', 'Posted review for Business Cards'][i % 4],
    entity_id: i % 2 === 0 ? `ord-${2847 - i}` : null,
    entity_label: i % 2 === 0 ? `ORD-${2847 - i}` : null,
    created_at: new Date(Date.now() - i * 1000 * 60 * 60 * 48).toISOString(),
  }));
}

export async function updateCustomerStatus(id: string, status: 'active' | 'banned'): Promise<{ success: boolean }> {
  await delay();
  return { success: true };
}
