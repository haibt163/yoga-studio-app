import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { buildPageMetadata } from '@/lib/metadata';
import BookingDashboard from './BookingDashboard';
import GuestLogin from './GuestLogin';
import { getGuestDashboard } from '@/lib/guest/data';
import { verifyGuestSession } from '@/lib/guest/session';
import {
  addDays,
  getStudioDateString,
  getStudioTimeString,
} from '@/lib/studio-date';

interface BookingPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: BookingPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'en' ? 'en' : 'vi';
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return buildPageMetadata({
    title: t('bookingTitle'),
    description: t('bookingDescription'),
    path: `/${locale}/booking`,
    locale,
  });
}

export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'en' ? 'en' : 'vi';
  const query = await searchParams;
  const rawDate = typeof query.date === 'string' ? query.date : '';
  const rawTime = typeof query.time === 'string' ? query.time : '';
  const initialDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : '';
  const initialTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(rawTime) ? rawTime : '';
  const t = await getTranslations({ locale });

  const session = await verifyGuestSession();

  if (!session) {
    return (
      <GuestLogin
        locale={locale}
        initialDate={initialDate}
        initialTime={initialTime}
      />
    );
  }

  const { guestName, bookings, takenSlots, error } = await getGuestDashboard(
    session.guestId
  );

  if (error || !guestName) {
    return (
      <GuestLogin
        locale={locale}
        initialDate={initialDate}
        initialTime={initialTime}
        systemError={
          error === 'not-configured'
            ? t('Booking.notConfigured')
            : error === 'database'
              ? t('Errors.database')
              : t('Booking.wrongCredentials')
        }
      />
    );
  }

  const today = getStudioDateString();
  const days = Array.from({ length: 30 }, (_, index) => addDays(today, index));

  return (
    <BookingDashboard
      locale={locale}
      guestName={guestName}
      bookings={bookings}
      takenSlots={takenSlots}
      today={today}
      days={days}
      nowTime={getStudioTimeString()}
      initialDate={initialDate}
      initialTime={initialTime}
    />
  );
}
