import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-rose-200">
      <nav className="w-full fixed top-0 left-0 right-0 z-[100] border-b border-stone-200/50 ios-header-fix">
        <div className="max-w-7xl mx-auto px-8 pt-[env(safe-area-inset-top,0px)]">
          <div className="flex justify-between items-center h-24">
            <Link href={`/${locale}`} className="text-2xl tracking-widest font-light uppercase">
              Yoga<span className="font-semibold text-rose-700"> x Chang</span>
            </Link>
            <Link href={`/${locale}`} className="text-xs uppercase tracking-widest text-stone-500 hover:text-rose-700 transition-colors">
              {locale === 'vi' ? 'Quay lại' : 'Back'}
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pt-48 pb-20">
        <header className="mb-16">
          <h1 className="text-5xl font-light text-stone-900 mb-4 tracking-tight">{t('About.title')}</h1>
          <p className="text-xl text-stone-400 font-light italic">{t('About.subtitle')}</p>
        </header>

        <div className="space-y-10 text-lg text-stone-600 font-light leading-relaxed">
          <p>{t('About.p1')}</p>
          <p>{t('About.p2')}</p>
          <p className="p-8 bg-white border border-stone-100 rounded-3xl shadow-sm text-stone-800">
            {t('About.p3')}
          </p>
        </div>
      </main>
    </div>
  );
}