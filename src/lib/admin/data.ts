import { extractTime, type AdminBooking, type ClassRef } from '@/lib/bookings';
import { createServerSupabase } from '@/lib/supabase/server';

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

export interface AdminBookingsResult {
  bookings: AdminBooking[];
  error: 'not-configured' | 'database' | null;
}

export async function getAdminBookings(): Promise<AdminBookingsResult> {
  const supabase = createServerSupabase();

  if (!supabase) {
    return {
      bookings: [],
      error: 'not-configured',
    };
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('id, name, guest_id, status, booking_date, classes(description, start_time, end_time)')
    .order('booking_date', { ascending: true });

  if (error) {
    console.error('Admin bookings fetch failed:', error.message);
    return { bookings: [], error: 'database' };
  }

  const bookings = ((data ?? []) as unknown as RawBooking[]).map((row) => ({
    id: String(row.id),
    name: row.name ?? '',
    guestId: row.guest_id ?? '',
    status: row.status ?? '',
    bookingDate: row.booking_date ?? '',
    classes: (row.classes ?? null) as ClassRef | ClassRef[] | null,
  }));

  bookings.sort((left, right) => {
    if (left.bookingDate !== right.bookingDate) {
      return left.bookingDate.localeCompare(right.bookingDate);
    }

    return (extractTime(left.classes, left.status) || '23:59').localeCompare(
      extractTime(right.classes, right.status) || '23:59'
    );
  });

  return { bookings, error: null };
}
