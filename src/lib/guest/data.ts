import {
  extractTime,
  isCancelled,
  type ClassRef,
  type GuestBooking,
} from '@/lib/bookings';
import { slotKey } from '@/lib/schedule';
import { addDays, getStudioDateString } from '@/lib/studio-date';
import { createServerSupabase } from '@/lib/supabase/server';

interface RawGuest {
  name?: string | null;
}

interface RawGuestBooking {
  id: string | number;
  status?: string | null;
  booking_date?: string | null;
  classes?: ClassRef | ClassRef[] | null;
}

export type GuestLoginResult =
  | { ok: true; guestId: string; name: string }
  | { ok: false; error: 'invalid' | 'database' | 'not-configured' };

export interface GuestDashboardResult {
  guestName: string | null;
  bookings: GuestBooking[];
  takenSlots: string[];
  error: 'database' | 'not-configured' | null;
}

export async function loginGuest(
  guestId: string,
  pin: string
): Promise<GuestLoginResult> {
  const supabase = createServerSupabase();

  if (!supabase) {
    return { ok: false, error: 'not-configured' };
  }

  const { data, error } = await supabase
    .from('guests')
    .select('name')
    .eq('guest_id', guestId)
    .eq('pin', pin)
    .single<RawGuest>();

  if (error) {
    if (error.code === 'PGRST116') {
      return { ok: false, error: 'invalid' };
    }

    console.error('Guest login failed:', error.message);
    return { ok: false, error: 'database' };
  }

  return { ok: true, guestId, name: data.name ?? '' };
}

export async function getGuestName(guestId: string): Promise<string | null> {
  const supabase = createServerSupabase();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from('guests')
    .select('name')
    .eq('guest_id', guestId)
    .maybeSingle<RawGuest>();

  return data?.name ?? null;
}

export async function getGuestDashboard(
  guestId: string
): Promise<GuestDashboardResult> {
  const supabase = createServerSupabase();

  if (!supabase) {
    return {
      guestName: null,
      bookings: [],
      takenSlots: [],
      error: 'not-configured',
    };
  }

  const today = getStudioDateString();
  const endDate = addDays(today, 34);

  const [guestResult, bookingsResult, allBookingsResult] = await Promise.all([
    supabase.from('guests').select('name').eq('guest_id', guestId).maybeSingle<RawGuest>(),
    supabase
      .from('bookings')
      .select('id, status, booking_date, classes(description, start_time)')
      .eq('guest_id', guestId)
      .gte('booking_date', today)
      .order('booking_date', { ascending: true }),
    supabase
      .from('bookings')
      .select('booking_date, status, classes(start_time)')
      .gte('booking_date', today)
      .lte('booking_date', endDate),
  ]);

  if (guestResult.error || bookingsResult.error || allBookingsResult.error) {
    console.error(
      'Guest dashboard fetch failed:',
      guestResult.error?.message ??
        bookingsResult.error?.message ??
        allBookingsResult.error?.message
    );
    return {
      guestName: null,
      bookings: [],
      takenSlots: [],
      error: 'database',
    };
  }

  const bookings = (
    (bookingsResult.data ?? []) as unknown as RawGuestBooking[]
  ).map((row) => ({
    id: String(row.id),
    status: row.status ?? '',
    bookingDate: row.booking_date ?? '',
    classes: (row.classes ?? null) as ClassRef | ClassRef[] | null,
  }));

  const takenSlots = Array.from(
    new Set(
      ((allBookingsResult.data ?? []) as unknown as RawGuestBooking[])
        .filter((row) => !isCancelled(row.status ?? ''))
        .map((row) =>
          slotKey(
            row.booking_date ?? '',
            extractTime(row.classes, row.status ?? '')
          )
        )
        .filter((key) => !key.startsWith('_') && !key.endsWith('_'))
    )
  );

  return {
    guestName: guestResult.data?.name ?? null,
    bookings,
    takenSlots,
    error: null,
  };
}
