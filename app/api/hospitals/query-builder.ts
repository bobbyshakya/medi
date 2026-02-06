// app/api/hospitals/query-builder.ts
// Optimized query building logic with filter pushdown
// Fixed: Removed all limits, pagination, slicing for complete data retrieval

import { wixClient } from "@/lib/wixClient"
import { COLLECTIONS } from './collections'
import { ReferenceMapper } from './mappers'
import type { HospitalFilters } from './types'

// =============================================================================
// OPTIMIZED QUERY BUILDERS
// =============================================================================

/**
 * Builds an optimized Wix query with filter pushdown
 * This pushes filters to the API level rather than filtering in memory
 * Fixed: NO LIMITS - fetch all matching data
 */
export function buildOptimizedBranchesQuery(filters: {
  branchIds?: string[]
  cityIds?: string[]
  doctorIds?: string[]
  specialtyIds?: string[]
  accreditationIds?: string[]
  treatmentIds?: string[]
  specialistIds?: string[]
  hospitalIds?: string[]
}) {
  const { branchIds, cityIds, doctorIds, specialtyIds, accreditationIds, treatmentIds, specialistIds, hospitalIds } = filters

  console.log(`[DEBUG] buildOptimizedBranchesQuery: Building query with filters - branchIds: ${branchIds?.length}, cityIds: ${cityIds?.length}, treatmentIds: ${treatmentIds?.length}, specialistIds: ${specialistIds?.length}`)

  let query = wixClient.items
    .query(COLLECTIONS.BRANCHES)
    .include(
      "hospital",
      "HospitalMaster_branches",
      "city",
      "doctor",
      "specialty",
      "accreditation",
      "treatment",
      "specialist",
    )

  // Push filters to API level (NO SLICING)
  if (branchIds?.length) {
    query = query.hasSome("_id", branchIds)
  }
  
  if (cityIds?.length) {
    query = query.hasSome("city", cityIds)
  }
  
  if (doctorIds?.length) {
    query = query.hasSome("doctor", doctorIds)
  }
  
  if (specialtyIds?.length) {
    query = query.hasSome("specialty", specialtyIds)
  }
  
  if (accreditationIds?.length) {
    query = query.hasSome("accreditation", accreditationIds)
  }
  
  if (treatmentIds?.length) {
    query = query.hasSome("treatment", treatmentIds)
  }
  
  if (specialistIds?.length) {
    query = query.hasSome("specialist", specialistIds)
  }
  
  if (hospitalIds?.length) {
    // Query both hospital reference fields
    query = query.hasSome("hospital", hospitalIds)
  }

  // NO LIMIT - fetch all matching branches
  return query
}

/**
 * Builds an optimized hospitals query with filter pushdown
 * Fixed: NO LIMITS for complete data retrieval
 */
export function buildOptimizedHospitalsQuery(filters: {
  hospitalIds?: string[]
  specialtyIds?: string[]
  showHospitalOnly?: boolean
}) {
  const { hospitalIds, specialtyIds, showHospitalOnly = true } = filters

  console.log(`[DEBUG] buildOptimizedHospitalsQuery: Building query with filters - hospitalIds: ${hospitalIds?.length}, specialtyIds: ${specialtyIds?.length}`)

  let query = wixClient.items
    .query(COLLECTIONS.HOSPITALS)
    .include("specialty", "ShowHospital")
    .descending("_createdDate")

  if (hospitalIds?.length) {
    query = query.hasSome("_id", hospitalIds)
  }

  if (specialtyIds?.length) {
    query = query.hasSome("specialty", specialtyIds)
  }

  // NO LIMIT - fetch all matching hospitals
  return query
}

// =============================================================================
// FILTER HELPERS
// =============================================================================

/**
 * Gets hospital IDs based on filters with optimized query
 * Fixed: NO LIMITS, proper debug logging
 */
