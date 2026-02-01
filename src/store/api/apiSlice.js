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
    'ProductVariants',
    'ProductVariant',
    'Categories',
    'Category',
    'Tags',
    'Tag',
    'PricingRules',
    'PricingRule',
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
    // Admin Product Endpoints
    // ========================================
    getProducts: builder.query({
      query: ({ page = 1, limit = 20, search = '', category = '', is_active }) => {
        const params = new URLSearchParams({ page, page_size: limit });
        if (search) params.append('search', search);
        if (category) params.append('category_id', category);
        if (is_active !== undefined) params.append('is_active', is_active);
        return `/admin/products?${params}`;
      },
      providesTags: ['Products'],
    }),
    getProduct: builder.query({
      query: (id) => `/admin/products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    createProduct: builder.mutation({
      query: (productData) => ({
        url: '/admin/products',
        method: 'POST',
        body: productData,
      }),
      invalidatesTags: ['Products'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...productData }) => ({
        url: `/admin/products/${id}`,
        method: 'PUT',
        body: productData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Product', id }, 'Products'],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/admin/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Products'],
    }),
    activateProduct: builder.mutation({
      query: (id) => ({
        url: `/admin/products/${id}/activate`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Product', id }, 'Products'],
    }),
    bulkDeleteProducts: builder.mutation({
      query: (productIds) => ({
        url: '/admin/products/bulk-delete',
        method: 'POST',
        body: { product_ids: productIds },
      }),
      invalidatesTags: ['Products'],
    }),

    // ========================================
    // Admin Product Variant Endpoints
    // ========================================
    getProductVariants: builder.query({
      query: (productId) => `/admin/products/${productId}/variants`,
      providesTags: (result, error, productId) => [
        { type: 'ProductVariants', productId },
        'ProductVariants',
      ],
    }),
    getProductVariant: builder.query({
      query: ({ productId, variantId }) => `/admin/products/${productId}/variants/${variantId}`,
      providesTags: (result, error, { variantId }) => [{ type: 'ProductVariant', id: variantId }],
    }),
    createProductVariant: builder.mutation({
      query: ({ productId, ...variantData }) => ({
        url: `/admin/products/${productId}/variants`,
        method: 'POST',
        body: variantData,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'ProductVariants', productId },
        { type: 'Product', id: productId },
      ],
    }),
    updateProductVariant: builder.mutation({
      query: ({ productId, variantId, ...variantData }) => ({
        url: `/admin/products/${productId}/variants/${variantId}`,
        method: 'PUT',
        body: variantData,
      }),
      invalidatesTags: (result, error, { productId, variantId }) => [
        { type: 'ProductVariant', id: variantId },
        { type: 'ProductVariants', productId },
        { type: 'Product', id: productId },
      ],
    }),
    deleteProductVariant: builder.mutation({
      query: ({ productId, variantId }) => ({
        url: `/admin/products/${productId}/variants/${variantId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'ProductVariants', productId },
        { type: 'Product', id: productId },
      ],
    }),
    setDefaultVariant: builder.mutation({
      query: ({ productId, variantId }) => ({
        url: `/admin/products/${productId}/variants/${variantId}/set-default`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'ProductVariants', productId },
        { type: 'Product', id: productId },
      ],
    }),
    bulkCreateVariants: builder.mutation({
      query: ({ productId, variants }) => ({
        url: `/admin/products/${productId}/variants/bulk-create`,
        method: 'POST',
        body: variants,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'ProductVariants', productId },
        { type: 'Product', id: productId },
      ],
    }),

    // ========================================
    // Admin Category Endpoints
    // ========================================
    getCategories: builder.query({
      query: ({ include_inactive = true } = {}) => {
        const params = new URLSearchParams();
        if (include_inactive !== undefined) params.append('include_inactive', include_inactive);
        return `/admin/categories?${params}`;
      },
      providesTags: ['Categories'],
    }),
    getCategory: builder.query({
      query: (id) => `/admin/categories/${id}`,
      providesTags: (result, error, id) => [{ type: 'Category', id }],
    }),
    createCategory: builder.mutation({
      query: (categoryData) => ({
        url: '/admin/categories',
        method: 'POST',
        body: categoryData,
      }),
      invalidatesTags: ['Categories'],
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...categoryData }) => ({
        url: `/admin/categories/${id}`,
        method: 'PUT',
        body: categoryData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Category', id }, 'Categories'],
    }),
    deleteCategory: builder.mutation({
      query: ({ id, force = false }) => ({
        url: `/admin/categories/${id}?force=${force}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Categories'],
    }),
    moveCategory: builder.mutation({
      query: ({ id, new_parent_id }) => ({
        url: `/admin/categories/${id}/move`,
        method: 'POST',
        body: { new_parent_id },
      }),
      invalidatesTags: ['Categories'],
    }),
    reorderCategory: builder.mutation({
      query: ({ id, new_display_order }) => ({
        url: `/admin/categories/${id}/reorder`,
        method: 'POST',
        body: { new_display_order },
      }),
      invalidatesTags: ['Categories'],
    }),

    // ========================================
    // Admin Tag Endpoints
    // ========================================
    getTags: builder.query({
      query: ({ category, search } = {}) => {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (search) params.append('search', search);
        return `/admin/tags?${params}`;
      },
      providesTags: ['Tags'],
    }),
    getTag: builder.query({
      query: (id) => `/admin/tags/${id}`,
      providesTags: (result, error, id) => [{ type: 'Tag', id }],
    }),
    createTag: builder.mutation({
      query: (tagData) => ({
        url: '/admin/tags',
        method: 'POST',
        body: tagData,
      }),
      invalidatesTags: ['Tags'],
    }),
    updateTag: builder.mutation({
      query: ({ id, ...tagData }) => ({
        url: `/admin/tags/${id}`,
        method: 'PUT',
        body: tagData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Tag', id }, 'Tags'],
    }),
    deleteTag: builder.mutation({
      query: (id) => ({
        url: `/admin/tags/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tags'],
    }),
    assignTagsToProduct: builder.mutation({
      query: ({ productId, tagIds, replace = false }) => ({
        url: `/admin/tags/products/${productId}/tags?replace=${replace}`,
        method: 'POST',
        body: { tag_ids: tagIds },
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'Product', id: productId },
        'Products',
      ],
    }),
    removeTagFromProduct: builder.mutation({
      query: ({ productId, tagId }) => ({
        url: `/admin/tags/products/${productId}/tags/${tagId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'Product', id: productId },
        'Products',
      ],
    }),

    // ========================================
    // Admin Pricing Rule Endpoints
    // ========================================
    getPricingRules: builder.query({
      query: ({ page = 1, limit = 20, rule_type, is_active, product_id, category_id } = {}) => {
        const params = new URLSearchParams({ page, page_size: limit });
        if (rule_type) params.append('rule_type', rule_type);
        if (is_active !== undefined) params.append('is_active', is_active);
        if (product_id) params.append('product_id', product_id);
        if (category_id) params.append('category_id', category_id);
        return `/admin/pricing-rules?${params}`;
      },
      providesTags: ['PricingRules'],
    }),
    getPricingRule: builder.query({
      query: (id) => `/admin/pricing-rules/${id}`,
      providesTags: (result, error, id) => [{ type: 'PricingRule', id }],
    }),
    createPricingRule: builder.mutation({
      query: (ruleData) => ({
        url: '/admin/pricing-rules',
        method: 'POST',
        body: ruleData,
      }),
      invalidatesTags: ['PricingRules'],
    }),
    updatePricingRule: builder.mutation({
      query: ({ id, ...ruleData }) => ({
        url: `/admin/pricing-rules/${id}`,
        method: 'PUT',
        body: ruleData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'PricingRule', id }, 'PricingRules'],
    }),
    deletePricingRule: builder.mutation({
      query: (id) => ({
        url: `/admin/pricing-rules/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PricingRules'],
    }),
    togglePricingRuleStatus: builder.mutation({
      query: ({ id, is_active }) => ({
        url: `/admin/pricing-rules/${id}/activate?is_active=${is_active}`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'PricingRule', id }, 'PricingRules'],
    }),
    testPricingRule: builder.mutation({
      query: ({ product_id, quantity, base_price }) => ({
        url: '/admin/pricing-rules/test',
        method: 'POST',
        body: { product_id, quantity, base_price },
      }),
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

    // ========================================
    // Specification Endpoints
    // ========================================
    getSpecifications: builder.query({
      query: ({ type, is_active, skip = 0, limit = 100 } = {}) => {
        const params = new URLSearchParams({ skip, limit });
        if (type) params.append('type', type);
        if (is_active !== undefined) params.append('is_active', is_active);
        return `/admin/specifications?${params}`;
      },
      providesTags: ['Specifications'],
    }),
    getSpecificationsByType: builder.query({
      query: ({ is_active = true } = {}) => {
        const params = new URLSearchParams();
        if (is_active !== undefined) params.append('is_active', is_active);
        return `/admin/specifications/by-type?${params}`;
      },
      providesTags: ['Specifications'],
    }),
    getSpecification: builder.query({
      query: (id) => `/admin/specifications/${id}`,
      providesTags: (result, error, id) => [{ type: 'Specification', id }],
    }),
    createSpecification: builder.mutation({
      query: (specData) => ({
        url: '/admin/specifications',
        method: 'POST',
        body: specData,
      }),
      invalidatesTags: ['Specifications'],
    }),
    updateSpecification: builder.mutation({
      query: ({ id, ...specData }) => ({
        url: `/admin/specifications/${id}`,
        method: 'PUT',
        body: specData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Specification', id }, 'Specifications'],
    }),
    deleteSpecification: builder.mutation({
      query: (id) => ({
        url: `/admin/specifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Specifications'],
    }),

    // ========================================
    // Permissions Management Endpoints
    // ========================================
    getAdminPermissions: builder.query({
      query: ({ page = 1, page_size = 50, resource = '', search = '' } = {}) => {
        const params = new URLSearchParams({ page, page_size });
        if (resource) params.append('resource', resource);
        if (search) params.append('search', search);
        return `/admin/permissions?${params}`;
      },
      providesTags: ['Permissions'],
    }),
    getPermissionResources: builder.query({
      query: () => '/admin/permissions/resources',
      providesTags: ['Permissions'],
    }),
    createPermission: builder.mutation({
      query: (permissionData) => ({
        url: '/admin/permissions',
        method: 'POST',
        body: permissionData,
      }),
      invalidatesTags: ['Permissions', 'Roles'],
    }),
    updatePermission: builder.mutation({
      query: ({ id, ...permissionData }) => ({
        url: `/admin/permissions/${id}`,
        method: 'PUT',
        body: permissionData,
      }),
      invalidatesTags: ['Permissions', 'Roles'],
    }),
    deletePermission: builder.mutation({
      query: (id) => ({
        url: `/admin/permissions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Permissions', 'Roles'],
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
  useActivateProductMutation,
  useBulkDeleteProductsMutation,

  // Product Variants
  useGetProductVariantsQuery,
  useGetProductVariantQuery,
  useCreateProductVariantMutation,
  useUpdateProductVariantMutation,
  useDeleteProductVariantMutation,
  useSetDefaultVariantMutation,
  useBulkCreateVariantsMutation,

  // Categories
  useGetCategoriesQuery,
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useMoveCategoryMutation,
  useReorderCategoryMutation,

  // Tags
  useGetTagsQuery,
  useGetTagQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
  useAssignTagsToProductMutation,
  useRemoveTagFromProductMutation,

  // Specifications
  useGetSpecificationsQuery,
  useGetSpecificationsByTypeQuery,
  useGetSpecificationQuery,
  useCreateSpecificationMutation,
  useUpdateSpecificationMutation,
  useDeleteSpecificationMutation,

  // Pricing Rules
  useGetPricingRulesQuery,
  useGetPricingRuleQuery,
  useCreatePricingRuleMutation,
  useUpdatePricingRuleMutation,
  useDeletePricingRuleMutation,
  useTogglePricingRuleStatusMutation,
  useTestPricingRuleMutation,

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

  // Permissions
  useGetAdminPermissionsQuery,
  useGetPermissionResourcesQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation,
} = apiSlice;
