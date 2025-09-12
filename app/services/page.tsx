import ServicesPage from './ServicePage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Medical Services | Medivisor India',
  description: 'Explore Medivisor India’s world-class medical services for international patients. We offer advanced surgeries, IVF, kidney transplant, cancer care, and heart treatments with compassionate, expert-led care.',
  keywords: 'Medivisor India services, medical tourism India, surgeries India, IVF treatment India, kidney transplant, cancer care, heart treatment, international patient care, world-class hospitals India',

  robots: 'index, follow',
  openGraph: {
    title: 'Our Medical Services | Medivisor India',
    description: 'Discover Medivisor India’s advanced medical services including surgeries, IVF, kidney transplant, cancer care, and heart treatments for international patients.',
    url: 'https://medivisorindiatreatment.com/services',
    siteName: 'Medivisor India Treatment',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/MRX-Logo-PNG.png',
        width: 800,
        height: 250,
        alt: 'Medivisor India Medical Services',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Our Medical Services | Medivisor India',
    description: 'Get advanced medical care in India with Medivisor. Surgeries, IVF, kidney transplant, cancer care, and heart treatments with expert-led guidance.',

    site: '@MedivisorIndiatreatment',
  },
};

export default function Page() {
  return <ServicesPage />;
}
