import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { cleanEnv } from '@/lib/env';
import MusicPlayer from '@/components/MusicPlayer';

interface FooterProps {
  locale: 'vi' | 'en';
}

export default async function Footer({ locale }: FooterProps) {
  const t = await getTranslations();
  const contactLink = cleanEnv(process.env.NEXT_PUBLIC_CONTACT_LINK);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-stone-200/70 bg-stone-50 pb-6">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Link
            href={`/${locale}`}
            className="text-lg tracking-widest uppercase text-stone-900"
          >
            Yoga<span className="font-semibold text-rose-700"> with Chang</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-stone-600">
            {t('Footer.tagline')}
          </p>
        </div>

        <nav
          aria-label={t('Navigation.menu')}
          className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-stone-600"
        >
          <Link href={`/${locale}`} className="hover:text-rose-700">
            {t('Navigation.home')}
          </Link>
          <Link href={`/${locale}/about`} className="hover:text-rose-700">
            {t('Navigation.about')}
          </Link>
          <Link href={`/${locale}/testimonials`} className="hover:text-rose-700">
            {t('Navigation.testimonials')}
          </Link>
          <Link href={`/${locale}/calendar`} className="hover:text-rose-700">
            {t('Navigation.calendar')}
          </Link>
          <Link href={`/${locale}/booking`} className="hover:text-rose-700">
            {t('Navigation.booking')}
          </Link>
          <Link href={`/${locale}/admin`} className="hover:text-rose-700">
            {t('Footer.admin')}
          </Link>
        </nav>

        <div className="text-sm text-stone-600">
          <p className="font-medium text-stone-800">{t('Footer.contact')}</p>
          {contactLink ? (
            <a
              href={contactLink}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex rounded-full border border-rose-200 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-rose-800 transition-colors hover:border-rose-800 hover:bg-rose-800 hover:text-white"
            >
              {t('Home.contactCta')}
            </a>
          ) : (
            <p className="mt-2 text-xs text-stone-500">{t('Footer.ownerInput')}</p>
          )}
          <div className="mt-4">
            <MusicPlayer />
          </div>
        </div>
      </div>

      <div className="border-t border-stone-200/60 px-6 py-5 text-center text-xs text-stone-600">
        © {year} Yoga with Chang. {t('Footer.rights')}
      </div>
    </footer>
  );
}
