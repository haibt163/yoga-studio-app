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
    <div className="min-h-screen flex flex-col font-sans bg-stone-50 selection:bg-rose-200 text-stone-900">
      
      {/* BULLETPROOF IOS HEADER */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white/90 border-b border-stone-200/50 ios-glass">
        {/* iOS Safe Area Spacer - natively pushes content down below the notch without breaking CSS math */}
        <div className="w-full pt-[env(safe-area-inset-top,0px)]"></div>
        
        {/* Navigation Content - Fully responsive */}
        <nav className="w-full max-w-7xl mx-auto px-6 py-4 flex flex-wrap justify-between items-center gap-y-4">
          
          {/* 1. Logo */}
          <div className="text-xl md:text-2xl tracking-widest font-light uppercase order-1">
            Yoga<span className="font-semibold text-rose-700"> with Chang</span>
          </div>
          
          {/* 2. Links */}
          <div className="w-full md:w-auto flex justify-center space-x-8 md:space-x-12 text-[10px] md:text-xs tracking-widest text-stone-500 uppercase font-medium order-3 md:order-2 border-t border-stone-200/50 md:border-none pt-4 md:pt-0">
            <Link href={`/${locale}/about`} className="hover:text-rose-700 transition-colors">{t('Navigation.about')}</Link>
            <Link href={`/${locale}/testimonials`} className="hover:text-rose-700 transition-colors">{t('Navigation.testimonials')}</Link>
            <Link href={`/${locale}/calendar`} className="hover:text-rose-700 transition-colors">{t('Navigation.calendar')}</Link>
          </div>

          {/* 3. Actions */}
          <div className="flex items-center space-x-4 md:space-x-6 order-2 md:order-3">
            <Link href={`/${toggleLang}`} className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-rose-700 transition-colors">
              {locale === 'vi' ? 'EN' : 'VN'}
            </Link>
            <Link href={`/${locale}/booking`} className="text-[10px] font-bold border border-rose-200 px-4 md:px-6 py-2 md:py-3 rounded-full hover:bg-rose-800 hover:text-white hover:border-rose-800 transition-all uppercase tracking-widest shadow-sm text-rose-800">
              {t('Navigation.booking')}
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-6 pt-56 pb-10 text-center relative overflow-hidden">
        <div className="max-w-4xl relative z-10 flex flex-col items-center">
          {/* Logo Addition */}
          <img src="/logo.png" alt="Yoga with Chang Logo" className="w-24 h-24 mb-8 opacity-90 object-contain" />
          
          <span className="text-xs uppercase tracking-[0.3em] text-rose-600 font-semibold mb-6 block">
            {locale === 'vi' ? 'Khám phá sự tĩnh tại' : 'Discover tranquility'}
          </span>
          <h1 className="text-6xl md:text-8xl font-light tracking-tighter mb-8 text-stone-900 leading-[1.1]">
            {t('Hero.title')}
          </h1>
          <p className="text-lg md:text-xl text-stone-500 mb-12 font-light max-w-xl mx-auto leading-relaxed">
            {t('Hero.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link href={`/${locale}/booking`} className="px-8 py-4 bg-rose-800 text-white rounded-full text-xs uppercase tracking-widest hover:bg-rose-900 hover:-translate-y-0.5 transition-all shadow-md w-full sm:w-auto">
              {locale === 'vi' ? 'Đặt lịch ngay' : 'Book a Session'}
            </Link>
            <Link href={`/${locale}/about`} className="px-8 py-4 bg-white border border-stone-200 text-stone-600 rounded-full text-xs uppercase tracking-widest hover:bg-rose-50 hover:text-rose-800 transition-all w-full sm:w-auto">
              {locale === 'vi' ? 'Tìm hiểu thêm' : 'Learn More'}
            </Link>
          </div>
        </div>
      </main>

      {/* B.K.S. Iyengar Quote Section */}
      {/* FIX: Changed 'font-serif' to 'font-sans' to fix Vietnamese spacing */}
      <div className="w-full max-w-3xl mx-auto px-6 py-20 text-center border-t border-stone-200/50">
        <p className="text-xl md:text-2xl font-sans italic text-stone-600 mb-6 leading-relaxed">
          {t('Quote.text')}
        </p>
        <p className="text-xs font-medium tracking-widest uppercase text-rose-700">
          {t('Quote.author')} <br/><span className="mt-2 inline-block">Namaste 🙏</span>
        </p>
      </div>

      <footer className="w-full py-12 px-8 border-t border-stone-200/50 bg-stone-50 text-center text-xs text-stone-400 uppercase tracking-widest">
        <p>© {new Date().getFullYear()} Yoga with Chang. {locale === 'vi' ? 'Mọi quyền được bảo lưu.' : 'All rights reserved.'}</p>
      </footer>
    </div>
  );
}