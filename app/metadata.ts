// app/metadata.ts
import { Metadata } from 'next';
import { wixClient } from "@/lib/wixClient"; // Assuming this path is correct
import { media } from '@wix/sdk';
// ====================================================================
// 1. GLOBAL CONSTANTS
// ====================================================================
const SITE_NAME = 'Medivisor India Treatment';
const SITE_URL = 'https://medivisorindiatreatment.com/'; // Using the URL from your initial request
const SITE_TITLE_BASE = 'Medivisor India Treatment - World Class Healthcare For International Patients';
const SITE_DESCRIPTION = 'Proudly treated 2000+ patients worldwide. Medivisor India Treatment offers world-class, affordable medical treatments for international patients, including surgeries, IVF, kidney transplants, cancer care, and advanced heart treatments. Experience compassionate care with expert doctors and state-of-the-art hospitals.';
const TWITTER_HANDLE = '@MedivisorIndia'; // Assuming this is correct
const OG_IMAGE_URL = 'https://medivisorindiatreatment.com/logo_medivisor.png'; // Using the image from your initial request

// ====================================================================
// 2. DEFAULT METADATA CONFIGURATION (Used by the Root Layout or Home Page)
// ====================================================================
export const defaultMetadata: Metadata = {
  title: {
    default: SITE_TITLE_BASE,
    template: `%s | ${SITE_NAME}`, // Allows for dynamic titles like "About Us  Treatment"
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'Medivisor India Treatment',
    'medical tourism India',
    'affordable medical treatment',
    'international patient care',
    'surgery in India',
    'IVF treatment India',
    'kidney transplant India',
    'cancer treatment India',
    'heart treatment India',
    'best hospitals India',
    'expert doctors',
    'world-class healthcare',
  ],
  authors: [{ name: 'Medivisor Team' }],
  creator: SITE_NAME,
  publisher: SITE_NAME,

  metadataBase: new URL(SITE_URL),

  // Canonical should point to the root path for the home page
  alternates: {
    canonical: '/',
  },

  // --- Open Graph (OG) for social media previews ---
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE_BASE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE_URL,
        width: 800, // Matching your initial provided width
        height: 250, // Matching your initial provided height
        alt: `${SITE_NAME} - Premium Medical Care`,
      },
    ],
  },

  // --- Twitter Card for social media previews ---
  twitter: {
    card: 'summary_large_image', // Often preferred for better engagement
    title: SITE_TITLE_BASE,
    description: SITE_DESCRIPTION,
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
    images: [OG_IMAGE_URL],
  },

  // --- Robots/SEO Configuration ---
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // --- Verification (Replace with your actual codes) ---
  verification: {
    google: '746594929470-busv549t5tat92misjbn6jcercqd5886.apps.googleusercontent.com',
  },

  // --- Other useful metadata (e.g., icons) ---
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  }
};

// ====================================================================
// 3. PAGE-SPECIFIC METADATA CONFIGURATIONS (Examples for other pages)
// ====================================================================

