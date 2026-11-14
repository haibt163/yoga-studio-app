'use client';

import { useTranslations } from 'next-intl';
import { getSlots, isPastSlot, slotKey, type ScheduleMode } from '@/lib/schedule';

interface SlotPickerProps {
  locale: 'vi' | 'en';
  days: string[];
  mode: ScheduleMode;
  selectedDate: string;
  selectedTime: string;
  takenSlots: ReadonlySet<string>;
  today: string;
  nowTime: string;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
  disabled?: boolean;
}

function formatDay(date: string, locale: 'vi' | 'en'): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

export default function SlotPicker({
  locale,
  days,
  mode,
  selectedDate,
  selectedTime,
  takenSlots,
  today,
  nowTime,
  onSelectDate,
  onSelectTime,
  disabled = false,
}: SlotPickerProps) {
  const t = useTranslations('SlotPicker');
  const slots = selectedDate ? getSlots(mode, selectedDate) : [];

  return (
    <div className="space-y-6">
      <fieldset disabled={disabled}>
        <legend className="mb-2 block text-xs font-semibold uppercase tracking-widest text-stone-600">
          {t('chooseDate')}
        </legend>
        <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2">
          {days.map((day) => {
            const selected = day === selectedDate;
            const isToday = day === today;

            return (
              <button
                key={day}
                type="button"
                onClick={() => {
                  onSelectDate(day);
                  onSelectTime('');
                }}
                aria-pressed={selected}
                aria-label={`${formatDay(day, locale)}${isToday ? `, ${t('today')}` : ''}`}
                className={`min-w-[6.5rem] snap-start rounded-2xl border px-3 py-3 text-left transition-colors ${
                  selected
                    ? 'border-rose-800 bg-rose-800 text-white'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-rose-300'
                }`}
              >
                <span className="block text-xs uppercase tracking-widest opacity-80">
                  {formatDay(day, locale)}
                </span>
                {isToday && (
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-widest">
                    {t('today')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      {selectedDate && (
        <fieldset disabled={disabled || slots.length === 0}>
          <legend className="mb-2 block text-xs font-semibold uppercase tracking-widest text-stone-600">
            {t('chooseTime')}
          </legend>
          {slots.length === 0 ? (
            <p className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
              {t('closed')}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((slot) => {
                const taken = takenSlots.has(slotKey(selectedDate, slot));
                const past = isPastSlot(selectedDate, slot, today, nowTime);
                const unavailable = taken || past;
                const selected = selectedTime === slot;

                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => onSelectTime(slot)}
                    disabled={unavailable}
                    aria-pressed={selected}
                    aria-label={`${slot} — ${
                      taken ? t('taken') : past ? t('past') : t('available')
                    }`}
                    className={`rounded-xl border px-2 py-3 text-sm font-medium transition-colors ${
                      selected
                        ? 'border-rose-800 bg-rose-800 text-white'
                        : unavailable
                          ? 'cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400'
                          : 'border-stone-200 bg-white text-stone-800 hover:border-rose-300'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          )}
        </fieldset>
      )}
    </div>
  );
}
