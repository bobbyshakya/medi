// lib/cms/data-service.ts
// Centralized CMS data fetching service with caching

import { wixClient } from '@/lib/wixClient'
import { memoryCache, CACHE_CONFIG, CACHE_TAGS, createCachedFetcher } from './cache'
import type {
  HospitalData,
  BranchData,
  DoctorData,
  TreatmentData,
  CityData,
  AccreditationData,
  SpecializationData,
  DepartmentData,
  ExtendedTreatmentData,
  TreatmentLocation,
  CMSDataResponse,
  HospitalDetailResponse,
} from './types'

// =============================================================================
// COLLECTION NAMES
// =============================================================================

const COLLECTIONS = {
  BRANCHES: 'BranchesMaster',
  DOCTORS: 'DoctorMaster',
  CITIES: 'CityMaster',
  HOSPITALS: 'HospitalMaster',
  ACCREDITATIONS: 'Accreditation',
  SPECIALTIES: 'SpecialistsMaster',
  DEPARTMENTS: 'Department',
  TREATMENTS: 'TreatmentMaster',
  STATES: 'StateMaster',
  COUNTRIES: 'CountryMaster',
} as const

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getValue(item: any, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = item?.[key] ?? item?.data?.[key]
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'string') {
        return value
      }
      if (typeof value === 'object') {
        // Handle Wix CMS reference objects - try to get name/title from common fields
        return value.name || value.title || value.state || value.StateName || value.stateName || value['State Name'] || null
      }
      return String(value)
    }
  }
  return null
}

function extractRichText(field: any): string {
  if (!field) return ''
  if (typeof field === 'string') return field
  if (field.nodes) {
    return field.nodes
      .map((node: any) => {
        if (node.type === 'PARAGRAPH' && node.nodes) {
          return node.nodes.map((n: any) => n.textData?.text || '').join('')
        }
        return ''
      })
      .join('\n')
  }
  return ''
}

function shouldShowHospital(item: any): boolean {
  const showHospital = item?.ShowHospital ?? item?.data?.ShowHospital ?? item?.showHospital ?? item?.data?.showHospital
  if (showHospital === true || showHospital === 'true' || showHospital === 1 || showHospital === '1' || showHospital === 'yes') {
    return true
  }
  if (showHospital === false || showHospital === 'false' || showHospital === 0 || showHospital === '0' || showHospital === 'no') {
    return false
  }
  return false
}

function isStandaloneBranch(branch: any): boolean {
  const hospitalGroupRefs = [
    branch.HospitalMaster_branches,
    branch.data?.HospitalMaster_branches,
    branch.hospitalGroup,
    branch.data?.hospitalGroup,
    branch['Hospital Group Master'],
    branch.data?.['Hospital Group Master'],
  ]

  const hasHospitalGroupRef = hospitalGroupRefs.some((ref) => {
    if (!ref) return false
    if (typeof ref === 'string' && ref.trim() !== '') return true
    if (Array.isArray(ref) && ref.length > 0) return true
    if (typeof ref === 'object' && Object.keys(ref).length > 0) return true
    return false
  })

  const directHospitalRef = branch.hospital || branch.data?.hospital
  const hasDirectHospitalRef =
    (typeof directHospitalRef === 'string' && directHospitalRef.trim() !== '') ||
    (Array.isArray(directHospitalRef) && directHospitalRef.length > 0) ||
    (typeof directHospitalRef === 'object' && directHospitalRef !== null)

  return !hasHospitalGroupRef && !hasDirectHospitalRef
}

function extractMultiReference(field: any, ...nameKeys: string[]): any[] {
  if (!field) return []
  const items = Array.isArray(field) ? field : [field]

  return items
    .filter(Boolean)
    .map((ref: any) => {
      if (typeof ref === 'string') return { _id: ref, name: 'ID Reference' }
      if (typeof ref === 'object') {
        let name = 'Unknown'
        for (const key of nameKeys) {
          if (ref[key]) {
            name = ref[key]
            break
          }
        }
        const id = ref._id || ref.ID || ref.data?._id
        return id ? { _id: id, name, ...ref } : null
      }
      return null
    })
    .filter(Boolean)
}

function extractIds(refs: any[]): string[] {
  return refs.map((r) => (typeof r === 'string' ? r : r?._id || r?.ID)).filter(Boolean)
}

function extractHospitalIds(branch: any): string[] {
  const set = new Set<string>()
  const keys = ['hospital', 'HospitalMaster_branches', 'hospitalGroup', 'Hospital Group Master']

  keys.forEach((k) => {
    const val = branch[k] || branch.data?.[k]
    if (!val) return
    if (typeof val === 'string') set.add(val)
    else if (Array.isArray(val)) {
      val.forEach((i: any) => {
        const id = typeof i === 'string' ? i : i?._id || i?.ID
        if (id) set.add(id)
      })
    } else if (val?._id || val?.ID) {
      set.add(val._id || val.ID)
    }
  })

  return Array.from(set)
}

