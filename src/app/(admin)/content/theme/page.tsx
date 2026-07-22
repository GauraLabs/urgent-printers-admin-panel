import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { ThemeManager } from '@/features/content/components/ThemeManager';

export const metadata: Metadata = { title: 'Site Theme' };

export default function ThemePage() {
  return (
    <div>
      <PageHeader
        title="Site Theme"
        description="Choose the storefront's brand color preset."
      />
      <ThemeManager />
    </div>
  );
}
