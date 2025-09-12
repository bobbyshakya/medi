import VisaProcessPage from './VisaProcessPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Visa Process for Medical Travel | Medivisor India',
  description: 'Learn about the step-by-step visa process for international patients seeking medical treatment in India with Medivisor India.',
  keywords: 'Medivisor India visa process, medical visa India, international patient visa, India medical travel, healthcare visa India, medical tourism India',
  robots: 'index, follow',
  openGraph: {
    title: 'Visa Process for Medical Travel | Medivisor India',
    description: 'Step-by-step guide for international patients to obtain a medical visa and travel to India for world-class treatment with Medivisor India.',
    url: 'https://medivisorindiatreatment.com/visa-process',
    siteName: 'Medivisor India Treatment',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/MRX-Logo-PNG.png',
        width: 800,
        height: 250,
        alt: 'Medivisor India Visa Process',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Visa Process for Medical Travel | Medivisor India',
    description: 'Medivisor India helps international patients with the medical visa application process and travel guidance to India.',
    site: '@MedivisorIndiatreatment',
  },
};

export default function Page() {
  return <VisaProcessPage />;
}
