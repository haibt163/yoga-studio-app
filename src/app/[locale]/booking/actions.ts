'use server';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import { extractTime, isCancelled, type ClassRef } from '@/lib/bookings';
import { createServerSupabase } from '@/lib/supabase/server';
import { getGuestName, loginGuest } from '@/lib/guest/data';
import {
  createGuestSession,
  deleteGuestSession,
  verifyGuestSession,
} from '@/lib/guest/session';
import { isPastSlot, isSlotAllowed } from '@/lib/schedule';
import { getStudioDateString, getStudioTimeString } from '@/lib/studio-date';
import type {
  BookingActionResult,
  GuestLoginState,
} from '@/lib/guest/action-types';

interface RawConflictRow {
  id: string | number;
  status?: string | null;
  classes?: ClassRef | ClassRef[] | null;
}

function normalizeLocale(value: FormDataEntryValue | null): 'vi' | 'en' {
  return value === 'en' ? 'en' : 'vi';
}

function isValidId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 100;
}

function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function unauthorized(): BookingActionResult {
  return { ok: false, error: 'unauthorized' };
}

async function slotConflict(
  date: string,
  time: string,
  excludeId?: string
): Promise<'conflict' | 'free' | 'database'> {
  const supabase = createServerSupabase();

  if (!supabase) {
    return 'database';
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('id, status, classes(start_time)')
    .eq('booking_date', date);

  if (error) {
    console.error('Slot conflict check failed:', error.message);
    return 'database';
  }

  const conflict = ((data ?? []) as unknown as RawConflictRow[]).some(
    (row) =>
      String(row.id) !== excludeId &&
      !isCancelled(row.status ?? '') &&
      extractTime(row.classes, row.status ?? '') === time
  );

  return conflict ? 'conflict' : 'free';
}

export async function guestLoginAction(
  _previousState: GuestLoginState,
  formData: FormData
): Promise<GuestLoginState> {
  const locale = normalizeLocale(formData.get('locale'));
  const guestId = String(formData.get('guestId') ?? '').trim();
  const pin = String(formData.get('pin') ?? '').trim();
  const date = String(formData.get('date') ?? '');
  const time = String(formData.get('time') ?? '');

  if (!guestId || !pin) {
    return { error: 'invalid' };
  }

  const result = await loginGuest(guestId, pin);

  if (!result.ok) {
    return {
      error:
        result.error === 'not-configured'
          ? 'not-configured'
          : result.error === 'database'
            ? 'database'
            : 'invalid',
    };
  }

  try {
    await createGuestSession(result.guestId);
  } catch {
    return { error: 'not-configured' };
  }

  const query =
    isValidDate(date) && isValidTime(time)
      ? `?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`
      : '';

  redirect(`/${locale}/booking${query}`);
}

export async function guestLogoutAction(formData: FormData): Promise<void> {
  const locale = normalizeLocale(formData.get('locale'));
  await deleteGuestSession();
  redirect(`/${locale}/booking`);
}

export async function createBookingAction(
  date: unknown,
  time: unknown
): Promise<BookingActionResult> {
  const session = await verifyGuestSession();

  if (!session) {
    return unauthorized();
  }

  if (
    !isValidDate(date) ||
    !isValidTime(time) ||
    !isSlotAllowed('guest', date, time)
  ) {
    return { ok: false, error: 'invalid' };
  }

  const today = getStudioDateString();

  if (isPastSlot(date, time, today, getStudioTimeString())) {
    return { ok: false, error: 'invalid' };
  }

  const supabase = createServerSupabase();

  if (!supabase) {
    return { ok: false, error: 'not-configured' };
  }

  const name = await getGuestName(session.guestId);

  if (!name) {
    return { ok: false, error: 'not-found' };
  }

  const conflict = await slotConflict(date, time);

  if (conflict === 'conflict') {
    return { ok: false, error: 'slot-taken' };
  }

  if (conflict === 'database') {
    return { ok: false, error: 'database' };
  }

  const { error } = await supabase.from('bookings').insert([
    {
      guest_id: session.guestId,
      name,
      booking_date: date,
      status: `Pending: ${time}`,
    },
  ]);

  if (error) {
    console.error('Booking creation failed:', error.message);
    return { ok: false, error: 'database' };
  }

  refresh();
  return { ok: true };
}

export async function rescheduleBookingAction(
  id: unknown,
  date: unknown,
  time: unknown
): Promise<BookingActionResult> {
  const session = await verifyGuestSession();

  if (!session) {
    return unauthorized();
  }

  if (
    !isValidId(id) ||
    !isValidDate(date) ||
    !isValidTime(time) ||
    !isSlotAllowed('guest', date, time)
  ) {
    return { ok: false, error: 'invalid' };
  }

  const today = getStudioDateString();

  if (isPastSlot(date, time, today, getStudioTimeString())) {
    return { ok: false, error: 'invalid' };
  }

  const supabase = createServerSupabase();

  if (!supabase) {
    return { ok: false, error: 'not-configured' };
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('id', id)
    .eq('guest_id', session.guestId)
    .maybeSingle<{ id: string | number; status?: string | null }>();

  if (bookingError) {
    console.error('Booking ownership check failed:', bookingError.message);
    return { ok: false, error: 'database' };
  }

  if (!booking) {
    return { ok: false, error: 'not-found' };
  }

  if (isCancelled(booking.status ?? '')) {
    return { ok: false, error: 'invalid' };
  }

  const conflict = await slotConflict(date, time, id);

  if (conflict === 'conflict') {
    return { ok: false, error: 'slot-taken' };
  }

  if (conflict === 'database') {
    return { ok: false, error: 'database' };
  }

  const { error } = await supabase
    .from('bookings')
    .update({ booking_date: date, status: `Pending: ${time}` })
    .eq('id', id)
    .eq('guest_id', session.guestId);

  if (error) {
    console.error('Booking reschedule failed:', error.message);
    return { ok: false, error: 'database' };
  }

  refresh();
  return { ok: true };
}

export async function cancelBookingAction(id: unknown): Promise<BookingActionResult> {
  const session = await verifyGuestSession();

  if (!session) {
    return unauthorized();
  }

  if (!isValidId(id)) {
    return { ok: false, error: 'invalid' };
  }

  const supabase = createServerSupabase();

  if (!supabase) {
    return { ok: false, error: 'not-configured' };
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, status, classes(start_time)')
    .eq('id', id)
    .eq('guest_id', session.guestId)
    .maybeSingle<{
      id: string | number;
      status?: string | null;
      classes?: ClassRef | ClassRef[] | null;
    }>();

  if (bookingError) {
    console.error('Booking ownership check failed:', bookingError.message);
    return { ok: false, error: 'database' };
  }

  if (!booking) {
    return { ok: false, error: 'not-found' };
  }

  if (isCancelled(booking.status ?? '')) {
    return { ok: true };
  }

  const time = extractTime(booking.classes, booking.status ?? '');

  const { error } = await supabase
    .from('bookings')
    .update({ status: `Cancelled${time ? `: ${time}` : ''}` })
    .eq('id', id)
    .eq('guest_id', session.guestId);

  if (error) {
    console.error('Booking cancellation failed:', error.message);
    return { ok: false, error: 'database' };
  }

  refresh();
  return { ok: true };
}
