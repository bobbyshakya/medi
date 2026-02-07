// app/api/treatments/route.ts
// Unified API endpoint for treatments - uses centralized lib/cms/data-service.ts

import { NextResponse } from "next/server"
import { getAllCMSData, getTreatmentBySlug } from '@/lib/cms/data-service'

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

let treatmentsCache: any[] | null = null
let treatmentsCacheTime: number = 0
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

// =============================================================================
// API HANDLER
// =============================================================================

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const searchQuery = url.searchParams.get("q")?.trim().toLowerCase() || ""
    const category = url.searchParams.get("category")?.trim() || ""
    const popular = url.searchParams.get("popular") === "true"
    const page = Math.max(0, Number(url.searchParams.get("page") || 0))
    const pageSize = Number(url.searchParams.get("pageSize") || 1000)
    const slug = url.searchParams.get("slug")?.trim() || ""

    const now = Date.now()

    // If slug provided, return single treatment by slug
    if (slug) {
      const treatment = await getTreatmentBySlug(slug)
      if (!treatment) {
        return NextResponse.json({ error: "Treatment not found" }, { status: 404 })
      }
      return NextResponse.json({ items: [treatment], total: 1 }, {
        headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' }
      })
    }

    // Check cache first
    if (treatmentsCache && (now - treatmentsCacheTime) < CACHE_DURATION) {
      let filteredTreatments = treatmentsCache

      // Apply filters
      if (searchQuery) {
        filteredTreatments = filteredTreatments.filter(t => 
          (t.name ?? '').toLowerCase().includes(searchQuery) ||
          (t.category ?? '').toLowerCase().includes(searchQuery)
        )
      }

      if (category) {
        filteredTreatments = filteredTreatments.filter(t => t.category === category)
      }

      if (popular) {
        filteredTreatments = filteredTreatments.filter(t => t.popular)
      }

      // Apply pagination
      const total = filteredTreatments.length
      const startIndex = page * pageSize
      const endIndex = startIndex + pageSize
      const paginatedTreatments = filteredTreatments.slice(startIndex, endIndex)
      const hasMore = endIndex < total
      
      return NextResponse.json({
        items: paginatedTreatments,
        total,
        page,
        pageSize,
        filteredCount: total,
        hasMore,
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
          'X-Has-More': String(hasMore),
        },
      })
    }

    // Fetch all treatments from centralized service
    const { treatments } = await getAllCMSData()
    
    // Cache the results
    treatmentsCache = treatments
    treatmentsCacheTime = now

    // Apply filters
    let filteredTreatments = treatments

    if (searchQuery) {
      filteredTreatments = filteredTreatments.filter(t => 
        (t.name ?? '').toLowerCase().includes(searchQuery) ||
        (t.category ?? '').toLowerCase().includes(searchQuery)
      )
    }

    if (category) {
      filteredTreatments = filteredTreatments.filter(t => t.category === category)
    }

    if (popular) {
      filteredTreatments = filteredTreatments.filter(t => t.popular)
    }

    // Sort alphabetically
    filteredTreatments.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))

    // Apply pagination
    const total = filteredTreatments.length
    const startIndex = page * pageSize
    const endIndex = startIndex + pageSize
    const paginatedTreatments = filteredTreatments.slice(startIndex, endIndex)
    const hasMore = endIndex < total

    return NextResponse.json({
      items: paginatedTreatments,
      total,
      page,
      pageSize,
      filteredCount: total,
      hasMore,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        'X-Has-More': String(hasMore),
      },
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch treatments" }, { status: 500 })
  }
}
