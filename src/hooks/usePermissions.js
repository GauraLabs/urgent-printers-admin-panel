/**
 * Permission checking hook
 * Utility hook for permission-based rendering
 */

import { useSelector } from 'react-redux';
import { selectUserPermissions, selectUserRole } from '@/store/slices/authSlice';
import { ROLES, ROLE_HIERARCHY } from '@/constants/permissions';

export const usePermissions = () => {
  const permissions = useSelector(selectUserPermissions);
  const role = useSelector(selectUserRole);

  /**
   * Check if user has a specific permission
   */
  const can = (permission) => {
    if (!permission) return true;
    // Super admin has all permissions
    if (role === ROLES.SUPER_ADMIN) return true;
    return permissions.includes(permission);
  };

  /**
   * Check if user has any of the given permissions
   */
  const canAny = (permissionList) => {
    if (!permissionList || permissionList.length === 0) return true;
    if (role === ROLES.SUPER_ADMIN) return true;
    return permissionList.some((p) => permissions.includes(p));
  };

  /**
   * Check if user has all of the given permissions
   */
  const canAll = (permissionList) => {
    if (!permissionList || permissionList.length === 0) return true;
    if (role === ROLES.SUPER_ADMIN) return true;
    return permissionList.every((p) => permissions.includes(p));
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (targetRole) => {
    if (!targetRole) return true;
    if (Array.isArray(targetRole)) {
      return targetRole.includes(role);
    }
    return role === targetRole;
  };

  /**
   * Check if user's role is at least as high as the target role
   */
  const hasMinRole = (targetRole) => {
    const userRoleIndex = ROLE_HIERARCHY.indexOf(role);
    const targetRoleIndex = ROLE_HIERARCHY.indexOf(targetRole);
    return userRoleIndex >= targetRoleIndex;
  };

  /**
   * Check if user is super admin
   */
  const isSuperAdmin = () => role === ROLES.SUPER_ADMIN;

  /**
   * Check if user is admin or higher
   */
  const isAdmin = () => hasMinRole(ROLES.ADMIN);

  return {
    permissions,
    role,
    can,
    canAny,
    canAll,
    hasRole,
    hasMinRole,
    isSuperAdmin,
    isAdmin,
  };
};

export default usePermissions;
