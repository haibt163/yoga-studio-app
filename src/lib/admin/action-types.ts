export type ActionError =
  | 'unauthorized'
  | 'invalid'
  | 'database'
  | 'not-configured'
  | 'guest-not-found';

export type ActionResult = { ok: true } | { ok: false; error: ActionError };

export interface LoginState {
  error?: Extract<ActionError, 'invalid' | 'not-configured'>;
}
