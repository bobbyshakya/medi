// app/metadata.ts
import { Metadata } from 'next';

// --- Global Constants for Medivisor Treatment India ---
const SITE_NAME = 'Medivisor Treatment India';
const SITE_URL = 'https://www.medivisortreatmentindia.com';
const SITE_DESCRIPTION = 'Medivisor Treatment India: Your trusted partner for world-class, affordable medical treatment and health services in India. Find top doctors, hospitals, and personalized care plans.';
const TWITTER_HANDLE = '@MedivisorIndia'; // Assuming a Twitter handle

// --- Default Metadata Configuration (App-wide) ---
export const defaultMetadata: Metadata = {
  title: {
    default: 'Medical Treatment & Health Services in India | Medivisor Treatment India',
    template: `%s | ${SITE_NAME}`
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'medical treatment in India',
    'medical tourism',
    'best hospitals India',
    'top doctors India',
    'affordable healthcare India',
    'health services India',
    'medical visa assistance',
    'medivisor'
  ],
  authors: [{ name: 'Medivisor Team' }],
  creator: 'Medivisor Treatment India',
  publisher: SITE_NAME,
  formatDetection: {
    email: true, // Typically, for a medical service, you might want email detection
    address: false,
    telephone: true, // Important for quick contact
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  // --- Open Graph (OG) for social media previews ---
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'Your Gateway to Quality Medical Treatment in India | Medivisor',
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og-image-medivisor.jpg', // Replace with a high-quality, relevant image (e.g., hospital exterior, doctor-patient interaction)
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} | Affordable Medical Treatment`,
      },
    ],
  },
  // --- Twitter Card for social media previews ---
  twitter: {
    card: 'summary_large_image',
    title: 'Medical Treatment & Health Services in India | Medivisor Treatment India',
    description: SITE_DESCRIPTION,
    creator: TWITTER_HANDLE,
    images: ['/og-image-medivisor.jpg'], // Same image as Open Graph
  },
  // --- Robots/SEO Configuration ---
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1, // Allow full preview
      'max-image-preview': 'large', // Show large image previews
      'max-snippet': -1, // Allow full snippet
    },
  },
  // --- Site Verification (Replace with your actual codes) ---
  verification: {
    google: 'your-medivisor-google-verification-code',
    yandex: 'your-medivisor-yandex-verification-code',
    // Removed Yahoo as it is less common, but added Bing
    other: {
        'msvalidate.01': 'your-medivisor-bing-verification-code',
    }
  },
  // --- Other useful metadata (e.g., PWA/App Icons) ---
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  }
};

// --- Page-Specific Metadata Configurations ---

// Example 1: About Us Page
export const aboutMetadata: Metadata = {
  title: 'About Medivisor | Your Medical Tourism Partner in India',
  description: 'Learn about Medivisor Treatment India’s mission, our team of experts, and our commitment to connecting patients with the best medical care and facilities in India.',
  openGraph: {
    title: 'About Medivisor Treatment India',
    description: 'Our mission is to provide seamless and affordable medical travel to India.',
    // Optional: Add a specific image for the About page
  },
};

// Example 2: Services Page (e.g., for different specialties)
export const servicesMetadata: Metadata = {
    title: 'Our Medical Services & Specialties | Medivisor',
    description: 'Explore the wide range of medical services offered by Medivisor Treatment India, including Cardiology, Orthopaedics, Oncology, IVF, and Organ Transplants.',
    keywords: [
        'cardiology treatment India',
        'orthopaedic surgery India',
        'cancer treatment India',
        'IVF in India',
        'medical specialties'
    ],
    openGraph: {
        title: 'Specialized Medical Treatments in India',
        description: 'Find advanced treatments like joint replacement and cardiac surgery through Medivisor.',
    },
};

// Example 3: Contact Us Page
export const contactMetadata: Metadata = {
  title: 'Contact Medivisor Team | Get a Free Treatment Quote',
  description: 'Contact Medivisor Treatment India today for a free consultation, treatment plan, and travel assistance. Our patient coordinators are available 24/7.',
  openGraph: {
    title: 'Get in Touch with Medivisor India',
    description: 'We are ready to assist you with your medical travel needs.',
  },
};