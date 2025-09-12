


import AboutPage from './AboutPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Medivisor India Treatment| Trusted International Medical Partner',
  description: 'Medivisor India is your trusted gateway to world-class healthcare. We help international patients access advanced medical treatments including surgeries, IVF, kidney transplants, cancer care, and heart treatments with compassionate, expert-led care.',
  keywords: 'Medivisor India, About Medivisor, international medical travel, medical tourism India, expert doctors India, surgeries, IVF treatment India, kidney transplant, cancer care, heart treatment, trusted healthcare partner',
  robots: 'index, follow',
  openGraph: {
    title: 'About Medivisor India Treatment| Trusted International Medical Partner',
    description: 'Learn about Medivisor India’s mission, values, and experience in helping international patients access world-class healthcare with safety, compassion, and expertise.',
    url: 'https://medivisorindiatreatment.com/about',
    siteName: 'Medivisor India Treatment',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/MRX-Logo-PNG.png',
        width: 800,
        height: 250,
        alt: 'About Medivisor India Treatment- Trusted Medical Partner',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Medivisor India Treatment| Trusted International Medical Partner',
    description: 'Discover how Medivisor India helps international patients access world-class medical treatments in India with expert care and safety-first approach.',
   
    site: '@MedivisorIndiatreatment',
  },
};

export default function Page() {
  return <AboutPage />;
}
