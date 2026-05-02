import type { Role } from '@/types';

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  operations_manager: 'Operations Manager',
  customer_support: 'Customer Support',
  catalogue_manager: 'Catalogue Manager',
  finance: 'Finance',
  marketing: 'Marketing',
};

export const ROLE_COLORS: Record<Role, string> = {
  super_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  operations_manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  customer_support: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  catalogue_manager: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  finance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  marketing: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
};

export const ALL_ROLES: Role[] = [
  'super_admin',
  'operations_manager',
  'customer_support',
  'catalogue_manager',
  'finance',
  'marketing',
];
