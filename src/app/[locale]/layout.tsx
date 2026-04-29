import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Be_Vietnam_Pro } from 'next/font/google';
import type { Viewport, Metadata } from 'next';
import '@/app/globals.css';

// FIX: We include the full range of weights (100-900).
// Loading all weights ensures the browser always has the native glyphs for Vietnamese 
// diacritics, preventing the "broken" spacing seen when weights are synthesized.
const beVietnam = Be_Vietnam_Pro({ 
  subsets: ['latin', 'vietnamese'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
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

// Adds the home screen icon for iOS and search engine metadata
export const metadata: Metadata = {
  title: 'Yoga x Chang',
  description: 'A minimal yoga space for focus and tranquility.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  }
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
      {/* FIX: We use beVietnam.variable combined with the 'font-sans' class.
          This ensures the font is correctly applied globally via Tailwind's 
          configuration while maintaining the high-quality Vietnamese rendering.
      */}
      <body className={`${beVietnam.variable} font-sans bg-stone-50 text-stone-900 antialiased selection:bg-rose-200 min-h-screen`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}