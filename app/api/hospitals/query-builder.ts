// app/api/hospitals/query-builder.ts
// Optimized query building logic with filter pushdown

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
  limit?: number
}) {
  const { branchIds, cityIds, doctorIds, specialtyIds, accreditationIds, treatmentIds, specialistIds, hospitalIds, limit = 100 } = filters

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

  // Push filters to API level
  if (branchIds?.length) {
    query = query.hasSome("_id", branchIds.slice(0, 100)) // Wix limit
  }
  
  if (cityIds?.length) {
    query = query.hasSome("city", cityIds.slice(0, 100))
  }
  
  if (doctorIds?.length) {
    query = query.hasSome("doctor", doctorIds.slice(0, 100))
  }
  
  if (specialtyIds?.length) {
    query = query.hasSome("specialty", specialtyIds.slice(0, 100))
  }
  
  if (accreditationIds?.length) {
    query = query.hasSome("accreditation", accreditationIds.slice(0, 100))
  }
  
  if (treatmentIds?.length) {
    query = query.hasSome("treatment", treatmentIds.slice(0, 100))
  }
  
  if (specialistIds?.length) {
    query = query.hasSome("specialist", specialistIds.slice(0, 100))
  }
  
  if (hospitalIds?.length) {
    // Query both hospital reference fields
    query = query.hasSome("hospital", hospitalIds.slice(0, 100))
  }

  return query.limit(limit)
}

/**
 * Builds an optimized hospitals query with filter pushdown
 */
export function buildOptimizedHospitalsQuery(filters: {
  hospitalIds?: string[]
  specialtyIds?: string[]
  showHospitalOnly?: boolean
  limit?: number
}) {
  const { hospitalIds, specialtyIds, showHospitalOnly = true, limit = 100 } = filters

  let query = wixClient.items
    .query(COLLECTIONS.HOSPITALS)
    .include("specialty", "ShowHospital")
    .descending("_createdDate")

  if (hospitalIds?.length) {
    query = query.hasSome("_id", hospitalIds.slice(0, 100))
  }

  if (specialtyIds?.length) {
    query = query.hasSome("specialty", specialtyIds.slice(0, 100))
  }

  return query.limit(limit)
}

// =============================================================================
// FILTER HELPERS
// =============================================================================

/**
 * Gets hospital IDs based on filters with optimized query
 */
export async function getHospitalIds(filters: HospitalFilters): Promise<string[]> {
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
    return []

  // Resolve department IDs to specialty IDs first
  if (departmentIds?.length) {
    const res = await wixClient.items
      .query(COLLECTIONS.SPECIALTIES)
      .hasSome("department", departmentIds)
      .limit(500)
      .find()
    
    const addIds = res.items.map((i) => i._id).filter(Boolean)
    specialistIds = [...(specialistIds || []), ...addIds]
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
  
  // Extract unique hospital IDs from branches
  const hospitalIds = new Set<string>()
  result.items.forEach((b: any) => {
    ReferenceMapper.extractHospitalIds(b).forEach((id) => hospitalIds.add(id))
  })
  
  return Array.from(hospitalIds)
}

/**
 * Gets filtered branch IDs with optimized query
 */
export async function getBranchIds(filters: HospitalFilters): Promise<string[]> {
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
    return []

  // Resolve department IDs
  if (departmentIds?.length) {
    const res = await wixClient.items
      .query(COLLECTIONS.SPECIALTIES)
      .hasSome("department", departmentIds)
      .limit(500)
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
      .limit(500)
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

  // Note: Wix may not support count() directly, so we fetch with limit 1
  const result = await query.limit(1).find()
  
  // If Wix returns total in metadata, use it
  // Otherwise, we'd need a different approach
  return result.totalCount || result.items.length
}

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

/**
 * Fetches multiple collections in parallel for efficiency
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

  // Build parallel fetch promises
  const promises: Promise<any>[] = []

  if (cityIds?.length) {
    promises.push(
      wixClient.items
        .query(COLLECTIONS.CITIES)
        .hasSome("_id", cityIds.slice(0, 100))
        .find()
        .catch(() => ({ items: [] }))
    )
  }

  if (doctorIds?.length) {
    promises.push(
      wixClient.items
        .query(COLLECTIONS.DOCTORS)
        .hasSome("_id", doctorIds.slice(0, 100))
        .include("specialization")
        .find()
        .catch(() => ({ items: [] }))
    )
  }

  if (specialtyIds?.length) {
    promises.push(
      wixClient.items
        .query(COLLECTIONS.SPECIALTIES)
        .hasSome("_id", specialtyIds.slice(0, 100))
        .include("department", "treatment")
        .find()
        .catch(() => ({ items: [] }))
    )
  }

  if (accreditationIds?.length) {
    promises.push(
      wixClient.items
        .query(COLLECTIONS.ACCREDITATIONS)
        .hasSome("_id", accreditationIds.slice(0, 100))
        .find()
        .catch(() => ({ items: [] }))
    )
  }

  if (treatmentIds?.length) {
    promises.push(
      wixClient.items
        .query(COLLECTIONS.TREATMENTS)
        .hasSome("_id", treatmentIds.slice(0, 100))
        .find()
        .catch(() => ({ items: [] }))
    )
  }

  if (departmentIds?.length) {
    promises.push(
      wixClient.items
        .query(COLLECTIONS.DEPARTMENTS)
        .hasSome("_id", departmentIds.slice(0, 100))
        .find()
        .catch(() => ({ items: [] }))
    )
  }

  const results = await Promise.all(promises)

  return {
    cities: results[0]?.items || [],
    doctors: results[1]?.items || [],
    specialties: results[2]?.items || [],
    accreditations: results[3]?.items || [],
    treatments: results[4]?.items || [],
    departments: results[5]?.items || [],
  }
}
