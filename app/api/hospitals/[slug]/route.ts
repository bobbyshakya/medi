// app/api/hospitals/[slug]/route.ts
// Simplified Hospital Detail API endpoint using centralized CMS service

import { NextResponse } from "next/server"
import { getHospitalBySlug } from '@/lib/cms'

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
}

/**
 * GET /api/hospitals/[slug]
 * 
 * Returns hospital details by slug
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const requestId = crypto.randomUUID?.() || Date.now().toString()

  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400, headers: { 'X-Request-Id': requestId } }
      )
    }

    const result = await getHospitalBySlug(slug)

    if (!result.hospital) {
      return NextResponse.json(
        { error: 'Hospital not found' },
        { status: 404, headers: { 'X-Request-Id': requestId } }
      )
    }

    return NextResponse.json(
      {
        hospital: result.hospital,
        similarHospitals: result.similarHospitals || [],
      },
      {
        headers: {
          ...CACHE_HEADERS,
          'X-Request-Id': requestId,
        },
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error(`[${requestId}] Hospital Detail API Error:`, error)

    return NextResponse.json(
      {
        error: 'Failed to fetch hospital',
        details: errorMessage,
      },
      {
        status: 500,
        headers: {
          'X-Request-Id': requestId,
        },
      }
    )
  }
}
