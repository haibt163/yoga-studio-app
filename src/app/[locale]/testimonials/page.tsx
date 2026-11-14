import Image from 'next/image';
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
    title: t('testimonialsTitle'),
    description: t('testimonialsDescription'),
    path: `/${locale}/testimonials`,
    locale,
  });
}

export default async function TestimonialsPage() {
  const t = await getTranslations();

  const reviews = [1, 2, 3, 4, 5].map((index) => ({
    text: t(`Testimonials.r${index}`),
    author: t(`Testimonials.a${index}`),
    photo: t.has(`Testimonials.photo${index}`)
      ? t(`Testimonials.photo${index}`)
      : null,
  }));

  return (
    <main className="mx-auto w-full max-w-6xl px-6 pb-20 pt-12 sm:pt-16">
      <header className="mb-14 text-center">
        <h1 className="mb-4 text-4xl font-light tracking-tight text-stone-900 sm:text-5xl">
          {t('Testimonials.title')}
        </h1>
        <p className="text-xs uppercase tracking-widest text-stone-600">
          {t('Testimonials.subtitle')}
        </p>
      </header>

      <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
        {reviews.map((review, index) => (
          <figure
            key={index}
            className="mb-6 break-inside-avoid rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm"
          >
            <div className="mb-5 text-4xl font-serif text-rose-700" aria-hidden="true">
              “
            </div>
            <blockquote className="mb-6 text-base italic leading-relaxed text-stone-700">
              {review.text}
            </blockquote>
            <figcaption className="flex items-center gap-3">
              {review.photo ? (
                <Image
                  src={review.photo}
                  alt={t('Testimonials.photoAlt')}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-sm font-semibold text-rose-800"
                >
                  {review.author.charAt(0)}
                </span>
              )}
              <span className="text-sm font-medium text-stone-800">
                {review.author}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
