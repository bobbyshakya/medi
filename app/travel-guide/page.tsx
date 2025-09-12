import TravelGuidePage from './TravelGuidePage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Travel Guide for International Patients | Medivisor India',
  description: 'Medivisor India provides a comprehensive travel guide for international patients seeking medical treatment in India. Learn about travel tips, accommodation, local transport, and essential guidelines.',
  keywords: 'Medivisor India travel guide, medical travel India, international patient guide, India travel tips, medical tourism India, accommodation for patients, local transport India',
  robots: 'index, follow',
  openGraph: {
    title: 'Travel Guide for International Patients | Medivisor India',
    description: 'Plan your medical trip to India with Medivisor India’s travel guide for international patients, including tips on travel, accommodation, and local transport.',
    url: 'https://medivisorindiatreatment.com/travel-guide',
    siteName: 'Medivisor India Treatment',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/og-travel-guide.jpg',
        width: 800,
        height: 250,
        alt: 'Medivisor India Travel Guide',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Travel Guide for International Patients | Medivisor India',
    description: 'Get essential travel tips, accommodation guidance, and local transport information for international patients traveling to India for medical treatment.',
    site: '@MedivisorIndiatreatment',
  },
};

export default function Page() {
  return <TravelGuidePage />;
}
