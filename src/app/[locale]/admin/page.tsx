import AdminDashboard from './AdminDashboard';
import AdminLogin from './AdminLogin';
import { getAdminBookings } from '@/lib/admin/data';
import { verifyAdminSession } from '@/lib/admin/session';

interface AdminPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'en' ? 'en' : 'vi';

  if (!(await verifyAdminSession())) {
    return <AdminLogin locale={locale} />;
  }

  const { bookings, error } = await getAdminBookings();

  return <AdminDashboard bookings={bookings} loadError={error} locale={locale} />;
}
