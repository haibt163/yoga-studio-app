import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getStudioDateString } from '@/lib/studio-date';

interface RawClass {
  class_id: string | number;
  start_time: string | null;
  end_time: string | null;
}

const formatICSDate = (date: Date) => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

export async function GET() {
  const supabase = createServerSupabase();

  if (!supabase) {
    return new NextResponse('Calendar feed is not configured', { status: 503 });
  }

  try {
    const today = getStudioDateString();
    const { data, error } = await supabase
      .from('classes')
      .select('class_id, start_time, end_time')
      .gte('start_time', today)
      .order('start_time', { ascending: true });

    if (error) {
      throw error;
    }

    const classes = (data ?? []) as unknown as RawClass[];
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

    classes.forEach((cls) => {
      if (!cls.class_id || !cls.start_time || !cls.end_time) {
        return;
      }

      const startDate = new Date(cls.start_time);
      const endDate = new Date(cls.end_time);

      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime())
      ) {
        return;
      }

      const eventId = createHash('sha256')
        .update(String(cls.class_id))
        .digest('hex')
        .slice(0, 16);

      // This feed is public. It intentionally contains no guest names, guest
      // IDs, booking IDs, or free-text class details.
      icsString +=
        [
          'BEGIN:VEVENT',
          `UID:${eventId}@yogastudio.com`,
          `DTSTAMP:${formatICSDate(now)}`,
          `DTSTART:${formatICSDate(startDate)}`,
          `DTEND:${formatICSDate(endDate)}`,
          'SUMMARY:Yoga class',
          'DESCRIPTION:Yoga session',
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
        'Cache-Control': 'no-cache, no-store, must-revalidate',
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
