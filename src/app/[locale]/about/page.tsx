import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();

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

      <main className="max-w-3xl mx-auto px-6 pt-40 pb-20">
        <h1 className="text-5xl font-light text-stone-900 mb-4">{t('About.title')}</h1>
        <p className="text-xl text-stone-400 font-light mb-12 italic">{t('About.subtitle')}</p>
        
        <div className="space-y-8 text-stone-600 leading-relaxed font-light">
          <p>{t('About.p1')}</p>
          <p>{t('About.p2')}</p>
          <p>{t('About.p3')}</p>
        </div>
      </main>
    </div>
  );
}