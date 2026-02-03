// app/api/hospitals/handlers.ts
// Optimized business logic handlers with lazy loading support

import { wixClient } from "@/lib/wixClient"
import { COLLECTIONS } from './collections'
import { DataMappers, ReferenceMapper } from './mappers'
import { 
  fetchAllBranches, 
  fetchDoctors, 
  fetchCitiesWithStateAndCountry, 
  fetchByIds, 
  cachedFetchByIds, 
  fetchTreatmentsWithFullData, 
  fetchSpecialistsWithDeptAndTreatments 
} from './fetchers'
import { 
  shouldShowHospital, 
  shouldShowHospitalForHospital, 
  isStandaloneBranch, 
  accreditationsCache 
} from './utils'
import { generateSlug } from './shared-utils'
import type { FilterIds, HospitalData } from './types'

// =============================================================================
// LAZY LOADING SUPPORT
// =============================================================================

interface LazyLoadConfig {
  loadBranches?: boolean
  loadDoctors?: boolean
  loadCities?: boolean
  loadAccreditations?: boolean
  loadTreatments?: boolean
  loadSpecialists?: boolean
  limitBranches?: number
}

/**
 * Default lazy loading config for different use cases
 */
const LAZY_CONFIGS = {
  list: {
    loadBranches: true, // Enable branches for search/listing pages
    loadDoctors: false,
    loadCities: true,   // Enable cities for filtering
    loadAccreditations: false,
    loadTreatments: false,
    loadSpecialists: false,
    limitBranches: 20,  // Limit branches per hospital for list view
  } as LazyLoadConfig,
  
  detail: {
    loadBranches: true,
    loadDoctors: true,
    loadCities: true,
    loadAccreditations: true,
    loadTreatments: true,
    loadSpecialists: true,
    limitBranches: 50,
  } as LazyLoadConfig,
  
  minimal: {
    loadBranches: false,
    loadDoctors: false,
    loadCities: false,
    loadAccreditations: false,
    loadTreatments: false,
    loadSpecialists: false,
  } as LazyLoadConfig,
}

// =============================================================================
// OPTIMIZED HOSPITAL ENRICHMENT
// =============================================================================

/**
 * Enriches hospitals with branch, doctor, and treatment data
 * Optimized with lazy loading and selective data fetching
 */
