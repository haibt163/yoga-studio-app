import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { cleanEnv } from '@/lib/env';
import { buildPageMetadata } from '@/lib/metadata';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'en' ? 'en' : 'vi';
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return buildPageMetadata({
    title: t('homeTitle'),
    description: t('homeDescription'),
    path: `/${locale}`,
    locale,
  });
}

export default async function LandingPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'en' ? 'en' : 'vi';
  const t = await getTranslations();
  const contactLink = cleanEnv(process.env.NEXT_PUBLIC_CONTACT_LINK);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-6 pb-20 pt-12 sm:pt-16">
      <section className="flex flex-col items-center text-center">
        <Image
          src="/logo.png"
          alt="Yoga with Chang"
          width={96}
          height={96}
          className="mb-8 h-24 w-24 object-contain"
          priority
        />
        <span className="mb-5 block text-xs font-semibold uppercase tracking-[0.3em] text-rose-700">
          {t('Hero.eyebrow')}
        </span>
        <h1 className="mb-6 text-5xl font-light leading-[1.08] tracking-tight text-stone-900 sm:text-6xl md:text-7xl">
          {t('Hero.title')}
        </h1>
        <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-stone-600 sm:text-lg">
          {t('Hero.subtitle')}
        </p>
        <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          <Link
            href={`/${locale}/booking`}
            className="w-full rounded-full bg-rose-800 px-8 py-4 text-center text-xs font-semibold uppercase tracking-widest text-white shadow-md transition-colors hover:bg-rose-900 sm:w-auto"
          >
            {t('Hero.cta')}
          </Link>
          <Link
            href={`/${locale}/about`}
            className="w-full rounded-full border border-stone-300 bg-white px-8 py-4 text-center text-xs font-semibold uppercase tracking-widest text-stone-700 transition-colors hover:border-rose-300 hover:text-rose-800 sm:w-auto"
          >
            {t('Hero.learnMore')}
          </Link>
        </div>
      </section>

      <section className="mt-20 grid items-center gap-10 border-t border-stone-200/70 pt-16 md:grid-cols-2">
        <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[2rem] border border-dashed border-stone-300 bg-stone-100 p-8 text-center">
          <p className="max-w-[16rem] text-sm leading-relaxed text-stone-600">
            {t('Home.photoPlaceholder')}
          </p>
        </div>
        <div>
          <h2 className="mb-5 text-3xl font-light text-stone-900 sm:text-4xl">
            {t('Home.aboutTitle')}
          </h2>
          <p className="mb-4 leading-relaxed text-stone-700">{t('About.p1')}</p>
          <p className="mb-6 leading-relaxed text-stone-700">{t('About.p3')}</p>
          <Link
            href={`/${locale}/about`}
            className="text-sm font-semibold text-rose-800 underline-offset-4 hover:underline"
          >
            {t('Home.aboutCta')}
          </Link>
        </div>
      </section>

      <section className="mt-20 border-t border-stone-200/70 pt-16">
        <h2 className="mb-10 text-3xl font-light text-stone-900 sm:text-4xl">
          {t('Home.howTitle')}
        </h2>
        <ol className="grid gap-6 md:grid-cols-3">
          {[
            ['step1Title', 'step1Body'],
            ['step2Title', 'step2Body'],
            ['step3Title', 'step3Body'],
          ].map(([titleKey, bodyKey], index) => (
            <li key={titleKey} className="rounded-3xl border border-stone-200 bg-white p-6">
              <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-sm font-semibold text-rose-800">
                {index + 1}
              </span>
              <h3 className="mb-2 text-lg font-medium text-stone-900">
                {t(`Home.${titleKey}`)}
              </h3>
              <p className="text-sm leading-relaxed text-stone-600">
                {t(`Home.${bodyKey}`)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-20 grid gap-6 border-t border-stone-200/70 pt-16 md:grid-cols-2">
        <div className="rounded-3xl bg-stone-900 p-8 text-stone-50">
          <h2 className="mb-3 text-2xl font-light">{t('Home.pricingTitle')}</h2>
          <p className="mb-6 text-sm leading-relaxed text-stone-300">
            {t('Home.pricingBody')}
          </p>
          {contactLink ? (
            <a
              href={contactLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full bg-white px-5 py-3 text-xs font-semibold uppercase tracking-widest text-stone-900 transition-colors hover:bg-rose-100"
            >
              {t('Home.contactCta')}
            </a>
          ) : (
            <p className="text-xs text-stone-400">{t('Common.ownerInput')}</p>
          )}
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white p-8">
          <h2 className="mb-5 text-2xl font-light text-stone-900">
            {t('Home.testimonialsTitle')}
          </h2>
          <div className="space-y-4">
            {[1, 2, 3].map((index) => (
              <blockquote key={index} className="border-l-2 border-rose-200 pl-4">
                <p className="text-sm italic leading-relaxed text-stone-700">
                  “{t(`Testimonials.r${index}`)}”
                </p>
                <footer className="mt-1 text-xs uppercase tracking-widest text-stone-500">
                  {t(`Testimonials.a${index}`)}
                </footer>
              </blockquote>
            ))}
          </div>
          <Link
            href={`/${locale}/testimonials`}
            className="mt-6 inline-block text-sm font-semibold text-rose-800 underline-offset-4 hover:underline"
          >
            {t('Home.testimonialsCta')}
          </Link>
        </div>
      </section>

      <section className="mt-20 border-t border-stone-200/70 pt-16 text-center">
        <p className="mx-auto mb-6 max-w-3xl text-xl italic leading-relaxed text-stone-700 sm:text-2xl">
          {t('Quote.text')}
        </p>
        <p className="mb-12 text-xs font-medium uppercase tracking-widest text-rose-700">
          {t('Quote.author')}
        </p>
        <h2 className="mb-3 text-3xl font-light text-stone-900 sm:text-4xl">
          {t('Home.finalCtaTitle')}
        </h2>
        <p className="mx-auto mb-8 max-w-xl leading-relaxed text-stone-600">
          {t('Home.finalCtaBody')}
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={`/${locale}/booking`}
            className="w-full rounded-full bg-rose-800 px-8 py-4 text-center text-xs font-semibold uppercase tracking-widest text-white shadow-md transition-colors hover:bg-rose-900 sm:w-auto"
          >
            {t('Home.bookCta')}
          </Link>
          {contactLink && (
            <a
              href={contactLink}
              target="_blank"
              rel="noreferrer"
              className="w-full rounded-full border border-stone-300 bg-white px-8 py-4 text-center text-xs font-semibold uppercase tracking-widest text-stone-700 transition-colors hover:border-rose-300 hover:text-rose-800 sm:w-auto"
            >
              {t('Home.contactCta')}
            </a>
          )}
        </div>
      </section>
    </main>
  );
}
