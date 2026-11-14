'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  extractTime,
  firstClass,
  isCancelled,
  isPending,
  type GuestBooking,
} from '@/lib/bookings';
import {
  BOOKING_ERROR_KEYS,
  type BookingActionResult,
} from '@/lib/guest/action-types';
import { slotKey } from '@/lib/schedule';
import {
  cancelBookingAction,
  createBookingAction,
  guestLogoutAction,
  rescheduleBookingAction,
} from './actions';
import Modal from '@/components/Modal';
import SlotPicker from '@/components/SlotPicker';
import Toast from '@/components/Toast';

interface BookingDashboardProps {
  locale: 'vi' | 'en';
  guestName: string;
  bookings: GuestBooking[];
  takenSlots: string[];
  today: string;
  days: string[];
  nowTime: string;
  initialDate: string;
  initialTime: string;
}

export default function BookingDashboard({
  locale,
  guestName,
  bookings,
  takenSlots,
  today,
  days,
  nowTime,
  initialDate,
  initialTime,
}: BookingDashboardProps) {
  const t = useTranslations('Booking');
  const commonT = useTranslations('Common');
  const errorsT = useTranslations('Errors');
  const [modalMode, setModalMode] = useState<'new' | 'reschedule' | null>(
    initialDate && initialTime ? 'new' : null
  );
  const [editing, setEditing] = useState<GuestBooking | null>(null);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedTime, setSelectedTime] = useState(initialTime);
  const [cancelling, setCancelling] = useState<GuestBooking | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const takenSet = useMemo(() => new Set(takenSlots), [takenSlots]);

  const takenForModal = useMemo(() => {
    const set = new Set(takenSet);

    if (modalMode === 'reschedule' && editing) {
      set.delete(
        slotKey(
          editing.bookingDate,
          extractTime(editing.classes, editing.status)
        )
      );
    }

    return set;
  }, [takenSet, modalMode, editing]);

  function statusLabel(status: string): string {
    if (isCancelled(status)) {
      return t('cancelled');
    }

    if (isPending(status)) {
      return t('pending');
    }

    return t('confirmed');
  }

  function openNew() {
    setModalMode('new');
    setEditing(null);
    setSelectedDate('');
    setSelectedTime('');
    setActionError(null);
  }

  function openReschedule(booking: GuestBooking) {
    setModalMode('reschedule');
    setEditing(booking);
    setSelectedDate(booking.bookingDate);
    setSelectedTime(extractTime(booking.classes, booking.status));
    setActionError(null);
  }

  function closeModal() {
    if (isSaving) {
      return;
    }

    setModalMode(null);
    setEditing(null);
    setActionError(null);
  }

  async function runAction(
    action: () => Promise<BookingActionResult>,
    successMessage: string,
    onSuccess?: () => void
  ) {
    setIsSaving(true);
    setActionError(null);

    try {
      const result = await action();

      if (!result.ok) {
        setActionError(errorsT(BOOKING_ERROR_KEYS[result.error]));
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

  function submitSelection() {
    if (!selectedDate || !selectedTime) {
      setActionError(errorsT('invalid'));
      return;
    }

    if (takenForModal.has(slotKey(selectedDate, selectedTime))) {
      setActionError(errorsT('slotTaken'));
      return;
    }

    if (modalMode === 'reschedule' && editing) {
      void runAction(
        () => rescheduleBookingAction(editing.id, selectedDate, selectedTime),
        t('successRescheduled'),
        () => setModalMode(null)
      );
      return;
    }

    void runAction(
      () => createBookingAction(selectedDate, selectedTime),
      t('successBooked'),
      () => setModalMode(null)
    );
  }

  function confirmCancel() {
    if (!cancelling) {
      return;
    }

    void runAction(
      () => cancelBookingAction(cancelling.id),
      t('successCancelled'),
      () => setCancelling(null)
    );
  }

  return (
    <>
      <main className="mx-auto w-full max-w-5xl px-6 pb-20 pt-10 sm:pt-14">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-light text-stone-900 sm:text-4xl">
              {t('welcome')}, {guestName}
            </h1>
            <p className="text-stone-600">{t('dashboardSubtitle')}</p>
            <p className="mt-2 text-xs leading-relaxed text-stone-600">
              {t('scheduleNote')}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openNew}
              className="rounded-full bg-rose-800 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-white shadow-md transition-colors hover:bg-rose-900"
            >
              {t('bookNew')}
            </button>
            <form action={guestLogoutAction}>
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className="rounded-full border border-stone-300 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-stone-700 transition-colors hover:border-rose-300 hover:text-rose-800"
              >
                {t('logout')}
              </button>
            </form>
          </div>
        </div>

        {actionError && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-900"
          >
            {actionError}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center">
            <p className="mb-5 text-stone-600">{t('noBookings')}</p>
            <button
              type="button"
              onClick={openNew}
              className="rounded-full bg-rose-800 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rose-900"
            >
              {t('bookNew')}
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking) => {
              const classItem = firstClass(booking.classes);
              const pending = isPending(booking.status);
              const cancelled = isCancelled(booking.status);
              const time = extractTime(booking.classes, booking.status);
              const dateLabel = new Date(`${booking.bookingDate}T00:00:00Z`).toLocaleDateString(
                locale,
                {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  timeZone: 'UTC',
                }
              );

              return (
                <article
                  key={booking.id}
                  className={`rounded-3xl border p-6 ${
                    cancelled
                      ? 'border-stone-200 bg-stone-50 opacity-70'
                      : 'border-stone-200 bg-white shadow-sm'
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span
                        className={`mb-3 inline-block rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-widest ${
                          pending
                            ? 'bg-amber-50 text-amber-800'
                            : cancelled
                              ? 'bg-stone-100 text-stone-600'
                              : 'bg-emerald-50 text-emerald-800'
                        }`}
                      >
                        {statusLabel(booking.status)}
                      </span>
                      <h2
                        className={`text-xl font-medium ${
                          cancelled ? 'text-stone-500 line-through' : 'text-stone-900'
                        }`}
                      >
                        {classItem?.description || t('classCode')}
                      </h2>
                      <p className="mt-1 text-stone-600">
                        {dateLabel}
                        <span className="mx-2">·</span>
                        {time || '—'}
                      </p>
                      {pending && (
                        <p className="mt-2 text-sm text-amber-800">
                          {t('waitingForConfirmation')}
                        </p>
                      )}
                    </div>

                    {!cancelled && (
                      <div className="flex flex-wrap gap-3">
                        {!pending && (
                          <button
                            type="button"
                            onClick={() => openReschedule(booking)}
                            className="rounded-full border border-stone-300 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-stone-700 transition-colors hover:bg-stone-50"
                          >
                            {t('reschedule')}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setCancelling(booking);
                            setActionError(null);
                          }}
                          className="rounded-full border border-rose-200 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-rose-700 transition-colors hover:bg-rose-50"
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <Modal
        open={modalMode !== null}
        onClose={closeModal}
        title={modalMode === 'reschedule' ? t('rescheduleTitle') : t('bookTitle')}
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              disabled={isSaving}
              className="flex-1 rounded-full border border-stone-300 py-3 text-xs font-semibold uppercase tracking-widest text-stone-800 hover:bg-stone-50 disabled:opacity-50"
            >
              {commonT('cancel')}
            </button>
            <button
              type="button"
              onClick={submitSelection}
              disabled={!selectedDate || !selectedTime || isSaving}
              className="flex-1 rounded-full bg-rose-800 py-3 text-xs font-semibold uppercase tracking-widest text-white hover:bg-rose-900 disabled:opacity-50"
            >
              {isSaving
                ? '...'
                : modalMode === 'reschedule'
                  ? t('confirmReschedule')
                  : t('confirmBooking')}
            </button>
          </>
        }
      >
        <SlotPicker
          locale={locale}
          days={days}
          mode="guest"
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          takenSlots={takenForModal}
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
              {t('keepBooking')}
            </button>
            <button
              type="button"
              onClick={confirmCancel}
              disabled={isSaving}
              className="flex-1 rounded-full bg-rose-800 py-3 text-xs font-semibold uppercase tracking-widest text-white hover:bg-rose-900 disabled:opacity-50"
            >
              {isSaving ? '...' : t('cancelConfirm')}
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-stone-700">{t('cancelBody')}</p>
      </Modal>

      <Toast message={toast} onClose={() => setToast(null)} />
    </>
  );
}
