'use client';

import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ef4444', '#06b6d4'];

const tooltipStyle = {
  contentStyle: {
    background: 'var(--color-popover)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    fontSize: '12px',
    color: 'var(--color-popover-foreground)',
  },
  itemStyle: { color: 'var(--color-popover-foreground)' },
  labelStyle: { color: 'var(--color-muted-foreground)', fontWeight: 600 },
};

const axisStyle = { fontSize: 11, fill: 'var(--color-muted-foreground)' };
const gridStyle = { stroke: 'var(--color-border)', strokeDasharray: '3 3' };

function formatDate(str: string) {
  try { return format(parseISO(str), 'd MMM'); } catch { return str; }
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  isLoading?: boolean;
  children: React.ReactNode;
  height?: number;
}

export function ChartCard({ title, subtitle, isLoading, children, height = 220 }: ChartCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-[13px] font-semibold text-foreground">{title}</p>
      {subtitle && <p className="text-[12px] text-muted-foreground mb-3">{subtitle}</p>}
      {isLoading
        ? <Skeleton className="w-full rounded-lg mt-2" style={{ height }} />
        : <div style={{ height }} className="mt-2">{children}</div>}
    </div>
  );
}

// ── Area/Line trend chart ────────────────────────────────────────────────────
interface TrendChartProps {
  data: { date: string; value: number }[];
  color?: string;
  formatValue?: (v: number) => string;
  type?: 'area' | 'line';
}

export function TrendChart({ data, color = COLORS[0], formatValue, type = 'area' }: TrendChartProps) {
  const id = `grad-${color.replace('#', '')}`;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.15} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} {...gridStyle} />
        <XAxis dataKey="date" tickFormatter={formatDate} tick={axisStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={formatValue} width={54} />
        <Tooltip {...tooltipStyle} formatter={(v) => [formatValue ? formatValue(Number(v ?? 0)) : String(v ?? 0), '']} labelFormatter={(l) => formatDate(String(l ?? ""))} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${id})`} dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Grouped bar chart ────────────────────────────────────────────────────────
interface BarData {
  name: string;
  [key: string]: string | number;
}

interface GroupBarChartProps {
  data: BarData[];
  keys: string[];
  formatValue?: (v: number) => string;
}

export function GroupBarChart({ data, keys, formatValue }: GroupBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} {...gridStyle} />
        <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={formatValue} width={54} />
        <Tooltip {...tooltipStyle} formatter={(v) => [formatValue ? formatValue(Number(v ?? 0)) : String(v ?? 0), '']} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {keys.map((k, i) => (
          <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Horizontal bar chart ─────────────────────────────────────────────────────
interface HBarChartProps {
  data: { name: string; value: number }[];
  color?: string;
  formatValue?: (v: number) => string;
}

export function HBarChart({ data, color = COLORS[0], formatValue }: HBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart layout="vertical" data={data} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} {...gridStyle} />
        <XAxis type="number" tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={formatValue} />
        <YAxis type="category" dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} width={100} />
        <Tooltip {...tooltipStyle} formatter={(v) => [formatValue ? formatValue(Number(v ?? 0)) : String(v ?? 0), '']} />
        <Bar dataKey="value" fill={color} radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Donut chart ──────────────────────────────────────────────────────────────
interface DonutChartProps {
  data: { name: string; value: number }[];
}

export function DonutChart({ data }: DonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={80} paddingAngle={2} strokeWidth={0}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip {...tooltipStyle} formatter={(v) => [String(v ?? 0), '']} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
