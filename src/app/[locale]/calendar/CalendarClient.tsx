'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { actionErrorMessage } from '@/lib/action-errors';
import type { ActionResult } from '@/lib/admin/action-types';
import type { CalendarClass } from '@/lib/bookings';
import { getWeekday, timeToMinutes } from '@/lib/studio-date';
import { createAdminBookingAction } from '../admin/actions';

const SLOTS_BY_WEEKDAY: Record<number, string[]> = {
  0: ['09:30'],
  1: ['08:00', '09:00'],
  2: ['06:00', '07:00'],
  4: ['16:00'],
  6: ['16:00'],
};

interface CalendarClientProps {
  locale: 'vi' | 'en';
  isAdmin: boolean;
  days: string[];
  nowTime: string;
  initialClasses: CalendarClass[];
  loadError: string | null;
}

export default function CalendarClient({
  locale,
  isAdmin,
  days,
  nowTime,
  initialClasses,
  loadError,
}: CalendarClientProps) {
  const calT = useTranslations('Calendar');
  const navT = useTranslations('Navigation');
  const [showAdminBookModal, setShowAdminBookModal] = useState(false);
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('');
  const [bookGuestId, setBookGuestId] = useState('');
  const [bookPin, setBookPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const nowMinutes = timeToMinutes(nowTime);

  function handleSyncCalendar() {
    const currentHost = window.location.host;
    const protocol = window.location.protocol === 'https:' ? 'webcal://' : 'http://';
    window.location.href = `${protocol}${currentHost}/api/calendar/feed?nocache=${Date.now()}`;
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
        setActionError(actionErrorMessage(result.error, locale));
        return;
      }

      setShowAdminBookModal(false);
      setBookGuestId('');
      setBookPin('');
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
    <div className="min-h-screen pb-20 bg-stone-50 font-sans selection:bg-rose-200">
      <nav className="w-full px-8 pt-[max(env(safe-area-inset-top),1.5rem)] pb-6 flex justify-between items-center border-b border-stone-200/50 bg-white/90 backdrop-blur-md sticky top-0 z-50 transition-all ios-header-fix">
        <Link
          href={`/${locale}`}
          className="text-xl tracking-widest font-light uppercase text-stone-900"
        >
          Yoga<span className="font-semibold text-rose-700"> with Chang</span>
        </Link>
        <div className="flex space-x-6 items-center">
          <Link
            href={`/${locale}/admin`}
            className={`text-[10px] uppercase tracking-widest font-bold transition-colors ${
              isAdmin ? 'text-rose-700 hover:text-rose-900' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            {isAdmin ? calT('adminOn') : calT('adminOff')}
          </Link>
          <Link
            href={`/${locale}/booking`}
            className="text-xs uppercase tracking-widest text-stone-500 hover:text-rose-700 transition-colors"
          >
            {navT('booking')}
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-12">
        <header className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end">
          <div>
            <h1 className="text-4xl font-light text-stone-900 mb-2 italic">
              {calT('title')}
            </h1>
            <p className="text-stone-500">{calT('subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={handleSyncCalendar}
            className="mt-6 md:mt-0 px-6 py-3 bg-stone-900 text-white rounded-full text-xs tracking-widest uppercase hover:bg-stone-800 transition-all shadow-md flex items-center justify-center space-x-2 w-full md:w-auto"
          >
            <svg
              className="w-4 h-4"
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
            className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800"
          >
            {actionError ?? loadError}
          </div>
        )}

        <div className="flex md:grid md:grid-cols-7 overflow-x-auto gap-4 pb-8 snap-x scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
          {days.map((day) => {
            const date = new Date(`${day}T00:00:00Z`);
            const weekday = date.toLocaleDateString(locale, {
              weekday: 'short',
              timeZone: 'UTC',
            });
            const dayClasses = initialClasses.filter(
              (calendarClass) => calendarClass.date === day
            );
            const bookedTimes = dayClasses.map(
              (calendarClass) => calendarClass.time
            );
            const possibleSlots = SLOTS_BY_WEEKDAY[getWeekday(day)] ?? [];
            const isToday = day === days[0];
            const vacantSlots = possibleSlots.filter((slot) => {
              if (bookedTimes.includes(slot)) {
                return false;
              }

              return !isToday || timeToMinutes(slot) > nowMinutes;
            });

            const slots = [
              ...dayClasses.map((calendarClass) => ({
                kind: 'booking' as const,
                ...calendarClass,
              })),
              ...(isAdmin
                ? vacantSlots.map((slot) => ({
                    kind: 'vacant' as const,
                    id: `vacant_${day}_${slot}`,
                    time: slot,
                  }))
                : []),
            ].sort((left, right) => left.time.localeCompare(right.time));

            return (
              <div
                key={day}
                className={`flex-none w-[260px] md:w-auto flex flex-col bg-white rounded-3xl border ${
                  isToday
                    ? 'border-rose-700 shadow-md relative'
                    : 'border-stone-100 shadow-sm'
                } overflow-hidden snap-center`}
              >
                {isToday && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-rose-700" />
                )}

                <div
                  className={`p-5 text-center border-b ${
                    isToday ? 'bg-rose-50/50' : 'border-stone-50'
                  }`}
                >
                  <span className="block text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">
                    {weekday}
                  </span>
                  <span
                    className={`text-3xl font-light ${
                      isToday ? 'text-stone-900' : 'text-stone-600'
                    }`}
                  >
                    {date.getUTCDate()}
                  </span>
                </div>

                <div className="p-4 space-y-3 flex-grow bg-stone-50/20">
                  {slots.length === 0 ? (
                    <div className="h-full min-h-[120px] flex items-center justify-center text-[10px] text-stone-300 uppercase tracking-widest text-center px-4">
                      {possibleSlots.length === 0
                        ? locale === 'vi'
                          ? 'Nghỉ'
                          : 'Off day'
                        : calT('empty')}
                    </div>
                  ) : (
                    slots.map((slot) => {
                      if (slot.kind === 'vacant') {
                        return (
                          <div
                            key={slot.id}
                            className="p-3 rounded-2xl border border-dashed border-stone-300 bg-transparent flex justify-between items-center group hover:border-rose-400 transition-colors"
                          >
                            <span className="text-sm font-medium text-stone-400">
                              {slot.time}
                            </span>
                            <button
                              type="button"
                              onClick={() => openAdminBookModal(day, slot.time)}
                              aria-label={`${calT('book')} ${slot.time}`}
                              className="text-[10px] uppercase tracking-widest text-rose-700 font-bold opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-opacity px-3 py-1 bg-rose-50 rounded-full"
                            >
                              {calT('book')}
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={slot.id}
                          className={`p-4 rounded-2xl border ${
                            isAdmin
                              ? 'bg-stone-50 border-stone-200'
                              : 'bg-stone-100 border-transparent'
                          } ${
                            slot.isPending
                              ? 'border-amber-200 bg-amber-50/30'
                              : ''
                          } transition-all`}
                        >
                          <p
                            className={`text-sm font-medium flex justify-between items-center ${
                              isAdmin
                                ? 'text-stone-900'
                                : 'text-stone-400 line-through'
                            }`}
                          >
                            <span>{slot.time}</span>
                            {slot.isPending && isAdmin && (
                              <span className="text-[9px] text-amber-600 font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-100">
                                Pending
                              </span>
                            )}
                          </p>

                          {isAdmin ? (
                            <div className="mt-2">
                              <span className="block text-xs font-mono text-stone-500">
                                {slot.description || '—'}
                              </span>
                              <span className="block text-[10px] uppercase tracking-widest text-rose-600 mt-1 font-semibold">
                                {slot.guestName || calT('unknown')}
                              </span>
                            </div>
                          ) : (
                            <div className="mt-1">
                              <span className="text-[10px] uppercase tracking-widest text-stone-400">
                                {calT('busy')}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {showAdminBookModal && isAdmin && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110]">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-light mb-2 text-stone-900">
              {locale === 'vi' ? 'Thêm Lịch Tập' : 'Add Booking'}
            </h3>
            <p className="text-sm text-stone-500 mb-6">
              {bookDate} · {bookTime}
            </p>
            <form onSubmit={handleAdminBookSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="admin-guest-id"
                  className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1"
                >
                  Guest ID
                </label>
                <input
                  id="admin-guest-id"
                  type="text"
                  value={bookGuestId}
                  onChange={(event) => setBookGuestId(event.target.value)}
                  className="w-full border-b border-stone-300 py-2 text-sm focus:outline-none focus:border-rose-700 text-stone-900"
                  placeholder="e.g. CN012"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="admin-guest-pin"
                  className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1"
                >
                  Guest PIN
                </label>
                <input
                  id="admin-guest-pin"
                  type="password"
                  value={bookPin}
                  onChange={(event) => setBookPin(event.target.value)}
                  maxLength={6}
                  className="w-full border-b border-stone-300 py-2 text-sm focus:outline-none focus:border-rose-700 text-stone-900 tracking-widest"
                  placeholder="••••••"
                  required
                />
              </div>
              {actionError && (
                <p role="alert" className="text-sm text-rose-700 leading-relaxed">
                  {actionError}
                </p>
              )}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdminBookModal(false)}
                  disabled={isSaving}
                  className="flex-1 py-3 text-xs border border-stone-200 rounded-full uppercase tracking-widest text-stone-900 hover:bg-stone-50 disabled:opacity-50"
                >
                  {calT('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 text-xs bg-rose-800 text-white rounded-full uppercase tracking-widest hover:bg-rose-900 disabled:opacity-50 shadow-md"
                >
                  {isSaving
                    ? '...'
                    : locale === 'vi'
                      ? 'Xác Nhận'
                      : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
