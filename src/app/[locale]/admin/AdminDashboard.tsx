'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  extractTime,
  firstClass,
  isCancelled,
  isPending,
  type AdminBooking,
} from '@/lib/bookings';
import type { ActionResult } from '@/lib/admin/action-types';
import { actionErrorMessage } from '@/lib/action-errors';
import {
  adminLogoutAction,
  approveBookingAction,
  declineBookingAction,
  rescheduleBookingAction,
} from './actions';

const ADMIN_SLOTS = [
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
];

export default function AdminDashboard({
  bookings,
  loadError,
  locale,
}: {
  bookings: AdminBooking[];
  loadError: string | null;
  locale: 'vi' | 'en';
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<AdminBooking | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const next30Days = useMemo(
    () =>
      Array.from({ length: 30 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() + index);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }),
    []
  );

  const takenSlots = useMemo(
    () =>
      bookings
        .filter((booking) => !isCancelled(booking.status))
        .map(
          (booking) =>
            `${booking.bookingDate}_${extractTime(booking.classes, booking.status)}`
        ),
    [bookings]
  );

  const validSlots = useMemo(() => {
    if (!selectedDate) {
      return [];
    }

    return ADMIN_SLOTS.filter(
      (slot) => !takenSlots.includes(`${selectedDate}_${slot}`)
    );
  }, [selectedDate, takenSlots]);

  const pendingCount = bookings.filter((booking) => isPending(booking.status)).length;

  async function runAction(
    action: () => Promise<ActionResult>,
    onSuccess?: () => void
  ) {
    setIsSaving(true);
    setActionError(null);

    try {
      const result = await action();

      if (!result.ok) {
        setActionError(actionErrorMessage(result.error, locale));
        return;
      }

      onSuccess?.();
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

  function handleApprove(booking: AdminBooking) {
    const time = extractTime(booking.classes, booking.status);

    if (!time) {
      setActionError(
        locale === 'vi'
          ? 'Lịch này không có giờ để duyệt.'
          : 'This booking has no time to approve.'
      );
      return;
    }

    void runAction(() => approveBookingAction(booking.id, time));
  }

  function handleDecline(booking: AdminBooking) {
    const confirmed = confirm(
      locale === 'vi'
        ? 'Chắc chắn hủy yêu cầu này?'
        : 'Are you sure you want to cancel this booking?'
    );

    if (!confirmed) {
      return;
    }

    void runAction(() => declineBookingAction(booking.id));
  }

  function openRescheduleModal(booking: AdminBooking) {
    setBookingToEdit(booking);
    setSelectedDate('');
    setSelectedTime('');
    setActionError(null);
    setIsModalOpen(true);
  }

  function submitReschedule() {
    if (!bookingToEdit || !selectedDate || !selectedTime) {
      return;
    }

    void runAction(
      () =>
        rescheduleBookingAction(bookingToEdit.id, selectedDate, selectedTime),
      () => setIsModalOpen(false)
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans selection:bg-rose-200">
      <nav className="w-full px-8 py-6 bg-white border-b border-stone-200 flex justify-between items-center sticky top-0 z-40">
        <div className="text-xl tracking-widest font-light uppercase text-stone-900">
          Yoga<span className="font-semibold text-rose-700"> with Chang</span>
          <span className="text-xs text-stone-400 ml-2 tracking-normal uppercase">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href={`/${locale}/calendar`}
            className="text-xs uppercase tracking-widest text-stone-500 hover:text-rose-700 transition-colors"
          >
            {locale === 'vi' ? 'Lịch tập' : 'Calendar'}
          </Link>
          <form action={adminLogoutAction}>
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              className="text-xs uppercase tracking-widest text-stone-500 hover:text-rose-700 transition-colors"
            >
              {locale === 'vi' ? 'Đăng Xuất' : 'Sign Out'}
            </button>
          </form>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 pb-32">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-10">
          <div>
            <h1 className="text-4xl font-light text-stone-900 mb-2">
              {locale === 'vi' ? 'Bảng Điều Khiển' : 'Dashboard'}
            </h1>
            <p className="text-stone-500">
              {locale === 'vi' ? 'Quản lý Lịch tập' : 'Manage the class schedule'}
            </p>
          </div>
          <div className="mt-4 md:mt-0 text-left md:text-right">
            <span className="text-xs uppercase tracking-widest text-stone-400 mr-4">
              {locale === 'vi' ? 'Tổng cộng' : 'Total'}: {bookings.length}
            </span>
            {pendingCount > 0 && (
              <span className="text-xs font-bold uppercase tracking-widest text-rose-600 px-3 py-1 bg-rose-50 rounded-full border border-rose-100">
                {pendingCount} {locale === 'vi' ? 'chờ duyệt' : 'pending'}
              </span>
            )}
          </div>
        </div>

        {(loadError || actionError) && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800"
          >
            {actionError ?? loadError}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                <th className="p-4 pl-6 text-xs uppercase tracking-widest text-stone-400 font-medium">
                  {locale === 'vi' ? 'Ngày / Khung giờ' : 'Date / Time'}
                </th>
                <th className="p-4 text-xs uppercase tracking-widest text-stone-400 font-medium">
                  {locale === 'vi' ? 'Học Viên' : 'Guest'}
                </th>
                <th className="p-4 text-xs uppercase tracking-widest text-stone-400 font-medium">
                  {locale === 'vi' ? 'Lớp' : 'Class'}
                </th>
                <th className="p-4 text-xs uppercase tracking-widest text-stone-400 font-medium">
                  {locale === 'vi' ? 'Trạng Thái' : 'Status'}
                </th>
                <th className="p-4 pr-6 text-xs uppercase tracking-widest text-stone-400 font-medium">
                  {locale === 'vi' ? 'Hành Động' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-stone-400">
                    {locale === 'vi' ? 'Chưa có lịch tập.' : 'No bookings yet.'}
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const pending = isPending(booking.status);
                  const cancelled = isCancelled(booking.status);
                  const classItem = firstClass(booking.classes);
                  const timeDisplay = extractTime(booking.classes, booking.status);
                  const statusLabel = booking.status.split(':')[0] || '—';

                  return (
                    <tr
                      key={booking.id}
                      className={`border-b border-stone-50 transition-colors ${
                        pending ? 'bg-orange-50/30' : 'hover:bg-stone-50/50'
                      }`}
                    >
                      <td className="p-4 pl-6 whitespace-nowrap">
                        <span
                          className={`block font-medium ${
                            cancelled
                              ? 'line-through text-stone-400'
                              : 'text-stone-900'
                          }`}
                        >
                          {booking.bookingDate}
                        </span>
                        <span className="text-xs text-stone-500">{timeDisplay}</span>
                      </td>
                      <td className="p-4">
                        <span className="block font-medium text-stone-900">
                          {booking.name}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-stone-400">
                          {booking.guestId}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-stone-600">
                        {classItem?.description || 'Custom Lớp'}
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full ${
                            pending
                              ? 'bg-orange-100 text-orange-700'
                              : cancelled
                                ? 'bg-stone-100 text-stone-500'
                                : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="p-4 pr-6 space-x-2 whitespace-nowrap">
                        {pending && (
                          <button
                            type="button"
                            onClick={() => handleApprove(booking)}
                            disabled={isSaving}
                            className="text-xs bg-stone-900 text-white px-5 py-2.5 rounded-full hover:bg-stone-800 disabled:opacity-50 transition-colors shadow-sm"
                          >
                            {locale === 'vi' ? 'Duyệt' : 'Approve'}
                          </button>
                        )}
                        {!cancelled && (
                          <>
                            <button
                              type="button"
                              onClick={() => openRescheduleModal(booking)}
                              disabled={isSaving}
                              className="text-xs border border-stone-200 text-stone-600 px-5 py-2.5 rounded-full hover:bg-stone-50 disabled:opacity-50 transition-colors"
                            >
                              {locale === 'vi' ? 'Đổi' : 'Reschedule'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDecline(booking)}
                              disabled={isSaving}
                              className="text-xs font-semibold text-rose-600 hover:text-rose-800 disabled:opacity-50 transition-colors px-3 py-2.5"
                            >
                              {locale === 'vi' ? 'Hủy' : 'Cancel'}
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

      {isModalOpen && bookingToEdit && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-light mb-8 text-stone-900">
              {locale === 'vi' ? 'Admin Đổi Lịch' : 'Reschedule Booking'}
            </h3>

            <div className="space-y-6 mb-10">
              <div>
                <label
                  htmlFor="reschedule-date"
                  className="block text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-2"
                >
                  {locale === 'vi' ? '1. Chọn Ngày Mới' : '1. Select a new date'}
                </label>
                <select
                  id="reschedule-date"
                  className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-rose-700 transition-colors text-stone-900"
                  value={selectedDate}
                  onChange={(event) => {
                    setSelectedDate(event.target.value);
                    setSelectedTime('');
                  }}
                >
                  <option value="">
                    {locale === 'vi' ? '-- Chọn ngày --' : '-- Select date --'}
                  </option>
                  {next30Days.map((date) => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="reschedule-time"
                  className="block text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-2"
                >
                  {locale === 'vi' ? '2. Chọn Giờ' : '2. Select a time'}
                </label>
                <select
                  id="reschedule-time"
                  className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-rose-700 transition-colors disabled:opacity-50 text-stone-900"
                  value={selectedTime}
                  onChange={(event) => setSelectedTime(event.target.value)}
                  disabled={!selectedDate}
                >
                  <option value="">
                    {locale === 'vi' ? '-- Chọn giờ --' : '-- Select time --'}
                  </option>
                  {validSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
                {selectedDate && validSlots.length === 0 && (
                  <p className="text-xs text-rose-600 mt-2 italic">
                    {locale === 'vi'
                      ? 'Ngày này nghỉ hoặc đã kín lịch.'
                      : 'This day is closed or fully booked.'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="flex-1 py-4 text-xs border border-stone-200 rounded-full uppercase tracking-widest hover:bg-stone-50 disabled:opacity-50 transition-colors text-stone-900"
              >
                {locale === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={submitReschedule}
                disabled={!selectedDate || !selectedTime || isSaving}
                className="flex-1 py-4 text-xs bg-rose-800 text-white rounded-full uppercase tracking-widest hover:bg-rose-900 disabled:opacity-50 transition-colors shadow-md"
              >
                {isSaving
                  ? '...'
                  : locale === 'vi'
                    ? 'Xác nhận Đổi'
                    : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