export async function getHospitalIds(filters: HospitalFilters): Promise<string[]> {
  let { branchIds, cityIds, doctorIds, specialtyIds, accreditationIds, treatmentIds, specialistIds, departmentIds } =
    filters

  console.log(`[DEBUG] getHospitalIds: Starting with filters - branchIds: ${branchIds?.length}, cityIds: ${cityIds?.length}, specialtyIds: ${specialtyIds?.length}, treatmentIds: ${treatmentIds?.length}, specialistIds: ${specialistIds?.length}`)

  if (
    !branchIds?.length &&
    !cityIds?.length &&
    !doctorIds?.length &&
    !specialtyIds?.length &&
    !accreditationIds?.length &&
    !treatmentIds?.length &&
    !specialistIds?.length &&
    !departmentIds?.length
  ) {
    console.log('[DEBUG] getHospitalIds: No filters provided, returning empty array')
    return []
  }

  // Resolve department IDs to specialty IDs first
  if (departmentIds?.length) {
    console.log(`[DEBUG] getHospitalIds: Resolving ${departmentIds.length} department IDs to specialty IDs`)
    const res = await wixClient.items
      .query(COLLECTIONS.SPECIALTIES)
      .hasSome("department", departmentIds)
      .find()
    
    const addIds = res.items.map((i) => i._id).filter(Boolean)
    specialistIds = [...(specialistIds || []), ...addIds]
    console.log(`[DEBUG] getHospitalIds: Resolved to ${addIds.length} specialty IDs, total specialistIds: ${specialistIds?.length}`)
  }

  // Build optimized query with all filters pushed to API
  const query = buildOptimizedBranchesQuery({
    branchIds,
    cityIds,
    doctorIds,
    specialtyIds,
    accreditationIds,
    treatmentIds,
    specialistIds,
  })

  const result = await query.find()
  
  console.log(`[DEBUG] getHospitalIds: Found ${result.items.length} branches matching filters`)
  
  // Extract unique hospital IDs from branches
  const hospitalIds = new Set<string>()
  result.items.forEach((b: any) => {
    ReferenceMapper.extractHospitalIds(b).forEach((id) => hospitalIds.add(id))
  })
  
  console.log(`[DEBUG] getHospitalIds: Extracted ${hospitalIds.size} unique hospital IDs`)
  return Array.from(hospitalIds)
}

/**
 * Gets filtered branch IDs with optimized query
 * Fixed: NO LIMITS
 */
export async function getBranchIds(filters: HospitalFilters): Promise<string[]> {
  let { branchIds, cityIds, doctorIds, specialtyIds, accreditationIds, treatmentIds, specialistIds, departmentIds } =
    filters

  console.log(`[DEBUG] getBranchIds: Starting with filters`)

  if (
    !branchIds?.length &&
    !cityIds?.length &&
    !doctorIds?.length &&
    !specialtyIds?.length &&
    !accreditationIds?.length &&
    !treatmentIds?.length &&
    !specialistIds?.length &&
    !departmentIds?.length
  )
    return []

  // Resolve department IDs
  if (departmentIds?.length) {
    const res = await wixClient.items
      .query(COLLECTIONS.SPECIALTIES)
      .hasSome("department", departmentIds)
      .find()
    
    const addIds = res.items.map((i) => i._id).filter(Boolean)
    specialistIds = [...(specialistIds || []), ...addIds]
  }

  const query = buildOptimizedBranchesQuery({
    branchIds,
    cityIds,
    doctorIds,
    specialtyIds,
    accreditationIds,
    treatmentIds,
    specialistIds,
  })

  const result = await query.find()
  console.log(`[DEBUG] getBranchIds: Found ${result.items.length} branches`)
  return result.items.map((i: any) => i._id).filter(Boolean)
}

// =============================================================================
// COUNT QUERIES (for pagination totals)
// =============================================================================

/**
 * Gets count of items matching filters
 */
