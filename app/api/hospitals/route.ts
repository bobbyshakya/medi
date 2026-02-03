// app/api/hospitals/route.ts
// Optimized Hospitals API endpoint with performance enhancements

import { NextResponse } from "next/server"
import { COLLECTIONS } from './collections'
import { searchIds, searchBranches, fetchAllBranches, deduplicatedRequest } from './fetchers'
import { getAllHospitals } from './handlers'
import type { ApiParams, FilterIds, ApiResponse } from './types'

// =============================================================================
// CONSTANTS & CONFIGURATION
// =============================================================================

const CACHE_CONFIG = {
  DURATION_MS: 10 * 60 * 1000, // 10 minutes
  STALE_WHILE_REVALIDATE: 20 * 60, // 20 minutes
} as const

const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 0,
  DEFAULT_PAGE_SIZE: 20, // Reduced from 100 for faster initial load
  MAX_PAGE_SIZE: 100,
} as const

// =============================================================================
// CACHE MANAGEMENT with Request Deduplication
// =============================================================================

interface CacheEntry<T> {
  data: T
  timestamp: number
}

// In-memory cache (resets per serverless instance)
const branchesCache = new Map<string, CacheEntry<unknown>>()
const hospitalDataCache = new Map<string, CacheEntry<unknown>>()

/**
 * Get cached data with TTL support
 */
function getCachedData<T>(key: string, maxAgeMs: number): T | null {
  const entry = branchesCache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  
  const now = Date.now()
  if (now - entry.timestamp > maxAgeMs) {
    branchesCache.delete(key)
    return null
  }
  
  return entry.data
}

/**
 * Set cached data with timestamp
 */
function setCachedData<T>(key: string, data: T): void {
  branchesCache.set(key, { data, timestamp: Date.now() })
}

/**
 * Get cached branches with deduplication
 */
async function getCachedBranches(): Promise<unknown[]> {
  const cacheKey = 'branches_all'
  const cached = getCachedData<unknown[]>(cacheKey, CACHE_CONFIG.DURATION_MS)
  if (cached) return cached
  
  // Use deduplicated request to prevent multiple simultaneous fetches
  return deduplicatedRequest(cacheKey, async () => {
    const branches = await fetchAllBranches()
    setCachedData(cacheKey, branches)
    return branches
  })
}

// =============================================================================
// PARAMETER PARSING HELPERS
// =============================================================================

interface ParsedParams {
  filters: FilterIds
  textFilters: {
    branchText?: string
    cityText?: string
    doctorText?: string
    specialtyText?: string
    accreditationText?: string
    treatmentText?: string
    specialistText?: string
    departmentText?: string
  }
  pagination: { page: number; pageSize: number; cursor?: string }
  search: { q: string; slug: string }
  options: { includeStandalone: boolean; minimal: boolean }
  hasActiveFilters: boolean
}

/**
 * Parse numeric parameter with validation
 */
function parseNumericParam(
  value: string | null,
  defaultValue: number,
  minValue: number,
  maxValue: number
): number {
  const parsed = Number(value)
  if (isNaN(parsed) || !isFinite(parsed)) return defaultValue
  return Math.max(minValue, Math.min(maxValue, Math.floor(parsed)))
}

/**
 * Parse string parameter safely
 */
function parseStringParam(value: string | null): string {
  return value?.trim() || ''
}

/**
 * Parse and validate all query parameters
 */
