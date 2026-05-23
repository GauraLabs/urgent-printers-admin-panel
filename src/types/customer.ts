export type CustomerStatus = 'active' | 'banned' | 'inactive';

export interface CustomerAddress {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: CustomerStatus;
  avatar_url: string | null;
  total_orders: number;
  total_spent: number;
  avg_order_value: number;
  last_order_at: string | null;
  email_verified: boolean;
  joined_at: string;
  updated_at: string;
}

export interface CustomerWithDetails extends Customer {
  addresses: CustomerAddress[];
  notes: string | null;
  referral_source: string | null;
}

export interface CustomerActivity {
  id: string;
  type: 'order_placed' | 'order_cancelled' | 'review_posted' | 'login' | 'profile_updated' | 'address_added';
  description: string;
  entity_id: string | null;
  entity_label: string | null;
  created_at: string;
}

export interface CustomersListResponse {
  items: Customer[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CustomerFilters {
  status?: CustomerStatus;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}
