import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function TestimonialsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; 
  const t = await getTranslations();

  const reviews = [
    { text: t('Testimonials.r1'), author: t('Testimonials.a1') },
    { text: t('Testimonials.r2'), author: t('Testimonials.a2') },
    { text: t('Testimonials.r3'), author: t('Testimonials.a3') },
    { text: t('Testimonials.r4'), author: t('Testimonials.a4') },
    { text: t('Testimonials.r5'), author: t('Testimonials.a5') },
  ];

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900">
      <nav className="w-full fixed top-0 left-0 right-0 z-[100] border-b border-stone-200/50 ios-header-fix">
        <div className="max-w-7xl mx-auto px-8 pt-[env(safe-area-inset-top,0px)]">
          <div className="flex justify-between items-center h-24">
            <Link href={`/${locale}`} className="text-2xl tracking-widest font-light uppercase">
              Yoga<span className="font-semibold text-stone-700">Studio</span>
            </Link>
            <Link href={`/${locale}`} className="text-xs uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors">
              {locale === 'vi' ? 'Quay lại' : 'Back'}
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-48 pb-20">
        <div className="text-center mb-20">
          <h1 className="text-5xl font-light text-stone-900 mb-4">{t('Testimonials.title')}</h1>
          <p className="text-stone-400 font-light tracking-wide uppercase text-[10px]">{t('Testimonials.subtitle')}</p>
        </div>
        
        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
          {reviews.map((review, i) => (
            <div key={i} className="break-inside-avoid bg-white p-10 rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-500">
              <div className="text-stone-200 text-4xl font-serif mb-4">“</div>
              <p className="text-stone-600 font-light leading-relaxed mb-8 italic">
                {review.text}
              </p>
              <div className="flex items-center space-x-4">
                <div className="h-px w-6 bg-stone-300"></div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
                  {review.author}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}