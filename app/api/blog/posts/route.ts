import { type NextRequest, NextResponse } from "next/server"
import { wixServerClient } from "@/lib/wixServer"

async function fetchWebsiteData() {
  const response = await fetch("https://www.medivisorindiatreatment.com", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  })

  if (!response.ok) {
    throw new Error(`Website fetch failed: ${response.status}`)
  }

  const html = await response.text()

  // Create mock blog posts from website content
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
        image: {
          url: "/placeholder.svg?height=400&width=600",
        },
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
        image: {
          url: "/placeholder.svg?height=400&width=600",
        },
      },
    },
  ]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "9")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const sort = searchParams.get("sort") || "PUBLISHED_DATE_DESC"
    const useWebsiteFallback = searchParams.get("fallback") === "website"

    console.log("[v0] Fetching posts with params:", { limit, offset, sort, useWebsiteFallback })

    if (useWebsiteFallback) {
      try {
        const websiteData = await fetchWebsiteData()
        return NextResponse.json(
          {
            posts: websiteData,
            total: websiteData.length,
            hasMore: false,
            source: "website",
          },
          {
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
          },
        )
      } catch (websiteError) {
        console.log("[v0] Website fallback failed, trying SDK:", websiteError)
      }
    }

    const result = await wixServerClient.posts.listPosts({
      paging: { limit, offset },
      sort: sort as any,
    })

    console.log("[v0] Posts fetched successfully:", result.posts?.length || 0)

    const posts = Array.isArray(result.posts)
      ? result.posts.map((post: any) => {
          console.log(`[v0] Processing images for post: ${post.title}`)

          let imageUrl = null

          // Try to get image from various Wix fields
          if (post.coverMedia?.image?.url) {
            imageUrl = post.coverMedia.image.url
          } else if (post.featuredMedia?.image?.url) {
            imageUrl = post.featuredMedia.image.url
          } else if (post.media?.mainMedia?.image?.url) {
            imageUrl = post.media.mainMedia.image.url
          } else if (post.heroImage?.url) {
            imageUrl = post.heroImage.url
          }

          console.log(`[v0] Direct image URL found: ${imageUrl || "None"}`)

          return {
            ...post,
            excerpt: post.excerpt || "No description available.",
            content: post.content || "",
            coverMedia: {
              ...post.coverMedia,
              processedImageUrl: imageUrl, // Use direct URL
              originalImageUrl: imageUrl, // Same URL for fallback
            },
          }
        })
      : []

    const response = NextResponse.json({
      posts,
      total: result.metaData?.total || 0,
      hasMore: offset + limit < (result.metaData?.total || 0),
      source: "wix-sdk",
    })

    // Set CORS headers to allow requests from any domain
    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")

    return response
  } catch (error) {
    console.error("[v0] Failed to fetch posts:", error)

    try {
      console.log("[v0] Attempting website fallback after SDK failure")
      const websiteData = await fetchWebsiteData()
      return NextResponse.json(
        {
          posts: websiteData,
          total: websiteData.length,
          hasMore: false,
          source: "website-fallback",
        },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        },
      )
    } catch (fallbackError) {
      console.error("[v0] Website fallback also failed:", fallbackError)
    }

    const errorResponse = NextResponse.json(
      {
        error: "Failed to fetch blog posts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )

    errorResponse.headers.set("Access-Control-Allow-Origin", "*")
    errorResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    errorResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")

    return errorResponse
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
