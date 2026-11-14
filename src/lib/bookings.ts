export interface ClassRef {
  description: string | null;
  start_time: string | null;
}

export interface AdminBooking {
  id: string;
  name: string;
  guestId: string;
  status: string;
  bookingDate: string;
  classes: ClassRef | ClassRef[] | null;
}

export interface GuestBooking {
  id: string;
  status: string;
  bookingDate: string;
  classes: ClassRef | ClassRef[] | null;
}

export interface CalendarClass {
  id: string;
  date: string;
  time: string;
  description: string | null;
  guestName: string | null;
  isPending: boolean;
}

export function firstClass(
  classes: ClassRef | ClassRef[] | null | undefined
): ClassRef | null {
  if (!classes) {
    return null;
  }

  return Array.isArray(classes) ? classes[0] ?? null : classes;
}

export function extractTime(
  classes: ClassRef | ClassRef[] | null | undefined,
  status: string
): string {
  const statusMatch = status.match(/(\d{2}:\d{2})/);

  if (statusMatch) {
    return statusMatch[1];
  }

  const classRef = firstClass(classes);
  const match = classRef?.start_time?.match(/(\d{2}:\d{2})/);
  return match?.[1] ?? '';
}

export function isCancelled(status: string): boolean {
  return status.toLowerCase().includes('cancelled');
}

export function isPending(status: string): boolean {
  return status.toLowerCase().includes('pending');
}

export function isVisibleOnCalendar(status: string): boolean {
  const normalized = status.toLowerCase();
  return normalized.includes('confirmed') || normalized.includes('pending');
}
