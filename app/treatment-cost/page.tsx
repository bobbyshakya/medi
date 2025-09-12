import TreatmentCostPage from './TreatmentCostPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Treatment Cost | Medivisor India',
  description: 'Get an overview of treatment costs in India with Medivisor India. Transparent pricing for surgeries, IVF, kidney transplant, cancer care, and heart treatments for international patients.',
  keywords: 'Medivisor India treatment cost, medical treatment prices India, surgery cost India, IVF cost India, kidney transplant price, cancer treatment cost, heart treatment cost, international patients',
  robots: 'index, follow',
  openGraph: {
    title: 'Treatment Cost | Medivisor India',
    description: 'Transparent treatment cost overview for international patients. Learn about prices for surgeries, IVF, kidney transplant, cancer care, and heart treatments in India.',
    url: 'https://medivisorindiatreatment.com/treatment-cost',
    siteName: 'Medivisor India Treatment',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/MRX-Logo-PNG.png',
        width: 800,
        height: 250,
        alt: 'Medivisor India Treatment Cost',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Treatment Cost | Medivisor India',
    description: 'Get clear information on treatment costs for surgeries, IVF, kidney transplant, cancer care, and heart treatments in India with Medivisor.',
  
    site: '@MedivisorIndiatreatment',
  },
};

export default function Page() {
  return <TreatmentCostPage />;
}
