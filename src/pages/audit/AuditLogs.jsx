/**
 * Audit Logs Page
 * View system audit trail
 */

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { useGetAuditLogsQuery } from '@/store/api/apiSlice';
import PageHeader from '@/components/common/PageHeader';
import { ROUTES } from '@/constants/routes';
import { Download, Filter, FileText, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACTION_COLORS = {
  create: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  update: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  delete: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  login: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  logout: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const AuditLogs = () => {
  const [page, setPage] = useState(1);
  const [allLogs, setAllLogs] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const scrollContainerRef = useRef(null);
  const loaderRef = useRef(null);

  const { data, isLoading, isFetching } = useGetAuditLogsQuery({
    page,
    limit: 50,
    action: actionFilter,
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
  });

  // Reset when filters change
  useEffect(() => {
    setPage(1);
    setAllLogs([]);
    setHasMore(true);
  }, [actionFilter, dateRange.from, dateRange.to]);

  // Accumulate logs
  useEffect(() => {
    if (data?.logs) {
      if (page === 1) {
        setAllLogs(data.logs);
      } else {
        setAllLogs(prev => [...prev, ...data.logs]);
      }

      // Check if there are more logs to load
      const totalPages = Math.ceil(data.total / 50);
      setHasMore(page < totalPages);
    }
  }, [data, page]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetching) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [hasMore, isFetching]);

  const totalCount = data?.total || 0;

  const columns = useMemo(
    () => [
      {
        accessorKey: 'created_at',
        header: 'Time',
        size: 150,
        Cell: ({ cell }) => (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p>{new Date(cell.getValue()).toLocaleDateString()}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(cell.getValue()).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'action',
        header: 'Action',
        size: 100,
        Cell: ({ cell }) => (
          <span
            className={cn(
              'inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize',
              ACTION_COLORS[cell.getValue()] || ACTION_COLORS.update
            )}
          >
            {cell.getValue()}
          </span>
        ),
      },
      {
        accessorKey: 'resource_type',
        header: 'Resource',
        size: 120,
        Cell: ({ row }) => (
          <div>
            <p className="font-medium capitalize">{row.original.resource_type}</p>
            <p className="text-xs text-muted-foreground">{row.original.resource_id}</p>
          </div>
        ),
      },
      {
        accessorFn: (row) => {
          // Extract meaningful details from metadata
          if (row.new_values || row.old_values) {
            const changes = [];
            if (row.new_values) {
              Object.keys(row.new_values).forEach(key => {
                changes.push(`${key}: ${JSON.stringify(row.new_values[key])}`);
              });
            }
            return changes.join(', ') || 'No details available';
          }
          return row.metadata ? JSON.stringify(row.metadata).substring(0, 100) : 'No details available';
        },
        id: 'details',
        header: 'Details',
        size: 300,
        Cell: ({ cell }) => (
          <p className="text-sm text-muted-foreground line-clamp-2">{cell.getValue()}</p>
        ),
      },
      {
        accessorKey: 'user_email',
        header: 'User',
        size: 150,
        Cell: ({ row }) => {
          const email = row.original.user_email;
          const initial = email ? email.charAt(0).toUpperCase() : 'S';
          const displayName = email ? email.split('@')[0] : 'System';

          return (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                {initial}
              </div>
              <div>
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{email || 'System'}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'ip_address',
        header: 'IP',
        size: 120,
        Cell: ({ cell }) => (
          <span className="font-mono text-xs text-muted-foreground">{cell.getValue()}</span>
        ),
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: allLogs,
    enablePagination: false,
    enableBottomToolbar: false,
    state: {
      isLoading: isLoading && page === 1,
    },
    enableGlobalFilter: false,
    enableRowActions: false,
    enableRowVirtualization: true,
    muiTableContainerProps: {
      ref: scrollContainerRef,
      sx: { maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' },
    },
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        borderRadius: '0.75rem',
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      },
    },
    muiTableHeadCellProps: {
      sx: {
        fontWeight: 600,
      },
    },
    muiTableBodyCellProps: {
      sx: {
        color: 'text.primary',
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="System activity and change history"
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Audit Logs' },
        ]}
      >
        <button className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
          <Download className="h-4 w-4" />
          Export Logs
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        {/* Action Filter */}
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
        </select>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            placeholder="From"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            placeholder="To"
          />
        </div>

        {(actionFilter || dateRange.from || dateRange.to) && (
          <button
            onClick={() => {
              setActionFilter('');
              setDateRange({ from: '', to: '' });
            }}
            className="text-sm text-primary hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{allLogs.length}</p>
              <p className="text-sm text-muted-foreground">
                Loaded {totalCount > 0 && `of ${totalCount}`}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{allLogs.filter(l => l.action === 'create').length}</p>
              <p className="text-sm text-muted-foreground">Creates</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{allLogs.filter(l => l.action === 'update').length}</p>
              <p className="text-sm text-muted-foreground">Updates</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
              <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{allLogs.filter(l => l.action === 'delete').length}</p>
              <p className="text-sm text-muted-foreground">Deletes</p>
            </div>
          </div>
        </div>
      </div>

      <MaterialReactTable table={table} />

      {/* Infinite scroll loader */}
      {hasMore && (
        <div ref={loaderRef} className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading more logs...</span>
        </div>
      )}

      {!hasMore && allLogs.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <span className="text-sm text-muted-foreground">
            All {totalCount} logs loaded
          </span>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
