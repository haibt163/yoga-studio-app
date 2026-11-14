'use client';

import { useTranslations } from 'next-intl';

interface ToastProps {
  message: string | null;
  tone?: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ message, tone = 'success', onClose }: ToastProps) {
  const t = useTranslations('Toast');

  if (!message) {
    return null;
  }

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      className={`fixed bottom-24 left-1/2 z-[120] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border px-5 py-4 text-sm shadow-xl ${
        tone === 'error'
          ? 'border-rose-200 bg-rose-50 text-rose-900'
          : 'border-emerald-200 bg-emerald-50 text-emerald-900'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="leading-relaxed">{message}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="rounded-full p-1 transition-opacity hover:opacity-70"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