export function generateSlug(name: string | null | undefined): string {
  return (name ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// =============================================================================
// DATA MAPPERS
// =============================================================================

// =============================================================================
// STATE & CITY MAPPING
// =============================================================================

// Fallback city-to-state mapping for special cases (only used when CMS data is missing)
const CITY_TO_STATE_FALLBACK: Record<string, string> = {
  // Delhi NCR
  'delhi': 'Delhi NCR',
  'delhi ncr': 'Delhi NCR',
  'new delhi': 'Delhi NCR',
  'noida': 'Delhi NCR',
  'gurgaon': 'Delhi NCR',
  'gurugram': 'Delhi NCR',
  'faridabad': 'Delhi NCR',
  'ghaziabad': 'Delhi NCR',
  // Maharashtra
  'mumbai': 'Maharashtra',
  'pune': 'Maharashtra',
  'nagpur': 'Maharashtra',
  // Karnataka
  'bangalore': 'Karnataka',
  'bengaluru': 'Karnataka',
  'mysore': 'Karnataka',
  // Tamil Nadu
  'chennai': 'Tamil Nadu',
  'coimbatore': 'Tamil Nadu',
  // Telangana
  'hyderabad': 'Telangana',
  // Gujarat
  'ahmedabad': 'Gujarat',
  'surat': 'Gujarat',
  'vadodara': 'Gujarat',
  'rajkot': 'Gujarat',
  // West Bengal
  'kolkata': 'West Bengal',
  // Uttar Pradesh
  'lucknow': 'Uttar Pradesh',
  'kanpur': 'Uttar Pradesh',
  // Rajasthan
  'jaipur': 'Rajasthan',
  // Madhya Pradesh
  'bhopal': 'Madhya Pradesh',
  'indore': 'Madhya Pradesh',
}

// Enhanced mapCity function that resolves state from Wix CMS StateMaster
// Falls back to static mapping only when CMS data is unavailable
function mapCityWithStateRef(item: any, stateMap: Record<string, { _id: string; name: string }>): CityData {
  const cityName = getValue(item, 'cityName', 'city name', 'name', 'City Name') || 'Unknown City'
  
  // Try to get state from Wix CMS StateMaster reference
  let state = 'Unknown State'
  let stateId: string | undefined = undefined
  
  // Check for state reference in various Wix CMS field formats
  const stateRef = item.state || item.State || item.stateRef || item.state_master || item.stateMaster || item.StateMaster || item.StateMaster_state
  
  if (stateRef) {
    if (Array.isArray(stateRef)) {
      // Multi-reference array from Wix CMS
      const firstRef = stateRef[0]
      if (firstRef) {
        if (typeof firstRef === 'object') {
          // Array of state objects - get name from first item
          state = getValue(firstRef, 'state', 'State Name', 'name', 'title', 'State', 'stateName', 'StateName') || 'Unknown State'
          stateId = firstRef._id || firstRef.ID
        } else if (typeof firstRef === 'string') {
          // Array of IDs - lookup in stateMap
          stateId = firstRef
          const resolvedState = stateMap[firstRef]
          if (resolvedState) {
            state = resolvedState.name
          }
        }
      }
    } else if (typeof stateRef === 'object') {
      // Direct state object from Wix CMS - get name from state fields
      state = getValue(stateRef, 'state', 'State Name', 'name', 'title', 'State', 'stateName', 'StateName') || 'Unknown State'
      stateId = stateRef._id || stateRef.ID
    } else if (typeof stateRef === 'string') {
      // It's an ID reference - lookup in stateMap (fetched from StateMaster)
      stateId = stateRef
      const resolvedState = stateMap[stateRef]
      if (resolvedState) {
        state = resolvedState.name
      }
    }
  }
  
  // If still no state, try direct state field on city item
  if (state === 'Unknown State') {
    state = getValue(item, 'state', 'State Name', 'stateName') || 'Unknown State'
  }
  
  // Final fallback: use static city-to-state mapping for known cities
  if (state === 'Unknown State') {
    const normalizedCity = cityName.toLowerCase().trim()
    const fallbackState = CITY_TO_STATE_FALLBACK[normalizedCity]
    if (fallbackState) {
      state = fallbackState
    }
  }
  
  return {
    _id: item._id || item.ID,
    cityName,
    state,
    stateId,
    country: getValue(item, 'country', 'Country Name') || 'India',
  }
}

function mapCity(item: any): CityData {
  return {
    _id: item._id || item.ID,
    cityName: getValue(item, 'cityName', 'city name', 'name', 'City Name') || 'Unknown City',
    state: getValue(item, 'state', 'State Name', 'stateName') || 'Unknown State',
    country: getValue(item, 'country', 'Country Name') || 'India',
  }
}

function mapAccreditation(item: any): AccreditationData {
  return {
    _id: item._id || item.ID,
    title: getValue(item, 'title', 'Title') || 'Unknown Accreditation',
    image: item.image || item.data?.image || null,
  }
}

function mapDepartment(item: any): DepartmentData {
  return {
    _id: item._id || item.ID,
    name: getValue(item, 'department', 'Name', 'name') || 'Unknown Department',
  }
}

function mapSpecialistWithTreatments(item: any): any {
  const treatments = item.treatment || item.data?.treatment || []
  const treatmentArray = Array.isArray(treatments) ? treatments : [treatments].filter(Boolean)
  
  return {
    _id: item._id || item.ID,
    name: getValue(item, 'specialty', 'Specialty Name', 'title', 'name') || 'Unknown Specialist',
    treatments: treatmentArray.map((t: any) => ({
      _id: t._id || t.ID || t,
      name: getValue(t, 'treatmentName', 'Treatment Name', 'title', 'name') || 'Unknown Treatment',
      description: extractRichText(t.Description || t.description),
      cost: getValue(t, 'cost', 'Cost', 'averageCost'),
      treatmentImage: t.treatmentImage || t['treatment image'] || null,
    })),
  }
}

function mapTreatment(item: any): TreatmentData {
  return {
    _id: item._id || item.ID,
    name: getValue(item, 'treatmentName', 'Treatment Name', 'title', 'name') || 'Unknown Treatment',
    description: extractRichText(item.Description || item.description),
    category: getValue(item, 'category', 'Category'),
    duration: getValue(item, 'duration', 'Duration'),
    cost: getValue(item, 'cost', 'Cost', 'averageCost'),
    treatmentImage: item.treatmentImage || item['treatment image'] || null,
    popular: getValue(item, 'popular') === 'true',
  }
}

function mapDoctor(item: any): DoctorData {
  const aboutField = item.aboutDoctor || item.data?.aboutDoctor
  return {
    _id: item._id || item.ID,
    doctorName: getValue(item, 'doctorName', 'Doctor Name') || 'Unknown Doctor',
    specialization: extractMultiReference(item.Specialist, 'specialty', 'Specialty Name', 'title', 'name', 'Specialist'),
    qualification: getValue(item, 'qualification', 'Qualification'),
    experienceYears: getValue(item, 'experienceYears', 'Experience (Years)'),
    designation: getValue(item, 'designation', 'Designation'),
    aboutDoctor: extractRichText(aboutField),
    profileImage: item.profileImage || item['profile Image'] || null,
    popular: getValue(item, 'popular') === 'true',
  }
}

function mapBranch(item: any): BranchData {
  return {
    _id: item._id || item.ID,
    branchName: getValue(item, 'branchName', 'Branch Name') || 'Unknown Branch',
    address: getValue(item, 'address', 'Address'),
    city: extractMultiReference(item.city, 'cityName', 'city name', 'name'),
    specialty: extractMultiReference(item.specialty, 'specialization', 'Specialty Name', 'title', 'name'),
    accreditation: extractMultiReference(item.accreditation, 'title', 'Title'),
    description: extractRichText(item.description || item.data?.description),
    totalBeds: getValue(item, 'totalBeds', 'Total Beds'),
    noOfDoctors: getValue(item, 'noOfDoctors', 'No of Doctors'),
    yearEstablished: getValue(item, 'yearEstablished'),
    branchImage: item.branchImage || item['Branch Image'] || null,
    logo: item.logo || item.Logo || null,
    doctors: extractMultiReference(item.doctor, 'doctorName', 'Doctor Name'),
    specialists: extractMultiReference(item.specialist || item.specialists, 'specialty', 'Specialty Name', 'title', 'name'),
    treatments: extractMultiReference(item.treatment, 'treatmentName', 'Treatment Name', 'title', 'name'),
    specialization: [
      ...extractMultiReference(item.specialty, 'specialty', 'Specialty Name', 'title', 'name'),
      ...extractMultiReference(item.treatment, 'treatmentName', 'Treatment Name', 'title', 'name').map((t) => ({
        ...t,
        isTreatment: true,
      })),
    ],
    popular: getValue(item, 'popular') === 'true',
    isStandalone: isStandaloneBranch(item),
    showHospital: shouldShowHospital(item),
  }
}

function mapHospital(item: any, isFromBranch: boolean = false): HospitalData {
  if (isFromBranch) {
    return {
      _id: `standalone-${item._id || item.ID}`,
      hospitalName: getValue(item, 'branchName', 'hospitalName', 'Hospital Name') || 'Unknown Hospital',
      description: extractRichText(item.description || item.data?.description),
      specialty: extractMultiReference(item.specialty, 'specialty', 'Specialty Name', 'title', 'name'),
      yearEstablished: getValue(item, 'yearEstablished', 'Year Established'),
      hospitalImage: item.branchImage || item.hospitalImage || null,
      logo: item.logo || item.Logo || null,
      isStandalone: true,
      originalBranchId: item._id || item.ID,
      branches: [],
      doctors: [],
      specialists: [],
      treatments: [],
      accreditations: [],
      showHospital: shouldShowHospital(item),
    }
  }

  return {
    _id: item._id || item.ID,
    hospitalName: getValue(item, 'hospitalName', 'Hospital Name') || 'Unknown Hospital',
    description: extractRichText(item.description || item.data?.description),
    specialty: extractMultiReference(item.specialty, 'specialty', 'Specialty Name', 'title', 'name'),
    yearEstablished: getValue(item, 'yearEstablished', 'Year Established'),
    hospitalImage: item.hospitalImage || null,
    logo: item.logo || item.Logo || null,
    isStandalone: false,
    branches: [],
    doctors: [],
    specialists: [],
    treatments: [],
    accreditations: [],
    showHospital: true,
  }
}

// =============================================================================
// CORE DATA FETCHING
// =============================================================================

async function fetchAllBranches(): Promise<any[]> {
  const cacheKey = 'all_branches'
  const cached = memoryCache.get<any[]>(cacheKey)
  if (cached) return cached

  return memoryCache.dedupe(cacheKey, async () => {
    const res = await wixClient.items
      .query(COLLECTIONS.BRANCHES)
      .include(
        'hospital',
        'HospitalMaster_branches',
        'city',
        'doctor',
        'specialty',
        'accreditation',
        'treatment',
        'specialist',
        'specialists',
        'ShowHospital'
      )
      .limit(1000)
      .find()

    const branches = res.items.filter((b: any) => shouldShowHospital(b))
    memoryCache.set(cacheKey, branches, CACHE_CONFIG.HOSPITALS * 1000)
    return branches
  })
}

async function fetchAllHospitals(): Promise<any[]> {
  const cacheKey = 'all_hospitals'
  const cached = memoryCache.get<any[]>(cacheKey)
  if (cached) return cached

  return memoryCache.dedupe(cacheKey, async () => {
    const res = await wixClient.items
      .query(COLLECTIONS.HOSPITALS)
      .include('specialty', 'ShowHospital')
      .ascending('_createdDate') // CMS order: first created appears first
      .limit(1000)
      .find()

    memoryCache.set(cacheKey, res.items, CACHE_CONFIG.HOSPITALS * 1000)
    return res.items
  })
}

async function fetchAllTreatments(): Promise<any[]> {
  const cacheKey = 'all_treatments'
  const cached = memoryCache.get<any[]>(cacheKey)
  if (cached) return cached

  return memoryCache.dedupe(cacheKey, async () => {
    const res = await wixClient.items
      .query(COLLECTIONS.TREATMENTS)
      .include('branches', 'hospital', 'city', 'department')
      .limit(1000)
      .find()

    memoryCache.set(cacheKey, res.items, CACHE_CONFIG.TREATMENTS * 1000)
    return res.items
  })
}

async function fetchAllDoctors(): Promise<any[]> {
  const cacheKey = 'all_doctors'
  const cached = memoryCache.get<any[]>(cacheKey)
  if (cached) return cached

  return memoryCache.dedupe(cacheKey, async () => {
    const res = await wixClient.items
      .query(COLLECTIONS.DOCTORS)
      .limit(1000)
      .find()

    memoryCache.set(cacheKey, res.items, CACHE_CONFIG.HOSPITALS * 1000)
    return res.items
  })
}

async function fetchAllStates(): Promise<Record<string, { _id: string; name: string }>> {
  const cacheKey = 'all_states_map'
  const cached = memoryCache.get<Record<string, { _id: string; name: string }>>(cacheKey)
  if (cached) return cached

  return memoryCache.dedupe(cacheKey, async () => {
    // Fetch all states (no limit)
    const res = await wixClient.items
      .query(COLLECTIONS.STATES)
      .find()

    const stateMap: Record<string, { _id: string; name: string }> = {}
    res.items.forEach((item: any) => {
      const id = item._id || item.ID
      const name = getValue(item, 'state', 'State Name', 'name', 'title', 'stateName', 'StateName') || 'Unknown State'
      if (id) {
        stateMap[id] = { _id: id, name }
      }
    })

    memoryCache.set(cacheKey, stateMap, CACHE_CONFIG.HOSPITALS * 1000)
    return stateMap
  })
}

async function fetchAllCities(): Promise<any[]> {
  const cacheKey = 'all_cities'
  const cached = memoryCache.get<any[]>(cacheKey)
  if (cached) return cached

  return memoryCache.dedupe(cacheKey, async () => {
    // Fetch cities with state reference included (all cities, no limit)
    const res = await wixClient.items
      .query(COLLECTIONS.CITIES)
      .include('state', 'State', 'stateRef', 'stateMaster', 'state_master')
      .find()

    memoryCache.set(cacheKey, res.items, CACHE_CONFIG.CITIES * 1000)
    return res.items
  })
}

async function fetchAllSpecialists(): Promise<any[]> {
  const cacheKey = 'all_specialists'
  const cached = memoryCache.get<any[]>(cacheKey)
  if (cached) return cached

  return memoryCache.dedupe(cacheKey, async () => {
    const res = await wixClient.items
      .query(COLLECTIONS.SPECIALTIES)
      .include('treatment', 'department')
      .limit(1000)
      .find()

    memoryCache.set(cacheKey, res.items, CACHE_CONFIG.HOSPITALS * 1000)
    return res.items
  })
}

async function fetchSpecialistsWithTreatments(
  specialistIds: string[]
): Promise<Record<string, any>> {
  if (!specialistIds.length) return {}

  const sortedIds = [...specialistIds].sort()
  const cacheKey = `specialists_with_treatments_${sortedIds.slice(0, 10).join('_')}_${sortedIds.length}`
  const cached = memoryCache.get<Record<string, any>>(cacheKey)
  if (cached) return cached

  // Fetch specialists WITH treatment and department included
  const res = await wixClient.items
    .query(COLLECTIONS.SPECIALTIES)
    .hasSome('_id', sortedIds)
    .include('treatment', 'department')
    .limit(Math.min(sortedIds.length, 1000))
    .find()

  const result: Record<string, any> = {}
  res.items.forEach((item) => {
    result[item._id!] = mapSpecialistWithTreatments(item)
  })

  memoryCache.set(cacheKey, result, CACHE_CONFIG.HOSPITALS * 1000)
  return result
}

async function fetchByIds<T>(
  collection: string,
  ids: string[],
  mapper: (item: any) => T
): Promise<Record<string, T>> {
  if (!ids.length) return {}

  const sortedIds = [...ids].sort()
  const cacheKey = `${collection}_${sortedIds.slice(0, 10).join('_')}_${sortedIds.length}`
  const cached = memoryCache.get<Record<string, T>>(cacheKey)
  if (cached) return cached

  const res = await wixClient.items
    .query(collection)
    .hasSome('_id', sortedIds)
    .limit(Math.min(sortedIds.length, 1000))
    .find()

  const result = res.items.reduce((acc, item) => {
    acc[item._id!] = mapper(item)
    return acc
  }, {} as Record<string, T>)

  memoryCache.set(cacheKey, result, CACHE_CONFIG.HOSPITALS * 1000)
  return result
}

// =============================================================================
// ENRICHMENT FUNCTIONS
// =============================================================================

async function enrichBranchesWithRelatedData(
  branches: any[],
  options: { loadDoctors?: boolean; loadCities?: boolean; loadAccreditations?: boolean } = {}
): Promise<BranchData[]> {
  const { loadDoctors = true, loadCities = true, loadAccreditations = true } = options

  const doctorIds = new Set<string>()
  const cityIds = new Set<string>()
  const accreditationIds = new Set<string>()

  const mappedBranches = branches.map((b) => {
    const mapped = mapBranch(b)
    if (loadDoctors) extractIds(mapped.doctors).forEach((id) => doctorIds.add(id))
    if (loadCities) extractIds(mapped.city).forEach((id) => cityIds.add(id))
    if (loadAccreditations) extractIds(mapped.accreditation).forEach((id) => accreditationIds.add(id))
    return mapped
  })

  // Fetch states for proper city-state mapping
  const stateMap = loadCities ? await fetchAllStates() : {}

  const [doctors, cities, accreditations] = await Promise.all([
    loadDoctors ? fetchByIds(COLLECTIONS.DOCTORS, Array.from(doctorIds), mapDoctor) : {} as Record<string, DoctorData>,
    loadCities ? fetchByIds(COLLECTIONS.CITIES, Array.from(cityIds), (item) => mapCityWithStateRef(item, stateMap)) : {} as Record<string, CityData>,
    loadAccreditations ? fetchByIds(COLLECTIONS.ACCREDITATIONS, Array.from(accreditationIds), mapAccreditation) : {} as Record<string, AccreditationData>,
  ])

  return mappedBranches.map((branch) => ({
    ...branch,
    doctors: branch.doctors.map((d: any) => (doctors as Record<string, DoctorData>)[d._id] || d),
    city: branch.city.map((c: any) => {
      // Try to get enriched city from cache first
      const enrichedCity = (cities as Record<string, CityData>)[c._id]
      if (enrichedCity && enrichedCity.state && enrichedCity.state !== 'Unknown State') {
        return enrichedCity
      }
      // Apply fallback: use city data with CITY_TO_STATE_FALLBACK mapping
      const cityName = c.name || c.cityName || 'Unknown City'
      const normalizedCity = cityName.toLowerCase().trim()
      const fallbackState = CITY_TO_STATE_FALLBACK[normalizedCity] || 'Unknown State'
      return {
        _id: c._id,
        cityName,
        state: fallbackState,
        country: 'India',
      }
    }),
    accreditation: branch.accreditation.map((a: any) => (accreditations as Record<string, AccreditationData>)[a._id] || a),
  }))
}

// =============================================================================
// MAIN DATA SERVICE
// =============================================================================

/**
 * Fetches all CMS data in a single optimized call
 * This is the primary entry point for data fetching
 */
export async function getAllCMSData(): Promise<CMSDataResponse> {
  const cacheKey = 'cms_all_data'
  const cached = memoryCache.get<CMSDataResponse>(cacheKey)
  if (cached) return cached

  return memoryCache.dedupe(cacheKey, async () => {
    // Fetch all base data in parallel
    const [rawHospitals, rawBranches, rawTreatments, rawCities, rawSpecialists, rawDoctors] = await Promise.all([
      fetchAllHospitals(),
      fetchAllBranches(),
      fetchAllTreatments(),
      fetchAllCities(),
      fetchAllSpecialists(),
      fetchAllDoctors(),
    ])

    // Fetch all states for proper city-state mapping
    const stateMap = await fetchAllStates()

    // Build cities map with proper state resolution
    const citiesMap = new Map<string, CityData>()
    rawCities.forEach((city: any) => {
      if (city._id) {
        citiesMap.set(city._id, mapCityWithStateRef(city, stateMap))
      }
    })

    // Build specialist → treatment mapping
    // This is the key chain: Specialist → Department → Treatment
    const specialistTreatmentMap = new Map<string, Set<string>>()
    const specialistDepartmentMap = new Map<string, Set<string>>()
    const treatmentNameToId = new Map<string, string>()

    // Fallback specialty-to-treatment name mapping (common variations)
    const SPECIALTY_TREATMENT_ALIASES: Record<string, string[]> = {
      'ophthalmology': ['cataract', 'lasik', 'retina', 'cornea', 'glaucoma', 'eye surgery', 'eye treatment'],
      'cardiology': ['heart', 'cardiac', 'bypass', 'angioplasty', 'heart surgery'],
      'orthopedics': ['bone', 'joint', 'knee', 'hip', 'spine', 'orthopedic', 'fracture'],
      'neurology': ['brain', 'neural', 'spine surgery', 'neuro'],
      'oncology': ['cancer', 'tumor', 'chemotherapy', 'radiation therapy'],
      'gastroenterology': ['stomach', 'digestive', 'liver', 'gastro', 'intestine'],
      'dermatology': ['skin', 'hair', 'cosmetic dermatology'],
      'urology': ['urinary', 'kidney', 'bladder'],
      'ent': ['ear', 'nose', 'throat', 'sinus'],
      'pediatrics': ['child', 'children', 'pediatric'],
      'gynecology': ['pregnancy', 'maternity', 'women health', 'obstetrics'],
      'psychiatry': ['mental', 'psychological', 'depression', 'anxiety'],
      'dentistry': ['dental', 'tooth', 'teeth', 'cavity'],
      'plastic surgery': ['cosmetic', 'reconstructive', 'aesthetic'],
    }

    // First, build treatment name-to-ID map from TreatmentMaster
    rawTreatments.forEach((item: any) => {
      const id = item._id || item.ID
      const name = getValue(item, 'treatmentName', 'Treatment Name', 'title', 'name')
      if (id && name) {
        treatmentNameToId.set(name.toLowerCase(), id)
      }
    })

    // Build specialist mappings
    rawSpecialists.forEach((spec: any) => {
      const specId = spec._id || spec.ID
      if (!specId) return

      // Get specialist name for alias matching
      const specName = (spec.name || spec.specialty || spec.title || '').toLowerCase()

      // Get treatments from specialist
      const treatments = spec.treatment || spec.data?.treatment || []
      const treatmentArray = Array.isArray(treatments) ? treatments : [treatments].filter(Boolean)
      const treatmentIds = new Set<string>()
      treatmentArray.forEach((t: any) => {
        const tid = t?._id || t?.ID || t
        if (tid) treatmentIds.add(tid)
        // Also add by name match
        const tname = t?.treatmentName || t?.name || t?.title
        if (tname) {
          const masterId = treatmentNameToId.get(tname.toLowerCase())
          if (masterId) treatmentIds.add(masterId)
        }
      })

      // Use alias mapping to find additional treatments for this specialty
      const aliases = SPECIALTY_TREATMENT_ALIASES[specName] || []
      aliases.forEach((alias: string) => {
        const treatmentId = treatmentNameToId.get(alias.toLowerCase())
        if (treatmentId) {
          treatmentIds.add(treatmentId)
        }
      })

      specialistTreatmentMap.set(specId, treatmentIds)

      // Get departments from specialist
      const departments = spec.department || spec.data?.department || []
      const deptArray = Array.isArray(departments) ? departments : [departments].filter(Boolean)
      const deptIds = new Set<string>()
      deptArray.forEach((d: any) => {
        const did = d?._id || d?.ID || d
        if (did) deptIds.add(did)
      })
      specialistDepartmentMap.set(specId, deptIds)
    })

    // Separate standalone and grouped branches
    const standaloneBranches: any[] = []
    const groupedBranches: any[] = []
    const branchesByHospital = new Map<string, any[]>()

    rawBranches.forEach((branch: any) => {
      if (isStandaloneBranch(branch)) {
        standaloneBranches.push(branch)
      } else {
        groupedBranches.push(branch)
        const hospitalIds = extractHospitalIds(branch)
        hospitalIds.forEach((hid) => {
          if (!branchesByHospital.has(hid)) {
            branchesByHospital.set(hid, [])
          }
          branchesByHospital.get(hid)!.push(branch)
        })
      }
    })

    // Collect all IDs for batch fetching
    const allDoctorIds = new Set<string>()
    const allAccreditationIds = new Set<string>()
    const allTreatmentIds = new Set<string>()
    const allSpecialistIds = new Set<string>()

    rawBranches.forEach((branch: any) => {
      const mapped = mapBranch(branch)
      extractIds(mapped.doctors).forEach((id) => allDoctorIds.add(id))
      extractIds(mapped.accreditation).forEach((id) => allAccreditationIds.add(id))
      extractIds(mapped.treatments).forEach((id) => allTreatmentIds.add(id))
      extractIds(mapped.specialists).forEach((id) => allSpecialistIds.add(id))
    })

    // Batch fetch related data - specialists need treatment/department included
    const [doctorsMap, accreditationsMap, treatmentsMap, specialistsMap] = await Promise.all([
      fetchByIds(COLLECTIONS.DOCTORS, Array.from(allDoctorIds), mapDoctor),
      fetchByIds(COLLECTIONS.ACCREDITATIONS, Array.from(allAccreditationIds), mapAccreditation),
      fetchByIds(COLLECTIONS.TREATMENTS, Array.from(allTreatmentIds), mapTreatment),
      fetchSpecialistsWithTreatments(Array.from(allSpecialistIds)),
    ])

    // Build hospitals with enriched branches
    const hospitals: HospitalData[] = []

    // Process regular hospitals
    rawHospitals.forEach((rawHospital: any) => {
      const hospital = mapHospital(rawHospital)
      const hospitalBranches = branchesByHospital.get(hospital._id) || []

      const enrichedBranches = hospitalBranches.map((b: any) => {
        const mapped = mapBranch(b)
        return {
          ...mapped,
          doctors: mapped.doctors.map((d: any) => doctorsMap[d._id] || d),
          specialists: mapped.specialists.map((s: any) => specialistsMap[s._id] || s),
          city: mapped.city.map((c: any) => {
            const enrichedCity = citiesMap.get(c._id)
            if (enrichedCity && enrichedCity.state && enrichedCity.state !== 'Unknown State') {
              return enrichedCity
            }
            // Apply fallback: use city data with CITY_TO_STATE_FALLBACK mapping
            const cityName = c.name || c.cityName || 'Unknown City'
            const normalizedCity = cityName.toLowerCase().trim()
            const fallbackState = CITY_TO_STATE_FALLBACK[normalizedCity] || 'Unknown State'
            return {
              _id: c._id,
              cityName,
              state: fallbackState,
              country: 'India',
            }
          }),
          accreditation: mapped.accreditation.map((a: any) => accreditationsMap[a._id] || a),
          treatments: mapped.treatments.map((t: any) => treatmentsMap[t._id] || t),
        }
      })

      // Collect unique items from branches
      const uniqueDoctors = new Map<string, DoctorData>()
      const uniqueTreatments = new Map<string, TreatmentData>()
      const uniqueAccreditations = new Map<string, AccreditationData>()

      enrichedBranches.forEach((branch) => {
        branch.doctors.forEach((d: DoctorData) => d._id && uniqueDoctors.set(d._id, d))
        branch.treatments.forEach((t: TreatmentData) => t._id && uniqueTreatments.set(t._id, t))
        branch.accreditation.forEach((a: AccreditationData) => a._id && uniqueAccreditations.set(a._id, a))
      })

      hospitals.push({
        ...hospital,
        branches: enrichedBranches,
        doctors: Array.from(uniqueDoctors.values()),
        treatments: Array.from(uniqueTreatments.values()),
        accreditations: Array.from(uniqueAccreditations.values()),
      })
    })

    // Process standalone branches as hospitals
    standaloneBranches.forEach((branch: any) => {
      const mapped = mapBranch(branch)
      const enrichedBranch = {
        ...mapped,
        doctors: mapped.doctors.map((d: any) => doctorsMap[d._id] || d),
        specialists: mapped.specialists.map((s: any) => specialistsMap[s._id] || s),
        city: mapped.city.map((c: any) => {
          const enrichedCity = citiesMap.get(c._id)
          if (enrichedCity && enrichedCity.state && enrichedCity.state !== 'Unknown State') {
            return enrichedCity
          }
          // Apply fallback: use city data with CITY_TO_STATE_FALLBACK mapping
          const cityName = c.name || c.cityName || 'Unknown City'
          const normalizedCity = cityName.toLowerCase().trim()
          const fallbackState = CITY_TO_STATE_FALLBACK[normalizedCity] || 'Unknown State'
          return {
            _id: c._id,
            cityName,
            state: fallbackState,
            country: 'India',
          }
        }),
        accreditation: mapped.accreditation.map((a: any) => accreditationsMap[a._id] || a),
        treatments: mapped.treatments.map((t: any) => treatmentsMap[t._id] || t),
      }

      const hospital = mapHospital(branch, true)
      hospitals.push({
        ...hospital,
        branches: [enrichedBranch],
        doctors: enrichedBranch.doctors,
        treatments: enrichedBranch.treatments,
        accreditations: enrichedBranch.accreditation,
      })
    })

    // Build extended treatments with branch availability
    // Create a comprehensive mapping using both treatment IDs and names
    const treatmentBranchMap = new Map<string, Map<string, TreatmentLocation>>()

    // Then map branches to treatments (using treatmentNameToId from above)
    hospitals.forEach((hospital) => {
      hospital.branches.forEach((branch) => {
        // Map treatments by ID
        branch.treatments.forEach((treatment: TreatmentData) => {
          if (!treatmentBranchMap.has(treatment._id)) {
            treatmentBranchMap.set(treatment._id, new Map())
          }
          const branchMap = treatmentBranchMap.get(treatment._id)!
          if (!branchMap.has(branch._id)) {
            branchMap.set(branch._id, {
              branchId: branch._id,
              branchName: branch.branchName,
              hospitalName: hospital.hospitalName,
              hospitalId: hospital._id,
              cities: branch.city,
              departments: [],
              cost: treatment.cost,
            })
          }

          // Also map by treatment name to TreatmentMaster ID
          if (treatment.name) {
            const masterId = treatmentNameToId.get(treatment.name.toLowerCase())
            if (masterId && masterId !== treatment._id) {
              if (!treatmentBranchMap.has(masterId)) {
                treatmentBranchMap.set(masterId, new Map())
              }
              const masterBranchMap = treatmentBranchMap.get(masterId)!
              if (!masterBranchMap.has(branch._id)) {
                masterBranchMap.set(branch._id, {
                  branchId: branch._id,
                  branchName: branch.branchName,
                  hospitalName: hospital.hospitalName,
                  hospitalId: hospital._id,
                  cities: branch.city,
                  departments: [],
                  cost: treatment.cost,
                })
              }
            }
          }
        })

        // Also check specialization treatments
        branch.specialization?.forEach((spec: any) => {
          if (spec.isTreatment && spec.name) {
            const masterId = treatmentNameToId.get(spec.name.toLowerCase())
            if (masterId) {
              if (!treatmentBranchMap.has(masterId)) {
                treatmentBranchMap.set(masterId, new Map())
              }
              const branchMap = treatmentBranchMap.get(masterId)!
              if (!branchMap.has(branch._id)) {
                branchMap.set(branch._id, {
                  branchId: branch._id,
                  branchName: branch.branchName,
                  hospitalName: hospital.hospitalName,
                  hospitalId: hospital._id,
                  cities: branch.city,
                  departments: [],
                  cost: null,
                })
              }
            }
          }
        })
      })
    })

    // Also map treatments from specialists at each branch
    // This handles the chain: Branch → Specialist → Treatment
    const allSpecialistTreatments = new Map<string, { treatment: any; branches: Map<string, any> }>()
    
    hospitals.forEach((hospital) => {
      hospital.branches.forEach((branch) => {
        // Get specialist IDs from branch
        const branchSpecialistIds = extractIds(branch.specialists || [])
        
        branchSpecialistIds.forEach((specId) => {
          // Get treatments linked to this specialist
          const specTreatmentIds = specialistTreatmentMap.get(specId)
          if (specTreatmentIds) {
            specTreatmentIds.forEach((treatmentId) => {
              if (!allSpecialistTreatments.has(treatmentId)) {
                allSpecialistTreatments.set(treatmentId, { treatment: null, branches: new Map() })
              }
              const entry = allSpecialistTreatments.get(treatmentId)!
              if (!entry.branches.has(branch._id)) {
                // Find treatment data from treatmentsMap
                const treatmentData = treatmentsMap[treatmentId]
                entry.branches.set(branch._id, {
                  branchId: branch._id,
                  branchName: branch.branchName,
                  hospitalName: hospital.hospitalName,
                  hospitalId: hospital._id,
                  cities: branch.city,
                  departments: [],
                  cost: treatmentData?.cost || null,
                })
              }
              // Also add to treatmentBranchMap for direct lookup
              if (!treatmentBranchMap.has(treatmentId)) {
                treatmentBranchMap.set(treatmentId, new Map())
              }
              if (!treatmentBranchMap.get(treatmentId)!.has(branch._id)) {
                const treatmentData = treatmentsMap[treatmentId]
                treatmentBranchMap.get(treatmentId)!.set(branch._id, {
                  branchId: branch._id,
                  branchName: branch.branchName,
                  hospitalName: hospital.hospitalName,
                  hospitalId: hospital._id,
                  cities: branch.city,
                  departments: [],
                  cost: treatmentData?.cost || null,
                })
              }
            })
          }
        })
        
        // Also map treatments directly from enriched specialists (with treatments array)
        branch.specialists?.forEach((specialist: any) => {
          if (specialist.treatments && Array.isArray(specialist.treatments)) {
            specialist.treatments.forEach((treatment: any) => {
              if (!treatment || !(treatment._id || treatment.name)) return
              
              const treatmentId = treatment._id || treatment.name
              if (!allSpecialistTreatments.has(treatmentId)) {
                allSpecialistTreatments.set(treatmentId, { treatment, branches: new Map() })
              }
              const entry = allSpecialistTreatments.get(treatmentId)!
              // Update treatment data if not already set
              if (!entry.treatment) {
                entry.treatment = treatment
              }
              if (!entry.branches.has(branch._id)) {
                entry.branches.set(branch._id, {
                  branchId: branch._id,
                  branchName: branch.branchName,
                  hospitalName: hospital.hospitalName,
                  hospitalId: hospital._id,
                  cities: branch.city,
                  departments: [],
                  cost: treatment.cost || treatment.averageCost || null,
                })
              }
              // Also add to treatmentBranchMap for direct lookup
              if (!treatmentBranchMap.has(treatmentId)) {
                treatmentBranchMap.set(treatmentId, new Map())
              }
              if (!treatmentBranchMap.get(treatmentId)!.has(branch._id)) {
                treatmentBranchMap.get(treatmentId)!.set(branch._id, {
                  branchId: branch._id,
                  branchName: branch.branchName,
                  hospitalName: hospital.hospitalName,
                  hospitalId: hospital._id,
                  cities: branch.city,
                  departments: [],
                  cost: treatment.cost || treatment.averageCost || null,
                })
              }
            })
          }
        })
      })
    })

    // Build extended treatments from rawTreatments
    const treatments: ExtendedTreatmentData[] = rawTreatments.map((item: any) => {
      const treatment = mapTreatment(item)
      
      // Try to find branches by ID first
      let branchesMap = treatmentBranchMap.get(treatment._id)
      
      // If not found by ID, try by treatment name
      if (!branchesMap && treatment.name) {
        const treatmentNameSlug = generateSlug(treatment.name)
        
        // Search through all treatmentBranchMap entries to find matching name
        for (const [key, value] of treatmentBranchMap.entries()) {
          // Check if the key matches the treatment name
          if (key === treatmentNameSlug || key === treatment.name?.toLowerCase()) {
            branchesMap = value
            break
          }
        }
      }
      
      return {
        ...treatment,
        branchesAvailableAt: branchesMap ? Array.from(branchesMap.values()) : [],
        departments: [],
      }
    })

    // Add treatments from specialists that are not in rawTreatments
    const existingTreatmentIds = new Set(treatments.map(t => t._id))
    allSpecialistTreatments.forEach((entry, treatmentId) => {
      if (!existingTreatmentIds.has(treatmentId) && entry.treatment) {
        const specTreatment = entry.treatment
        const extendedTreatment: ExtendedTreatmentData = {
          _id: specTreatment._id || treatmentId,
          name: getValue(specTreatment, 'treatmentName', 'Treatment Name', 'title', 'name') || 'Unknown Treatment',
          description: extractRichText(specTreatment.Description || specTreatment.description),
          category: getValue(specTreatment, 'category', 'Category'),
          duration: getValue(specTreatment, 'duration', 'Duration'),
          cost: getValue(specTreatment, 'cost', 'Cost', 'averageCost'),
          treatmentImage: specTreatment.treatmentImage || specTreatment.image || null,
          popular: getValue(specTreatment, 'popular') === 'true',
          branchesAvailableAt: Array.from(entry.branches.values()),
          departments: [],
        }
        treatments.push(extendedTreatment)
      }
    })

    const response: CMSDataResponse = {
      hospitals,
      treatments,
      doctors: rawDoctors.map(mapDoctor),
      totalHospitals: hospitals.length,
      totalTreatments: treatments.length,
      totalDoctors: rawDoctors.length,
      lastUpdated: new Date().toISOString(),
    }

    // Log data summary for debugging
    console.log('[CMS Data] Final data summary:', {
      totalHospitals: hospitals.length,
      totalTreatments: treatments.length,
      hospitalsWithBranches: hospitals.filter(h => (h.branches?.length || 0) > 0).length,
      hospitalsWithTreatments: hospitals.filter(h => (h.treatments?.length || 0) > 0).length,
      treatmentSample: treatments.slice(0, 3).map(t => ({ name: t.name, branchesCount: t.branchesAvailableAt?.length || 0 }))
    })
    
    memoryCache.set(cacheKey, response, CACHE_CONFIG.HOSPITALS * 1000)
    return response
  })
}

/**
 * Get hospital by slug with similar hospitals
 * Supports matching by hospital name slug OR branch name slug
 */
export async function getHospitalBySlug(slug: string): Promise<HospitalDetailResponse> {
  const { hospitals } = await getAllCMSData()

  // Normalize slug: lowercase, trim, remove trailing dashes, normalize multiple dashes
  const normalizedSlug = slug.toLowerCase().trim().replace(/[-_]+/g, '-')
  
  // First try to find by hospital slug
  let hospital = hospitals.find((h) => {
    const hospitalSlug = generateSlug(h.hospitalName)
    return hospitalSlug === normalizedSlug || 
           hospitalSlug === slug || // Also try original case
           h._id === slug ||
           h._id === normalizedSlug ||
           hospitalSlug + '-' === normalizedSlug || // Handle trailing dash
           normalizedSlug.startsWith(hospitalSlug + '-') || // Handle hospital-city slug
           hospitalSlug + '-' === slug ||
           slug.startsWith(hospitalSlug + '-') // Handle hospital-city slug with original case
  })

  // If not found, try to find by branch slug
  if (!hospital) {
    for (const h of hospitals) {
      const matchingBranch = h.branches.find((b) => {
        const branchSlug = generateSlug(b.branchName)
        return branchSlug === normalizedSlug ||
               branchSlug === slug || // Also try original case
               branchSlug + '-' === normalizedSlug ||
               slug.startsWith(branchSlug + '-') ||
               slug.startsWith(branchSlug + '-') ||
               (h.hospitalName && (generateSlug(h.hospitalName) + '-' + branchSlug === normalizedSlug)) ||
               (h.hospitalName && (generateSlug(h.hospitalName) + '-' + branchSlug === slug))
      })
      
      if (matchingBranch) {
        // Return the hospital but with only the matching branch
        hospital = {
          ...h,
          branches: [matchingBranch]
        }
        break
      }
    }
  }

  if (!hospital) {
    return { hospital: null, similarHospitals: [], error: 'Hospital not found' }
  }

  // Find similar hospitals (same city, same state, or matching accreditations)
  const hospitalCities = new Set<string>()
  const hospitalStates = new Set<string>()
  hospital.branches.forEach((branch) => {
    branch.city?.forEach((c) => {
      if (c.cityName) hospitalCities.add(c.cityName.toLowerCase())
      if (c.state) hospitalStates.add(c.state.toLowerCase())
    })
  })
  const hospitalAccreditations = new Set(hospital.accreditations.map((a) => a.title?.toLowerCase()).filter(Boolean))

  const similarHospitals = hospitals
    .filter((h) => {
      if (h._id === hospital._id) return false
      
      // Collect cities and states for this hospital
      const hCities = new Set<string>()
      const hStates = new Set<string>()
      h.branches.forEach((branch) => {
        branch.city?.forEach((c) => {
          if (c.cityName) hCities.add(c.cityName.toLowerCase())
          if (c.state) hStates.add(c.state.toLowerCase())
        })
      })
      
      // Match if: same city OR same state OR matching accreditation
      const hasMatchingCity = [...hospitalCities].some((city) => hCities.has(city))
      const hasMatchingState = [...hospitalStates].some((state) => hStates.has(state))
      const hasMatchingAccreditation = h.accreditations.some((a) => 
        a.title && hospitalAccreditations.has(a.title.toLowerCase())
      )
      
      return hasMatchingCity || hasMatchingState || hasMatchingAccreditation
    })

  return { hospital, similarHospitals }
}

/**
 * Get treatment by slug with branch availability
 * Supports matching by treatment name slug
 */
export async function getTreatmentBySlug(slug: string): Promise<ExtendedTreatmentData | null> {
  const { treatments, hospitals } = await getAllCMSData()

  // Normalize slug: lowercase, trim, remove trailing dashes, normalize multiple dashes
  const normalizedSlug = slug.toLowerCase().trim().replace(/[-_]+/g, '-')

  // Find treatment by slug
  let treatment = treatments.find((t) => {
    const treatmentSlug = generateSlug(t.name)
    return treatmentSlug === normalizedSlug ||
           treatmentSlug === slug || // Also try original case
           t._id === slug ||
           t._id === normalizedSlug
  })

  // If not found by direct match, try fuzzy matching
  if (!treatment) {
    // Try partial match (for slugs like "treatment-name-delhi")
    treatment = treatments.find((t) => {
      const treatmentSlug = generateSlug(t.name)
      return normalizedSlug.includes(treatmentSlug) ||
             slug.includes(treatmentSlug)
    })
  }

  if (!treatment) {
    return null
  }

  // Find all branches offering this treatment
  const branchesOfferingTreatment: Map<string, any> = new Map()

  hospitals.forEach((hospital) => {
    hospital.branches.forEach((branch) => {
      // Check treatments directly on branch
      const branchTreatments = [...(branch.treatments || [])]
      
      // Check treatments from specialists
      branch.specialists?.forEach((specialist) => {
        specialist.treatments?.forEach((specTreatment) => {
          if (specTreatment._id === treatment?._id) {
            const branchKey = `${hospital._id}-${branch._id}`
            if (!branchesOfferingTreatment.has(branchKey)) {
              branchesOfferingTreatment.set(branchKey, {
                ...branch,
                hospitalName: hospital.hospitalName,
                hospitalId: hospital._id,
                hospitalLogo: hospital.logo,
              })
            }
          }
        })
      })

      // Check treatments directly on branch
      branchTreatments.forEach((branchTreatment) => {
        if (branchTreatment._id === treatment?._id) {
          const branchKey = `${hospital._id}-${branch._id}`
          if (!branchesOfferingTreatment.has(branchKey)) {
            branchesOfferingTreatment.set(branchKey, {
              ...branch,
              hospitalName: hospital.hospitalName,
              hospitalId: hospital._id,
              hospitalLogo: hospital.logo,
            })
          }
        }
      })
    })
  })

  // Build treatment location data
  const branchesAvailableAt = Array.from(branchesOfferingTreatment.values()).map((branch) => ({
    branchId: branch._id,
    branchName: branch.branchName,
    hospitalName: branch.hospitalName,
    hospitalId: branch.hospitalId,
    cities: branch.city || [],
    departments: [],
    cost: treatment.cost || null,
  }))

  return {
    ...treatment,
    branchesAvailableAt,
  }
}

/**
 * Search hospitals by query
 * Fixed: Added debug logging for treatment verification
 */
export async function searchHospitals(query: string): Promise<HospitalData[]> {
  console.log(`[DEBUG] searchHospitals: Starting with query="${query}"`)
  
  const { hospitals } = await getAllCMSData()
  console.log(`[DEBUG] searchHospitals: Retrieved ${hospitals.length} hospitals from cache`)
  
  // Debug: Log treatment counts per hospital
  hospitals.forEach((h, idx) => {
    const treatmentCount = h.treatments?.length || 0
    const branchCount = h.branches?.length || 0
    console.log(`[DEBUG] searchHospitals: Hospital ${idx+1}: "${h.hospitalName}" - ${branchCount} branches, ${treatmentCount} treatments`)
    
    // Debug: Log first few treatments
    if (treatmentCount > 0) {
      const treatmentNames = h.treatments.slice(0, 5).map((t: any) => t.name).join(', ')
      console.log(`[DEBUG] searchHospitals:   Treatments: ${treatmentNames}${treatmentCount > 5 ? '...' : ''}`)
    }
  })
  
  const normalizedQuery = query.toLowerCase().trim()
  
  if (!normalizedQuery) {
    console.log(`[DEBUG] searchHospitals: No query, returning all ${hospitals.length} hospitals`)
    return hospitals
  }
  
  const filtered = hospitals.filter((h) => {
    const nameMatch = h.hospitalName.toLowerCase().includes(normalizedQuery)
    const cityMatch = h.branches.some((b) => b.city.some((c) => c.cityName.toLowerCase().includes(normalizedQuery)))
    const treatmentMatch = h.treatments.some((t) => t.name.toLowerCase().includes(normalizedQuery))
    
    if (nameMatch || cityMatch || treatmentMatch) {
      console.log(`[DEBUG] searchHospitals: Matched "${h.hospitalName}" - name:${nameMatch}, city:${cityMatch}, treatment:${treatmentMatch}`)
    }
    
    return nameMatch || cityMatch || treatmentMatch
  })
  
  console.log(`[DEBUG] searchHospitals: Query "${query}" matched ${filtered.length} hospitals`)
  
  return filtered
}

// Export cached version for server components
export const getCachedCMSData = createCachedFetcher(getAllCMSData, ['cms-all-data'], {
  revalidate: CACHE_CONFIG.HOSPITALS,
  tags: [CACHE_TAGS.ALL_DATA],
})

/**
 * Get a single doctor by slug directly from Wix CMS
 * This is more efficient than fetching all data and searching
 */
export async function getDoctorBySlug(slug: string): Promise<DoctorData | null> {
  try {
    const normalizedSlug = slug.toLowerCase().trim().replace(/[-_]+/g, '-')
    
    // Query the DoctorMaster collection - fetch all to find by slug
    const res = await wixClient.items
      .query(COLLECTIONS.DOCTORS)
      .limit(1000)
      .find()
    
    if (!res.items || res.items.length === 0) {
      console.warn('[getDoctorBySlug] No doctors found in CMS')
      return null
    }
    
    // Find doctor by matching slug (generated from doctorName)
    const foundDoctor = res.items.find((item: any) => {
      const doctorName = item.doctorName || item.DoctorName || item.name || ''
      const generatedSlug = generateSlug(doctorName)
      const normalizedGeneratedSlug = generatedSlug.toLowerCase().trim().replace(/[-_]+/g, '-')
      
      return normalizedGeneratedSlug === normalizedSlug || 
             generatedSlug === slug
    })
    
    if (!foundDoctor) {
      console.warn('[getDoctorBySlug] Doctor not found for slug:', slug)
      return null
    }
    
    // Map the doctor data to our type
    return mapDoctorData(foundDoctor)
  } catch (error) {
    console.error('[getDoctorBySlug] Error fetching doctor:', error)
    return null
  }
}

/**
 * Map raw Wix doctor data to our DoctorData type
 */
function mapDoctorData(item: any): DoctorData {
  return {
    _id: item._id || item.ID || '',
    doctorName: item.doctorName || item.DoctorName || item.name || '',
    specialization: extractMultiReference(item.Specialist, 'specialty', 'Specialty Name', 'title', 'name', 'Specialist'),
    qualification: item.qualification || item.Qualification || null,
    experienceYears: item.experienceYears?.toString() || item.ExperienceYears?.toString() || null,
    designation: item.designation || item.Designation || null,
    aboutDoctor: item.aboutDoctor || item.AboutDoctor || null,
    aboutDoctorHtml: item.aboutDoctorHtml || item.AboutDoctorHtml || null,
    profileImage: item.profileImage || item.ProfileImage || item.photo || item.Photo || null,
    popular: item.popular || item.Popular || false,
  }
}
