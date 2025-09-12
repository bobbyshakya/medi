import TeamPage from './TeamPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meet Our Expert Team | Medivisor India',
  description: 'Meet the Medivisor India team of expert doctors, surgeons, and healthcare professionals committed to providing world-class medical care to international patients.',
  keywords: 'Medivisor India team, expert doctors India, medical team India, international patient care, surgeons, healthcare professionals, medical tourism India',
  
  robots: 'index, follow',
  openGraph: {
    title: 'Meet Our Expert Team | Medivisor India',
    description: 'Discover our dedicated team of doctors, surgeons, and healthcare professionals delivering advanced medical care for international patients.',
    url: 'https://medivisorindiatreatment.com/team',
    siteName: 'Medivisor India Treatment',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/MRX-Logo-PNG.png',
        width: 800,
        height: 250,
        alt: 'Medivisor India Expert Team',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meet Our Expert Team | Medivisor India',
    description: 'Meet our team of highly skilled doctors, surgeons, and healthcare professionals committed to world-class medical care.',
   
    site: '@MedivisorIndiatreatment',
  },
};

export default function Page() {
  return <TeamPage />;
}
