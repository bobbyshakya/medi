import type { NextRequest } from "next/server"
import { wixServerClient } from "@/lib/wixServer"
import { COLLECTION_IDS, mapCityData, DEFAULT_LIMIT } from "@/lib/wix-mappers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get("limit") || DEFAULT_LIMIT), 1000)
    const skip = Number(searchParams.get("skip") || 0)
    const search = searchParams.get("search") || ""

    let query = wixServerClient.items.query(COLLECTION_IDS.CITIES).include("state", "country").limit(limit).skip(skip)

    if (search) {
      query = query.contains("city name", search)
    }

    const res = await query.find({ consistentRead: true })
    const mapped = (res.items || []).map(mapCityData).filter(Boolean)

    return Response.json(
      { data: mapped, totalCount: mapped.length, success: true },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error: any) {
    return Response.json(
      { error: "Failed to fetch cities", message: error.message, data: [], totalCount: 0, success: false },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      },
    )
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
