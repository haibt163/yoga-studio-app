import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { cleanEnv } from '@/lib/env';
import { isVisibleOnCalendar } from '@/lib/bookings';
import { createServerSupabase } from '@/lib/supabase/server';
import { getStudioDateString } from '@/lib/studio-date';

interface RawClass {
  description?: string | null;
  start_time?: string | null;
  end_time?: string | null;
}

interface RawBooking {
  id: string | number;
  name?: string | null;
  guest_id?: string | null;
  status?: string | null;
  booking_date?: string | null;
  classes?: RawClass | RawClass[] | null;
}

const formatICSDate = (date: Date) => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

const escapeICS = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

function tokensMatch(provided: string, expected: string): boolean {
  const providedHash = createHash('sha256').update(provided).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(providedHash, expectedHash);
}

export async function GET(request: Request) {
  const supabase = createServerSupabase();

  if (!supabase) {
    return new NextResponse('Calendar feed is not configured', { status: 503 });
  }

  try {
    const expectedToken = cleanEnv(process.env.CALENDAR_FEED_TOKEN);
    const providedToken = new URL(request.url).searchParams.get('token') ?? '';
    const isPrivileged = Boolean(
      expectedToken && providedToken && tokensMatch(providedToken, expectedToken)
    );

    const today = getStudioDateString();
    const { data, error } = await supabase
      .from('bookings')
      .select('id, name, guest_id, status, booking_date, classes(description, start_time, end_time)')
      .gte('booking_date', today)
      .order('booking_date', { ascending: true });

    if (error) {
      throw error;
    }

    const bookings = ((data ?? []) as unknown as RawBooking[]).filter((booking) =>
      isVisibleOnCalendar(booking.status ?? '')
    );
    const now = new Date();

    let icsString =
      [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Yoga x Chang//Calendar//VI',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Yoga with Chang',
        'X-PUBLISHED-TTL:PT15M',
        'REFRESH-INTERVAL;VALUE=DURATION:PT15M',
      ].join('\r\n') + '\r\n';

    bookings.forEach((booking) => {
      const classItem = Array.isArray(booking.classes)
        ? booking.classes[0]
        : booking.classes;
      const statusTime = booking.status?.match(/(\d{2}:\d{2})/)?.[1];
      const classTime = classItem?.start_time?.match(/(\d{2}:\d{2})/)?.[1];
      const time = statusTime ?? classTime;

      if (!booking.booking_date || !time) {
        return;
      }

      const startDate = classItem?.start_time
        ? new Date(classItem.start_time)
        : new Date(`${booking.booking_date}T${time}:00+07:00`);
      const endDate = classItem?.end_time
        ? new Date(classItem.end_time)
        : new Date(startDate.getTime() + 60 * 60 * 1000);

      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime())
      ) {
        return;
      }

      const eventId = createHash('sha256')
        .update(String(booking.id))
        .digest('hex')
        .slice(0, 16);

      const summary = isPrivileged
        ? `Yoga: ${classItem?.description ?? 'Private session'} (${booking.name ?? 'Guest'})`
        : 'Yoga class';
      const description = isPrivileged
        ? `Học viên: ${booking.name ?? 'Guest'}\nMã lớp: ${classItem?.description ?? ''}\nID: ${booking.guest_id ?? ''}`
        : 'Yoga session';

      icsString +=
        [
          'BEGIN:VEVENT',
          `UID:${eventId}@yogastudio.com`,
          `DTSTAMP:${formatICSDate(now)}`,
          `DTSTART:${formatICSDate(startDate)}`,
          `DTEND:${formatICSDate(endDate)}`,
          `SUMMARY:${escapeICS(summary)}`,
          `DESCRIPTION:${escapeICS(description)}`,
          'STATUS:CONFIRMED',
          'BEGIN:VALARM',
          'TRIGGER:-PT2H',
          'ACTION:DISPLAY',
          'DESCRIPTION:Reminder: Upcoming Yoga Session',
          'END:VALARM',
          'END:VEVENT',
        ].join('\r\n') + '\r\n';
    });

    icsString += 'END:VCALENDAR';

    return new NextResponse(icsString, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="yoga_schedule.ics"',
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  } catch (error: unknown) {
    console.error(
      'Calendar Feed Error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
