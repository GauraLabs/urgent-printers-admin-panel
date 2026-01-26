/**
 * Main App Component
 * Configures routing and global providers
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { ROUTES } from '@/constants/routes';
import MuiThemeProvider from '@/providers/MuiThemeProvider';

// Layout
import DashboardLayout from '@/components/layout/DashboardLayout';

// Auth Pages
import Login from '@/pages/auth/Login';
import AcceptInvitation from '@/pages/auth/AcceptInvitation';

// Dashboard
import Dashboard from '@/pages/dashboard/Dashboard';

// User Management
import UserList from '@/pages/users/UserList';
import RoleManagement from '@/pages/users/RoleManagement';
import InvitationManagement from '@/pages/invitations/InvitationManagement';

// Product Management
import ProductList from '@/pages/products/ProductList';
import CategoryManagement from '@/pages/products/CategoryManagement';

// Order Management
import OrderList from '@/pages/orders/OrderList';
import OrderDetail from '@/pages/orders/OrderDetail';

// Coupons
import CouponManagement from '@/pages/coupons/CouponManagement';

// Analytics
import AnalyticsDashboard from '@/pages/analytics/AnalyticsDashboard';

// Audit Logs
import AuditLogs from '@/pages/audit/AuditLogs';

// Settings
import Settings from '@/pages/settings/Settings';

function App() {
  return (
    <Provider store={store}>
      <MuiThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path={ROUTES.LOGIN} element={<Login />} />
            <Route path={ROUTES.FORGOT_PASSWORD} element={<Login />} />
            <Route path={ROUTES.ACCEPT_INVITATION} element={<AcceptInvitation />} />

            {/* Protected Routes */}
            <Route element={<DashboardLayout />}>
              {/* Dashboard */}
              <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />

              {/* User Management */}
              <Route path={ROUTES.USERS} element={<UserList />} />
              <Route path={ROUTES.ROLES} element={<RoleManagement />} />
              <Route path={ROUTES.INVITATIONS} element={<InvitationManagement />} />

              {/* Product Management */}
              <Route path={ROUTES.PRODUCTS} element={<ProductList />} />
              <Route path={ROUTES.CATEGORIES} element={<CategoryManagement />} />

              {/* Order Management */}
              <Route path={ROUTES.ORDERS} element={<OrderList />} />
              <Route path={ROUTES.ORDER_DETAIL} element={<OrderDetail />} />

              {/* Coupons */}
              <Route path={ROUTES.COUPONS} element={<CouponManagement />} />

              {/* Analytics */}
              <Route path={ROUTES.ANALYTICS} element={<AnalyticsDashboard />} />
              <Route path={ROUTES.REPORTS} element={<AnalyticsDashboard />} />

              {/* Audit Logs */}
              <Route path={ROUTES.AUDIT_LOGS} element={<AuditLogs />} />

              {/* Settings */}
              <Route path={ROUTES.SETTINGS} element={<Settings />} />
              <Route path={ROUTES.PAYMENT_SETTINGS} element={<Settings />} />
              <Route path={ROUTES.EMAIL_SETTINGS} element={<Settings />} />
              <Route path={ROUTES.SYSTEM_SETTINGS} element={<Settings />} />

              {/* Catch all */}
              <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </MuiThemeProvider>
    </Provider>
  );
}

export default App;
