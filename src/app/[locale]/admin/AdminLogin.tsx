'use client';

import { useActionState } from 'react';
import { adminLoginAction } from './actions';
import type { LoginState } from '@/lib/admin/action-types';

const INITIAL_STATE: LoginState = {};

export default function AdminLogin({ locale }: { locale: 'vi' | 'en' }) {
  const [state, formAction, pending] = useActionState(adminLoginAction, INITIAL_STATE);
  const isVietnamese = locale === 'vi';

  const errorMessage =
    state.error === 'not-configured'
      ? isVietnamese
        ? 'Đăng nhập quản trị chưa được cấu hình. Thêm ADMIN_PASSWORD vào .env.local.'
        : 'Admin login is not configured. Add ADMIN_PASSWORD to .env.local.'
      : state.error === 'invalid'
        ? isVietnamese
          ? 'Sai tên đăng nhập hoặc mật khẩu.'
          : 'Invalid username or password.'
        : null;

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center font-sans selection:bg-rose-200">
      <form
        action={formAction}
        className="bg-white p-10 rounded-[2rem] shadow-xl max-w-sm w-full mx-4 border border-stone-100"
      >
        <input type="hidden" name="locale" value={locale} />
        <h1 className="text-2xl font-light mb-8 text-center uppercase tracking-widest text-stone-900">
          {isVietnamese ? 'Đăng Nhập Quản Trị' : 'Admin Login'}
        </h1>
        <input
          type="text"
          name="username"
          autoComplete="username"
          placeholder={isVietnamese ? 'Tên đăng nhập' : 'Username'}
          className="w-full border-b border-stone-300 py-3 mb-6 focus:outline-none focus:border-rose-700 bg-transparent text-stone-900"
          required
        />
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder={isVietnamese ? 'Mật khẩu' : 'Password'}
          className="w-full border-b border-stone-300 py-3 mb-6 focus:outline-none focus:border-rose-700 bg-transparent text-stone-900 tracking-widest"
          required
        />
        {errorMessage && (
          <p role="alert" className="text-sm text-rose-700 mb-6 leading-relaxed">
            {errorMessage}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-rose-800 text-white py-4 rounded-full uppercase tracking-widest text-xs hover:bg-rose-900 disabled:opacity-50 transition-colors shadow-md"
        >
          {pending ? '...' : isVietnamese ? 'Đăng Nhập' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
