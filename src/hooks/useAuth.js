/**
 * Authentication hook
 * Provides authentication state and methods
 */

import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectUserPermissions,
  selectUserRole,
  logout as logoutAction,
} from '@/store/slices/authSlice';
import { useLoginMutation, useLogoutMutation, useGetMeQuery } from '@/store/api/apiSlice';
import { ROUTES } from '@/constants/routes';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectIsLoading);
  const permissions = useSelector(selectUserPermissions);
  const role = useSelector(selectUserRole);

  const [loginMutation, { isLoading: isLoggingIn }] = useLoginMutation();
  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();

  // Check if user has token on mount
  const hasToken = !!localStorage.getItem('access_token');
  const { isLoading: isCheckingAuth } = useGetMeQuery(undefined, {
    skip: !hasToken,
  });

  const login = async (credentials) => {
    try {
      const result = await loginMutation(credentials).unwrap();
      navigate(ROUTES.DASHBOARD);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch (error) {
      // Still logout locally even if API fails
      console.error('Logout API error:', error);
    } finally {
      dispatch(logoutAction());
      navigate(ROUTES.LOGIN);
    }
  };

  const hasPermission = (permission) => {
    if (!permission) return true;
    if (Array.isArray(permission)) {
      return permission.some((p) => permissions.includes(p));
    }
    return permissions.includes(permission);
  };

  const hasAllPermissions = (permissionList) => {
    if (!permissionList || permissionList.length === 0) return true;
    return permissionList.every((p) => permissions.includes(p));
  };

  const hasRole = (targetRole) => {
    if (!targetRole) return true;
    if (Array.isArray(targetRole)) {
      return targetRole.includes(role);
    }
    return role === targetRole;
  };

  const isSuperAdmin = () => role === 'super_admin';
  const isAdmin = () => ['super_admin', 'admin'].includes(role);

  // Only consider loading if we have a token and are checking auth
  const authLoading = hasToken ? (isLoading || isCheckingAuth) : false;

  return {
    user,
    isAuthenticated,
    isLoading: authLoading,
    isLoggingIn,
    isLoggingOut,
    permissions,
    role,
    login,
    logout,
    hasPermission,
    hasAllPermissions,
    hasRole,
    isSuperAdmin,
    isAdmin,
  };
};

export default useAuth;
