import { NextResponse, type NextRequest } from "next/server";
import { wixServerClient } from "@/lib/wixServer";

// Define CORS headers as a constant to reuse them
const corsHeaders = {
  // IMPORTANT: Replace '*' with your specific Wix domain for security in a production environment.
  // For example: "Access-Control-Allow-Origin": "https://www.your-wix-site.com",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Handles the GET request for a specific blog post by its slug.
 * @param req The incoming Next.js request object.
 * @param context The context object containing dynamic route parameters.
 * @returns A Next.js response with the requested post data or an error.
 */
export async function GET(
  req: NextRequest,
  context: { params: { slug: string } }
) {
  const { slug } = context.params;

  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400, headers: corsHeaders });
  }

  try {
    let post = null;

    // Try getPostBySlug from wixServerClient
    if (typeof wixServerClient.posts.getPostBySlug === "function") {
      const response = await wixServerClient.posts.getPostBySlug(slug, {
        fieldsets: ["CONTENT_TEXT", "URL", "RICH_CONTENT"],
      });
      post = response.post;
    }

    // Fallback query if getPostBySlug is not found or fails
    if (!post && typeof wixServerClient.posts.queryPosts === "function") {
      const response = await wixServerClient.posts.queryPosts().eq("slug", slug).find();
      if (response.items.length > 0) post = response.items[0]; // Fetch a single post
    }

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404, headers: corsHeaders });
    }

    // Successfully found a post
    return NextResponse.json(post, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error(`[api/wix-posts/${slug}] Error fetching post:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch post" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Handles the OPTIONS preflight request for CORS.
 * @returns A successful Next.js response with CORS headers.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}