import { SettingsTabs } from '@/features/settings/components/SettingsTabs';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-6">
        <SettingsTabs />
      </div>
      {children}
    </div>
  );
}
