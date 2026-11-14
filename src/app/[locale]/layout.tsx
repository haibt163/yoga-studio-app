import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { Be_Vietnam_Pro } from 'next/font/google';
import type { Metadata, Viewport } from 'next';
import '@/app/globals.css';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { verifyAdminSession } from '@/lib/admin/session';

const beVietnam = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-be-vietnam',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#fafaf9',
};

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'en' ? 'en' : 'vi';
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://changyoga.vercel.app';

  return {
    metadataBase: new URL(siteUrl),
    title: t('homeTitle'),
    description: t('homeDescription'),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        vi: '/vi',
        en: '/en',
      },
    },
    openGraph: {
      title: t('homeTitle'),
      description: t('homeDescription'),
      url: `/${locale}`,
      siteName: 'Yoga with Chang',
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
      type: 'website',
      images: [
        {
          url: '/logo.png',
          width: 512,
          height: 512,
          alt: t('ogAlt'),
        },
      ],
    },
    icons: {
      icon: '/logo.png',
      apple: '/logo.png',
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === 'en' ? 'en' : 'vi';
  const messages = await getMessages({ locale });
  const isAdmin = await verifyAdminSession();

  return (
    <html lang={locale}>
      <body className={`${beVietnam.variable} flex min-h-screen flex-col bg-stone-50 font-sans text-stone-900 antialiased selection:bg-rose-200`}>
        <NextIntlClientProvider messages={messages}>
          <Header locale={locale} isAdmin={isAdmin} />
          <div className="flex-1">{children}</div>
          <Footer locale={locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
