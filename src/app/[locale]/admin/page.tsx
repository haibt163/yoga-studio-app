import type { Metadata } from 'next';
import AdminDashboard from './AdminDashboard';
import AdminLogin from './AdminLogin';
import { getAdminBookings } from '@/lib/admin/data';
import { verifyAdminSession } from '@/lib/admin/session';
import {
  addDays,
  getStudioDateString,
  getStudioTimeString,
} from '@/lib/studio-date';

interface AdminPageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  title: 'Admin',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'en' ? 'en' : 'vi';

  if (!(await verifyAdminSession())) {
    return <AdminLogin locale={locale} />;
  }

  const { bookings, error } = await getAdminBookings();
  const today = getStudioDateString();
  const days = Array.from({ length: 30 }, (_, index) => addDays(today, index));

  return (
    <AdminDashboard
      bookings={bookings}
      loadError={error}
      locale={locale}
      today={today}
      days={days}
      nowTime={getStudioTimeString()}
    />
  );
}
