import HomePage from '@/components/HomePage';


import { Metadata } from 'next';

export const generateMetadata = (): Metadata => {
  return {

  title: 'Medivisor India | Premium Medical Treatment for International Patients',
  description: 'Medivisor India offers world-class, affordable medical treatments for international patients, including surgeries, IVF, kidney transplants, cancer care, and advanced heart treatments. Experience compassionate care with expert doctors and state-of-the-art hospitals.',
  keywords: 'Medivisor India, medical tourism India, affordable medical treatment, international patient care, surgery in India, IVF treatment India, kidney transplant India, cancer treatment India, heart treatment India, best hospitals India, expert doctors, world-class healthcare',
  robots: 'index, follow',
  openGraph: {
    title: 'Medivisor India | Premium Medical Treatment for International Patients',
    description: 'Get affordable, high-quality medical care in India with Medivisor. We provide expert-guided surgeries, IVF, kidney transplants, cancer care, and heart treatments for international patients.',
    url: 'https://www.medivisorindia.com/',
    siteName: 'Medivisor India',
    images: [
      {
        url: 'https://www.medivisorindia.com/medical-help-india.jpg',
        width: 1200,
        height: 630,
        alt: 'Medivisor India - Premium Medical Care',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Medivisor India Treatment | Premium Medical Treatment for International Patients',
    description: 'Affordable, high-quality medical treatment in India for international patients. Surgeries, IVF, kidney transplant, cancer care, and heart treatments with expert care.',
    site: '@MedivisorIndia',
  },
};

  };

export default function Home() {
  return (
    <HomePage/>
  );
}