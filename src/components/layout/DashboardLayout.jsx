/**
 * Dashboard Layout Component
 * Main layout wrapper with sidebar and header
 */

import { useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { selectSidebarCollapsed, selectTheme } from '@/store/slices/uiSlice';
import { ROUTES, PUBLIC_ROUTES } from '@/constants/routes';
import Sidebar from './Sidebar';
import Header from './Header';
import { Toaster } from 'sonner';

const DashboardLayout = () => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const collapsed = useSelector(selectSidebarCollapsed);
  const theme = useSelector(selectTheme);

  // Apply theme on mount and changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated && !PUBLIC_ROUTES.includes(location.pathname)) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Don't show layout for public routes
  if (PUBLIC_ROUTES.includes(location.pathname)) {
    return (
      <>
        <Outlet />
        <Toaster position="top-right" richColors />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />

      {/* Main Content */}
      <main
        className={cn(
          'min-h-screen pt-16 transition-all duration-300',
          collapsed ? 'ml-[70px]' : 'ml-[260px]'
        )}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>

      {/* Toast Notifications */}
      <Toaster position="top-right" richColors />
    </div>
  );
};

export default DashboardLayout;
