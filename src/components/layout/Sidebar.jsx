/**
 * Sidebar Component
 * Collapsible navigation sidebar with menu items
 */

import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { MENU_ITEMS } from '@/constants/menuItems';
import {
  selectSidebarCollapsed,
  toggleSidebarCollapsed,
} from '@/store/slices/uiSlice';
import {
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Printer,
} from 'lucide-react';

const SidebarItem = ({ item, collapsed, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const { canAny } = usePermissions();

  // Check permissions
  if (item.permissions && item.permissions.length > 0) {
    if (!canAny(item.permissions)) return null;
  }

  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;

  // Check if any child is active
  const isChildActive = hasChildren && item.children.some(
    (child) => location.pathname === child.path || location.pathname.startsWith(child.path + '/')
  );

  // Check if this item is active
  const isActive = item.path
    ? location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    : isChildActive;

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const itemContent = (
    <>
      <div className="flex items-center gap-3">
        {Icon && (
          <Icon
            className={cn(
              'h-5 w-5 shrink-0 transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
            )}
          />
        )}
        {!collapsed && (
          <span className={cn(
            'text-sm font-medium transition-colors',
            isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
          )}>
            {item.label}
          </span>
        )}
      </div>
      {!collapsed && hasChildren && (
        <div className="ml-auto">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      )}
    </>
  );

  const baseClasses = cn(
    'group flex items-center justify-between w-full rounded-lg px-3 py-2.5 transition-all duration-200',
    isActive
      ? 'bg-primary/10 text-foreground'
      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
    collapsed && 'justify-center px-2'
  );

  return (
    <div>
      {item.path && !hasChildren ? (
        <NavLink to={item.path} className={baseClasses}>
          {itemContent}
        </NavLink>
      ) : (
        <button onClick={handleClick} className={baseClasses}>
          {itemContent}
        </button>
      )}

      {/* Children */}
      {hasChildren && isExpanded && !collapsed && (
        <div className="ml-4 mt-1 space-y-1 border-l border-border pl-3">
          {item.children.map((child) => (
            <SidebarItem
              key={child.id}
              item={child}
              collapsed={collapsed}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar = () => {
  const dispatch = useDispatch();
  const collapsed = useSelector(selectSidebarCollapsed);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-[70px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex h-16 items-center border-b border-border px-4',
        collapsed && 'justify-center px-2'
      )}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Printer className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">Urgent Printers</span>
              <span className="text-xs text-muted-foreground">Admin Panel</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {MENU_ITEMS.map((item) => (
          <SidebarItem key={item.id} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-border p-3">
        <button
          onClick={() => dispatch(toggleSidebarCollapsed())}
          className={cn(
            'flex w-full items-center justify-center rounded-lg px-3 py-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
            collapsed && 'px-2'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <>
              <PanelLeftClose className="h-5 w-5" />
              <span className="ml-3 text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
