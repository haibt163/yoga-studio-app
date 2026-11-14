export type BookingError =
  | 'unauthorized'
  | 'invalid'
  | 'database'
  | 'not-configured'
  | 'slot-taken'
  | 'not-found';

export type BookingActionResult = { ok: true } | { ok: false; error: BookingError };

export const BOOKING_ERROR_KEYS: Record<BookingError, string> = {
  unauthorized: 'unauthorized',
  invalid: 'invalid',
  database: 'database',
  'not-configured': 'notConfigured',
  'slot-taken': 'slotTaken',
  'not-found': 'notFound',
};

export interface GuestLoginState {
  error?: 'invalid' | 'not-configured' | 'database';
}
