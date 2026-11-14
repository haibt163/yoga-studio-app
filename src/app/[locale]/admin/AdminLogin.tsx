'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { adminLoginAction } from './actions';
import type { LoginState } from '@/lib/admin/action-types';

const INITIAL_STATE: LoginState = {};

export default function AdminLogin({ locale }: { locale: 'vi' | 'en' }) {
  const t = useTranslations('Admin');
  const [state, formAction, pending] = useActionState(adminLoginAction, INITIAL_STATE);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-[2rem] border border-stone-200 bg-white p-8 shadow-xl"
      >
        <input type="hidden" name="locale" value={locale} />
        <h1 className="mb-8 text-center text-2xl font-light uppercase tracking-widest text-stone-900">
          {t('loginTitle')}
        </h1>
        <div className="mb-5">
          <label
            htmlFor="admin-login-username"
            className="mb-2 block text-xs font-semibold uppercase tracking-widest text-stone-600"
          >
            {t('username')}
          </label>
          <input
            id="admin-login-username"
            type="text"
            name="username"
            autoComplete="username"
            className="w-full border-b border-stone-300 bg-transparent py-2 text-stone-900 focus:border-rose-700 focus:outline-none"
            required
          />
        </div>
        <div className="mb-6">
          <label
            htmlFor="admin-login-password"
            className="mb-2 block text-xs font-semibold uppercase tracking-widest text-stone-600"
          >
            {t('password')}
          </label>
          <input
            id="admin-login-password"
            type="password"
            name="password"
            autoComplete="current-password"
            className="w-full border-b border-stone-300 bg-transparent py-2 tracking-widest text-stone-900 focus:border-rose-700 focus:outline-none"
            required
          />
        </div>
        {state.error && (
          <p role="alert" className="mb-6 text-sm leading-relaxed text-rose-800">
            {state.error === 'not-configured'
              ? t('notConfigured')
              : t('invalidCredentials')}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-rose-800 py-4 text-xs font-semibold uppercase tracking-widest text-white shadow-md transition-colors hover:bg-rose-900 disabled:opacity-50"
        >
          {pending ? '...' : t('signIn')}
        </button>
      </form>
    </main>
  );
}