// Example 1: About Us Page
export const aboutMetadata: Metadata = {
  title: 'About Medivisor India Treatment| Trusted International Medical Partner',
  description: 'Medivisor India is your trusted gateway to world-class healthcare. We help international patients access advanced medical treatments including surgeries, IVF, kidney transplants, cancer care, and heart treatments with compassionate, expert-led care.',
  keywords: [
    'Medivisor India',
    'About Medivisor',
    'international medical travel',
    'medical tourism India',
    'expert doctors India',
    'surgeries',
    'IVF treatment India',
    'kidney transplant',
    'cancer care',
    'heart treatment',
    'trusted healthcare partner'
  ],
  robots: 'index, follow',
  openGraph: {
    title: 'About Medivisor India Treatment| Trusted International Medical Partner',
    description: 'Learn about Medivisor India’s mission, values, and experience in helping international patients access world-class healthcare with safety, compassion, and expertise.',
    url: 'https://medivisorindiatreatment.com/about',
    siteName: 'Medivisor India Treatment',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/logo_medivisor.png',
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

export const pngExpendedMetadata: Metadata = {
  title: 'Medivisor Community Health Partners PNG | Join Our Healthcare Network',
  description:
    'Join the Medivisor Expanded Patient Support Network (PNG) as a Community Health Partner. Help bridge healthcare gaps between Papua New Guinea and India.',

  keywords: [
    'Medivisor Community Health Partners',
    'PNG Health Ambassador',
    'Medical Support Network PNG',
    'Healthcare Partners Papua New Guinea',
    'Medical Tourism India',
    'Community Health Guide',
    'Patient Support Network',
    'Health Ambassador Program',
    'Medical Support PNG',
    'Healthcare Bridge PNG India',
  ],

  robots: 'index, follow',

  alternates: {
    canonical:
      'https://medivisorindiatreatment.com/medivisor-expanded-patient-support-network-png',
  },

  openGraph: {
    title: 'Medivisor Community Health Partners PNG | Join Our Healthcare Network',
    description:
      'Join the Medivisor Expanded Patient Support Network (PNG) as a Community Health Partner.',
    url: 'https://medivisorindiatreatment.com/medivisor-expanded-patient-support-network-png',
    siteName: 'Medivisor India Treatment',
    type: 'website',
    locale: 'en_US',

    images: [
      {
        url: 'https://medivisorindiatreatment.com/PNG-Web-Banner-fb.jpg',
        secureUrl: 'https://medivisorindiatreatment.com/PNG-Web-Banner-fb.jpg',
        width: 1200,
        height: 630,
        alt: 'Medivisor Community Health Partners PNG',
        type: 'image/jpeg',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Medivisor Community Health Partners PNG | Join Our Healthcare Network',
    description:
      'Join the Medivisor Expanded Patient Support Network (PNG) as a Community Health Partner.',
    images: ['https://medivisorindiatreatment.com/PNG-Web-Banner-fb.jpg'],
  },
};


// Example 4: Blog Page (New addition)
export const blogMetadata: Metadata = {
  title: 'Blog ',
  description: 'Read informative blog posts by Medivisor India on medical treatments, healthcare tips, patient journeys, and international medical tourism in India.',
  keywords: ['Medivisor India blog', 'healthcare blog India', 'medical tourism articles', 'patient stories', 'medical treatment tips', 'health tips for international patients'],
  robots: 'index, follow',
  openGraph: {
    title: 'Blog ',
    description: 'Stay updated with the latest blog posts, patient stories, and healthcare insights by Medivisor India.',
    url: 'https://medivisorindiatreatment.com/blog',
    siteName: 'Medivisor India Treatment',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/logo_medivisor.png',
        width: 800,
        height: 250,
        alt: 'Medivisor India Blog',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog ',
    description: 'Read blog posts and healthcare articles by Medivisor India to guide international patients.',
    site: '@MedivisorIndiatreatment',
  },
};

export const servicesMetadata: Metadata = {
  title: "Our Medical Services",
  description:
    "Explore Medivisor India’s world-class medical services for international patients. We offer advanced surgeries, IVF, kidney transplant, cancer care, and heart treatments with compassionate, expert-led care.",
  keywords:
    "Medivisor India services, medical tourism India, surgeries India, IVF treatment India, kidney transplant, cancer care, heart treatment, international patient care, world-class hospitals India",
  robots: "index, follow",
  alternates: {
    canonical: "https://medivisorindiatreatment.com/services/", // ✅ Canonical Added
  },
  openGraph: {
    title: "Our Medical Services",
    description:
      "Discover Medivisor India’s advanced medical services including surgeries, IVF, kidney transplant, cancer care, and heart treatments for international patients.",
    url: "https://medivisorindiatreatment.com/services/",
    siteName: "Medivisor India Treatment",
    images: [
      {
        url: "https://medivisorindiatreatment.com/logo_medivisor.png",
        width: 800,
        height: 250,
        alt: "Medivisor India Medical Services",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Medical Services",
    description:
      "Get advanced medical care in India with Medivisor. Surgeries, IVF, kidney transplant, cancer care, and heart treatments with expert-led guidance.",
    site: "@MedivisorIndiatreatment",
  },
};
export const teamMetadata: Metadata = {
  title: 'Meet Our Expert Team',
  description: 'Meet the Medivisor India team of expert doctors, surgeons, and healthcare professionals committed to providing world-class medical care to international patients.',
  keywords: 'Medivisor India team, expert doctors India, medical team India, international patient care, surgeons, healthcare professionals, medical tourism India',

  robots: 'index, follow',
  openGraph: {
    title: 'Meet Our Expert Team',
    description: 'Discover our dedicated team of doctors, surgeons, and healthcare professionals delivering advanced medical care for international patients.',
    url: 'https://medivisorindiatreatment.com/team',
    siteName: 'Medivisor India Treatment',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/logo_medivisor.png',
        width: 800,
        height: 250,
        alt: 'Medivisor India Expert Team',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meet Our Expert Team',
    description: 'Meet our team of highly skilled doctors, surgeons, and healthcare professionals committed to world-class medical care.',

    site: '@MedivisorIndiatreatment',
  },
};
export const safetyMeasuresMetadata: Metadata = {
  title: 'Safety Measures & Protocols ',
  description: 'Our commitment to your safety: Review Medivisor India\'s strict safety protocols, accredited hospital partnerships, and comprehensive measures ensuring a secure and worry-free healthcare journey for international patients.',
  keywords: 'Medivisor India safety measures, patient safety protocols, accredited hospitals India, secure medical journey, healthcare security, international patient safety',

  robots: 'index, follow',
  openGraph: {
    title: 'Ensuring Care with Trust | Safety Measures at Medivisor India',
    description: 'Learn about the strict safety and hygiene protocols Medivisor India follows to ensure the highest standard of care and security throughout your treatment in India.',
    url: 'https://medivisorindiatreatment.com/safety-measures', // Update the URL to your safety measures page
    siteName: 'Medivisor India Treatment',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/safety_measures_banner.png', // Update the image URL to a relevant safety/trust image
        width: 1200, // Recommend a larger width for Open Graph images
        height: 630, // Recommend a standard ratio (e.g., 1.91:1)
        alt: 'Medivisor India Safety and Trust',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your Safety is Our Priority',
    description: 'We follow stringent safety protocols and partner only with accredited facilities. Explore our commitment to a secure medical journey.',

    site: '@MedivisorIndiatreatment',
  },
};

export const treatmentCostMetadata: Metadata = {
  title: 'Treatment Cost',
  description: 'Get an overview of treatment costs in India with Medivisor India. Transparent pricing for surgeries, IVF, kidney transplant, cancer care, and heart treatments for international patients.',
  keywords: 'Medivisor India treatment cost, medical treatment prices India, surgery cost India, IVF cost India, kidney transplant price, cancer treatment cost, heart treatment cost, international patients',
  robots: 'index, follow',
  openGraph: {
    title: 'Treatment Cost',
    description: 'Transparent treatment cost overview for international patients. Learn about prices for surgeries, IVF, kidney transplant, cancer care, and heart treatments in India.',
    url: 'https://medivisorindiatreatment.com/treatment-cost',
    siteName: 'Medivisor India Treatment',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/logo_medivisor.png',
        width: 800,
        height: 250,
        alt: 'Medivisor India Treatment Cost',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Treatment Cost',
    description: 'Get clear information on treatment costs for surgeries, IVF, kidney transplant, cancer care, and heart treatments in India with Medivisor.',

    site: '@MedivisorIndiatreatment',
  },
};

export const treatmentProcessMetadata: Metadata = {
  title: "Treatment Process",
  description:
    "Learn about the Medivisor India treatment process for international patients. From initial consultation to post-treatment care, we ensure a smooth and safe medical journey.",
  keywords:
    "Medivisor India treatment process, medical process India, international patient care, hospital procedures India, treatment steps India, patient journey, medical tourism India",
  robots: "index, follow",
  alternates: {
    canonical: "https://medivisorindiatreatment.com/treatment-process/", // ✅ Canonical Added
  },
  openGraph: {
    title: "Treatment Process",
    description:
      "Step-by-step guide to Medivisor India’s treatment process for international patients, ensuring safe and effective medical care.",
    url: "https://medivisorindiatreatment.com/treatment-process/",
    siteName: "Medivisor India Treatment",
    images: [
      {
        url: "https://medivisorindiatreatment.com/logo_medivisor.png",
        width: 800,
        height: 250,
        alt: "Medivisor India Treatment Process",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Treatment Process",
    description:
      "Explore Medivisor India’s treatment process for international patients, from consultation to post-treatment follow-up.",
    site: "@MedivisorIndiatreatment",
  },
};

export const visaProcessMetadata: Metadata = {
  title: 'Visa Process for Medical Travel',
  description: 'Learn about the step-by-step visa process for international patients seeking medical treatment in India with Medivisor India.',
  keywords: 'Medivisor India visa process, medical visa India, international patient visa, India medical travel, healthcare visa India, medical tourism India',
  robots: 'index, follow',
  openGraph: {
    title: 'Visa Process for Medical Travel',
    description: 'Step-by-step guide for international patients to obtain a medical visa and travel to India for world-class treatment with Medivisor India.',
    url: 'https://medivisorindiatreatment.com/visa-process',
    siteName: 'Medivisor India Treatment',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/logo_medivisor.png',
        width: 800,
        height: 250,
        alt: 'Medivisor India Visa Process',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Visa Process for Medical Travel',
    description: 'Medivisor India helps international patients with the medical visa application process and travel guidance to India.',
    site: '@MedivisorIndiatreatment',
  },
};

export const travelGuideMetadata: Metadata = {
  title: 'Travel Guide for International Patients',
  description: 'Medivisor India provides a comprehensive travel guide for international patients seeking medical treatment in India. Learn about travel tips, accommodation, local transport, and essential guidelines.',
  keywords: 'Medivisor India travel guide, medical travel India, international patient guide, India travel tips, medical tourism India, accommodation for patients, local transport India',
  robots: 'index, follow',
  openGraph: {
    title: 'Travel Guide for International Patients',
    description: 'Plan your medical trip to India with Medivisor India’s travel guide for international patients, including tips on travel, accommodation, and local transport.',
    url: 'https://medivisorindiatreatment.com/travel-guide',
    siteName: 'Medivisor India Treatment',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/og-travel-guide.jpg',
        width: 800,
        height: 250,
        alt: 'Medivisor India Travel Guide',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Travel Guide for International Patients',
    description: 'Get essential travel tips, accommodation guidance, and local transport information for international patients traveling to India for medical treatment.',
    site: '@MedivisorIndiatreatment',
  },
};

export const faqsMetadata: Metadata = {
  title: 'FAQs',
  description: 'Find answers to frequently asked questions by international patients seeking medical treatment in India. Get clarity on treatments, costs, travel, and more.',
  keywords: 'Medivisor India FAQs, medical treatment questions, international patients, treatment queries, travel and visa FAQs, cost and hospital information',
  robots: 'index, follow',
  openGraph: {
    title: 'FAQs',
    description: 'Explore frequently asked questions for international patients planning medical treatment in India with Medivisor India.',
    url: 'https://medivisorindiatreatment.com/faqs',
    siteName: 'Medivisor India Treatment',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/logo_medivisor.png',
        width: 800,
        height: 250,
        alt: 'Medivisor India FAQs',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQs | Medivisor India',
    description: 'Get answers to commonly asked questions for international patients traveling to India for medical treatment.',
    site: '@MedivisorIndiatreatment',
  },
};

export const whyMedivisorMetadata: Metadata = {
  title: 'Why Choose Medivisor India? | Leading Medical Tourism',
  description: 'Discover why Medivisor India is the best choice for international patients, offering world-class doctors, accredited hospitals, seamless patient experience, and compassionate care.',
  keywords: 'Why Medivisor India, choose Medivisor, best medical tourism India, world-class healthcare, accredited hospitals, seamless patient journey, medical care India',

  robots: 'index, follow',
  openGraph: {
    title: 'The Medivisor Advantage: Trust, Quality, and Compassionate Care',
    description: 'Learn about the unique advantages of choosing Medivisor India for your medical treatment, including high standards of safety, transparency, and personalized support.',
    url: 'https://medivisorindiatreatment.com/why-medivisor', // Update the URL
    siteName: 'Medivisor India Treatment',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/why_medivisor_og_banner.png', // Replace with an image showcasing trust or quality
        width: 1200,
        height: 630,
        alt: 'The Medivisor India Advantage',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your Best Choice for Medical Travel: Why Medivisor?',
    description: 'World-class doctors, accredited facilities, and comprehensive support—see why Medivisor India is the trusted partner for your medical journey.',

    site: '@MedivisorIndiatreatment',
  },
};

export const patientTestimonialsMetadata: Metadata = {
  title: 'Patient Testimonials',
  description: 'Read real experiences and success stories from international patients who received treatment in India through Medivisor India. Learn why patients trust us for world-class healthcare.',
  keywords: 'Medivisor India testimonials, patient reviews India, medical treatment feedback, international patient experiences, surgery success stories, medical tourism India',
  robots: 'index, follow',
  openGraph: {
    title: 'Patient Testimonials',
    description: 'Discover real experiences of international patients who trusted Medivisor India for their medical treatment in India.',
    url: 'https://medivisorindiatreatment.com/patient-testimonials',
    siteName: 'Medivisor India Treatment',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/logo_medivisor.png',
        width: 800,
        height: 250,
        alt: 'Medivisor India Patient Testimonials',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Patient Testimonials',
    description: 'Read patient reviews and success stories of international patients treated in India through Medivisor India.',
    site: '@MedivisorIndiatreatment',
  },
};

export const mediaCoverageMetadata: Metadata = {
  title: 'Media Coverage & News',
  description: 'Explore the latest media coverage, press releases, and news articles about Medivisor India’s contributions to international patient care and medical tourism in India.',
  keywords: 'Medivisor India news, media coverage India, press releases, healthcare news, international patient news, medical tourism media, India healthcare news',
  robots: 'index, follow',
  openGraph: {
    title: 'Media Coverage & News',
    description: 'Stay updated with press releases, news articles, and media mentions of Medivisor India.',
    url: 'https://medivisorindiatreatment.com/media-coverage',
    siteName: 'Medivisor India Treatment',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/logo_medivisor.png',
        width: 800,
        height: 250,
        alt: 'Medivisor India Media Coverage',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Media Coverage & News',
    description: 'Discover recent news articles, press releases, and media coverage featuring Medivisor India and international patient care.',
    site: '@MedivisorIndiatreatment',
  },
};

export const contactMetadata: Metadata = {
  title: "Contact Medivisor India Treatment - Get Medical Tourism Support",
  description:
    "Contact Medivisor India Treatment for medical tourism assistance. Global offices in India, Mauritius, Fiji, Vanuatu, Solomon Islands, and PNG. 24/7 support available.",
  keywords:
    "contact medivisor, medical tourism contact, healthcare support India, international patient assistance",
  openGraph: {
    title: "Contact Medivisor India Treatment - Get Medical Tourism Support",
    description:
      "Reach Medivisor India for expert medical tourism assistance across multiple countries. Our global offices provide 24/7 support to international patients.",
    url: "https://medivisorindiatreatment.com/contact",
    siteName: "Medivisor India",
    type: "website",
    images: [
      {
        url: 'https://medivisorindiatreatment.com/logo_medivisor.png',
        width: 800,
        height: 250,
        alt: "Contact Medivisor India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Medivisor India Treatment",
    description:
      "Connect with Medivisor India for seamless medical tourism assistance and global support for patients.",
    site: "@MedivisorIndiatreatment",
    images: ["/logo-10.png"],
  },
  robots: "index, follow",
  authors: [{ name: "Medivisor India" }],
  metadataBase: new URL("https://medivisorindiatreatment.com"),
};

export const pngNetworkMetadata: Metadata = {
  title: 'Medivisor Community Health Partners PNG | Join Our Healthcare Network',
  description: 'Join the Medivisor Expanded Patient Support Network (PNG) as a Community Health Partner. Help bridge healthcare gaps between Papua New Guinea and India. Earn respect, purpose, skills, and sustainable livelihood while saving lives.',
  keywords: [
    'Medivisor Community Health Partners',
    'PNG Health Ambassador',
    'Medical Support Network PNG',
    'Healthcare Partners Papua New Guinea',
    'Medical Tourism India',
    'Community Health Guide',
    'Patient Support Network',
    'Health Ambassador Program',
    'Medical Support PNG',
    'Healthcare Bridge PNG India'
  ],
  robots: 'index, follow',
  alternates: {
    canonical: 'https://medivisorindiatreatment.com/medivisor-expanded-patient-support-network-png',
  },
  openGraph: {
    title: 'Medivisor Community Health Partners PNG | Join Our Healthcare Network',
    description: 'Join the Medivisor Expanded Patient Support Network (PNG) as a Community Health Partner. Help bridge healthcare gaps between Papua New Guinea and India.',
    url: 'https://medivisorindiatreatment.com/medivisor-expanded-patient-support-network-png',
    siteName: 'Medivisor India Treatment',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/PNG-Web-Banner-fb.jpg',
        width: 1200,
        height: 630,
        alt: 'Medivisor Community Health Partners PNG',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Medivisor Community Health Partners PNG | Join Our Healthcare Network',
    description: 'Join the Medivisor Expanded Patient Support Network (PNG) as a Community Health Partner.',
    site: '@MedivisorIndia',
    images: ['https://medivisorindiatreatment.com/PNG-Web-Banner-fb.jpg'],
  },
};
