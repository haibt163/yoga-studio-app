'use client';

import Image from 'next/image';
import { useActionState, useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { cleanEnv } from '@/lib/env';
import { guestLoginAction } from './actions';
import type { GuestLoginState } from '@/lib/guest/action-types';

const INITIAL_STATE: GuestLoginState = {};

function isZaloContactLink(base: string): boolean {
  try {
    const hostname = new URL(base).hostname.toLowerCase();
    return (
      hostname === 'zalo.me' ||
      hostname.endsWith('.zalo.me') ||
      hostname === 'zaloapp.com' ||
      hostname.endsWith('.zaloapp.com')
    );
  } catch {
    return false;
  }
}

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
  const [requestMessage, setRequestMessage] = useState('');
  const [showZaloPanel, setShowZaloPanel] = useState(false);
  const [requestCopyStatus, setRequestCopyStatus] = useState<'copied' | 'failed' | null>(
    null
  );
  const requestPanelRef = useRef<HTMLDivElement | null>(null);
  const requestMessageRef = useRef<HTMLTextAreaElement | null>(null);
  const contactLink = cleanEnv(process.env.NEXT_PUBLIC_CONTACT_LINK);

  const loginError =
    state.error === 'invalid'
      ? t('wrongCredentials')
      : state.error === 'not-configured'
        ? t('notConfigured')
        : state.error === 'database'
          ? errorsT('database')
          : null;

  useEffect(() => {
    if (showZaloPanel) {
      requestPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showZaloPanel, requestMessage]);

  function copyRequestMessage() {
    const textarea = requestMessageRef.current;

    if (!textarea || !requestMessage) {
      return;
    }

    // Invoke the modern clipboard API directly from the user's tap.
    let clipboardWrite: Promise<void> | undefined;
    try {
      clipboardWrite = navigator.clipboard?.writeText(requestMessage);
    } catch {
      clipboardWrite = undefined;
    }

    // Try the synchronous fallback in the same tap for older iOS and
    // in-app browsers that do not grant Clipboard API access.
    let copiedWithFallback = false;
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    try {
      copiedWithFallback = document.execCommand('copy');
    } catch {
      copiedWithFallback = false;
    }

    if (copiedWithFallback) {
      setRequestCopyStatus('copied');
      void clipboardWrite?.catch(() => undefined);
      return;
    }

    if (clipboardWrite) {
      void clipboardWrite
        .then(() => setRequestCopyStatus('copied'))
        .catch(() => setRequestCopyStatus('failed'));
      return;
    }

    setRequestCopyStatus('failed');
  }

  function handleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestError(null);

    if (!contactLink) {
      setRequestError(t('requestMissingContact'));
      return;
    }

    const message = [
      t('requestMessageIntro'),
      `${t('requestName')}: ${requestName.trim()}`,
      `${t('requestPhone')}: ${requestPhone.trim()}`,
      `${t('requestTime')}: ${requestTime.trim()}`,
    ].join('\n');

    if (isZaloContactLink(contactLink)) {
      setRequestMessage(message);
      setRequestCopyStatus(null);
      setShowZaloPanel(true);

      // Dismiss the mobile keyboard before scrolling the new panel into view.
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      return;
    }

    // Preserve the existing WhatsApp, email, and other contact-link flow.
    window.open(buildContactUrl(contactLink, message), '_blank', 'noopener,noreferrer');
  }

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-8 px-6 pb-20 pt-10 sm:pt-14 lg:grid-cols-2">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
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
              className="min-h-12 w-full border-b border-stone-300 bg-transparent py-3 text-base text-stone-900 focus:border-rose-700 focus:outline-none"
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
              className="min-h-12 w-full border-b border-stone-300 bg-transparent py-3 text-base tracking-widest text-stone-900 focus:border-rose-700 focus:outline-none"
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
            className="min-h-12 w-full rounded-full bg-rose-800 py-3 text-xs font-semibold uppercase tracking-widest text-white shadow-md transition-colors hover:bg-rose-900 disabled:opacity-50"
          >
            {pending ? t('loggingIn') : t('login')}
          </button>
          <p className="text-xs leading-relaxed text-stone-600">{t('rememberNote')}</p>
        </form>
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
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
              className="min-h-12 w-full border-b border-stone-300 bg-transparent py-3 text-base text-stone-900 focus:border-rose-700 focus:outline-none"
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
              className="min-h-12 w-full border-b border-stone-300 bg-transparent py-3 text-base text-stone-900 focus:border-rose-700 focus:outline-none"
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
              className="min-h-12 w-full border-b border-stone-300 bg-transparent py-3 text-base text-stone-900 focus:border-rose-700 focus:outline-none"
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
            className="min-h-12 w-full rounded-full border border-rose-200 bg-rose-50 py-3 text-xs font-semibold uppercase tracking-widest text-rose-800 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('requestSubmit')}
          </button>
          <p className="text-xs leading-relaxed text-stone-600">
            {contactLink ? t('requestNote') : t('requestMissingContact')}
          </p>
        </form>

        {showZaloPanel && (
          <div
            ref={requestPanelRef}
            aria-labelledby="zalo-request-title"
            className="mt-6 scroll-mt-6 rounded-2xl border border-rose-200 bg-rose-50/50 p-4 sm:p-5"
          >
            <h3
              id="zalo-request-title"
              className="mb-3 text-lg font-medium text-stone-900"
            >
              {t('requestPanelTitle')}
            </h3>
            <textarea
              ref={requestMessageRef}
              aria-label={t('requestMessageLabel')}
              readOnly
              rows={6}
              value={requestMessage}
              onFocus={(event) => event.currentTarget.select()}
              onClick={(event) => event.currentTarget.select()}
              className="min-h-36 w-full resize-y rounded-xl border border-stone-300 bg-white p-3 text-base leading-relaxed text-stone-800"
            />
            <button
              type="button"
              onClick={copyRequestMessage}
              className="mt-3 min-h-12 w-full rounded-full bg-rose-800 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-900"
            >
              {requestCopyStatus === 'copied'
                ? t('requestCopiedButton')
                : t('requestCopyButton')}
            </button>
            {requestCopyStatus === 'failed' && (
              <p role="alert" className="mt-3 text-sm leading-relaxed text-rose-800">
                {t('requestCopyFailed')}
              </p>
            )}
            <p className="mt-4 text-sm font-medium leading-relaxed text-stone-800">
              {t('requestInstructions')}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              {t('requestManualCopyNote')}
            </p>
            <a
              href={contactLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={copyRequestMessage}
              className="mt-4 flex min-h-12 w-full items-center justify-center rounded-full border border-rose-300 bg-white px-5 py-3 text-sm font-semibold text-rose-800 transition-colors hover:bg-rose-100"
            >
              {t('requestOpenZalo')}
            </a>
          </div>
        )}

        <div className="mt-8 hidden border-t border-stone-200 pt-6 md:block">
          <p className="mb-4 text-xs uppercase tracking-widest text-stone-600">
            {t('contactCta')}
          </p>
          <Image
            src="/qr-code.jpg"
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
