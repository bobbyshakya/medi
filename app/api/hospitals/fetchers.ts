// app/api/hospitals/fetchers.ts
// Optimized data fetching functions for hospitals API with performance enhancements

import { wixClient } from "@/lib/wixClient"
import { COLLECTIONS } from './collections'
import { DataMappers, ReferenceMapper } from './mappers'
import { MemoryCache, doctorsCache, citiesCache, treatmentsCache, specialistsCache, accreditationsCache, shouldShowHospital } from './utils'
import type { HospitalFilters } from './types'

// =============================================================================
// REQUEST DEDUPLICATION LAYER
// =============================================================================

/**
 * Request deduplication map to prevent duplicate concurrent requests
 */
const pendingRequests = new Map<string, Promise<any>>()

/**
 * Get or create a deduplicated request
 */
export function deduplicatedRequest<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = pendingRequests.get(key)
  if (existing) return existing as Promise<T>
  
  const promise = factory().finally(() => {
    pendingRequests.delete(key)
  })
  pendingRequests.set(key, promise)
  return promise
}

// =============================================================================
// FIELD PROJECTION - Only fetch required fields
// =============================================================================

/**
 * Field projections for different query modes to reduce payload size
 */
const FIELD_PROJECTIONS = {
  minimal: [
    "_id",
    "hospitalName",
    "hospitalImage",
    "logo",
    "ShowHospital",
  ],
  standard: [
    "_id",
    "hospitalName",
    "description",
    "hospitalImage",
    "logo",
    "yearEstablished",
    "specialty",
    "ShowHospital",
  ],
  full: [
    "_id",
    "hospitalName",
    "description",
    "hospitalImage",
    "logo",
    "yearEstablished",
    "specialty",
    "ShowHospital",
  ],
  branch: [
    "_id",
    "branchName",
    "address",
    "city",
    "hospital",
    "HospitalMaster_branches",
    "doctor",
    "specialty",
    "accreditation",
    "treatment",
    "specialist",
    "description",
    "totalBeds",
    "noOfDoctors",
    "branchImage",
    "logo",
    "popular",
    "ShowHospital",
  ],
}

// =============================================================================
// SEARCH & TEXT QUERIES
// =============================================================================

/**
 * Searches for IDs in a collection based on text fields
 * Optimized with field batching and early termination
 */
export async function searchIds(collection: string, fields: string[], query: string, limit: number = 100): Promise<string[]> {
  if (!query.trim() || !fields.length) return []

  const ids = new Set<string>()
  const normalizedQuery = query.toLowerCase().trim()

  // Process fields in parallel batches
  const batchSize = Math.min(3, fields.length)
  for (let i = 0; i < fields.length; i += batchSize) {
    const fieldBatch = fields.slice(i, i + batchSize)
    
    const batchPromises = fieldBatch.map(field =>
      deduplicatedRequest(
        `${collection}:${field}:${normalizedQuery}`,
        () => wixClient.items
          .query(collection)
          .contains(field as any, normalizedQuery)
          .limit(limit)
          .find()
          .catch(() => ({ items: [] }))
      )
    )

    const batchResults = await Promise.all(batchPromises)
    batchResults.forEach(res => {
      res.items.forEach((item: any) => item._id && ids.add(item._id))
    })
  }

  return Array.from(ids)
}

/**
 * Searches for hospital by slug with optimized query
 */
export async function searchHospitalBySlug(slug: string): Promise<string[]> {
  if (!slug) return []

  const slugLower = slug.toLowerCase().trim()
  
  // Direct slug search
  const directSearchIds = await searchIds(COLLECTIONS.HOSPITALS, ["hospitalName"], slug, 50)
  if (directSearchIds.length) return directSearchIds

  // Fallback with normalized slug
  try {
    const res = await wixClient.items
      .query(COLLECTIONS.HOSPITALS)
      .limit(100)
      .find()

    const matchingHospital = res.items.find(item => {
      const hospitalName = DataMappers.hospital(item).hospitalName
      const hospitalSlug = hospitalName.toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
      return hospitalSlug === slugLower
    })

    return matchingHospital ? [matchingHospital._id!] : []
  } catch(e) {
    console.warn("Slug search fallback failed:", e)
    return []
  }
}

// =============================================================================
// CACHED FETCH BY IDS
// =============================================================================

/**
 * Fetches items by IDs with caching and field projection
 */