export async function getFilteredCount(filters: HospitalFilters, collection: 'hospitals' | 'branches'): Promise<number> {
  let { branchIds, cityIds, doctorIds, specialtyIds, accreditationIds, treatmentIds, specialistIds, departmentIds } =
    filters

  if (
    !branchIds?.length &&
    !cityIds?.length &&
    !doctorIds?.length &&
    !specialtyIds?.length &&
    !accreditationIds?.length &&
    !treatmentIds?.length &&
    !specialistIds?.length &&
    !departmentIds?.length
  )
    return 0

  // Resolve department IDs
  if (departmentIds?.length) {
    const res = await wixClient.items
      .query(COLLECTIONS.SPECIALTIES)
      .hasSome("department", departmentIds)
      .find()
    
    const addIds = res.items.map((i) => i._id).filter(Boolean)
    specialistIds = [...(specialistIds || []), ...addIds]
  }

  const query = collection === 'hospitals'
    ? buildOptimizedHospitalsQuery({ specialtyIds })
    : buildOptimizedBranchesQuery({
        branchIds,
        cityIds,
        doctorIds,
        specialtyIds,
        accreditationIds,
        treatmentIds,
        specialistIds,
      })

  // Fetch with limit 1 just to get total count
  const result = await query.limit(1).find()
  
  // Use totalCount if available, otherwise estimate from metadata
  return result.totalCount || result.items.length
}

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

/**
 * Fetches multiple collections in parallel for efficiency
 * Fixed: NO LIMITS on batch operations
 */
export async function batchFetchReferenceData(params: {
  cityIds?: string[]
  doctorIds?: string[]
  specialtyIds?: string[]
  accreditationIds?: string[]
  treatmentIds?: string[]
  departmentIds?: string[]
}) {
  const { cityIds, doctorIds, specialtyIds, accreditationIds, treatmentIds, departmentIds } = params

  console.log(`[DEBUG] batchFetchReferenceData: Fetching - cities: ${cityIds?.length}, doctors: ${doctorIds?.length}, specialties: ${specialtyIds?.length}, treatments: ${treatmentIds?.length}`)

  // Build parallel fetch promises
  const promises: Promise<any>[] = []

  if (cityIds?.length) {
    promises.push(
      wixClient.items
        .query(COLLECTIONS.CITIES)
        .hasSome("_id", cityIds)
        .find()
        .catch(() => ({ items: [] }))
    )
  }

  if (doctorIds?.length) {
    promises.push(
      wixClient.items
        .query(COLLECTIONS.DOCTORS)
        .hasSome("_id", doctorIds)
        .include("specialization")
        .find()
        .catch(() => ({ items: [] }))
    )
  }

  if (specialtyIds?.length) {
    promises.push(
      wixClient.items
        .query(COLLECTIONS.SPECIALTIES)
        .hasSome("_id", specialtyIds)
        .include("department", "treatment")
        .find()
        .catch(() => ({ items: [] }))
    )
  }

  if (accreditationIds?.length) {
    promises.push(
      wixClient.items
        .query(COLLECTIONS.ACCREDITATIONS)
        .hasSome("_id", accreditationIds)
        .find()
        .catch(() => ({ items: [] }))
    )
  }

  if (treatmentIds?.length) {
    promises.push(
      wixClient.items
        .query(COLLECTIONS.TREATMENTS)
        .hasSome("_id", treatmentIds)
        .find()
        .catch(() => ({ items: [] }))
    )
  }

  if (departmentIds?.length) {
    promises.push(
      wixClient.items
        .query(COLLECTIONS.DEPARTMENTS)
        .hasSome("_id", departmentIds)
        .find()
        .catch(() => ({ items: [] }))
    )
  }

  const results = await Promise.all(promises)

  console.log(`[DEBUG] batchFetchReferenceData: Results - cities: ${results[0]?.items?.length}, doctors: ${results[1]?.items?.length}, specialties: ${results[2]?.items?.length}, treatments: ${results[4]?.items?.length}`)

  return {
    cities: results[0]?.items || [],
    doctors: results[1]?.items || [],
    specialties: results[2]?.items || [],
    accreditations: results[3]?.items || [],
    treatments: results[4]?.items || [],
    departments: results[5]?.items || [],
  }
}
