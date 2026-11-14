import type { Metadata } from 'next';

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  locale: 'vi' | 'en';
}

export function buildPageMetadata({
  title,
  description,
  path,
  locale,
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
      type: 'website',
      images: [
        {
          url: '/logo.png',
          width: 512,
          height: 512,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: ['/logo.png'],
    },
  };
}
