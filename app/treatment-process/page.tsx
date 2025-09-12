import TreatmentProcessPage from './TreatmentProcessPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Treatment Process | Medivisor India',
  description: 'Learn about the Medivisor India treatment process for international patients. From initial consultation to post-treatment care, we ensure a smooth and safe medical journey.',
  keywords: 'Medivisor India treatment process, medical process India, international patient care, hospital procedures India, treatment steps India, patient journey, medical tourism India',
  robots: 'index, follow',
  openGraph: {
    title: 'Treatment Process | Medivisor India',
    description: 'Step-by-step guide to Medivisor India’s treatment process for international patients, ensuring safe and effective medical care.',
    url: 'https://medivisorindiatreatment.com/treatment-process',
    siteName: 'Medivisor India Treatment',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/MRX-Logo-PNG.png',
        width: 800,
        height: 250,
        alt: 'Medivisor India Treatment Process',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Treatment Process | Medivisor India',
    description: 'Explore Medivisor India’s treatment process for international patients, from consultation to post-treatment follow-up.',
    site: '@MedivisorIndiatreatment',
  },
};

export default function Page() {
  return <TreatmentProcessPage />;
}
