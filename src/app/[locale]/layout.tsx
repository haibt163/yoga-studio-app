import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Be_Vietnam_Pro } from 'next/font/google';
import '@/app/globals.css';

const beVietnam = Be_Vietnam_Pro({ 
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-be-vietnam',
  display: 'swap',
});

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>; // Restored: Promise
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params; // Restored: await
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${beVietnam.className} bg-gradient-to-br from-stone-50 to-stone-100 text-stone-900 antialiased selection:bg-stone-200 min-h-screen`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}