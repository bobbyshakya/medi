import { NextResponse, type NextRequest } from "next/server"
import { wixServerClient } from "@/lib/wixServer"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Number.parseInt(searchParams.get("limit") || "4", 10)
  const offset = Number.parseInt(searchParams.get("offset") || "0", 10)
  const sort = searchParams.get("sort") || "PUBLISHED_DATE_DESC"

  try {
    const result = await wixServerClient.posts.listPosts({
      paging: { limit, offset },
      // @ts-expect-error Wix types accept union strings here
      sort,
    })

    const posts = result.posts ?? []
    const total = result.metaData?.total ?? 0

    const res = NextResponse.json({ posts, metaData: { total } }, { status: 200 })
    // CORS headers (safe for public content; also fine for same-origin calls)
    res.headers.set("Access-Control-Allow-Origin", "*")
    res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
    return res
  } catch (error) {
    console.error("[api/wix-posts] Error fetching posts:", error)
    const res = NextResponse.json({ error: "Failed to fetch blog posts." }, { status: 500 })
    res.headers.set("Access-Control-Allow-Origin", "*")
    res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
    return res
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
