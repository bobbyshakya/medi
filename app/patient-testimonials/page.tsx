import PatientTestimonialsPage from './PatientTestimonialsPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Patient Testimonials | Medivisor India',
  description: 'Read real experiences and success stories from international patients who received treatment in India through Medivisor India. Learn why patients trust us for world-class healthcare.',
  keywords: 'Medivisor India testimonials, patient reviews India, medical treatment feedback, international patient experiences, surgery success stories, medical tourism India',
  robots: 'index, follow',
  openGraph: {
    title: 'Patient Testimonials | Medivisor India',
    description: 'Discover real experiences of international patients who trusted Medivisor India for their medical treatment in India.',
    url: 'https://medivisorindiatreatment.com/patient-testimonials',
    siteName: 'Medivisor India Treatment',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/MRX-Logo-PNG.png',
        width: 800,
        height: 250,
        alt: 'Medivisor India Patient Testimonials',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Patient Testimonials | Medivisor India',
    description: 'Read patient reviews and success stories of international patients treated in India through Medivisor India.',
    site: '@MedivisorIndiatreatment',
  },
};

export default function Page() {
  return <PatientTestimonialsPage />;
}
