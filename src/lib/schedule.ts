import { addDays, getWeekday, timeToMinutes } from './studio-date';

export type ScheduleMode = 'guest' | 'admin';

export const GUEST_SLOTS_BY_WEEKDAY: Record<number, string[]> = {
  0: ['09:30'],
  1: ['08:00', '09:00'],
  2: ['06:00', '07:00'],
  4: ['16:00'],
  6: ['16:00'],
};

export const ADMIN_SLOTS = [
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

export function getSlots(mode: ScheduleMode, date: string): string[] {
  if (mode === 'admin') {
    return ADMIN_SLOTS;
  }

  return GUEST_SLOTS_BY_WEEKDAY[getWeekday(date)] ?? [];
}

export function getNextDays(
  count: number,
  startDate: string
): string[] {
  return Array.from({ length: count }, (_, index) => addDays(startDate, index));
}

export function slotKey(date: string, time: string): string {
  return `${date}_${time}`;
}

export function isPastSlot(
  date: string,
  time: string,
  today: string,
  nowTime: string
): boolean {
  if (date < today) {
    return true;
  }

  if (date > today) {
    return false;
  }

  return timeToMinutes(time) <= timeToMinutes(nowTime);
}

export function isSlotAllowed(
  mode: ScheduleMode,
  date: string,
  time: string
): boolean {
  return getSlots(mode, date).includes(time);
}
