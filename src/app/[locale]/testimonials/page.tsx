import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function TestimonialsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();

  // Mapping the 5 reviews we just added to the JSON
  const reviews = [
    { text: t('Testimonials.r1'), author: t('Testimonials.a1') },
    { text: t('Testimonials.r2'), author: t('Testimonials.a2') },
    { text: t('Testimonials.r3'), author: t('Testimonials.a3') },
    { text: t('Testimonials.r4'), author: t('Testimonials.a4') },
    { text: t('Testimonials.r5'), author: t('Testimonials.a5') },
  ];

  return (
    <div className="min-h-screen bg-stone-50 font-sans selection:bg-stone-200">
      <nav className="w-full px-8 py-8 flex justify-between items-center fixed top-0 z-50 bg-stone-50/80 backdrop-blur-md border-b border-stone-200/50">
        <Link href={`/${locale}`} className="text-2xl tracking-widest font-light uppercase text-stone-900">
          Yoga<span className="font-semibold text-stone-700">Studio</span>
        </Link>
        <Link href={`/${locale}`} className="text-xs uppercase tracking-widest text-stone-500 hover:text-stone-900">
          {locale === 'vi' ? 'Quay lại' : 'Back'}
        </Link>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-40 pb-20">
        <h1 className="text-5xl font-light text-center text-stone-900 mb-4">{t('Testimonials.title')}</h1>
        <p className="text-stone-400 text-center font-light mb-16">{t('Testimonials.subtitle')}</p>
        
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {reviews.map((review, i) => (
            <div key={i} className="break-inside-avoid bg-white p-8 rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl transition-all">
              <p className="text-stone-600 font-light leading-relaxed mb-6">"{review.text}"</p>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">— {review.author}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}