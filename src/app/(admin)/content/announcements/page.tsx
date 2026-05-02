import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { AnnouncementBar } from '@/features/content/components/AnnouncementBar';

export const metadata: Metadata = { title: 'Announcement Bar' };

export default function AnnouncementsPage() {
  return (
    <div>
      <PageHeader
        title="Announcement Bar"
        description="Configure the site-wide announcement banner shown above the header."
      />
      <AnnouncementBar />
    </div>
  );
}