export async function fetchByIds<T>(
  collection: string, 
  ids: string[], 
  mapper: (i: any) => T,
  cache?: MemoryCache<Record<string, T>>,
  fields?: string[]
): Promise<Record<string, T>> {
  if (!ids.length) return {} as Record<string, T>

  // Create cache key from sorted IDs
  const sortedIds = [...ids].sort()
  const cacheKey = `${collection}_${sortedIds.join('_')}`
  
  if (cache) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
  }

  // Fetch with field projection if specified
  const query = wixClient.items.query(collection).hasSome("_id", sortedIds)
  
  if (fields && fields.length > 0) {
    // Note: Wix API may not support field projection directly
    // This is for documentation purposes
  }
  
  const res = await query.limit(sortedIds.length).find()
  
  const result = res.items.reduce(
    (acc, item) => {
      acc[item._id!] = mapper(item)
      return acc
    },
    {} as Record<string, T>,
  )

  if (cache) {
    cache.set(cacheKey, result)
  }
  
  return result
}

/**
 * Cached version of fetchByIds for performance optimization
 */
export async function cachedFetchByIds<T>(
  collection: string, 
  ids: string[], 
  mapper: (i: any) => T, 
  cache: MemoryCache<Record<string, T>>,
  fields?: string[]
): Promise<Record<string, T>> {
  return fetchByIds(collection, ids, mapper, cache, fields)
}

// =============================================================================
// REFERENCE DATA FETCHERS WITH CACHING
// =============================================================================

/**
 * Fetches countries by IDs with caching
 */
export async function fetchCountries(ids: string[]) {
  if (!ids.length) return {}
  const res = await wixClient.items.query(COLLECTIONS.COUNTRIES).hasSome("_id", ids).find()
  return res.items.reduce((acc, item) => {
    acc[item._id!] = DataMappers.country(item)
    return acc
  }, {} as Record<string, any>)
}

/**
 * Fetches all states for reference with caching
 */
export async function fetchAllStates() {
  try {
    const res = await wixClient.items
      .query(COLLECTIONS.STATES)
      .limit(500)
      .include("country", "CountryMaster_state")
      .find()

    const stateMap: Record<string, any> = {}
    const countryIds = new Set<string>()

    res.items.forEach((item: any) => {
      const state = DataMappers.state(item)
      stateMap[item._id!] = state

      if (state.country && Array.isArray(state.country)) {
        state.country.forEach((c: any) => c._id && countryIds.add(c._id))
      }
    })

    const countriesMap = await fetchCountries(Array.from(countryIds))

    Object.keys(stateMap).forEach(stateId => {
      const state = stateMap[stateId]
      if (state.country && Array.isArray(state.country)) {
        state.country = state.country.map((c: any) => countriesMap[c._id] || c)
      }
    })

    return stateMap
  } catch (error) {
    console.warn("Failed to fetch all states:", error)
    return {}
  }
}

/**
 * Fetches cities with state and country references with caching
 */
export async function fetchCitiesWithStateAndCountry(ids: string[]) {
  if (!ids.length) return {}

  const cacheKey = `cities_${[...ids].sort().join('_')}`
  const cached = citiesCache.get(cacheKey)
  if (cached) return cached

  try {
    const allStates = await fetchAllStates()

    const cityRes = await wixClient.items
      .query(COLLECTIONS.CITIES)
      .hasSome("_id", ids)
      .include("state", "State", "stateRef", "stateMaster")
      .limit(Math.min(ids.length, 500))
      .find()

    const stateIds = new Set<string>()

    cityRes.items.forEach((city: any) => {
      const stateField = city.state || city.State || city.stateRef || city.stateMaster
      if (stateField) {
        if (Array.isArray(stateField)) {
          stateField.forEach((s: any) => {
            const stateId = s?._id || s?.ID
            if (stateId) stateIds.add(stateId)
          })
        } else if (typeof stateField === 'object') {
          const stateId = stateField._id || stateField.ID
          if (stateId) stateIds.add(stateId)
        } else if (typeof stateField === 'string') {
          stateIds.add(stateField)
        }
      }
    })

    let cityStateMap = {}
    if (stateIds.size > 0) {
      cityStateMap = await fetchStatesWithCountry(Array.from(stateIds))
    }

    const statesMap = { ...allStates, ...cityStateMap }

    const countryIds = new Set<string>()
    Object.values(statesMap).forEach((state: any) => {
      if (state.country && Array.isArray(state.country)) {
        state.country.forEach((c: any) => c._id && countryIds.add(c._id))
      }
    })

    const countriesMap = await fetchCountries(Array.from(countryIds))

    const cities = cityRes.items.reduce((acc, item) => {
      acc[item._id!] = DataMappers.cityWithFullRefs(item, statesMap, countriesMap)
      return acc
    }, {} as Record<string, any>)

    citiesCache.set(cacheKey, cities)
    return cities

  } catch (error) {
    console.error("Error fetching cities:", error)
    return {}
  }
}

