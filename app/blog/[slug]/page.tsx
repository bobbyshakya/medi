import BlogPost from "@/components/BlogPostClientPage";
import { Metadata } from "next";
import { wixClient } from "@/lib/wixClient";
import { media } from '@wix/sdk';

interface Params {
  params: { slug: string };
}

// Function to get Wix Image URL for meta tags
function getWixImageUrl(wixUrl: string | undefined): string | null {
  if (!wixUrl || !wixUrl.startsWith('wix:image://')) {
    return null;
  }
  try {
    const { url } = media.getImageUrl(wixUrl);
    return url;
  } catch (error) {
    console.error('Error getting Wix image URL:', error);
    return null;
  }
}

// Function to get optimized Wix Image URL for social sharing
function getOptimizedWixImageUrl(wixUrl: string | undefined, width: number = 1200, height: number = 630): string | null {
  if (!wixUrl || !wixUrl.startsWith('wix:image://')) {
    return null;
  }
  try {
    const { url } = media.getImageUrl(wixUrl, {
      width,
      height,
      fit: 'fill'
    });
    return url;
  } catch (error) {
    console.error('Error getting optimized Wix image URL:', error);
    return null;
  }
}

// Function to generate optimized share image URL
function getOptimizedShareImage(wixUrl: string | undefined): string {
  // Try to get optimized image for social sharing first
  const optimizedImageUrl = getOptimizedWixImageUrl(wixUrl, 1200, 630);
  const imageUrl = optimizedImageUrl || getWixImageUrl(wixUrl);
  
  if (imageUrl) {
    return imageUrl;
  }
  
  // Fallback to default share image
  return "https://medivisorindiatreatment.com/default-share-image.jpg";
}

// Function to generate meta description from content
function generateMetaDescription(content: any, excerpt?: string): string {
  if (excerpt && excerpt.trim().length > 0) {
    return excerpt.trim();
  }

  let text = '';
  if (typeof content === 'string') {
    text = content.replace(/<[^>]*>/g, '').trim();
  } else if (content?.nodes) {
    // You might need to import and use extractTextFromRicos here if needed
    text = 'Informative medical blog post from Medivisor India.';
  }

  // Limit to 160 characters for SEO
  if (text.length > 160) {
    return text.substring(0, 157) + '...';
  }

  return text || 'Read this informative blog post about medical treatment, patient journeys, and healthcare tips in India.';
}

// ✅ Helper function to fetch blog by slug from Wix
async function fetchBlogBySlug(slug: string) {
  try {
    if (!wixClient.posts) return null;

    let blog = null;
    
    // Try getPostBySlug first
    if (typeof wixClient.posts.getPostBySlug === "function") {
      const response = await wixClient.posts.getPostBySlug(slug, {
        fieldsets: [
          "CONTENT_TEXT",
          "URL",
          "RICH_CONTENT",
          "TAGS",
          "SEO",
          "EXCERPT",
          "TITLE",
          "COVER_MEDIA",
          "PUBLISHED_DATE",
          "CONTENT",
          "MEDIA",
          "FIRST_PUBLISHED_DATE",
          "LAST_PUBLISHED_DATE",
        ],
      });
      if (response.post) blog = response.post;
    }

    // Fallback to queryPosts if getPostBySlug fails
    if (!blog && typeof wixClient.posts.queryPosts === "function") {
      const response = await wixClient.posts.queryPosts()
        .eq('slug', slug)
        .find();
      
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

// ✅ Dynamic Metadata for Blog Post
export async function generateMetadata({ params }: Params): Promise<Metadata> {
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
  const imageUrl = getOptimizedShareImage(blog.media?.wixMedia?.image || blog.coverMedia?.image);
  const url = `https://medivisorindiatreatment.com/blog/${params.slug}`;

  return {
    title: `${title} | Medivisor India`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Medivisor India",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/jpeg',
        },
      ],
      locale: "en_US",
      type: "article",
      publishedTime: blog.firstPublishedDate,
      modifiedTime: blog.lastPublishedDate || blog.firstPublishedDate,
      authors: ["Medivisor India"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      site: "@medivisorindiatreatment", // Replace with your actual Twitter handle
      creator: "@medivisorindiatreatment", // Replace with your actual Twitter handle
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    // Additional meta tags for better SEO
    keywords: blog.tags?.join(', ') || "medical treatment, healthcare, India, patient journey",
    authors: [{ name: "Medivisor India" }],
    publisher: "Medivisor India",
    category: "healthcare",
    // Article specific meta tags
    ...(blog.firstPublishedDate && {
      publishedTime: blog.firstPublishedDate,
    }),
    ...(blog.lastPublishedDate && {
      modifiedTime: blog.lastPublishedDate,
    }),
    // Add article tags if available
    ...(blog.tags && blog.tags.length > 0 && {
      tags: blog.tags,
    }),
  };
}

// ✅ Generate Static Params for SSG
export async function generateStaticParams() {
  try {
    if (!wixClient.posts) return [];

    let posts = [];
    
    // Try queryPosts first
    if (typeof wixClient.posts.queryPosts === "function") {
      const response = await wixClient.posts.queryPosts()
        .limit(50)
        .find();
      posts = response.items || [];
    } 
    // Fallback to listPosts
    else if (typeof wixClient.posts.listPosts === "function") {
      const response = await wixClient.posts.listPosts({
        paging: { limit: 50 },
      });
      posts = response.posts || [];
    }

    return posts.map((post: any) => ({
      slug: post.slug,
    }));
  } catch (err) {
    console.error("Error generating static params:", err);
    return [];
  }
}

// ✅ Blog Post Page Component
export default function BlogPostPage({ params }: Params) {
  return <BlogPost slug={params.slug} />;
}