export async function enrichHospitals(
  hospitals: HospitalData[],
  filterIds: FilterIds,
  config: LazyLoadConfig = LAZY_CONFIGS.detail,
) {
  const hospitalIds = hospitals.map((h) => h._id).filter(Boolean)
  
  if (hospitalIds.length === 0) return hospitals

  // Step 1: Fetch branches only if needed (lazy loading)
  let allBranches: any[] = []
  if (config.loadBranches) {
    const [groupedBranchesRes, standaloneBranchesRes] = await Promise.all([
      wixClient.items
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
        .hasSome("HospitalMaster_branches", hospitalIds)
        .limit(config.limitBranches || 1000)
        .find(),
      wixClient.items
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
        .hasSome("hospital", hospitalIds)
        .limit(config.limitBranches || 1000)
        .find()
    ])

    // Combine and filter branches
    allBranches = [...groupedBranchesRes.items, ...standaloneBranchesRes.items]
    allBranches = allBranches.filter((b: any) => shouldShowHospital(b))
  }

  // Deduplicate branches
  const uniqueBranchesMap = new Map<string, any>()
  allBranches.forEach((b: any) => {
    if (b._id) {
      uniqueBranchesMap.set(b._id, b)
    }
  })
  const uniqueBranches = Array.from(uniqueBranchesMap.values())

  const branchesByHospital: Record<string, any[]> = {}
  const doctorIds = new Set<string>()
  const cityIds = new Set<string>()
  const specialtyIds = new Set<string>()
  const accreditationIds = new Set<string>()
  const treatmentIds = new Set<string>()
  const specialistIds = new Set<string>()

  // Process branches
  uniqueBranches.forEach((b: any) => {
    const hIds = new Set<string>()

    // Get hospital IDs
    ReferenceMapper.extractHospitalIds(b).forEach((id) => hIds.add(id))

    const directHospitalRefs = ReferenceMapper.multiReference(
      b.hospital || b.data?.hospital,
      "hospitalName", "Hospital Name"
    )
    directHospitalRefs.forEach((h: any) => {
      if (h._id) hIds.add(h._id)
    })

    // Add branch to relevant hospitals
    hIds.forEach((hid) => {
      if (hospitalIds.includes(hid)) {
        if (!branchesByHospital[hid]) branchesByHospital[hid] = []
        const mapped = DataMappers.branch(b)
        branchesByHospital[hid].push(mapped)

        // Collect IDs only if we're loading related data
        if (config.loadDoctors) {
          ReferenceMapper.extractIds(mapped.doctors).forEach((id) => doctorIds.add(id))
        }
        if (config.loadCities) {
          ReferenceMapper.extractIds(mapped.city).forEach((id) => cityIds.add(id))
        }
        if (config.loadAccreditations) {
          ReferenceMapper.extractIds(mapped.accreditation).forEach((id) => accreditationIds.add(id))
        }
        if (config.loadSpecialists) {
          ReferenceMapper.extractIds(mapped.specialists).forEach((id) => specialistIds.add(id))
        }
        if (config.loadTreatments) {
          ReferenceMapper.extractIds(mapped.treatments).forEach((id) => treatmentIds.add(id))
        }

        if (config.loadSpecialists || config.loadTreatments) {
          mapped.specialization.forEach((s: any) => {
            if (s.isTreatment) {
              treatmentIds.add(s._id)
            } else {
              specialtyIds.add(s._id)
            }
          })
        }
      }
    })
  })

  // Step 2: Fetch related data in parallel (only if needed)
  const enrichmentPromises: Promise<any>[] = []
  
  if (config.loadDoctors) {
    enrichmentPromises.push(fetchDoctors(Array.from(doctorIds)))
  } else {
    enrichmentPromises.push(Promise.resolve({}))
  }
  
  if (config.loadCities) {
    enrichmentPromises.push(fetchCitiesWithStateAndCountry(Array.from(cityIds)))
  } else {
    enrichmentPromises.push(Promise.resolve({}))
  }
  
  if (config.loadAccreditations) {
    enrichmentPromises.push(cachedFetchByIds(COLLECTIONS.ACCREDITATIONS, Array.from(accreditationIds), DataMappers.accreditation, accreditationsCache))
  } else {
    enrichmentPromises.push(Promise.resolve({}))
  }
  
  if (config.loadTreatments) {
    enrichmentPromises.push(fetchTreatmentsWithFullData(Array.from(treatmentIds)))
  } else {
    enrichmentPromises.push(Promise.resolve({}))
  }
  
  if (config.loadSpecialists) {
    enrichmentPromises.push(fetchSpecialistsWithDeptAndTreatments(Array.from(new Set([...specialtyIds, ...specialistIds]))))
  } else {
    enrichmentPromises.push(Promise.resolve({}))
  }

  const [doctors, cities, accreditations, treatments, enrichedSpecialists] = await Promise.all(enrichmentPromises)

  return hospitals.map((hospital) => {
    const rawBranches = branchesByHospital[hospital._id] || []
    
    const filteredBranches = rawBranches.filter((b) => {
      if (!shouldShowHospital(b)) return false

      const matchBranch = !filterIds.branch.length || filterIds.branch.includes(b._id)
      const matchCity = !filterIds.city.length || b.city.some((c: any) => filterIds.city.includes(c._id))
      const matchDoctor = !filterIds.doctor.length || b.doctors.some((d: any) => filterIds.doctor.includes(d._id))
      const matchSpecialty =
        !filterIds.specialty.length ||
        b.specialization.some((s: any) => !s.isTreatment && filterIds.specialty.includes(s._id))
      const matchTreatment =
        !filterIds.treatment.length || b.treatments.some((t: any) => filterIds.treatment.includes(t._id))
      const matchSpecialist =
        !filterIds.specialist.length || b.specialists.some((s: any) => filterIds.specialist.includes(s._id))
      const matchDepartment =
        !filterIds.department.length ||
        b.specialists.some((s: any) => s.department.some((d: any) => filterIds.department.includes(d._id)))
      const matchAccred =
        !filterIds.accreditation.length || b.accreditation.some((a: any) => filterIds.accreditation.includes(a._id))
      
      return (
        matchBranch &&
        matchCity &&
        matchDoctor &&
        matchSpecialty &&
        matchTreatment &&
        matchSpecialist &&
        matchDepartment &&
        matchAccred
      )
    })

    const enrichedBranches = filteredBranches.map((b) => {
      let enrichedCities = config.loadCities 
        ? b.city.map((c: any) => cities[c._id] || c)
        : b.city

      if (enrichedCities.length === 0 && config.loadCities) {
        enrichedCities = [{
          _id: `fallback-${b._id}`,
          cityName: "Unknown City",
          state: "Unknown State",
          country: "Unknown Country",
        }]
      }

      return {
        ...b,
        doctors: config.loadDoctors ? b.doctors.map((d: any) => doctors[d._id] || d) : b.doctors,
        city: enrichedCities,
        accreditation: config.loadAccreditations ? b.accreditation.map((a: any) => accreditations[a._id] || a) : b.accreditation,
        specialists: config.loadSpecialists ? b.specialists.map((s: any) => enrichedSpecialists[s._id] || s) : b.specialists,
        treatments: config.loadTreatments ? b.treatments.map((t: any) => treatments[t._id] || t) : b.treatments,
        specialization: (config.loadSpecialists || config.loadTreatments)
          ? b.specialization.map((s: any) => {
              if (s.isTreatment) {
                return treatments[s._id] || s
              } else {
                return enrichedSpecialists[s._id] || s
              }
            })
          : b.specialization,
      }
    })

    // Collect unique items
    const uniqueDoctors = new Map()
    const uniqueSpecialists = new Map()
    const uniqueTreatments = new Map()

    enrichedBranches.forEach((b) => {
      b.doctors.forEach((d: any) => d._id && uniqueDoctors.set(d._id, d))
      b.specialists.forEach((s: any) => s._id && uniqueSpecialists.set(s._id, s))
      b.treatments.forEach((t: any) => t._id && uniqueTreatments.set(t._id, t))
    })

    return {
      ...hospital,
      branches: enrichedBranches,
      doctors: Array.from(uniqueDoctors.values()),
      specialists: Array.from(uniqueSpecialists.values()),
      treatments: Array.from(uniqueTreatments.values()),
      accreditations: enrichedBranches.flatMap((b) => b.accreditation),
    }
  })
}

