import type { Metadata } from 'next';

export const pageMetadata: Metadata = {
  title: 'Home',
  description: 'Medivisor is a trusted partner for medical treatment and travel in India. We provide comprehensive services, from visa assistance to hospital network access.',
  openGraph: {
    title: 'Medivisor India Treatment',
    description: 'Medivisor is a trusted partner for medical treatment and travel in India. We provide comprehensive services, from visa assistance to hospital network access.',
    url: 'https://www.medivisor.com',
    siteName: 'Medivisor',
    images: [
      {
        url: 'https://www.medivisor.com/og-image.jpg',
        width: 800,
        height: 250,
        alt: 'Medivisor India Treatment',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};