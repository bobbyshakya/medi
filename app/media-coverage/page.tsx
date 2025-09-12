import MediaCoveragePage from './MediaCoveragePage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Media Coverage & News | Medivisor India',
  description: 'Explore the latest media coverage, press releases, and news articles about Medivisor India’s contributions to international patient care and medical tourism in India.',
  keywords: 'Medivisor India news, media coverage India, press releases, healthcare news, international patient news, medical tourism media, India healthcare news',
  robots: 'index, follow',
  openGraph: {
    title: 'Media Coverage & News | Medivisor India',
    description: 'Stay updated with press releases, news articles, and media mentions of Medivisor India.',
    url: 'https://medivisorindiatreatment.com/media-coverage',
    siteName: 'Medivisor India Treatment',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/MRX-Logo-PNG.png',
        width: 800,
        height: 250,
        alt: 'Medivisor India Media Coverage',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Media Coverage & News | Medivisor India',
    description: 'Discover recent news articles, press releases, and media coverage featuring Medivisor India and international patient care.',
    site: '@MedivisorIndiatreatment',
  },
};

export default function Page() {
  return <MediaCoveragePage />;
}
