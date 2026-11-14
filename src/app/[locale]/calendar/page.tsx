import CalendarClient from './CalendarClient';
import { verifyAdminSession } from '@/lib/admin/session';
import { getCalendarClasses } from '@/lib/calendar/data';
import {
  addDays,
  getStudioDateString,
  getStudioTimeString,
} from '@/lib/studio-date';

interface CalendarPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CalendarPage({ params }: CalendarPageProps) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'en' ? 'en' : 'vi';
  const isAdmin = await verifyAdminSession();
  const today = getStudioDateString();
  const days = Array.from({ length: 7 }, (_, index) => addDays(today, index));
  const { classes, error } = await getCalendarClasses(days[0], days[6], isAdmin);

  return (
    <CalendarClient
      locale={locale}
      isAdmin={isAdmin}
      days={days}
      nowTime={getStudioTimeString()}
      initialClasses={classes}
      loadError={error}
    />
  );
}
