/**
 * RTK Query API Slice
 * Centralized API definitions with caching and automatic refetching
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Base query with auth header
const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Base query with re-auth
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token');

    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refresh_token: refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult?.data) {
        localStorage.setItem('access_token', refreshResult.data.access_token);
        result = await baseQuery(args, api, extraOptions);
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    } else {
      window.location.href = '/login';
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Users',
    'User',
    'Roles',
    'Products',
    'Product',
    'Categories',
    'Orders',
    'Order',
    'Coupons',
    'Coupon',
    'AuditLogs',
    'Dashboard',
    'Analytics',
    'Settings',
    'Invitations',
  ],
  endpoints: (builder) => ({
    // ========================================
    // Auth Endpoints
    // ========================================
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),

    // ========================================
    // Dashboard Endpoints
    // ========================================
    getDashboardStats: builder.query({
      query: () => '/admin/dashboard/stats',
      providesTags: ['Dashboard'],
    }),
    getRevenueChart: builder.query({
      query: ({ period = 'daily', days = 30 }) =>
        `/admin/dashboard/revenue-chart?period=${period}&days=${days}`,
      providesTags: ['Dashboard'],
    }),
    getOrdersByStatus: builder.query({
      query: () => '/admin/dashboard/orders-by-status',
      providesTags: ['Dashboard'],
    }),
    getTopProducts: builder.query({
      query: (limit = 10) => `/admin/dashboard/top-products?limit=${limit}`,
      providesTags: ['Dashboard'],
    }),
    getRecentOrders: builder.query({
      query: (limit = 10) => `/admin/dashboard/recent-orders?limit=${limit}`,
      providesTags: ['Dashboard', 'Orders'],
    }),

    // ========================================
    // User Management Endpoints
    // ========================================
    getUsers: builder.query({
      query: ({ page = 1, limit = 20, search = '', role = '' }) => {
        const params = new URLSearchParams({ page, limit });
        if (search) params.append('search', search);
        if (role) params.append('role', role);
        return `/admin/users?${params}`;
      },
      providesTags: ['Users'],
    }),
    getUser: builder.query({
      query: (id) => `/admin/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    createUser: builder.mutation({
      query: (userData) => ({
        url: '/admin/users',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['Users'],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...userData }) => ({
        url: `/admin/users/${id}`,
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }, 'Users'],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users'],
    }),

    // ========================================
    // Role Management Endpoints (RBAC)
    // ========================================
    getRoles: builder.query({
      query: ({ includePermissions = true } = {}) =>
        `/rbac/roles?include_permissions=${includePermissions}`,
      providesTags: ['Roles'],
    }),
    getRole: builder.query({
      query: (id) => `/rbac/roles/${id}`,
      providesTags: (result, error, id) => [{ type: 'Roles', id }],
    }),
    createRole: builder.mutation({
      query: (roleData) => ({
        url: '/rbac/roles',
        method: 'POST',
        body: roleData,
      }),
      invalidatesTags: ['Roles', 'Users'],
    }),
    updateRole: builder.mutation({
      query: ({ id, ...roleData }) => ({
        url: `/rbac/roles/${id}`,
        method: 'PUT',
        body: roleData,
      }),
      invalidatesTags: ['Roles', 'Users'],
    }),
    deleteRole: builder.mutation({
      query: (id) => ({
        url: `/rbac/roles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Roles', 'Users'],
    }),
    getPermissions: builder.query({
      query: () => '/rbac/permissions',
      providesTags: ['Roles'],
    }),
    assignRoleToUser: builder.mutation({
      query: ({ userId, roleName }) => ({
        url: `/rbac/users/${userId}/roles`,
        method: 'POST',
        body: { role_name: roleName },
      }),
      invalidatesTags: ['Users', 'Roles'],
    }),
    revokeRoleFromUser: builder.mutation({
      query: ({ userId, roleName }) => ({
        url: `/rbac/users/${userId}/roles/${roleName}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users', 'Roles'],
    }),

    // ========================================
    // Product Endpoints
    // ========================================
    getProducts: builder.query({
      query: ({ page = 1, limit = 20, search = '', category = '' }) => {
        const params = new URLSearchParams({ page, page_size: limit });
        if (search) params.append('search', search);
        if (category) params.append('category_slug', category);
        return `/products?${params}`;
      },
      providesTags: ['Products'],
    }),
    getProduct: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    createProduct: builder.mutation({
      query: (productData) => ({
        url: '/products',
        method: 'POST',
        body: productData,
      }),
      invalidatesTags: ['Products'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...productData }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body: productData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Product', id }, 'Products'],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Products'],
    }),

    // ========================================
    // Category Endpoints
    // ========================================
    getCategories: builder.query({
      query: () => '/products/categories/tree',
      providesTags: ['Categories'],
    }),
    createCategory: builder.mutation({
      query: (categoryData) => ({
        url: '/products/categories',
        method: 'POST',
        body: categoryData,
      }),
      invalidatesTags: ['Categories'],
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...categoryData }) => ({
        url: `/products/categories/${id}`,
        method: 'PUT',
        body: categoryData,
      }),
      invalidatesTags: ['Categories'],
    }),

    // ========================================
    // Order Endpoints
    // ========================================
    getOrders: builder.query({
      query: ({ page = 1, limit = 20, status = '', search = '' }) => {
        const params = new URLSearchParams({ page, limit });
        if (status) params.append('status', status);
        if (search) params.append('search', search);
        return `/admin/orders?${params}`;
      },
      providesTags: ['Orders'],
    }),
    getOrder: builder.query({
      query: (id) => `/admin/orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, status, reason, notes }) => ({
        url: `/admin/orders/${id}/status`,
        method: 'PATCH',
        body: { status, reason, notes },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Order', id },
        'Orders',
        'Dashboard',
      ],
    }),
    updateShippingDetails: builder.mutation({
      query: ({ id, ...shippingData }) => ({
        url: `/admin/orders/${id}/shipping`,
        method: 'PATCH',
        body: shippingData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Order', id }],
    }),

    // ========================================
    // Coupon Endpoints
    // ========================================
    getCoupons: builder.query({
      query: ({ page = 1, limit = 20, isActive = null, search = '' }) => {
        const params = new URLSearchParams({ page, limit });
        if (isActive !== null) params.append('is_active', isActive);
        if (search) params.append('search', search);
        return `/admin/coupons?${params}`;
      },
      providesTags: ['Coupons'],
    }),
    getCoupon: builder.query({
      query: (id) => `/admin/coupons/${id}`,
      providesTags: (result, error, id) => [{ type: 'Coupon', id }],
    }),
    createCoupon: builder.mutation({
      query: (couponData) => ({
        url: '/admin/coupons',
        method: 'POST',
        body: couponData,
      }),
      invalidatesTags: ['Coupons'],
    }),
    updateCoupon: builder.mutation({
      query: ({ id, ...couponData }) => ({
        url: `/admin/coupons/${id}`,
        method: 'PUT',
        body: couponData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Coupon', id }, 'Coupons'],
    }),
    deleteCoupon: builder.mutation({
      query: (id) => ({
        url: `/admin/coupons/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Coupons'],
    }),
    getCouponUsage: builder.query({
      query: (id) => `/admin/coupons/${id}/usage`,
      providesTags: (result, error, id) => [{ type: 'Coupon', id }],
    }),

    // ========================================
    // Audit Log Endpoints
    // ========================================
    getAuditLogs: builder.query({
      query: ({ page = 1, limit = 50, action = '', userId = '', dateFrom = '', dateTo = '', status = '' }) => {
        const params = new URLSearchParams({ page, page_size: limit });
        if (action) params.append('action', action);
        if (userId) params.append('user_id', userId);
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        if (status) params.append('status', status);
        return `/admin/audit-logs?${params}`;
      },
      providesTags: ['AuditLogs'],
    }),

    // ========================================
    // Analytics Endpoints
    // ========================================
    getSalesAnalytics: builder.query({
      query: ({ period = '30d' }) => `/admin/analytics/sales?period=${period}`,
      providesTags: ['Analytics'],
    }),
    getUserAnalytics: builder.query({
      query: ({ period = '30d' }) => `/admin/analytics/users?period=${period}`,
      providesTags: ['Analytics'],
    }),

    // ========================================
    // Invitation Endpoints
    // ========================================
    getInvitations: builder.query({
      query: ({ page = 1, limit = 20, status = '' }) => {
        const params = new URLSearchParams({ page, limit });
        if (status) params.append('status', status);
        return `/admin/invitations?${params}`;
      },
      providesTags: ['Invitations'],
    }),
    createInvitation: builder.mutation({
      query: (invitationData) => ({
        url: '/admin/invitations',
        method: 'POST',
        body: invitationData,
      }),
      invalidatesTags: ['Invitations'],
    }),
    cancelInvitation: builder.mutation({
      query: (id) => ({
        url: `/admin/invitations/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: ['Invitations'],
    }),
    deleteInvitation: builder.mutation({
      query: (id) => ({
        url: `/admin/invitations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Invitations'],
    }),
  }),
});

// Export hooks
export const {
  // Auth
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,

  // Dashboard
  useGetDashboardStatsQuery,
  useGetRevenueChartQuery,
  useGetOrdersByStatusQuery,
  useGetTopProductsQuery,
  useGetRecentOrdersQuery,

  // Users
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,

  // Roles
  useGetRolesQuery,
  useGetRoleQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetPermissionsQuery,
  useAssignRoleToUserMutation,
  useRevokeRoleFromUserMutation,

  // Products
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,

  // Categories
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,

  // Orders
  useGetOrdersQuery,
  useGetOrderQuery,
  useUpdateOrderStatusMutation,
  useUpdateShippingDetailsMutation,

  // Coupons
  useGetCouponsQuery,
  useGetCouponQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
  useGetCouponUsageQuery,

  // Audit Logs
  useGetAuditLogsQuery,

  // Analytics
  useGetSalesAnalyticsQuery,
  useGetUserAnalyticsQuery,

  // Invitations
  useGetInvitationsQuery,
  useCreateInvitationMutation,
  useCancelInvitationMutation,
  useDeleteInvitationMutation,
} = apiSlice;