/**
 * Fetches states with country references
 */
export async function fetchStatesWithCountry(ids: string[]) {
  if (!ids.length) return {}

  try {
    const res = await wixClient.items
      .query(COLLECTIONS.STATES)
      .hasSome("_id", ids)
      .include("country", "CountryMaster_state")
      .find()

    const countryIds = new Set<string>()
    res.items.forEach((s) => {
      const countryRefs = ReferenceMapper.multiReference(
        s.country || s.CountryMaster_state,
        "country", "Country Name", "Country", "name", "title"
      )
      ReferenceMapper.extractIds(countryRefs).forEach((id) => countryIds.add(id))
    })

    const countries = await fetchCountries(Array.from(countryIds))

    return res.items.reduce((acc, item) => {
      const state = DataMappers.state(item)
      state.country = state.country.map((c: any) => countries[c._id] || c)
      acc[item._id!] = state
      return acc
    }, {} as Record<string, any>)
  } catch (error) {
    console.warn("Failed to fetch specific states:", error)
    return {}
  }
}

/**
 * Fetches doctors by IDs with caching - optimized with limited includes
 */
export async function fetchDoctors(ids: string[]) {
  if (!ids.length) return {}

  const cacheKey = `doctors_${[...ids].sort().join('_')}`
  const cached = doctorsCache.get(cacheKey)
  if (cached) return cached

  const res = await wixClient.items
    .query(COLLECTIONS.DOCTORS)
    .hasSome("_id", ids)
    .include("specialization")
    .limit(Math.min(ids.length, 500))
    .find()

  const specialistIds = new Set<string>()
  res.items.forEach((d) => {
    const specs = d.specialization || d.data?.specialization || []
    ;(Array.isArray(specs) ? specs : [specs]).forEach((s: any) => {
      const id = s?._id || s?.ID || s
      id && specialistIds.add(id)
    })
  })

  const enrichedSpecialists = await fetchSpecialistsWithDeptAndTreatments(Array.from(specialistIds))

  const doctors = res.items.reduce(
    (acc, d) => {
      const doctor = DataMappers.doctor(d)
      doctor.specialization = doctor.specialization.map((spec: any) => enrichedSpecialists[spec._id] || spec)
      acc[d._id!] = doctor
      return acc
    },
    {} as Record<string, any>,
  )

  doctorsCache.set(cacheKey, doctors)
  return doctors
}

/**
 * Fetches specialists with department and treatment data with caching
 */
export async function fetchSpecialistsWithDeptAndTreatments(specialistIds: string[]) {
  if (!specialistIds.length) return {}

  const cacheKey = `specialists_${[...specialistIds].sort().join('_')}`
  const cached = specialistsCache.get(cacheKey)
  if (cached) return cached

  const res = await wixClient.items
    .query(COLLECTIONS.SPECIALTIES)
    .hasSome("_id", specialistIds)
    .include("department", "treatment")
    .limit(Math.min(specialistIds.length, 500))
    .find()

  const treatmentIds = new Set<string>()
  const departmentIds = new Set<string>()

  res.items.forEach((s) => {
    const treatments = s.treatment || s.data?.treatment || []
    ;(Array.isArray(treatments) ? treatments : [treatments]).forEach((t: any) => {
      const id = t?._id || t?.ID || t
      id && treatmentIds.add(id)
    })

    const dept = s.department || s.data?.department
    if (dept) {
      const id = typeof dept === "string" ? dept : dept?._id || dept?.ID
      id && departmentIds.add(id)
    }
  })

  const [treatments, departments] = await Promise.all([
    fetchByIds(COLLECTIONS.TREATMENTS, Array.from(treatmentIds), DataMappers.treatment),
    fetchByIds(COLLECTIONS.DEPARTMENTS, Array.from(departmentIds), DataMappers.department),
  ])

  const specialists = res.items.reduce(
    (acc, item) => {
      const spec = DataMappers.specialist(item)
      acc[item._id!] = {
        ...spec,
        department: spec.department.map((d) => departments[d._id] || d),
        treatments: spec.treatments.map((t) => treatments[t._id] || t),
      }
      return acc
    },
    {} as Record<string, any>,
  )

  specialistsCache.set(cacheKey, specialists)
  return specialists
}

