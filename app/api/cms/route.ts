// app/api/cms/route.ts
// Unified CMS API endpoint - single source of truth for all CMS data

import { NextResponse } from 'next/server'
import { getAllCMSData, getHospitalBySlug, searchHospitals } from '@/lib/cms'

// Cache configuration
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
}

/**
 * GET /api/cms
 * 
 * Query parameters:
 * - action: 'all' | 'hospital' | 'search' (default: 'all')
 * - slug: hospital slug (required for action='hospital')
 * - q: search query (for action='search')
 * - page: pagination page (default: 0)
 * - pageSize: items per page (default: 50)
 */
export async function GET(req: Request) {
  const requestId = crypto.randomUUID?.() || Date.now().toString()

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'all'
    const slug = url.searchParams.get('slug')
    const query = url.searchParams.get('q')
    const page = Math.max(0, Number(url.searchParams.get('page') || 0))
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || 50)))

    switch (action) {
      case 'hospital': {
        if (!slug) {
          return NextResponse.json(
            { error: 'Slug parameter is required for hospital action' },
            { status: 400, headers: { 'X-Request-Id': requestId } }
          )
        }
        const result = await getHospitalBySlug(slug)
        return NextResponse.json(result, {
          headers: {
            ...CACHE_HEADERS,
            'X-Request-Id': requestId,
          },
        })
      }

      case 'search': {
        const hospitals = await searchHospitals(query || '')
        const total = hospitals.length
        const startIndex = page * pageSize
        const paginatedItems = hospitals.slice(startIndex, startIndex + pageSize)
        const hasMore = startIndex + pageSize < total

        return NextResponse.json(
          {
            items: paginatedItems,
            total,
            page,
            pageSize,
            hasMore,
          },
          {
            headers: {
              ...CACHE_HEADERS,
              'X-Request-Id': requestId,
              'X-Total-Count': String(total),
              'X-Has-More': String(hasMore),
            },
          }
        )
      }

      case 'all':
      default: {
        const data = await getAllCMSData()

        // Apply pagination to hospitals
        const totalHospitals = data.hospitals.length
        const startIndex = page * pageSize
        const paginatedHospitals = data.hospitals.slice(startIndex, startIndex + pageSize)
        const hasMore = startIndex + pageSize < totalHospitals

        return NextResponse.json(
          {
            hospitals: paginatedHospitals,
            treatments: data.treatments,
            totalHospitals,
            totalTreatments: data.totalTreatments,
            page,
            pageSize,
            hasMore,
            lastUpdated: data.lastUpdated,
          },
          {
            headers: {
              ...CACHE_HEADERS,
              'X-Request-Id': requestId,
              'X-Total-Count': String(totalHospitals),
              'X-Has-More': String(hasMore),
            },
          }
        )
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error(`[${requestId}] CMS API Error:`, error)

    return NextResponse.json(
      {
        error: 'Failed to fetch CMS data',
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
