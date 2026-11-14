'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  extractTime,
  firstClass,
  isCancelled,
  isPending,
  type AdminBooking,
} from '@/lib/bookings';
import {
  ACTION_ERROR_KEYS,
  type ActionResult,
} from '@/lib/admin/action-types';
import { slotKey } from '@/lib/schedule';
import {
  adminLogoutAction,
  approveBookingAction,
  declineBookingAction,
  rescheduleBookingAction,
} from './actions';
import Modal from '@/components/Modal';
import SlotPicker from '@/components/SlotPicker';
import Toast from '@/components/Toast';

interface AdminDashboardProps {
  bookings: AdminBooking[];
  loadError: 'not-configured' | 'database' | null;
  locale: 'vi' | 'en';
  today: string;
  days: string[];
  nowTime: string;
}

export default function AdminDashboard({
  bookings,
  loadError,
  locale,
  today,
  days,
  nowTime,
}: AdminDashboardProps) {
  const t = useTranslations('Admin');
  const commonT = useTranslations('Common');
  const errorsT = useTranslations('Errors');
  const [editing, setEditing] = useState<AdminBooking | null>(null);
  const [cancelling, setCancelling] = useState<AdminBooking | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const takenSlots = useMemo(
    () =>
      new Set(
        bookings
          .filter((booking) => !isCancelled(booking.status))
          .map((booking) =>
            slotKey(
              booking.bookingDate,
              extractTime(booking.classes, booking.status)
            )
          )
      ),
    [bookings]
  );

  const pendingCount = bookings.filter((booking) => isPending(booking.status)).length;
  const loadErrorMessage = loadError
    ? errorsT(loadError === 'not-configured' ? 'notConfigured' : 'database')
    : null;

  function formatDate(date: string): string {
    return new Date(`${date}T00:00:00Z`).toLocaleDateString(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });
  }

  function statusLabel(status: string): string {
    if (isCancelled(status)) {
      return t('statusCancelled');
    }

    if (isPending(status)) {
      return t('statusPending');
    }

    return t('statusConfirmed');
  }

  async function runAction(
    action: () => Promise<ActionResult>,
    successMessage: string,
    onSuccess?: () => void
  ) {
    setIsSaving(true);
    setActionError(null);

    try {
      const result = await action();

      if (!result.ok) {
        setActionError(errorsT(ACTION_ERROR_KEYS[result.error]));
        return;
      }

      setToast(successMessage);
      onSuccess?.();
    } catch {
      setActionError(t('errorGeneric'));
    } finally {
      setIsSaving(false);
    }
  }

  function handleApprove(booking: AdminBooking) {
    const time = extractTime(booking.classes, booking.status);

    if (!time) {
      setActionError(errorsT('invalid'));
      return;
    }

    void runAction(
      () => approveBookingAction(booking.id, time),
      t('successApproved')
    );
  }

  function openReschedule(booking: AdminBooking) {
    setEditing(booking);
    setSelectedDate('');
    setSelectedTime('');
    setActionError(null);
  }

  function submitReschedule() {
    if (!editing || !selectedDate || !selectedTime) {
      return;
    }

    void runAction(
      () => rescheduleBookingAction(editing.id, selectedDate, selectedTime),
      t('successRescheduled'),
      () => setEditing(null)
    );
  }

  function confirmDecline() {
    if (!cancelling) {
      return;
    }

    void runAction(
      () => declineBookingAction(cancelling.id),
      t('successDeclined'),
      () => setCancelling(null)
    );
  }

  return (
    <>
      <main className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10 sm:pt-14">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-light text-stone-900 sm:text-5xl">
              {t('dashboardTitle')}
            </h1>
            <p className="text-stone-600">{t('dashboardSubtitle')}</p>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-stone-600">
              {t('scheduleNote')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest">
            <span className="text-stone-600">
              {t('total')}: {bookings.length}
            </span>
            {pendingCount > 0 && (
              <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 font-semibold text-rose-800">
                {pendingCount} {t('pendingCount')}
              </span>
            )}
            <Link
              href={`/${locale}/calendar`}
              className="rounded-full border border-stone-300 px-4 py-2 text-stone-700 transition-colors hover:border-rose-300 hover:text-rose-800"
            >
              {t('calendarLink')}
            </Link>
            <form action={adminLogoutAction}>
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className="rounded-full border border-stone-300 px-4 py-2 text-stone-700 transition-colors hover:border-rose-300 hover:text-rose-800"
              >
                {t('logout')}
              </button>
            </form>
          </div>
        </div>

        {(loadError || actionError) && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-900"
          >
            {actionError ?? loadErrorMessage}
          </div>
        )}

        <div className="overflow-x-auto rounded-3xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="p-4 pl-6 text-xs font-semibold uppercase tracking-widest text-stone-600">
                  {t('dateTime')}
                </th>
                <th className="p-4 text-xs font-semibold uppercase tracking-widest text-stone-600">
                  {t('guest')}
                </th>
                <th className="p-4 text-xs font-semibold uppercase tracking-widest text-stone-600">
                  {t('class')}
                </th>
                <th className="p-4 text-xs font-semibold uppercase tracking-widest text-stone-600">
                  {t('status')}
                </th>
                <th className="p-4 pr-6 text-xs font-semibold uppercase tracking-widest text-stone-600">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-stone-600">
                    {t('noBookings')}
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const pending = isPending(booking.status);
                  const cancelled = isCancelled(booking.status);
                  const classItem = firstClass(booking.classes);
                  const time = extractTime(booking.classes, booking.status);

                  return (
                    <tr
                      key={booking.id}
                      className={`border-b border-stone-100 last:border-0 ${
                        pending ? 'bg-orange-50/40' : ''
                      }`}
                    >
                      <td className="whitespace-nowrap p-4 pl-6">
                        <span
                          className={`block font-medium ${
                            cancelled ? 'text-stone-500 line-through' : 'text-stone-900'
                          }`}
                        >
                          {formatDate(booking.bookingDate)}
                        </span>
                        <span className="text-sm text-stone-600">{time || '—'}</span>
                      </td>
                      <td className="p-4">
                        <span className="block font-medium text-stone-900">
                          {booking.name || '—'}
                        </span>
                        <span className="text-xs uppercase tracking-widest text-stone-600">
                          {booking.guestId || '—'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-stone-700">
                        {classItem?.description || '—'}
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-widest ${
                            pending
                              ? 'bg-orange-100 text-orange-800'
                              : cancelled
                                ? 'bg-stone-100 text-stone-600'
                                : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {statusLabel(booking.status)}
                        </span>
                      </td>
                      <td className="space-x-2 whitespace-nowrap p-4 pr-6">
                        {pending && (
                          <button
                            type="button"
                            onClick={() => handleApprove(booking)}
                            disabled={isSaving}
                            className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-stone-800 disabled:opacity-50"
                          >
                            {t('approve')}
                          </button>
                        )}
                        {!cancelled && (
                          <>
                            <button
                              type="button"
                              onClick={() => openReschedule(booking)}
                              disabled={isSaving}
                              className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-50"
                            >
                              {t('reschedule')}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCancelling(booking);
                                setActionError(null);
                              }}
                              disabled={isSaving}
                              className="px-2 py-2 text-xs font-semibold uppercase tracking-widest text-rose-700 transition-colors hover:text-rose-900 disabled:opacity-50"
                            >
                              {t('cancel')}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      <Modal
        open={Boolean(editing)}
        onClose={() => {
          if (!isSaving) {
            setEditing(null);
          }
        }}
        title={t('rescheduleTitle')}
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditing(null)}
              disabled={isSaving}
              className="flex-1 rounded-full border border-stone-300 py-3 text-xs font-semibold uppercase tracking-widest text-stone-800 hover:bg-stone-50 disabled:opacity-50"
            >
              {commonT('cancel')}
            </button>
            <button
              type="button"
              onClick={submitReschedule}
              disabled={!selectedDate || !selectedTime || isSaving}
              className="flex-1 rounded-full bg-rose-800 py-3 text-xs font-semibold uppercase tracking-widest text-white hover:bg-rose-900 disabled:opacity-50"
            >
              {isSaving ? '...' : t('confirmReschedule')}
            </button>
          </>
        }
      >
        <SlotPicker
          locale={locale}
          days={days}
          mode="admin"
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          takenSlots={takenSlots}
          today={today}
          nowTime={nowTime}
          onSelectDate={setSelectedDate}
          onSelectTime={setSelectedTime}
          disabled={isSaving}
        />
        {actionError && (
          <p role="alert" className="mt-4 text-sm leading-relaxed text-rose-800">
            {actionError}
          </p>
        )}
      </Modal>

      <Modal
        open={Boolean(cancelling)}
        onClose={() => {
          if (!isSaving) {
            setCancelling(null);
          }
        }}
        title={t('cancelTitle')}
        footer={
          <>
            <button
              type="button"
              onClick={() => setCancelling(null)}
              disabled={isSaving}
              className="flex-1 rounded-full border border-stone-300 py-3 text-xs font-semibold uppercase tracking-widest text-stone-800 hover:bg-stone-50 disabled:opacity-50"
            >
              {commonT('cancel')}
            </button>
            <button
              type="button"
              onClick={confirmDecline}
              disabled={isSaving}
              className="flex-1 rounded-full bg-rose-800 py-3 text-xs font-semibold uppercase tracking-widest text-white hover:bg-rose-900 disabled:opacity-50"
            >
              {isSaving ? '...' : t('confirmCancel')}
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-stone-700">
          {cancelling
            ? `${cancelling.name || '—'} · ${formatDate(cancelling.bookingDate)} · ${extractTime(cancelling.classes, cancelling.status) || '—'}`
            : ''}
        </p>
        <p className="mt-3 text-sm text-stone-600">{t('cancelBody')}</p>
      </Modal>

      <Toast message={toast} onClose={() => setToast(null)} />
    </>
  );
}
