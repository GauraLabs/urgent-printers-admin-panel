/**
 * Settings Page
 * System configuration and preferences
 */

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import { ROUTES } from '@/constants/routes';
import {
  Settings as SettingsIcon,
  CreditCard,
  Mail,
  Server,
  Bell,
  Shield,
  Globe,
  Save,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TABS = [
  { id: 'general', label: 'General', icon: SettingsIcon, path: ROUTES.SETTINGS },
  { id: 'payments', label: 'Payments', icon: CreditCard, path: ROUTES.PAYMENT_SETTINGS },
  { id: 'email', label: 'Email', icon: Mail, path: ROUTES.EMAIL_SETTINGS },
  { id: 'system', label: 'System', icon: Server, path: ROUTES.SYSTEM_SETTINGS },
];

const Settings = () => {
  const location = useLocation();
  const [saving, setSaving] = useState(false);

  const currentTab = TABS.find(tab => tab.path === location.pathname)?.id || 'general';

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    toast.success('Settings saved successfully');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure your admin panel"
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Settings' },
        ]}
      >
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </PageHeader>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-64 shrink-0">
          <nav className="space-y-1 rounded-xl border border-border bg-card p-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <a
                  key={tab.id}
                  href={tab.path}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {currentTab === 'general' && <GeneralSettings />}
          {currentTab === 'payments' && <PaymentSettings />}
          {currentTab === 'email' && <EmailSettings />}
          {currentTab === 'system' && <SystemSettings />}
        </div>
      </div>
    </div>
  );
};

const GeneralSettings = () => (
  <div className="space-y-6">
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <h3 className="font-semibold">Business Information</h3>
        <p className="text-sm text-muted-foreground">Basic information about your business</p>
      </div>
      <div className="space-y-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Company Name</label>
            <input
              type="text"
              defaultValue="Urgent Printers"
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Support Email</label>
            <input
              type="email"
              defaultValue="support@urgentprinters.com"
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Phone</label>
            <input
              type="text"
              defaultValue="+91 80 1234 5678"
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">GST Number</label>
            <input
              type="text"
              defaultValue="29XXXXX1234X1Z5"
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Address</label>
          <textarea
            rows={3}
            defaultValue="123 MG Road, Koramangala, Bangalore, Karnataka - 560001"
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm"
          />
        </div>
      </div>
    </div>

    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <h3 className="font-semibold">Notifications</h3>
        <p className="text-sm text-muted-foreground">Configure notification preferences</p>
      </div>
      <div className="space-y-4 p-4">
        {[
          { label: 'New order notifications', description: 'Get notified for new orders', enabled: true },
          { label: 'Low stock alerts', description: 'Alert when products are running low', enabled: true },
          { label: 'Payment notifications', description: 'Notify on payment events', enabled: true },
          { label: 'Daily summary', description: 'Receive daily business summary', enabled: false },
        ].map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" defaultChecked={item.enabled} className="peer sr-only" />
              <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
            </label>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PaymentSettings = () => (
  <div className="space-y-6">
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <h3 className="font-semibold">Razorpay</h3>
        <p className="text-sm text-muted-foreground">Indian payment gateway configuration</p>
      </div>
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Enable Razorpay</p>
            <p className="text-sm text-muted-foreground">Accept payments via Razorpay</p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" defaultChecked className="peer sr-only" />
            <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
          </label>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Key ID</label>
          <input
            type="text"
            defaultValue="rzp_live_xxxxxxxxxxxxx"
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-mono"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Key Secret</label>
          <input
            type="password"
            defaultValue="xxxxxxxxxxxxxxxxxxxx"
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-mono"
          />
        </div>
      </div>
    </div>

    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <h3 className="font-semibold">Stripe</h3>
        <p className="text-sm text-muted-foreground">International payment gateway</p>
      </div>
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Enable Stripe</p>
            <p className="text-sm text-muted-foreground">Accept international payments</p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" className="peer sr-only" />
            <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
          </label>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Publishable Key</label>
          <input
            type="text"
            placeholder="pk_live_xxxxx"
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-mono"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Secret Key</label>
          <input
            type="password"
            placeholder="sk_live_xxxxx"
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-mono"
          />
        </div>
      </div>
    </div>
  </div>
);

const EmailSettings = () => (
  <div className="space-y-6">
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <h3 className="font-semibold">SMTP Configuration</h3>
        <p className="text-sm text-muted-foreground">Configure email delivery settings</p>
      </div>
      <div className="space-y-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">SMTP Host</label>
            <input
              type="text"
              defaultValue="smtp.gmail.com"
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">SMTP Port</label>
            <input
              type="text"
              defaultValue="587"
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Username</label>
            <input
              type="text"
              defaultValue="noreply@urgentprinters.com"
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Password</label>
            <input
              type="password"
              defaultValue="xxxxxxxxxx"
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="use-tls" defaultChecked className="rounded border-input" />
          <label htmlFor="use-tls" className="text-sm">Use TLS encryption</label>
        </div>
        <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
          Send Test Email
        </button>
      </div>
    </div>

    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <h3 className="font-semibold">Email Templates</h3>
        <p className="text-sm text-muted-foreground">Customize email content</p>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {[
            'Order Confirmation',
            'Payment Receipt',
            'Shipping Update',
            'Password Reset',
            'Welcome Email',
          ].map((template, index) => (
            <div key={index} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{template}</span>
              </div>
              <button className="text-sm text-primary hover:underline">Edit</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const SystemSettings = () => (
  <div className="space-y-6">
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <h3 className="font-semibold">Security</h3>
        <p className="text-sm text-muted-foreground">Security and access settings</p>
      </div>
      <div className="space-y-4 p-4">
        {[
          { label: 'Two-factor authentication', description: 'Require 2FA for admin users', enabled: true },
          { label: 'Session timeout', description: 'Auto logout after 30 minutes of inactivity', enabled: true },
          { label: 'IP whitelist', description: 'Restrict admin access to specific IPs', enabled: false },
          { label: 'Login notifications', description: 'Email alert on new login', enabled: true },
        ].map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" defaultChecked={item.enabled} className="peer sr-only" />
              <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
            </label>
          </div>
        ))}
      </div>
    </div>

    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <h3 className="font-semibold">Maintenance</h3>
        <p className="text-sm text-muted-foreground">System maintenance options</p>
      </div>
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Maintenance Mode</p>
            <p className="text-sm text-muted-foreground">Temporarily disable the storefront</p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" className="peer sr-only" />
            <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-destructive peer-checked:after:translate-x-full" />
          </label>
        </div>
        <div className="flex gap-3">
          <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
            Clear Cache
          </button>
          <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
            Rebuild Search Index
          </button>
          <button className="rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
            Export All Data
          </button>
        </div>
      </div>
    </div>

    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <h3 className="font-semibold">API Configuration</h3>
        <p className="text-sm text-muted-foreground">Backend API settings</p>
      </div>
      <div className="space-y-4 p-4">
        <div>
          <label className="mb-2 block text-sm font-medium">API Base URL</label>
          <input
            type="text"
            defaultValue="http://localhost:8000/api/v1"
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-mono"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Request Timeout (ms)</label>
          <input
            type="number"
            defaultValue="30000"
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm"
          />
        </div>
      </div>
    </div>
  </div>
);

export default Settings;
