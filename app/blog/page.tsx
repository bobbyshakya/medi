import BlogPage from './BlogPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | Medivisor India',
  description: 'Read informative blog posts by Medivisor India on medical treatments, healthcare tips, patient journeys, and international medical tourism in India.',
  keywords: 'Medivisor India blog, healthcare blog India, medical tourism articles, patient stories, medical treatment tips, health tips for international patients',
  robots: 'index, follow',
  openGraph: {
    title: 'Blog | Medivisor India',
    description: 'Stay updated with the latest blog posts, patient stories, and healthcare insights by Medivisor India.',
    url: 'https://medivisorindiatreatment.com/blog',
    siteName: 'Medivisor India Treatment',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/MRX-Logo-PNG.png',
        width: 800,
        height: 250,
        alt: 'Medivisor India Blog',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | Medivisor India',
    description: 'Read blog posts and healthcare articles by Medivisor India to guide international patients.',
    site: '@MedivisorIndiatreatment',
  },
};

export default function Page() {
  return <BlogPage />;
}