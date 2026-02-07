// app/api/cms/route.ts
// Unified CMS API endpoint - single source of truth for all CMS data
// OPTIMIZED: Smart caching for instant page loads

import { NextResponse } from 'next/server'
import { getAllCMSData, getHospitalBySlug, searchHospitals } from '@/lib/cms'

// Cache configuration for different data types
const CACHE_CONFIG = {
  // Static data that rarely changes - long cache time
  ALL_DATA: {
    'Cache-Control': 'public, max-age=600, s-maxage=600, stale-while-revalidate=300',
    'Surrogate-Control': 'max-age=600, stale-while-revalidate=300',
  },
  // Dynamic data - shorter cache time
  SEARCH: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
  // Single hospital - moderate cache
  HOSPITAL: {
    'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=120',
  },
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
  const startTime = Date.now()

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'all'
    const slug = url.searchParams.get('slug')
    const query = url.searchParams.get('q')
    const page = Math.max(0, Number(url.searchParams.get('page') || 0))
    const requestedPageSize = Number(url.searchParams.get('pageSize') || 1000)
    const pageSize = Math.min(2000, Math.max(0, requestedPageSize))

    switch (action) {
      case 'hospital': {
        if (!slug) {
          return NextResponse.json(
            { error: 'Slug parameter is required for hospital action' },
            { status: 400, headers: { 'X-Request-Id': requestId } }
          )
        }
        const result = await getHospitalBySlug(slug)
        console.log(`[${requestId}] CMS API: Fetched hospital ${slug} in ${Date.now() - startTime}ms`)
        return NextResponse.json(result, {
          headers: {
            ...CACHE_CONFIG.HOSPITAL,
            'X-Request-Id': requestId,
            'X-Response-Time': String(Date.now() - startTime),
          },
        })
      }

      case 'search': {
        const hospitals = await searchHospitals(query || '')
        const total = hospitals.length
        const startIndex = page * pageSize
        const paginatedItems = hospitals.slice(startIndex, startIndex + pageSize)
        const hasMore = startIndex + pageSize < total

        console.log(`[${requestId}] CMS API: Search '${query}' returned ${total} results in ${Date.now() - startTime}ms`)

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
              ...CACHE_CONFIG.SEARCH,
              'X-Request-Id': requestId,
              'X-Total-Count': String(total),
              'X-Has-More': String(hasMore),
              'X-Response-Time': String(Date.now() - startTime),
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
        const paginatedHospitals = pageSize === 0 
          ? data.hospitals 
          : data.hospitals.slice(startIndex, startIndex + pageSize)
        const hasMore = startIndex + pageSize < totalHospitals

        console.log(`[${requestId}] CMS API: Fetched all data - ${totalHospitals} hospitals, ${data.treatments.length} treatments in ${Date.now() - startTime}ms`)

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
              ...CACHE_CONFIG.ALL_DATA,
              'X-Request-Id': requestId,
              'X-Total-Count': String(totalHospitals),
              'X-Has-More': String(hasMore),
              'X-Response-Time': String(Date.now() - startTime),
              'ETag': `"${Buffer.from(JSON.stringify({ totalHospitals, totalTreatments: data.totalTreatments, lastUpdated: data.lastUpdated })).toString('base64')}"`,
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
          'X-Response-Time': String(Date.now() - startTime),
        },
      }
    )
  }
}
