import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Be_Vietnam_Pro } from 'next/font/google';
import type { Viewport, Metadata } from 'next';
import '@/app/globals.css';
// Step B Import:
import MusicPlayer from '@/components/MusicPlayer';

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

// Updated title to "Yoga with Chang" per your request
export const metadata: Metadata = {
  title: 'Yoga with Chang',
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
      <body className={`${beVietnam.variable} font-sans bg-stone-50 text-stone-900 antialiased selection:bg-rose-200 min-h-screen`}>
        <NextIntlClientProvider messages={messages}>
          {children}
          {/* Step B: MusicPlayer added here. 
              Placing it inside the Layout ensures the music 
              persists even when the user clicks between links. 
          */}
          <MusicPlayer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}