// =============================================================================
// OPTIMIZED GET ALL HOSPITALS
// =============================================================================

/**
 * Gets all hospitals with optimized lazy loading
 * Uses config-based approach to minimize unnecessary data fetching
 */
export async function getAllHospitals(
  filterIds: FilterIds,
  searchQuery?: string,
  includeStandalone: boolean = true,
  minimal: boolean = false,
  slug?: string,
  cachedBranches?: any[],
  showHospital: boolean = true,
  lazyConfig?: LazyLoadConfig,
) {
  // Determine lazy loading config
  const config = lazyConfig || (minimal ? LAZY_CONFIGS.minimal : LAZY_CONFIGS.list)

  // Fetch regular hospitals from HospitalMaster
  const regularHospitalsQuery = wixClient.items
    .query(COLLECTIONS.HOSPITALS)
    .include("specialty", "ShowHospital")
    .descending("_createdDate")
    .limit(minimal ? 100 : 1000)
    .find()

  // Use cached branches if provided
  const allBranches = cachedBranches || await fetchAllBranches()

  // Separate branches
  const standaloneBranches: any[] = []
  const groupedBranches: any[] = []

  allBranches.forEach(branch => {
    if (isStandaloneBranch(branch)) {
      standaloneBranches.push(branch)
    } else {
      groupedBranches.push(branch)
    }
  })

  // Process regular hospitals
  const regularHospitalsResult = await regularHospitalsQuery
  let regularHospitals = regularHospitalsResult.items

  // Convert standalone branches to hospital objects
  let standaloneHospitals: any[] = []
  if (includeStandalone) {
    const doctorIds = new Set<string>()
    const cityIds = new Set<string>()
    const accreditationIds = new Set<string>()
    const treatmentIds = new Set<string>()
    const specialistIds = new Set<string>()
    const specialtyIds = new Set<string>()

    // Map standalone branches
    standaloneBranches.forEach(branch => {
      const mapped = DataMappers.branch(branch)

      ReferenceMapper.extractIds(mapped.doctors).forEach((id) => doctorIds.add(id))
      ReferenceMapper.extractIds(mapped.city).forEach((id) => cityIds.add(id))
      ReferenceMapper.extractIds(mapped.accreditation).forEach((id) => accreditationIds.add(id))
      ReferenceMapper.extractIds(mapped.specialists).forEach((id) => specialistIds.add(id))
      ReferenceMapper.extractIds(mapped.treatments).forEach((id) => treatmentIds.add(id))

      mapped.specialization.forEach((s: any) => {
        if (s.isTreatment) {
          treatmentIds.add(s._id)
        } else {
          specialtyIds.add(s._id)
        }
      })
    })

    // Filter standalone branches
    const filteredStandaloneBranches = standaloneBranches.filter(branch => {
      if (!shouldShowHospital(branch)) return false

      const mapped = DataMappers.branch(branch)

      const matchBranch = !filterIds.branch.length || filterIds.branch.includes(mapped._id)
      const matchCity = !filterIds.city.length || mapped.city.some((c: any) => filterIds.city.includes(c._id))
      const matchDoctor = !filterIds.doctor.length || mapped.doctors.some((d: any) => filterIds.doctor.includes(d._id))
      const matchSpecialty =
        !filterIds.specialty.length ||
        mapped.specialization.some((s: any) => !s.isTreatment && filterIds.specialty.includes(s._id))
      const matchTreatment =
        !filterIds.treatment.length || mapped.treatments.some((t: any) => filterIds.treatment.includes(t._id))
      const matchSpecialist =
        !filterIds.specialist.length || mapped.specialists.some((s: any) => filterIds.specialist.includes(s._id))
      const matchDepartment =
        !filterIds.department.length ||
        mapped.specialists.some((s: any) => s.department.some((d: any) => filterIds.department.includes(d._id)))
      const matchAccred =
        !filterIds.accreditation.length || mapped.accreditation.some((a: any) => filterIds.accreditation.includes(a._id))

      return (
        matchBranch &&
        matchCity &&
        matchDoctor &&
        matchSpecialty &&
        matchTreatment &&
        matchSpecialist &&
        matchDepartment &&
        matchAccred
      )
    })

    // Fetch related data for enrichment
    const [doctors, cities, accreditations, treatments, enrichedSpecialists] = await Promise.all([
      fetchDoctors([...doctorIds]),
      fetchCitiesWithStateAndCountry([...cityIds]),
      fetchByIds(COLLECTIONS.ACCREDITATIONS, [...accreditationIds], DataMappers.accreditation),
      fetchTreatmentsWithFullData([...treatmentIds]),
      fetchSpecialistsWithDeptAndTreatments([...new Set([...specialtyIds, ...specialistIds])]),
    ])

    // Convert filtered branches to hospitals
    standaloneHospitals = filteredStandaloneBranches.map(branch => {
      const mappedBranch = DataMappers.branch(branch)

      const enrichedBranch = {
        ...mappedBranch,
        doctors: mappedBranch.doctors.map((d: any) => doctors[d._id] || d),
        city: mappedBranch.city.map((c: any) => cities[c._id] || c),
        accreditation: mappedBranch.accreditation.map((a: any) => accreditations[a._id] || a),
        specialists: mappedBranch.specialists.map((s: any) => enrichedSpecialists[s._id] || s),
        treatments: mappedBranch.treatments.map((t: any) => treatments[t._id] || t),
        specialization: mappedBranch.specialization.map((s: any) => {
          if (s.isTreatment) {
            return treatments[s._id] || s
          } else {
            return enrichedSpecialists[s._id] || s
          }
        }),
      }

      const hospital = DataMappers.hospital(branch, true)

      const uniqueDoctors = new Map()
      const uniqueSpecialists = new Map()
      const uniqueTreatments = new Map()

      enrichedBranch.doctors.forEach((d: any) => d._id && uniqueDoctors.set(d._id, d))
      enrichedBranch.specialists.forEach((s: any) => s._id && uniqueSpecialists.set(s._id, s))
      enrichedBranch.treatments.forEach((t: any) => t._id && uniqueTreatments.set(t._id, t))

      const hospitalData = minimal ? {
        _id: `standalone-${branch._id || branch.ID}`,
        hospitalName: branch.branchName || branch["Branch Name"] || "Branch",
        showHospital: shouldShowHospital(branch),
      } : {
        ...hospital,
        branches: [enrichedBranch],
        doctors: [],
        specialists: Array.from(uniqueSpecialists.values()),
        treatments: Array.from(uniqueTreatments.values()),
        accreditations: enrichedBranch.accreditation,
        showHospital: shouldShowHospital(branch),
      }

      return hospitalData
    })
  }

  // Enrich regular hospitals
  let enrichedRegularHospitals: HospitalData[] = []
  if (regularHospitals.length > 0) {
    if (minimal) {
      enrichedRegularHospitals = regularHospitals.map(h => ({
        _id: h._id,
        hospitalName: DataMappers.hospital(h).hospitalName,
        showHospital: shouldShowHospitalForHospital(h)
      })) as any[]
    } else {
      enrichedRegularHospitals = await enrichHospitals(regularHospitals.map(h => DataMappers.hospital(h)), filterIds, config)
      enrichedRegularHospitals = enrichedRegularHospitals.map((hospital, index) => ({
        ...hospital,
        showHospital: shouldShowHospitalForHospital(regularHospitals[index])
      }))
    }
  }

  // Combine all hospitals
  let allHospitals: any[] = [...enrichedRegularHospitals, ...standaloneHospitals]

  // Apply search query
  if (searchQuery) {
    const searchSlug = generateSlug(searchQuery)
    allHospitals = allHospitals.filter(hospital => {
      const hospitalSlug = generateSlug(hospital.hospitalName)
      return hospitalSlug.includes(searchSlug) ||
             hospital.hospitalName.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }

  // Apply slug filter
  if (slug) {
    const slugLower = generateSlug(slug)
    allHospitals = allHospitals.filter(hospital => {
      const hospitalSlug = generateSlug(hospital.hospitalName)
      return hospitalSlug === slugLower
    })
  }

  // Apply showHospital filter
  allHospitals = allHospitals.filter(hospital => hospital.showHospital === true)

  return allHospitals
}

// =============================================================================
// LAZY LOAD SINGLE HOSPITAL
// =============================================================================

/**
 * Lazily load a single hospital with full details
 */
export async function getHospitalBySlug(
  slug: string,
  includeRelated: boolean = true
): Promise<HospitalData | null> {
  const normalizedSlug = generateSlug(slug)
  
  // Check cache first
  const cacheKey = `hospital_slug_${normalizedSlug}`
  const cached = accreditationsCache.get(cacheKey)
  if (cached) return cached as HospitalData

  // Fetch hospital by slug
  const hospitals = await getAllHospitals(
    { branch: [], city: [], doctor: [], specialty: [], accreditation: [], treatment: [], specialist: [], department: [] },
    undefined,
    true,
    false,
    slug,
    undefined,
    true,
    includeRelated ? LAZY_CONFIGS.detail : LAZY_CONFIGS.minimal
  )

  if (hospitals.length === 0) return null

  const hospital = hospitals[0]
  
  // Cache the result
  accreditationsCache.set(cacheKey, hospital)
  
  return hospital
}
