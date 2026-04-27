import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

const locales = ['vi', 'en'];

export default getRequestConfig(async ({ requestLocale }) => {
  // In newer Next.js versions, we must await the requestLocale
  const locale = await requestLocale;

  // Validate that the incoming locale is supported
  if (!locale || !locales.includes(locale as any)) {
    notFound();
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});