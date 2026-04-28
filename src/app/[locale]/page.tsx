import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ locale: string }>; 
}

export default async function LandingPage({ params }: PageProps) {
  const { locale } = await params; 
  const t = await getTranslations();
  const toggleLang = locale === 'vi' ? 'en' : 'vi';

  return (
    <div className="min-h-screen flex flex-col font-sans bg-stone-50 selection:bg-stone-200 text-stone-900">
      <nav className="w-full px-8 pt-[max(env(safe-area-inset-top),2rem)] pb-6 flex justify-between items-center fixed top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200/50 transition-all ios-header-fix">
        <div className="text-2xl tracking-widest font-light uppercase">
          Yoga<span className="font-semibold text-stone-700">Studio</span>
        </div>
        
        <div className="hidden md:flex space-x-12 text-xs tracking-widest text-stone-500 uppercase font-medium">
          <Link href={`/${locale}/about`} className="hover:text-stone-900 transition-colors">{t('Navigation.about')}</Link>
          <Link href={`/${locale}/testimonials`} className="hover:text-stone-900 transition-colors">{t('Navigation.testimonials')}</Link>
          <Link href={`/${locale}/calendar`} className="hover:text-stone-900 transition-colors">{t('Navigation.calendar')}</Link>
        </div>

        <div className="flex items-center space-x-6">
          <Link href={`/${toggleLang}`} className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">
            {locale === 'vi' ? 'EN' : 'VN'}
          </Link>
          <Link href={`/${locale}/booking`} className="text-[10px] font-bold border border-stone-300 px-6 py-3 rounded-full hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all uppercase tracking-widest shadow-sm">
            {t('Navigation.booking')}
          </Link>
        </div>
      </nav>

      <main className="flex-grow flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center relative overflow-hidden">
        <div className="max-w-4xl relative z-10">
          <span className="text-xs uppercase tracking-[0.3em] text-stone-400 font-semibold mb-6 block">
            {locale === 'vi' ? 'Khám phá sự tĩnh tại' : 'Discover tranquility'}
          </span>
          <h1 className="text-6xl md:text-8xl font-light tracking-tighter mb-8 text-stone-900 leading-[1.1]">
            {t('Hero.title')}
          </h1>
          <p className="text-lg md:text-xl text-stone-500 mb-12 font-light max-w-xl mx-auto leading-relaxed">
            {t('Hero.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link href={`/${locale}/booking`} className="px-8 py-4 bg-stone-900 text-white rounded-full text-xs uppercase tracking-widest hover:bg-stone-800 transition-all shadow-md w-full sm:w-auto">
              {locale === 'vi' ? 'Đặt lịch ngay' : 'Book a Session'}
            </Link>
            <Link href={`/${locale}/about`} className="px-8 py-4 bg-white border border-stone-200 text-stone-600 rounded-full text-xs uppercase tracking-widest hover:bg-stone-50 transition-all w-full sm:w-auto">
              {locale === 'vi' ? 'Tìm hiểu thêm' : 'Learn More'}
            </Link>
          </div>
        </div>
      </main>

      <footer className="w-full py-12 px-8 border-t border-stone-200/50 bg-white/50 text-center text-xs text-stone-400 uppercase tracking-widest">
        <p>© {new Date().getFullYear()} YogaStudio. {locale === 'vi' ? 'Mọi quyền được bảo lưu.' : 'All rights reserved.'}</p>
      </footer>
    </div>
  );
}