'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { ACTION_ERROR_KEYS, type ActionResult } from '@/lib/admin/action-types';
import type { CalendarClass } from '@/lib/bookings';
import { getSlots, isPastSlot, slotKey } from '@/lib/schedule';
import { createAdminBookingAction } from '../admin/actions';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';

interface CalendarClientProps {
  locale: 'vi' | 'en';
  isAdmin: boolean;
  days: string[];
  nowTime: string;
  initialClasses: CalendarClass[];
  loadError: 'not-configured' | 'database' | null;
  feedPath: string;
}

export default function CalendarClient({
  locale,
  isAdmin,
  days,
  nowTime,
  initialClasses,
  loadError,
  feedPath,
}: CalendarClientProps) {
  const calT = useTranslations('Calendar');
  const adminT = useTranslations('Admin');
  const errorsT = useTranslations('Errors');
  const [showAdminBookModal, setShowAdminBookModal] = useState(false);
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('');
  const [bookGuestId, setBookGuestId] = useState('');
  const [bookPin, setBookPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const loadErrorMessage = loadError
    ? errorsT(loadError === 'not-configured' ? 'notConfigured' : 'database')
    : null;

  function handleSyncCalendar() {
    const currentHost = window.location.host;
    const protocol = window.location.protocol === 'https:' ? 'webcal://' : 'http://';
    const separator = feedPath.includes('?') ? '&' : '?';
    window.location.href = `${protocol}${currentHost}${feedPath}${separator}nocache=${Date.now()}`;
  }

  function openAdminBookModal(date: string, time: string) {
    setBookDate(date);
    setBookTime(time);
    setBookGuestId('');
    setBookPin('');
    setActionError(null);
    setShowAdminBookModal(true);
  }

  async function handleAdminBookSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setActionError(null);

    try {
      const result: ActionResult = await createAdminBookingAction(
        bookGuestId,
        bookPin,
        bookDate,
        bookTime
      );

      if (!result.ok) {
        setActionError(errorsT(ACTION_ERROR_KEYS[result.error]));
        return;
      }

      setShowAdminBookModal(false);
      setBookGuestId('');
      setBookPin('');
      setToast(calT('successAdded'));
    } catch {
      setActionError(
        locale === 'vi'
          ? 'Không thể kết nối tới máy chủ. Vui lòng thử lại.'
          : 'Could not reach the server. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <main className="mx-auto w-full max-w-7xl px-6 pb-20 pt-10 sm:pt-14">
        <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-light text-stone-900 sm:text-5xl">
              {calT('title')}
            </h1>
            <p className="text-stone-600">{calT('subtitle')}</p>
            {isAdmin && (
              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                {calT('adminNote')}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleSyncCalendar}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-stone-800 md:w-auto"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{calT('sync')}</span>
          </button>
        </header>

        {(loadError || actionError) && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-900"
          >
            {actionError ?? loadErrorMessage}
          </div>
        )}

        <div className="flex snap-x gap-4 overflow-x-auto pb-8 md:grid md:grid-cols-7 md:overflow-visible">
          {days.map((day) => {
            const date = new Date(`${day}T00:00:00Z`);
            const weekday = date.toLocaleDateString(locale, {
              weekday: 'short',
              timeZone: 'UTC',
            });
            const dayClasses = initialClasses.filter(
              (calendarClass) => calendarClass.date === day
            );
            const bookedTimes = dayClasses.map((calendarClass) => calendarClass.time);
            const daySlots = getSlots('guest', day);
            const isToday = day === days[0];
            const openSlots = daySlots.filter(
              (slot) =>
                !bookedTimes.includes(slot) &&
                !isPastSlot(day, slot, days[0], nowTime)
            );
            const slots = [
              ...dayClasses.map((calendarClass) => ({
                kind: 'booking' as const,
                ...calendarClass,
              })),
              ...openSlots.map((slot) => ({
                kind: 'open' as const,
                id: `open_${slotKey(day, slot)}`,
                time: slot,
              })),
            ].sort((left, right) => left.time.localeCompare(right.time));

            return (
              <section
                key={day}
                aria-label={weekday}
                className={`flex w-[260px] flex-none snap-center flex-col overflow-hidden rounded-3xl border bg-white md:w-auto ${
                  isToday
                    ? 'relative border-rose-700 shadow-md'
                    : 'border-stone-200 shadow-sm'
                }`}
              >
                {isToday && (
                  <div className="absolute left-0 top-0 h-1 w-full bg-rose-700" />
                )}

                <div
                  className={`border-b p-5 text-center ${
                    isToday ? 'border-rose-100 bg-rose-50/50' : 'border-stone-100'
                  }`}
                >
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-stone-600">
                    {weekday}
                  </span>
                  <span
                    className={`text-3xl font-light ${
                      isToday ? 'text-stone-900' : 'text-stone-700'
                    }`}
                  >
                    {date.getUTCDate()}
                  </span>
                </div>

                <div className="flex-grow space-y-3 bg-stone-50/40 p-4">
                  {slots.length === 0 ? (
                    <div className="flex min-h-[120px] items-center justify-center px-4 text-center text-xs uppercase tracking-widest text-stone-500">
                      {daySlots.length === 0 ? calT('offDay') : calT('noClasses')}
                    </div>
                  ) : (
                    slots.map((slot) => {
                      if (slot.kind === 'open') {
                        return (
                          <div
                            key={slot.id}
                            className="group flex items-center justify-between rounded-2xl border border-dashed border-stone-300 bg-white/70 p-3 transition-colors hover:border-rose-400"
                          >
                            <span className="text-sm font-medium text-stone-700">
                              {slot.time}
                            </span>
                            {isAdmin ? (
                              <button
                                type="button"
                                onClick={() => openAdminBookModal(day, slot.time)}
                                aria-label={`${calT('book')} ${slot.time}`}
                                className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-rose-800 transition-colors hover:bg-rose-100"
                              >
                                {calT('book')}
                              </button>
                            ) : (
                              <Link
                                href={`/${locale}/booking?date=${day}&time=${slot.time}`}
                                aria-label={`${calT('book')} ${slot.time}`}
                                className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-rose-800 transition-colors hover:bg-rose-100"
                              >
                                {calT('book')}
                              </Link>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={slot.id}
                          className={`rounded-2xl border p-4 transition-all ${
                            isAdmin
                              ? 'border-stone-200 bg-stone-50'
                              : 'border-stone-200 bg-stone-100'
                          } ${slot.isPending ? 'border-amber-200 bg-amber-50/40' : ''}`}
                        >
                          <p
                            className={`flex items-center justify-between text-sm font-medium ${
                              isAdmin ? 'text-stone-900' : 'text-stone-500 line-through'
                            }`}
                          >
                            <span>{slot.time}</span>
                            {slot.isPending && isAdmin && (
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-widest text-amber-700">
                                {adminT('statusPending')}
                              </span>
                            )}
                          </p>

                          {isAdmin ? (
                            <div className="mt-2">
                              <span className="block font-mono text-xs text-stone-600">
                                {slot.description || '—'}
                              </span>
                              <span className="mt-1 block text-xs font-semibold uppercase tracking-widest text-rose-700">
                                {slot.guestName || calT('unknown')}
                              </span>
                            </div>
                          ) : (
                            <span className="mt-1 block text-xs uppercase tracking-widest text-stone-600">
                              {calT('busy')}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      <Modal
        open={showAdminBookModal}
        onClose={() => setShowAdminBookModal(false)}
        title={calT('addBookingTitle')}
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowAdminBookModal(false)}
              disabled={isSaving}
              className="flex-1 rounded-full border border-stone-300 py-3 text-xs font-semibold uppercase tracking-widest text-stone-800 transition-colors hover:bg-stone-50 disabled:opacity-50"
            >
              {calT('cancel')}
            </button>
            <button
              type="submit"
              form="admin-booking-form"
              disabled={isSaving}
              className="flex-1 rounded-full bg-rose-800 py-3 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rose-900 disabled:opacity-50"
            >
              {isSaving ? '...' : calT('confirm')}
            </button>
          </>
        }
      >
        <p className="mb-6 text-sm text-stone-600">
          {bookDate} · {bookTime}
        </p>
        <form id="admin-booking-form" onSubmit={handleAdminBookSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="admin-guest-id"
              className="mb-1 block text-xs font-semibold uppercase tracking-widest text-stone-600"
            >
              {calT('guestId')}
            </label>
            <input
              id="admin-guest-id"
              type="text"
              value={bookGuestId}
              onChange={(event) => setBookGuestId(event.target.value)}
              className="w-full border-b border-stone-300 py-2 text-sm text-stone-900 focus:border-rose-700 focus:outline-none"
              placeholder="CN012"
              required
            />
          </div>
          <div>
            <label
              htmlFor="admin-guest-pin"
              className="mb-1 block text-xs font-semibold uppercase tracking-widest text-stone-600"
            >
              {calT('guestPin')}
            </label>
            <input
              id="admin-guest-pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={bookPin}
              onChange={(event) => setBookPin(event.target.value)}
              maxLength={6}
              className="w-full border-b border-stone-300 py-2 text-sm tracking-widest text-stone-900 focus:border-rose-700 focus:outline-none"
              placeholder="••••••"
              required
            />
          </div>
          {actionError && (
            <p role="alert" className="text-sm leading-relaxed text-rose-800">
              {actionError}
            </p>
          )}
        </form>
      </Modal>

      <Toast message={toast} onClose={() => setToast(null)} />
    </>
  );
}
