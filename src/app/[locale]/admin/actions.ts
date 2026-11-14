'use server';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createAdminSession,
  deleteAdminSession,
  isAdminLoginConfigured,
  verifyAdminCredentials,
  verifyAdminSession,
} from '@/lib/admin/session';
import { createServerSupabase } from '@/lib/supabase/server';
import { extractTime, type ClassRef } from '@/lib/bookings';
import type { ActionResult, LoginState } from '@/lib/admin/action-types';

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

function unauthorizedResult(): ActionResult {
  return { ok: false, error: 'unauthorized' };
}

export async function adminLoginAction(
  _previousState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const locale = normalizeLocale(formData.get('locale'));
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!isAdminLoginConfigured()) {
    return { error: 'not-configured' };
  }

  if (!verifyAdminCredentials(username, password)) {
    return { error: 'invalid' };
  }

  await createAdminSession();
  redirect(`/${locale}/admin`);
}

export async function adminLogoutAction(formData: FormData): Promise<void> {
  const locale = normalizeLocale(formData.get('locale'));
  await deleteAdminSession();
  redirect(`/${locale}/admin`);
}

export async function approveBookingAction(
  id: unknown,
  time: unknown
): Promise<ActionResult> {
  if (!(await verifyAdminSession())) {
    return unauthorizedResult();
  }

  if (!isValidId(id) || !isValidTime(time)) {
    return { ok: false, error: 'invalid' };
  }

  const supabase = createServerSupabase();

  if (!supabase) {
    return { ok: false, error: 'not-configured' };
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: `Confirmed: ${time}` })
    .eq('id', id);

  if (error) {
    console.error('Booking approval failed:', error.message);
    return { ok: false, error: 'database' };
  }

  refresh();
  return { ok: true };
}

export async function declineBookingAction(id: unknown): Promise<ActionResult> {
  if (!(await verifyAdminSession())) {
    return unauthorizedResult();
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
    .select('status, classes(start_time)')
    .eq('id', id)
    .maybeSingle<{
      status?: string | null;
      classes?: ClassRef | ClassRef[] | null;
    }>();

  if (bookingError) {
    console.error('Booking decline lookup failed:', bookingError.message);
    return { ok: false, error: 'database' };
  }

  if (!booking) {
    return { ok: false, error: 'invalid' };
  }

  const time = extractTime(booking.classes, booking.status ?? '');
  const { error } = await supabase
    .from('bookings')
    .update({ status: `Cancelled${time ? `: ${time}` : ''}` })
    .eq('id', id);

  if (error) {
    console.error('Booking decline failed:', error.message);
    return { ok: false, error: 'database' };
  }

  refresh();
  return { ok: true };
}

export async function rescheduleBookingAction(
  id: unknown,
  date: unknown,
  time: unknown
): Promise<ActionResult> {
  if (!(await verifyAdminSession())) {
    return unauthorizedResult();
  }

  if (!isValidId(id) || !isValidDate(date) || !isValidTime(time)) {
    return { ok: false, error: 'invalid' };
  }

  const supabase = createServerSupabase();

  if (!supabase) {
    return { ok: false, error: 'not-configured' };
  }

  const { error } = await supabase
    .from('bookings')
    .update({ booking_date: date, status: `Confirmed: ${time}` })
    .eq('id', id);

  if (error) {
    console.error('Booking reschedule failed:', error.message);
    return { ok: false, error: 'database' };
  }

  refresh();
  return { ok: true };
}

export async function createAdminBookingAction(
  guestId: unknown,
  pin: unknown,
  date: unknown,
  time: unknown
): Promise<ActionResult> {
  if (!(await verifyAdminSession())) {
    return unauthorizedResult();
  }

  if (
    typeof guestId !== 'string' ||
    typeof pin !== 'string' ||
    !guestId.trim() ||
    !pin.trim() ||
    !isValidDate(date) ||
    !isValidTime(time)
  ) {
    return { ok: false, error: 'invalid' };
  }

  const supabase = createServerSupabase();

  if (!supabase) {
    return { ok: false, error: 'not-configured' };
  }

  const { data: guest, error: guestError } = await supabase
    .from('guests')
    .select('name')
    .eq('guest_id', guestId.trim())
    .eq('pin', pin.trim())
    .single();

  if (guestError || !guest) {
    return { ok: false, error: 'guest-not-found' };
  }

  const { error } = await supabase.from('bookings').insert([
    {
      guest_id: guestId.trim(),
      name: guest.name,
      booking_date: date,
      status: `Confirmed: ${time}`,
    },
  ]);

  if (error) {
    console.error('Admin booking creation failed:', error.message);
    return { ok: false, error: 'database' };
  }

  refresh();
  return { ok: true };
}
