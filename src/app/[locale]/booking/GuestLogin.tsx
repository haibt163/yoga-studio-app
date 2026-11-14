'use client';

import Image from 'next/image';
import { useActionState, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { cleanEnv } from '@/lib/env';
import { guestLoginAction } from './actions';
import type { GuestLoginState } from '@/lib/guest/action-types';

const INITIAL_STATE: GuestLoginState = {};

function buildContactUrl(base: string, message: string): string {
  if (base.startsWith('mailto:')) {
    return `${base}?subject=${encodeURIComponent('First yoga session request')}&body=${encodeURIComponent(message)}`;
  }

  try {
    const url = new URL(base);
    url.searchParams.set('text', message);
    return url.toString();
  } catch {
    return base;
  }
}

interface GuestLoginProps {
  locale: 'vi' | 'en';
  initialDate: string;
  initialTime: string;
  systemError?: string;
}

export default function GuestLogin({
  locale,
  initialDate,
  initialTime,
  systemError,
}: GuestLoginProps) {
  const t = useTranslations('Booking');
  const errorsT = useTranslations('Errors');
  const [state, formAction, pending] = useActionState(guestLoginAction, INITIAL_STATE);
  const [requestName, setRequestName] = useState('');
  const [requestPhone, setRequestPhone] = useState('');
  const [requestTime, setRequestTime] = useState('');
  const [requestError, setRequestError] = useState<string | null>(null);
  const contactLink = cleanEnv(process.env.NEXT_PUBLIC_CONTACT_LINK);

  const loginError =
    state.error === 'invalid'
      ? t('wrongCredentials')
      : state.error === 'not-configured'
        ? t('notConfigured')
        : state.error === 'database'
          ? errorsT('database')
          : null;

  function handleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestError(null);

    if (!contactLink) {
      setRequestError(t('requestMissingContact'));
      return;
    }

    const message = [
      t('requestMessageIntro'),
      `${t('requestName')}: ${requestName}`,
      `${t('requestPhone')}: ${requestPhone}`,
      `${t('requestTime')}: ${requestTime}`,
    ].join('\n');

    window.open(buildContactUrl(contactLink, message), '_blank', 'noopener,noreferrer');
  }

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-8 px-6 pb-20 pt-10 sm:pt-14 lg:grid-cols-2">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="mb-2 text-3xl font-light text-stone-900 sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-stone-600">
          {t('subtitle')}
        </p>

        {systemError && (
          <p
            role="alert"
            className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-relaxed text-rose-900"
          >
            {systemError}
          </p>
        )}

        <form action={formAction} className="space-y-5">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="date" value={initialDate} />
          <input type="hidden" name="time" value={initialTime} />
          <div>
            <label
              htmlFor="guest-id"
              className="mb-2 block text-xs font-semibold uppercase tracking-widest text-stone-600"
            >
              {t('guestId')}
            </label>
            <input
              id="guest-id"
              name="guestId"
              type="text"
              autoComplete="username"
              className="w-full border-b border-stone-300 bg-transparent py-2 text-stone-900 focus:border-rose-700 focus:outline-none"
              required
            />
          </div>
          <div>
            <label
              htmlFor="guest-pin"
              className="mb-2 block text-xs font-semibold uppercase tracking-widest text-stone-600"
            >
              {t('pin')}
            </label>
            <input
              id="guest-pin"
              name="pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              pattern="[0-9]*"
              maxLength={6}
              className="w-full border-b border-stone-300 bg-transparent py-2 tracking-widest text-stone-900 focus:border-rose-700 focus:outline-none"
              required
            />
          </div>
          {loginError && (
            <p role="alert" className="text-sm leading-relaxed text-rose-800">
              {loginError}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-rose-800 py-4 text-xs font-semibold uppercase tracking-widest text-white shadow-md transition-colors hover:bg-rose-900 disabled:opacity-50"
          >
            {pending ? t('loggingIn') : t('login')}
          </button>
          <p className="text-xs leading-relaxed text-stone-600">{t('rememberNote')}</p>
        </form>
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="mb-2 text-2xl font-light text-stone-900">{t('newHereTitle')}</h2>
        <p className="mb-6 text-sm leading-relaxed text-stone-600">{t('newHereBody')}</p>

        <form onSubmit={handleRequest} className="space-y-5">
          <div>
            <label
              htmlFor="request-name"
              className="mb-2 block text-xs font-semibold uppercase tracking-widest text-stone-600"
            >
              {t('requestName')}
            </label>
            <input
              id="request-name"
              type="text"
              value={requestName}
              onChange={(event) => setRequestName(event.target.value)}
              className="w-full border-b border-stone-300 bg-transparent py-2 text-stone-900 focus:border-rose-700 focus:outline-none"
              required
            />
          </div>
          <div>
            <label
              htmlFor="request-phone"
              className="mb-2 block text-xs font-semibold uppercase tracking-widest text-stone-600"
            >
              {t('requestPhone')}
            </label>
            <input
              id="request-phone"
              type="tel"
              value={requestPhone}
              onChange={(event) => setRequestPhone(event.target.value)}
              className="w-full border-b border-stone-300 bg-transparent py-2 text-stone-900 focus:border-rose-700 focus:outline-none"
              required
            />
          </div>
          <div>
            <label
              htmlFor="request-time"
              className="mb-2 block text-xs font-semibold uppercase tracking-widest text-stone-600"
            >
              {t('requestTime')}
            </label>
            <input
              id="request-time"
              type="text"
              value={requestTime}
              onChange={(event) => setRequestTime(event.target.value)}
              className="w-full border-b border-stone-300 bg-transparent py-2 text-stone-900 focus:border-rose-700 focus:outline-none"
              placeholder={t('requestTimePlaceholder')}
              required
            />
          </div>
          {requestError && (
            <p role="alert" className="text-sm leading-relaxed text-rose-800">
              {requestError}
            </p>
          )}
          <button
            type="submit"
            disabled={!contactLink}
            className="w-full rounded-full border border-rose-200 bg-rose-50 py-4 text-xs font-semibold uppercase tracking-widest text-rose-800 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('requestSubmit')}
          </button>
          <p className="text-xs leading-relaxed text-stone-600">
            {contactLink ? t('requestNote') : t('requestMissingContact')}
          </p>
        </form>

        <div className="mt-8 hidden border-t border-stone-200 pt-6 md:block">
          <p className="mb-4 text-xs uppercase tracking-widest text-stone-600">
            {t('contactCta')}
          </p>
          <Image
            src="/qr-code.png"
            alt={t('contactCta')}
            width={160}
            height={160}
            className="h-40 w-40 rounded-2xl border border-stone-200 object-contain p-2"
          />
        </div>
      </section>
    </main>
  );
}
