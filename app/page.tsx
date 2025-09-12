import HomePage from '@/components/HomePage';


import { Metadata } from 'next';

export const generateMetadata = (): Metadata => {
  return {

  title: 'Medivisor India Treatment - World Class Healthcare For International Patients',
  description: 'Proudly treated 2000+ patients worldwide. Medivisor India Treatment offers world-class, affordable medical treatments for international patients, including surgeries, IVF, kidney transplants, cancer care, and advanced heart treatments. Experience compassionate care with expert doctors and state-of-the-art hospitals.',
  keywords: 'Medivisor India Treatment, medical tourism India, affordable medical treatment, international patient care, surgery in India, IVF treatment India, kidney transplant India, cancer treatment India, heart treatment India, best hospitals India, expert doctors, world-class healthcare',
  robots: 'index, follow',
  openGraph: {
    title: 'Medivisor India Treatment - World Class Healthcare For International Patients',
    description: 'Proudly treated 2000+ patients worldwide. Medivisor India Treatment offers world-class, affordable medical treatments for international patients, including surgeries, IVF, kidney transplants, cancer care, and advanced heart treatments. Experience compassionate care with expert doctors and state-of-the-art hospitals.',
    url: 'https://medivisorindiatreatment.com/',
    siteName: 'Medivisor India Treatment',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/MRX-Logo-PNG.png',
        width: 800,
        height: 250,
        alt: 'Medivisor India Treatment - Premium Medical Care',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Medivisor India Treatment - World Class Healthcare For International Patients',
    description: 'Proudly treated 2000+ patients worldwide. Medivisor India Treatment offers world-class, affordable medical treatments for international patients, including surgeries, IVF, kidney transplants, cancer care, and advanced heart treatments. Experience compassionate care with expert doctors and state-of-the-art hospitals.',
    site: '@MedivisorIndiatreatment',
  },
};

  };

export default function Home() {
  return (
    <HomePage/>
  );
}