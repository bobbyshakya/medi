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

// Example 2: Services Page (e.g., for different specialties)
export const servicesMetadata: Metadata = {
    title: 'Comprehensive Medical Services & Specialties | Medivisor',
    description: 'Explore the wide range of world-class medical services offered by Medivisor India Treatment, including Cardiology, Orthopaedics, Cancer Care, IVF, and Organ Transplants for global patients.',
    keywords: [
        'cardiology treatment India',
        'orthopaedic surgery India',
        'cancer treatment India',
        'IVF in India',
        'organ transplants',
        'medical specialties'
    ],
};

// Example 3: Contact Us Page
export const contactMetadata: Metadata = {
  title: 'Contact Medivisor Team | Get a Free Treatment Quote and Consultation',
  description: 'Contact Medivisor India Treatment today for a free consultation, personalized treatment plan, and full travel assistance. Our patient coordinators are available 24/7 to help you.',
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



// ====================================================================
// Interfaces
// ====================================================================

interface PostData {
    title?: string;
    excerpt?: string;
    richContent?: any;
    contentText?: string;
    content?: any;
    firstPublishedDate?: string;
    lastPublishedDate?: string;
    tags?: string[];
    slug?: string;
    coverMedia?: {
        image?: string;
    };
    media?: {
        wixMedia?: {
            image?: string;
        };
    };
}

// ====================================================================
// Image Helper Functions
// ====================================================================

/**
 * Function to get properly formatted Wix Image URL
 * @param wixUrl The Wix image URL string (e.g., wix:image://v1/...)
 * @returns An optimized, direct URL or null
 */
function getWixImageUrl(wixUrl: string | undefined): string | null {
    if (!wixUrl) return null;

    try {
        // Handle both wix:image:// and direct URLs
        if (wixUrl.startsWith('wix:image://')) {
            const { url } = media.getImageUrl(wixUrl);
            return formatImageUrlForSocial(url);
        } else if (wixUrl.startsWith('http')) {
            return formatImageUrlForSocial(wixUrl);
        }
        return null;
    } catch (error) {
        console.error('Error getting Wix image URL:', error);
        return null;
    }
}

/**
 * Function to format image URL for social media platforms (optimized for 1200x630)
 * @param imageUrl The resolved image URL
 * @returns The optimized social media image URL
 */
function formatImageUrlForSocial(imageUrl: string): string | null {
    if (!imageUrl) return null;

    try {
        const url = new URL(imageUrl);

        if (url.hostname === 'static.wixstatic.com') {
            // Extract the media part from the URL
            const pathParts = url.pathname.split('/');
            const mediaPart = pathParts.length > 0 ? pathParts[pathParts.length - 1] : '';

            if (mediaPart) {
                // Create a clean, optimized URL for social media (1200x630 is standard)
                const optimizedUrl = `https://static.wixstatic.com/media/${mediaPart}/v1/fill/w_1200,h_630,al_c,q_85,usm_0.66_1.00_0.01/${mediaPart}`;
                return optimizedUrl;
            }
        }

        // For other URLs or failed optimization, return as is
        return imageUrl;
    } catch (error) {
        console.error('Error formatting image URL:', error);
        return null;
    }
}

/**
 * Function to get optimized image URL for social sharing with reliable fallbacks
 * @param wixUrl The Wix image URL from the blog post data
 * @returns The final, shareable image URL
 */
function getOptimizedShareImage(wixUrl: string | undefined): string {
    // 1. Fallback to a reliable default image if no URL is provided
    const DEFAULT_FALLBACK_URL = "https://medivisorindiatreatment.com/logo_medivisor.png"; // Using your site's logo as a better default

    if (!wixUrl) {
        return DEFAULT_FALLBACK_URL;
    }

    // 2. Try to get the properly formatted image URL
    const imageUrl = getWixImageUrl(wixUrl);

    if (imageUrl) {
        return imageUrl;
    }

    // 3. Fallback if processing fails
    return DEFAULT_FALLBACK_URL;
}

// ====================================================================
// Content Helper Functions
// ====================================================================

/**
 * Function to extract text from content for meta description
 */
function extractTextForMeta(content: any): string {
    if (!content) return '';

    // Handle Wix's old contentText field (plain string)
    if (typeof content === 'string') {
        return content.replace(/<[^>]*>/g, '').trim();
    }
    
    // Handle Wix's Rich Content Structure (simplified extraction)
    // A more robust solution might involve parsing the JSON structure, but this is a reasonable default
    if (content.blocks && Array.isArray(content.blocks)) {
      const text = content.blocks.map((block: any) => block.text || '').join(' ');
      return text.replace(/<[^>]*>/g, '').trim();
    }

    return 'Informative medical blog post from Medivisor India.';
}

/**
 * Function to generate meta description from content, prioritizing excerpt
 */
function generateMetaDescription(content: any, excerpt?: string): string {
    if (excerpt && excerpt.trim().length > 0) {
        // Truncate excerpt if too long
        const cleanExcerpt = excerpt.trim();
        return cleanExcerpt.length > 160 ? cleanExcerpt.substring(0, 157) + '...' : cleanExcerpt;
    }

    const text = extractTextForMeta(content);

    if (text.length > 160) {
        return text.substring(0, 157) + '...';
    }

    return text || 'Read this informative blog post about medical treatment, patient journeys, and healthcare tips in India.';
}

// ====================================================================
// Data Fetcher
// ====================================================================

/**
 * Helper function to fetch blog by slug from Wix
 */
export async function fetchBlogBySlug(slug: string): Promise<PostData | null> {
    try {
        if (!wixClient.posts) return null;

        let blog: PostData | null = null;

        // Use queryPosts for flexibility and to ensure proper fieldsets are retrieved
        if (typeof wixClient.posts.queryPosts === "function") {
            const response = await wixClient.posts.queryPosts()
                .eq('slug', slug)
                .limit(1)
                .find({
                    fieldsets: [
                        "CONTENT_TEXT",
                        "URL",
                        "RICH_CONTENT",
                        "SEO",
                        "MEDIA",
                        "TAGS",
                        "PUBLISHED_DATE",
                        "LAST_PUBLISHED_DATE"
                    ],
                });

            if (response.items && response.items.length > 0) {
                blog = response.items[0];
            }
        }

        return blog;
    } catch (err) {
        console.error("Error fetching blog:", err);
        return null;
    }
}

// ====================================================================
// Dynamic Metadata Generator
// ====================================================================

interface GenerateMetadataParams {
    params: { slug: string };
}

/**
 * Dynamic Metadata for Blog Post
 */
export async function generateBlogPostMetadata({ params }: GenerateMetadataParams): Promise<Metadata> {
    const blog = await fetchBlogBySlug(params.slug);

    if (!blog) {
        return {
            title: "Blog Post Not Found | Medivisor India",
            description: "The requested blog post doesn't exist.",
            robots: "noindex, nofollow",
        };
    }

    const title = blog.title || "Medivisor India Blog";
    const description = generateMetaDescription(blog.richContent || blog.contentText || blog.content, blog.excerpt);

    // Prioritize coverMedia.image, then media.wixMedia.image
    const imageSource = blog.coverMedia?.image || blog.media?.wixMedia?.image;
    const shareImageUrl = getOptimizedShareImage(imageSource);

    const url = `https://medivisorindiatreatment.com/blog/${params.slug}`;
    const twitterHandle = "@MedivisorIndia"; // Define a constant if used globally

    // Article specific meta tags
    const articleMeta: any = {};
    if (blog.firstPublishedDate) {
        articleMeta.publishedTime = blog.firstPublishedDate;
    }
    if (blog.lastPublishedDate) {
        articleMeta.modifiedTime = blog.lastPublishedDate;
    }
    
    // Convert blog tags to OpenGraph and general keywords format
    const keywords = blog.tags?.join(', ') || "medical treatment, healthcare, India, patient journey";

    return {
        title: `${title} | Medivisor India`,
        description,
        keywords: keywords,
        alternates: {
            canonical: url,
        },
        openGraph: {
            title,
            description,
            url,
            siteName: "Medivisor India Treatment",
            images: [
                {
                    url: shareImageUrl,
                    width: 1200, // Optimized width
                    height: 630, // Optimized height
                    alt: title,
                },
            ],
            locale: "en_US",
            type: "article",
            ...articleMeta,
            authors: ["Medivisor India"],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [shareImageUrl],
            site: twitterHandle,
            creator: twitterHandle,
        },
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
        authors: [{ name: "Medivisor India" }],
        publisher: "Medivisor India",
        category: "healthcare",
        ...articleMeta,
    };
}