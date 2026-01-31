// app/api/hospitals/fetchers.ts
// Data fetching functions for hospitals API

import { wixClient } from "@/lib/wixClient"
import { COLLECTIONS } from './collections'
import { DataMappers, ReferenceMapper } from './mappers'
import { MemoryCache, doctorsCache, citiesCache, treatmentsCache, specialistsCache, accreditationsCache, shouldShowHospital } from './utils'
import type { HospitalFilters } from './types'

/**
 * Searches for IDs in a collection based on text fields
 * Optimized to reduce database queries by batching field searches
 */
export async function searchIds(collection: string, fields: string[], query: string): Promise<string[]> {
  if (!query.trim()) return []

  const ids = new Set<string>()

  // Process fields in batches of 3 to reduce sequential queries
  const batchSize = 3
  for (let i = 0; i < fields.length; i += batchSize) {
    const fieldBatch = fields.slice(i, i + batchSize)

    // Execute batch queries in parallel
    const batchPromises = fieldBatch.map(field =>
      wixClient.items
        .query(collection)
        .contains(field as any, query)
        .limit(500)
        .find()
        .catch(() => ({ items: [] })) // Handle errors gracefully
    )

    const batchResults = await Promise.all(batchPromises)
    batchResults.forEach(res => {
      res.items.forEach((item: any) => item._id && ids.add(item._id))
    })
  }

  return Array.from(ids)
}

/**
 * Searches for hospital by slug
 */
export async function searchHospitalBySlug(slug: string): Promise<string[]> {
  if (!slug) return []

  const directSearchIds = await searchIds(COLLECTIONS.HOSPITALS, ["hospitalName"], slug)
  if (directSearchIds.length) return directSearchIds

  try {
    const res = await wixClient.items
      .query(COLLECTIONS.HOSPITALS)
      .limit(500)
      .find()

    const matchingHospital = res.items.find(item => {
      const hospitalName = DataMappers.hospital(item).hospitalName
      return slug === hospitalName.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-")
    })

    return matchingHospital ? [matchingHospital._id!] : []
  } catch(e) {
    console.warn("Slug search fallback failed:", e)
    return []
  }
}

/**
 * Fetches items by IDs from a collection
 */
export async function fetchByIds(collection: string, ids: string[], mapper: (i: any) => any) {
  if (!ids.length) return {}
  const res = await wixClient.items.query(collection).hasSome("_id", ids).find()
  return res.items.reduce(
    (acc, item) => {
      acc[item._id!] = mapper(item)
      return acc
    },
    {} as Record<string, any>,
  )
}

/**
 * Cached version of fetchByIds for performance optimization
 */
export async function cachedFetchByIds(collection: string, ids: string[], mapper: (i: any) => any, cache: MemoryCache<Record<string, any>>) {
  if (!ids.length) return {}

  // Create cache key from sorted IDs and collection
  const cacheKey = `${collection}_${ids.sort().join('_')}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const result = await fetchByIds(collection, ids, mapper)
  cache.set(cacheKey, result)
  return result
}

/**
 * Fetches countries by IDs
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
 * Fetches all states for reference
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

  // Create cache key from sorted IDs
  const cacheKey = `cities_${ids.sort().join('_')}`
  const cached = citiesCache.get(cacheKey)
  if (cached) return cached

  try {
    const allStates = await fetchAllStates()

    const cityRes = await wixClient.items
      .query(COLLECTIONS.CITIES)
      .hasSome("_id", ids)
      .include("state", "State", "stateRef", "stateMaster")
      .limit(500)
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

    // Cache the result
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
 * Fetches doctors by IDs with caching for performance
 */
export async function fetchDoctors(ids: string[]) {
  if (!ids.length) return {}

  // Create cache key from sorted IDs
  const cacheKey = `doctors_${ids.sort().join('_')}`
  const cached = doctorsCache.get(cacheKey)
  if (cached) return cached

  const res = await wixClient.items.query(COLLECTIONS.DOCTORS).hasSome("_id", ids).include("specialization").find()

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

  // Cache the result
  doctorsCache.set(cacheKey, doctors)
  return doctors
}

/**
 * Fetches specialists with department and treatment data with caching
 */
export async function fetchSpecialistsWithDeptAndTreatments(specialistIds: string[]) {
  if (!specialistIds.length) return {}

  // Create cache key from sorted IDs
  const cacheKey = `specialists_${specialistIds.sort().join('_')}`
  const cached = specialistsCache.get(cacheKey)
  if (cached) return cached

  const res = await wixClient.items
    .query(COLLECTIONS.SPECIALTIES)
    .hasSome("_id", specialistIds)
    .include("department", "treatment")
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

  // Cache the result
  specialistsCache.set(cacheKey, specialists)
  return specialists
}

/**
 * Fetches treatments with full data with caching
 */
export async function fetchTreatmentsWithFullData(treatmentIds: string[]) {
  if (!treatmentIds.length) return {}

  // Create cache key from sorted IDs
  const cacheKey = `treatments_${treatmentIds.sort().join('_')}`
  const cached = treatmentsCache.get(cacheKey)
  if (cached) return cached

  const res = await wixClient.items.query(COLLECTIONS.TREATMENTS).hasSome("_id", treatmentIds).find()

  const treatments = res.items.reduce(
    (acc, item) => {
      acc[item._id!] = DataMappers.treatment(item)
      return acc
    },
    {} as Record<string, any>,
  )

  // Cache the result
  treatmentsCache.set(cacheKey, treatments)
  return treatments
}

/**
 * Fetches all branches with proper limit for large datasets
 * Only returns branches where ShowHospital=true
 */
export async function fetchAllBranches() {
  try {
    // Use a high limit to fetch all branches (Wix typically returns up to 1000 items per query)
    // For datasets larger than 1000, consider implementing cursor-based pagination
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
        "ShowHospital", // Include the boolean field for visibility control
      )
      .limit(1000) // Wix API maximum limit
      .find()

    // Filter to only include ShowHospital=true branches
    return res.items.filter(item => shouldShowHospital(item))
  } catch (error) {
    console.error("Error fetching branches:", error)
    return []
  }
}

/**
 * Fetches branches by IDs
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
        "ShowHospital", // Include the boolean field for visibility control
      )
      .limit(1000)
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
      .limit(500)
      .find()

    return res.items.map((i: any) => i._id).filter(Boolean)
  } catch (e) {
    console.warn(`Search failed on ${COLLECTIONS.BRANCHES}.${field}:`, e)
    return []
  }
}