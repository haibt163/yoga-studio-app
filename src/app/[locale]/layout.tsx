import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Be_Vietnam_Pro } from 'next/font/google';
import type { Viewport } from 'next';
import '@/app/globals.css';

const beVietnam = Be_Vietnam_Pro({ 
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-be-vietnam',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#fafaf9',
};

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>; 
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params; 
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${beVietnam.className} bg-stone-50 text-stone-900 antialiased selection:bg-stone-200 min-h-screen`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}