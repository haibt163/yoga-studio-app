export const STUDIO_TIME_ZONE = 'Asia/Ho_Chi_Minh';

function formatPart(date: Date, type: 'year' | 'month' | 'day' | 'hour' | 'minute'): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: STUDIO_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  return parts.find((part) => part.type === type)?.value ?? '';
}

export function getStudioDateString(date = new Date()): string {
  return `${formatPart(date, 'year')}-${formatPart(date, 'month')}-${formatPart(date, 'day')}`;
}

export function getStudioTimeString(date = new Date()): string {
  return `${formatPart(date, 'hour')}:${formatPart(date, 'minute')}`;
}

export function addDays(dateString: string, days: number): string {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getWeekday(dateString: string): number {
  return new Date(`${dateString}T00:00:00Z`).getUTCDay();
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