function parseQueryParams(url: URL): ParsedParams {
  // Parse pagination parameters
  const page = parseNumericParam(
    url.searchParams.get("page"),
    PAGINATION_CONFIG.DEFAULT_PAGE,
    0,
    Infinity
  )
  const pageSize = parseNumericParam(
    url.searchParams.get("pageSize"),
    PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
    1,
    PAGINATION_CONFIG.MAX_PAGE_SIZE
  )
  const cursor = url.searchParams.get("cursor") || undefined

  // Parse search parameters
  const q = parseStringParam(url.searchParams.get("q"))
  const slug = parseStringParam(url.searchParams.get("slug"))

  // Parse option flags
  const includeStandalone = url.searchParams.get("includeStandalone") === "true"
  const minimal = url.searchParams.get("minimal") === "true"

  // Build filter IDs
  const filterIds: FilterIds = {
    branch: [],
    city: [],
    doctor: [],
    specialty: [],
    accreditation: [],
    treatment: [],
    specialist: [],
    department: [],
  }

  const textFiltersMap: ParsedParams['textFilters'] = {}

  // Add explicit ID filters
  const idFilters = [
    { key: 'branchId', filterKey: 'branch' },
    { key: 'cityId', filterKey: 'city' },
    { key: 'doctorId', filterKey: 'doctor' },
    { key: 'specialtyId', filterKey: 'specialty' },
    { key: 'accreditationId', filterKey: 'accreditation' },
    { key: 'treatmentId', filterKey: 'treatment' },
    { key: 'specialistId', filterKey: 'specialist' },
    { key: 'departmentId', filterKey: 'department' },
  ] as const

  idFilters.forEach(({ key, filterKey }) => {
    const value = url.searchParams.get(key)?.trim()
    if (value) {
      filterIds[filterKey].push(value)
    }
  })

  // Add text filters
  const textFilterKeys = [
    'branchText', 'cityText', 'doctorText', 'specialtyText',
    'accreditationText', 'treatmentText', 'specialistText', 'departmentText'
  ] as const

  textFilterKeys.forEach(key => {
    const value = url.searchParams.get(key)?.trim()
    if (value) {
      textFiltersMap[key] = value
    }
  })

  // Determine if any filters are active
  const hasActiveFilters = 
    q.length > 0 || 
    slug.length > 0 ||
    Object.values(filterIds).some(arr => arr.length > 0) ||
    Object.values(textFiltersMap).some(v => !!v)

  return {
    filters: filterIds,
    textFilters: textFiltersMap,
    pagination: { page, pageSize, cursor },
    search: { q, slug },
    options: { includeStandalone, minimal },
    hasActiveFilters,
  }
}

// =============================================================================
// TEXT SEARCH HELPERS
// =============================================================================

interface TextSearchResult {
  cityIds: string[]
  doctorIds: string[]
  specialtyIds: string[]
  accreditationIds: string[]
  treatmentIds: string[]
  specialistIds: string[]
  departmentIds: string[]
}

/**
 * Perform all text-based searches in parallel with limit
 */
async function performTextSearches(params: ParsedParams): Promise<TextSearchResult> {
  const { search: searchParams, textFilters } = params

  // Use smaller limits for text searches to improve performance
  const searchLimit = 50

  const [
    cityIds,
    doctorIds,
    specialtyIds,
    accreditationIds,
    treatmentIds,
    specialistIds,
    departmentIds,
  ] = await Promise.all([
    searchParams.q 
      ? searchIds(COLLECTIONS.CITIES, ["cityName"], searchParams.q, searchLimit) 
      : Promise.resolve([]),
    textFilters.doctorText 
      ? searchIds(COLLECTIONS.DOCTORS, ["doctorName"], textFilters.doctorText, searchLimit)
      : Promise.resolve([]),
    textFilters.specialtyText
      ? searchIds(COLLECTIONS.SPECIALTIES, ["specialty"], textFilters.specialtyText, searchLimit)
      : Promise.resolve([]),
    textFilters.accreditationText
      ? searchIds(COLLECTIONS.ACCREDITATIONS, ["title"], textFilters.accreditationText, searchLimit)
      : Promise.resolve([]),
    textFilters.treatmentText
      ? searchIds(COLLECTIONS.TREATMENTS, ["treatmentName"], textFilters.treatmentText, searchLimit)
      : Promise.resolve([]),
    textFilters.specialistText
      ? searchIds(COLLECTIONS.SPECIALTIES, ["specialist"], textFilters.specialistText, searchLimit)
      : Promise.resolve([]),
    textFilters.departmentText
      ? searchIds(COLLECTIONS.DEPARTMENTS, ["department", "name"], textFilters.departmentText, searchLimit)
      : Promise.resolve([]),
  ])

  return {
    cityIds,
    doctorIds,
    specialtyIds,
    accreditationIds,
    treatmentIds,
    specialistIds,
    departmentIds,
  }
}

/**
 * Merge text search results with explicit ID filters
 */
function mergeFilters(
  explicitFilters: FilterIds,
  textSearchResults: TextSearchResult
): FilterIds {
  return {
    branch: [
      ...explicitFilters.branch,
      ...(textSearchResults.specialtyIds as unknown as string[]),
    ],
    city: [...explicitFilters.city, ...textSearchResults.cityIds],
    doctor: [...explicitFilters.doctor, ...textSearchResults.doctorIds],
    specialty: [...explicitFilters.specialty, ...textSearchResults.specialtyIds],
    accreditation: [...explicitFilters.accreditation, ...textSearchResults.accreditationIds],
    treatment: [...explicitFilters.treatment, ...textSearchResults.treatmentIds],
    specialist: [...explicitFilters.specialist, ...textSearchResults.specialistIds],
    department: [...explicitFilters.department, ...textSearchResults.departmentIds],
  }
}

