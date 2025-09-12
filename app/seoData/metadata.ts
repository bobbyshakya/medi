import { Metadata } from "next";

// Site-wide metadata
export const siteMetadata = {
  title: "Medivisor India Treatment - High-Quality Medical Care",
  description:
    "Medivisor provides affordable, high-quality medical treatment in India for international patients, including surgery, kidney transplant, IVF, cancer care, and heart treatment.",
  keywords:
    "medical tourism, India treatment, affordable surgery, kidney transplant, IVF, cancer care, heart treatment, international patients",
  canonical: "https://medivisorindiatreatment.com/",
  openGraph: {
    title: "Medivisor India Treatment - Your Trusted Medical Partner",
    description:
      "We offer comprehensive medical tourism services for international patients seeking world-class treatment in India.",
    url: "https://medivisorindiatreatment.com/",
    siteName: "Medivisor India Treatment",
    images: [
      {
        url: "https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg",
        width: 800,
        height: 250,
        alt: "Medivisor India Treatment",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@MedivisorIndiatreatment",
  },
};

// Page-specific metadata keyed by pathname
export const pageMetadata: Record<string, Partial<Metadata>> = {
  "/": {
    title: "Home | Medivisor India Treatment",
    description: siteMetadata.description,
  },
  "/aboutus": {
    title: "About Us | Medivisor India Treatment",
    description:
      "Learn about Medivisor's mission, vision, and commitment to providing the best medical tourism services.",
  },
  "/services": {
    title: "Our Services | Medivisor India Treatment",
    description:
      "Explore the wide range of medical services offered by Medivisor, including treatment for cancer, cardiology, and more.",
  },
  "/contact": {
    title: "Contact Us | Medivisor India Treatment",
    description: "Get in touch with Medivisor for all your medical tourism inquiries.",
  },
  // Add other pages similarly...
};
