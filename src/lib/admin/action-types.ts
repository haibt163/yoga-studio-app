export type ActionError =
  | 'unauthorized'
  | 'invalid'
  | 'database'
  | 'not-configured'
  | 'guest-not-found';

export type ActionResult = { ok: true } | { ok: false; error: ActionError };

export const ACTION_ERROR_KEYS: Record<ActionError, string> = {
  unauthorized: 'unauthorized',
  invalid: 'invalid',
  database: 'database',
  'not-configured': 'notConfigured',
  'guest-not-found': 'guestNotFound',
};

export interface LoginState {
  error?: Extract<ActionError, 'invalid' | 'not-configured'>;
}
