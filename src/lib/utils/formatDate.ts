import {
  format,
  formatDistanceToNow,
  parseISO,
  isValid,
} from 'date-fns';

export function formatDate(date: string | Date, pattern = 'dd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? format(d, pattern) : '—';
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'dd MMM yyyy, h:mm a');
}

export function formatTimeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : '—';
}

export function formatApiDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
