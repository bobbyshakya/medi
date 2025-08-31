import { type NextRequest, NextResponse } from "next/server";
import { wixServerClient } from "@/lib/wixServer";

// fallback scraper function
async function fetchWebsiteData() {
  const response = await fetch("https://www.medivisorindiatreatment.com", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Website fetch failed: ${response.status}`);
  }

  // fake posts for fallback demo
  return [
    {
      _id: "website-post-1",
      title: "The Future of Digital Marketing",
      excerpt:
        "Trends and Forecasts for 2035 and Beyond - Level up your brand with the latest digital marketing trends.",
      slug: "future-of-digital-marketing",
      publishedDate: new Date().toISOString(),
      content:
        "Discover the latest trends in digital marketing including VR, AR technology, and metaverse branding strategies.",
      author: "Digital Marketing Team",
      tags: ["Digital Marketing", "Future Trends", "Technology"],
      featuredMedia: {
        image: { url: "/placeholder.svg?height=400&width=600" },
      },
    },
    {
      _id: "website-post-2",
      title: "Meet Our Expert Speakers",
      excerpt: "Learn from industry leaders Jay Coral, Harlow Beck, and Tony Selby in our upcoming webinar.",
      slug: "meet-our-expert-speakers",
      publishedDate: new Date(Date.now() - 86400000).toISOString(),
      content:
        "Join our expert panel featuring Jay Coral from BuzzThrough, Harlow Beck from Wave, and Tony Selby from Target.",
      author: "Event Team",
      tags: ["Speakers", "Webinar", "Experts"],
      featuredMedia: {
        image: { url: "/placeholder.svg?height=400&width=600" },
      },
    },
  ];
}

// --- MAIN HANDLER ---
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get("limit") || "9");
    const offset = Number.parseInt(searchParams.get("offset") || "0");
    const sort = searchParams.get("sort") || "PUBLISHED_DATE_DESC";
    const useWebsiteFallback = searchParams.get("fallback") === "website";

    if (useWebsiteFallback) {
      const websiteData = await fetchWebsiteData();
      return jsonWithCors({
        posts: websiteData,
        total: websiteData.length,
        hasMore: false,
        source: "website",
      });
    }

    // ✅ Wix SDK call (server-to-server, no CORS issue)
    const result = await wixServerClient.posts.listPosts({
      paging: { limit, offset },
      sort: sort as any,
    });

    const posts = Array.isArray(result.posts)
      ? result.posts.map((post: any) => {
          let imageUrl: string | null = null;

          if (post.coverMedia?.image?.url) imageUrl = post.coverMedia.image.url;
          else if (post.featuredMedia?.image?.url) imageUrl = post.featuredMedia.image.url;
          else if (post.media?.mainMedia?.image?.url) imageUrl = post.media.mainMedia.image.url;
          else if (post.heroImage?.url) imageUrl = post.heroImage.url;

          return {
            ...post,
            excerpt: post.excerpt || "No description available.",
            content: post.content || "",
            coverMedia: {
              ...post.coverMedia,
              processedImageUrl: imageUrl,
              originalImageUrl: imageUrl,
            },
          };
        })
      : [];

    return jsonWithCors({
      posts,
      total: result.metaData?.total || 0,
      hasMore: offset + limit < (result.metaData?.total || 0),
      source: "wix-sdk",
    });
  } catch (error) {
    console.error("[API] Failed to fetch posts:", error);

    try {
      const websiteData = await fetchWebsiteData();
      return jsonWithCors({
        posts: websiteData,
        total: websiteData.length,
        hasMore: false,
        source: "website-fallback",
      });
    } catch {
      return jsonWithCors(
        {
          error: "Failed to fetch blog posts",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        500
      );
    }
  }
}

// --- OPTIONS handler (CORS preflight) ---
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

// --- HELPERS ---
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*", // or restrict to your Vercel domain
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function jsonWithCors(data: any, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders() });
}