// =============================================================================
// RESPONSE BUILDING HELPERS
// =============================================================================

interface PaginationResult {
  items: unknown[]
  total: number
  page: number
  pageSize: number
  regularCount: number
  standaloneCount: number
  filteredCount: number
  hasMore: boolean
  nextCursor?: string
}

/**
 * Apply pagination to results with cursor support
 */
function applyPagination(
  items: unknown[],
  page: number,
  pageSize: number
): PaginationResult {
  const total = items.length
  const startIndex = page * pageSize
  const endIndex = startIndex + pageSize
  const paginatedItems = items.slice(startIndex, endIndex)

  // Count by type
  const itemsArray = items as Array<{ isStandalone?: boolean }>
  const regularCount = itemsArray.filter(h => !h.isStandalone).length
  const standaloneCount = itemsArray.filter(h => h.isStandalone).length

  const hasMore = endIndex < total
  const nextCursor = hasMore ? Buffer.from(`${page + 1}`).toString('base64') : undefined

  return {
    items: paginatedItems,
    total,
    page,
    pageSize,
    regularCount,
    standaloneCount,
    filteredCount: total,
    hasMore,
    nextCursor,
  }
}

/**
 * Generate cache control headers based on request type
 */
function generateCacheControl(hasFilters: boolean): string {
  const sMaxAge = hasFilters ? 300 : 600 // 5 min for filtered, 10 min for unfiltered
  const staleWhileRevalidate = CACHE_CONFIG.STALE_WHILE_REVALIDATE
  
  return `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`
}

// =============================================================================
// MAIN REQUEST HANDLER
// =============================================================================

/**
 * Build ApiParams from parsed request
 */
function buildApiParams(parsed: ParsedParams): ApiParams {
  return {
    q: parsed.search.q,
    slug: parsed.search.slug,
    page: parsed.pagination.page,
    pageSize: parsed.pagination.pageSize,
    includeStandalone: parsed.options.includeStandalone,
    minimal: parsed.options.minimal,
    showHospital: true,
    branchText: parsed.textFilters.branchText,
    cityText: parsed.textFilters.cityText,
    doctorText: parsed.textFilters.doctorText,
    specialtyText: parsed.textFilters.specialtyText,
    accreditationText: parsed.textFilters.accreditationText,
    treatmentText: parsed.textFilters.treatmentText,
    specialistText: parsed.textFilters.specialistText,
    departmentText: parsed.textFilters.departmentText,
    branchId: parsed.filters.branch[0],
    cityId: parsed.filters.city[0],
    doctorId: parsed.filters.doctor[0],
    specialtyId: parsed.filters.specialty[0],
    accreditationId: parsed.filters.accreditation[0],
    treatmentId: parsed.filters.treatment[0],
    specialistId: parsed.filters.specialist[0],
    departmentId: parsed.filters.department[0],
  }
}

// GET /api/hospitals
export async function GET(req: Request) {
  const requestId = crypto.randomUUID?.() || Date.now().toString()
  
  try {
    const url = new URL(req.url)
    const parsed = parseQueryParams(url)
    
    // Early return for invalid pagination
    if (parsed.pagination.page < 0 || parsed.pagination.pageSize < 1) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400, headers: { 'X-Request-Id': requestId } }
      )
    }
    
    // Perform text searches in parallel
    const textSearchResults = await performTextSearches(parsed)
    
    // Merge all filters
    const mergedFilters = mergeFilters(parsed.filters, textSearchResults)
    
    // Get cached branches (with deduplication)
    const cachedBranches = await getCachedBranches()
    
    // Build API params
    const apiParams = buildApiParams(parsed)
    
    // Fetch hospitals with filters
    const allHospitals = await getAllHospitals(
      mergedFilters,
      apiParams.q || undefined,
      apiParams.includeStandalone,
      apiParams.minimal,
      apiParams.slug || undefined,
      cachedBranches,
      apiParams.showHospital
    )
    
    // Apply pagination
    const response = applyPagination(
      allHospitals,
      parsed.pagination.page,
      parsed.pagination.pageSize
    )
    
    // Generate cache headers
    const cacheControl = generateCacheControl(parsed.hasActiveFilters)
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': cacheControl,
        'X-Request-Id': requestId,
        'X-Total-Count': String(response.total),
        'X-Has-More': String(response.hasMore),
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorStack = process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    
    console.error(`[${requestId}] API Error:`, error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch hospitals',
        details: errorMessage,
        ...(errorStack && { stack: errorStack }),
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
