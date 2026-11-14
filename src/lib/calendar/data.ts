import {
  extractTime,
  firstClass,
  isPending,
  isVisibleOnCalendar,
  type CalendarClass,
  type ClassRef,
} from '@/lib/bookings';
import { createServerSupabase } from '@/lib/supabase/server';

interface RawCalendarBooking {
  id?: string | number;
  name?: string | null;
  status?: string | null;
  booking_date?: string | null;
  classes?: ClassRef | ClassRef[] | null;
}

export interface CalendarData {
  classes: CalendarClass[];
  error: string | null;
}

export async function getCalendarClasses(
  startDate: string,
  endDate: string,
  isAdmin: boolean
): Promise<CalendarData> {
  const supabase = createServerSupabase();

  if (!supabase) {
    return {
      classes: [],
      error:
        'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.',
    };
  }

  const columns = isAdmin
    ? 'id, name, guest_id, status, booking_date, classes(description, start_time)'
    : 'status, booking_date, classes(start_time)';

  const { data, error } = await supabase
    .from('bookings')
    .select(columns)
    .gte('booking_date', startDate)
    .lte('booking_date', endDate)
    .order('booking_date', { ascending: true });

  if (error) {
    console.error('Calendar fetch failed:', error.message);
    return { classes: [], error: 'Could not load the calendar.' };
  }

  const rows = ((data ?? []) as unknown as RawCalendarBooking[]).filter((row) => {
    const status = row.status ?? '';
    const date = row.booking_date ?? '';
    return (
      isVisibleOnCalendar(status) &&
      Boolean(date) &&
      date >= startDate &&
      date <= endDate
    );
  });

  const classes = rows.map((row, index): CalendarClass => {
    const status = row.status ?? '';
    const date = row.booking_date ?? '';

    return {
      id: isAdmin ? String(row.id) : `public_${index}`,
      date,
      time: extractTime(row.classes, status) || '00:00',
      description: isAdmin ? firstClass(row.classes)?.description ?? 'Custom' : null,
      guestName: isAdmin ? row.name ?? null : null,
      isPending: isPending(status),
    };
  });

  classes.sort((left, right) => {
    if (left.date !== right.date) {
      return left.date.localeCompare(right.date);
    }

    return left.time.localeCompare(right.time);
  });

  return { classes, error: null };
}