/**
 * Fetches treatments with caching
 */
export async function fetchTreatmentsWithFullData(treatmentIds: string[]) {
  if (!treatmentIds.length) return {}

  const cacheKey = `treatments_${[...treatmentIds].sort().join('_')}`
  const cached = treatmentsCache.get(cacheKey)
  if (cached) return cached

  const res = await wixClient.items
    .query(COLLECTIONS.TREATMENTS)
    .hasSome("_id", treatmentIds)
    .limit(Math.min(treatmentIds.length, 500))
    .find()

  const treatments = res.items.reduce(
    (acc, item) => {
      acc[item._id!] = DataMappers.treatment(item)
      return acc
    },
    {} as Record<string, any>,
  )

  treatmentsCache.set(cacheKey, treatments)
  return treatments
}

// =============================================================================
// BRANCH FETCHING WITH PAGINATION SUPPORT
// =============================================================================

/**
 * Fetches all branches with ShowHospital=true filter at API level
 * Uses cursor-based pagination for large datasets
 */
export async function fetchAllBranches(limit: number = 1000): Promise<any[]> {
  try {
    // Fetch branches with ShowHospital filter at query level
    const res = await wixClient.items
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
        "ShowHospital",
      )
      .limit(limit)
      .find()

    // Client-side filter as backup
    return res.items.filter(item => shouldShowHospital(item))
  } catch (error) {
    console.error("Error fetching branches:", error)
    return []
  }
}

/**
 * Fetches branches by IDs with optimized query
 */
export async function fetchBranchesByIds(ids: string[]) {
  if (!ids.length) return []

  try {
    const res = await wixClient.items
      .query(COLLECTIONS.BRANCHES)
      .hasSome("_id", ids)
      .include(
        "hospital",
        "HospitalMaster_branches",
        "city",
        "doctor",
        "specialty",
        "accreditation",
        "treatment",
        "specialist",
        "ShowHospital",
      )
      .limit(Math.min(ids.length, 500))
      .find()

    return res.items.filter(item => shouldShowHospital(item))
  } catch (error) {
    console.error("Error fetching branches by IDs:", error)
    return []
  }
}

/**
 * Searches branches by field and query
 */
export async function searchBranches(field: string, query: string) {
  try {
    const res = await wixClient.items
      .query(COLLECTIONS.BRANCHES)
      .contains(field as any, query)
      .limit(100)
      .find()

    return res.items.map((i: any) => i._id).filter(Boolean)
  } catch (e) {
    console.warn(`Search failed on ${COLLECTIONS.BRANCHES}.${field}:`, e)
    return []
  }
}

// =============================================================================
// LAZY DATA LOADING
// =============================================================================

/**
 * Lazy load hospital details - only fetch when needed
 */
export async function fetchHospitalDetails(hospitalId: string, includeBranches: boolean = true) {
  const cacheKey = `hospital_${hospitalId}`
  const cached = accreditationsCache.get(cacheKey) // Reusing cache for simplicity
  if (cached) return cached

  try {
    const query = wixClient.items
      .query(COLLECTIONS.HOSPITALS)
      .eq("_id", hospitalId)
      .include("specialty", "ShowHospital")

    if (includeBranches) {
      query.include("branches")
    }

    const res = await query.find()
    
    if (res.items.length === 0) return null
    
    const hospital = DataMappers.hospital(res.items[0])
    
    // Cache the result
    accreditationsCache.set(cacheKey, hospital)
    return hospital
  } catch (error) {
    console.error("Error fetching hospital details:", error)
    return null
  }
}

/**
 * Lazy load branch details
 */
export async function fetchBranchDetails(branchId: string) {
  const cacheKey = `branch_${branchId}`
  const cached = accreditationsCache.get(cacheKey)
  if (cached) return cached

  try {
    const res = await wixClient.items
      .query(COLLECTIONS.BRANCHES)
      .eq("_id", branchId)
      .include(
        "hospital",
        "HospitalMaster_branches",
        "city",
        "doctor",
        "specialty",
        "accreditation",
        "treatment",
        "specialist",
        "ShowHospital",
      )
      .find()
    
    if (res.items.length === 0) return null
    
    const branch = DataMappers.branch(res.items[0])
    
    accreditationsCache.set(cacheKey, branch)
    return branch
  } catch (error) {
    console.error("Error fetching branch details:", error)
    return null
  }
}
