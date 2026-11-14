'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface HeaderProps {
  locale: 'vi' | 'en';
  isAdmin: boolean;
}

const DESKTOP_LINKS = [
  { href: '', key: 'home' },
  { href: '/about', key: 'about' },
  { href: '/testimonials', key: 'testimonials' },
  { href: '/calendar', key: 'calendar' },
] as const;

export default function Header({ locale, isAdmin }: HeaderProps) {
  const t = useTranslations('Navigation');
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const otherLocale = locale === 'vi' ? 'en' : 'vi';
  const otherLocalePath = pathname
    ? pathname.replace(/^\/(vi|en)(?=\/|$)/, `/${otherLocale}`)
    : `/${otherLocale}`;

  const isActive = (href: string) => {
    const target = `/${locale}${href}`;
    return href === '' ? pathname === target : pathname?.startsWith(target);
  };

  return (
    <header
      className="sticky top-0 z-50 border-b border-stone-200/60 bg-stone-50/90 backdrop-blur-md ios-glass"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setMenuOpen(false);
        }
      }}
    >
      <div className="w-full pt-[env(safe-area-inset-top,0px)]">
        <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6">
          <Link
            href={`/${locale}`}
            className="shrink-0 whitespace-nowrap text-sm tracking-wide uppercase text-stone-900 sm:text-xl sm:tracking-widest"
            aria-label="Yoga with Chang"
          >
            Yoga<span className="font-semibold text-rose-700"> with Chang</span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            {DESKTOP_LINKS.map((link) => (
              <Link
                key={link.key}
                href={`/${locale}${link.href}`}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`text-xs uppercase tracking-widest transition-colors hover:text-rose-700 ${
                  isActive(link.href) ? 'text-rose-700' : 'text-stone-600'
                }`}
              >
                {t(link.key)}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href={`/${locale}/admin`}
                className="text-xs uppercase tracking-widest text-rose-700 transition-colors hover:text-rose-900"
              >
                {t('admin')}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link
              href={otherLocalePath}
              aria-label={t('language')}
              className="px-1.5 py-2 text-xs font-semibold uppercase tracking-widest text-stone-600 transition-colors hover:text-rose-700 sm:px-2"
            >
              {otherLocale.toUpperCase()}
            </Link>
            <Link
              href={`/${locale}/booking`}
              className="whitespace-nowrap rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-rose-800 transition-colors hover:border-rose-800 hover:bg-rose-800 hover:text-white sm:px-4 sm:py-2.5"
            >
              {t('booking')}
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? t('close') : t('menu')}
              className="rounded-full p-2 text-stone-700 transition-colors hover:bg-stone-100 md:hidden"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div
            id="mobile-menu"
            className="border-t border-stone-200/60 bg-stone-50 px-4 pb-4 pt-2 md:hidden"
          >
            <div className="flex flex-col">
              {DESKTOP_LINKS.map((link) => (
                <Link
                  key={link.key}
                  href={`/${locale}${link.href}`}
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-stone-200/50 py-3 text-sm uppercase tracking-widest text-stone-700"
                >
                  {t(link.key)}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  href={`/${locale}/admin`}
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-stone-200/50 py-3 text-sm uppercase tracking-widest text-rose-700"
                >
                  {t('admin')}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
