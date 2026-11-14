import type { ActionError } from '@/lib/admin/action-types';

const MESSAGES: Record<ActionError, { vi: string; en: string }> = {
  unauthorized: {
    vi: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    en: 'Your admin session expired. Please sign in again.',
  },
  invalid: {
    vi: 'Dữ liệu không hợp lệ.',
    en: 'The request is invalid.',
  },
  database: {
    vi: 'Không thể cập nhật lịch. Vui lòng thử lại.',
    en: 'Could not update the booking. Please try again.',
  },
  'not-configured': {
    vi: 'Cơ sở dữ liệu chưa được cấu hình.',
    en: 'The database is not configured.',
  },
  'guest-not-found': {
    vi: 'Sai ID hoặc mã PIN của học viên.',
    en: 'Invalid guest ID or PIN.',
  },
};

export function actionErrorMessage(
  error: ActionError,
  locale: 'vi' | 'en'
): string {
  return MESSAGES[error][locale];
}
