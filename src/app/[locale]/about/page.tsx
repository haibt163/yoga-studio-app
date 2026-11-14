import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'en' ? 'en' : 'vi';
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return buildPageMetadata({
    title: t('aboutTitle'),
    description: t('aboutDescription'),
    path: `/${locale}/about`,
    locale,
  });
}

export default async function AboutPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'en' ? 'en' : 'vi';
  const t = await getTranslations();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 pb-20 pt-12 sm:pt-16">
      <header className="mb-12">
        <h1 className="mb-4 text-4xl font-light tracking-tight text-stone-900 sm:text-5xl">
          {t('About.title')}
        </h1>
        <p className="text-lg italic text-stone-600">{t('About.subtitle')}</p>
      </header>

      <div className="grid gap-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-100">
          <Image
            src="/chang.jpg"
            alt={t('About.photoAlt')}
            fill
            sizes="(min-width: 768px) 40vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="space-y-6 text-base leading-relaxed text-stone-700 sm:text-lg">
          <p>{t('About.p1')}</p>
          <p>{t('About.p2')}</p>
          <p className="rounded-3xl border border-stone-200 bg-white p-6 text-stone-700 shadow-sm">
            {t('About.p3')}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={`/${locale}/booking`}
              className="rounded-full bg-rose-800 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rose-900"
            >
              {t('Hero.cta')}
            </Link>
            <Link
              href={`/${locale}/testimonials`}
              className="rounded-full border border-stone-300 bg-white px-6 py-3 text-xs font-semibold uppercase tracking-widest text-stone-700 transition-colors hover:border-rose-300 hover:text-rose-800"
            >
              {t('Navigation.testimonials')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
