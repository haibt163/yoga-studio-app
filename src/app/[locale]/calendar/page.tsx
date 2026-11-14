import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import CalendarClient from './CalendarClient';
import { verifyAdminSession } from '@/lib/admin/session';
import { getCalendarClasses } from '@/lib/calendar/data';
import { cleanEnv } from '@/lib/env';
import { buildPageMetadata } from '@/lib/metadata';
import {
  addDays,
  getStudioDateString,
  getStudioTimeString,
} from '@/lib/studio-date';

interface CalendarPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CalendarPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'en' ? 'en' : 'vi';
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return buildPageMetadata({
    title: t('calendarTitle'),
    description: t('calendarDescription'),
    path: `/${locale}/calendar`,
    locale,
  });
}

export default async function CalendarPage({ params }: CalendarPageProps) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'en' ? 'en' : 'vi';
  const isAdmin = await verifyAdminSession();
  const today = getStudioDateString();
  const days = Array.from({ length: 7 }, (_, index) => addDays(today, index));
  const { classes, error } = await getCalendarClasses(days[0], days[6], isAdmin);
  const feedToken = isAdmin ? cleanEnv(process.env.CALENDAR_FEED_TOKEN) : undefined;
  const feedPath = feedToken
    ? `/api/calendar/feed?token=${encodeURIComponent(feedToken)}`
    : '/api/calendar/feed';

  return (
    <CalendarClient
      locale={locale}
      isAdmin={isAdmin}
      days={days}
      nowTime={getStudioTimeString()}
      initialClasses={classes}
      loadError={error}
      feedPath={feedPath}
    />
  );
}
