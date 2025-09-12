import FaqsPage from './FaqsPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQs | Medivisor India',
  description: 'Find answers to frequently asked questions by international patients seeking medical treatment in India. Get clarity on treatments, costs, travel, and more.',
  keywords: 'Medivisor India FAQs, medical treatment questions, international patients, treatment queries, travel and visa FAQs, cost and hospital information',
  robots: 'index, follow',
  openGraph: {
    title: 'FAQs | Medivisor India',
    description: 'Explore frequently asked questions for international patients planning medical treatment in India with Medivisor India.',
    url: 'https://medivisorindiatreatment.com/faqs',
    siteName: 'Medivisor India Treatment',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/MRX-Logo-PNG.png',
        width: 800,
        height: 250,
        alt: 'Medivisor India FAQs',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQs | Medivisor India',
    description: 'Get answers to commonly asked questions for international patients traveling to India for medical treatment.',
    site: '@MedivisorIndiatreatment',
  },
};

export default function Page() {
  return <FaqsPage />;
}
