// lib/cms/data-service.ts
// Centralized CMS data fetching service with unified, clean data linking
// FIXED: Simplified treatment-to-branch mapping with comprehensive debug logs

import { wixClient } from '@/lib/wixClient'
import { memoryCache, CACHE_CONFIG, createCachedFetcher } from './cache'
import type {
  HospitalData,
  BranchData,
  DoctorData,
  TreatmentData,
  CityData,
  AccreditationData,
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
      if (typeof value === 'string') return value
      if (typeof value === 'object') {
        return value.name || value.title || value.state || value.State || 
               value.stateName || value.stateName || value['State Name'] || null
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
  const showHospital = item?.ShowHospital ?? item?.data?.ShowHospital ?? 
                       item?.showHospital ?? item?.data?.showHospital
  if (showHospital === true || showHospital === 'true' || showHospital === 1 || 
      showHospital === '1' || showHospital === 'yes') return true
  if (showHospital === false || showHospital === 'false' || showHospital === 0 || 
      showHospital === '0' || showHospital === 'no') return false
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
          if (ref[key]) { name = ref[key]; break }
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
// CITY-STATE FALLBACK MAPPING
// =============================================================================

const CITY_TO_STATE_FALLBACK: Record<string, string> = {
  'delhi': 'Delhi NCR', 'delhi ncr': 'Delhi NCR', 'new delhi': 'Delhi NCR',
  'noida': 'Delhi NCR', 'gurgaon': 'Delhi NCR', 'gurugram': 'Delhi NCR',
  'faridabad': 'Delhi NCR', 'ghaziabad': 'Delhi NCR',
  'mumbai': 'Maharashtra', 'pune': 'Maharashtra', 'nagpur': 'Maharashtra',
  'bangalore': 'Karnataka', 'bengaluru': 'Karnataka', 'mysore': 'Karnataka',
  'chennai': 'Tamil Nadu', 'coimbatore': 'Tamil Nadu',
  'hyderabad': 'Telangana', 'ahmedabad': 'Gujarat', 'surat': 'Gujarat',
  'kolkata': 'West Bengal', 'lucknow': 'Uttar Pradesh', 'kanpur': 'Uttar Pradesh',
  'jaipur': 'Rajasthan', 'bhopal': 'Madhya Pradesh', 'indore': 'Madhya Pradesh',
}

function mapCityWithStateRef(item: any, stateMap: Record<string, { _id: string; name: string }>): CityData {
  const cityName = getValue(item, 'cityName', 'city name', 'name', 'City Name') || 'Unknown City'
  let state = 'Unknown State'
  let stateId: string | undefined = undefined
  
  const stateRef = item.state || item.State || item.stateRef || 
                   item.state_master || item.stateMaster || item.StateMaster || item.StateMaster_state
  
  if (stateRef) {
    if (Array.isArray(stateRef) && stateRef.length > 0) {
      const firstRef = stateRef[0]
      if (typeof firstRef === 'object') {
        state = getValue(firstRef, 'state', 'State Name', 'name', 'title', 'State', 'stateName', 'StateName') || 'Unknown State'
        stateId = firstRef._id || firstRef.ID
      } else if (typeof firstRef === 'string') {
        stateId = firstRef
        const resolvedState = stateMap[firstRef]
        if (resolvedState) state = resolvedState.name
      }
    } else if (typeof stateRef === 'object') {
      state = getValue(stateRef, 'state', 'State Name', 'name', 'title', 'State', 'stateName', 'StateName') || 'Unknown State'
      stateId = stateRef._id || stateRef.ID
    } else if (typeof stateRef === 'string') {
      stateId = stateRef
      const resolvedState = stateMap[stateRef]
      if (resolvedState) state = resolvedState.name
    }
  }
  
  if (state === 'Unknown State') {
    state = getValue(item, 'state', 'State Name', 'stateName') || 'Unknown State'
  }
  
  if (state === 'Unknown State') {
    const normalizedCity = cityName.toLowerCase().trim()
    const fallbackState = CITY_TO_STATE_FALLBACK[normalizedCity]
    if (fallbackState) state = fallbackState
  }
  
  return {
    _id: item._id || item.ID,
    cityName,
    state,
    stateId,
    country: getValue(item, 'country', 'Country Name') || 'India',
  }
}

// =============================================================================
// DATA MAPPERS
// =============================================================================

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
    specialization: extractMultiReference(item.specialization, 'specialty', 'Specialty Name', 'title', 'name'),
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
    specialists: extractMultiReference(item.specialist, 'specialty', 'Specialty Name', 'title', 'name'),
    treatments: extractMultiReference(item.treatment, 'treatmentName', 'Treatment Name', 'title', 'name'),
    specialization: [
      ...extractMultiReference(item.specialty, 'specialization', 'Specialty Name', 'title', 'name'),
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
      specialty: extractMultiReference(item.specialty, 'specialization', 'Specialty Name', 'title', 'name'),
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
    specialty: extractMultiReference(item.specialty, 'specialization', 'Specialty Name', 'title', 'name'),
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
  const cacheKey = `all_branches_v${CACHE_VERSION}`
  const cached = memoryCache.get<any[]>(cacheKey)
  if (cached) return cached

  return memoryCache.dedupe(cacheKey, async () => {
    const res = await wixClient.items
      .query(COLLECTIONS.BRANCHES)
      .include(
        'hospital', 'HospitalMaster_branches', 'city', 'doctor', 'specialty',
        'accreditation', 'treatment', 'specialist', 'ShowHospital', 'department'
      )
      .limit(1000)
      .find()

    const branches = res.items.filter((b: any) => shouldShowHospital(b))
    
    console.log('[DEBUG] fetchAllBranches:')
    console.log('  - Total items:', res.items.length)
    console.log('  - Filtered branches:', branches.length)
    
    const branchesWithTreatments = branches.filter((b: any) => b.treatment && b.treatment.length > 0)
    const branchesWithSpecialists = branches.filter((b: any) => b.specialist && b.specialist.length > 0)
    console.log('  - Branches with treatments:', branchesWithTreatments.length)
    console.log('  - Branches with specialists:', branchesWithSpecialists.length)

    memoryCache.set(cacheKey, branches, CACHE_CONFIG.HOSPITALS * 1000)
    return branches
  })
}

async function fetchAllHospitals(): Promise<any[]> {
  const cacheKey = `all_hospitals_v${CACHE_VERSION}`
  const cached = memoryCache.get<any[]>(cacheKey)
  if (cached) return cached

  return memoryCache.dedupe(cacheKey, async () => {
    const res = await wixClient.items
      .query(COLLECTIONS.HOSPITALS)
      .include('specialty', 'ShowHospital')
      .ascending('_createdDate')
      .limit(1000)
      .find()

    console.log('[DEBUG] fetchAllHospitals:', res.items.length)
    memoryCache.set(cacheKey, res.items, CACHE_CONFIG.HOSPITALS * 1000)
    return res.items
  })
}

async function fetchAllTreatments(): Promise<any[]> {
  const cacheKey = `all_treatments_v${CACHE_VERSION}`
  const cached = memoryCache.get<any[]>(cacheKey)
  if (cached) return cached

  return memoryCache.dedupe(cacheKey, async () => {
    const res = await wixClient.items
      .query(COLLECTIONS.TREATMENTS)
      .include('branches', 'hospital', 'city', 'department')
      .limit(1000)
      .find()

    console.log('[DEBUG] fetchAllTreatments:', res.items.length)
    
    const treatmentsWithBranches = res.items.filter((t: any) => t.branches && t.branches.length > 0)
    const treatmentsWithHospital = res.items.filter((t: any) => t.hospital)
    console.log('  - Treatments with branches ref:', treatmentsWithBranches.length)
    console.log('  - Treatments with hospital ref:', treatmentsWithHospital.length)

    memoryCache.set(cacheKey, res.items, CACHE_CONFIG.TREATMENTS * 1000)
    return res.items
  })
}

async function fetchAllStates(): Promise<Record<string, { _id: string; name: string }>> {
  const cacheKey = 'all_states_map'
  const cached = memoryCache.get<Record<string, { _id: string; name: string }>>(cacheKey)
  if (cached) return cached

  return memoryCache.dedupe(cacheKey, async () => {
    const res = await wixClient.items.query(COLLECTIONS.STATES).find()
    const stateMap: Record<string, { _id: string; name: string }> = {}
    res.items.forEach((item: any) => {
      const id = item._id || item.ID
      const name = getValue(item, 'state', 'State Name', 'name', 'title', 'stateName', 'StateName') || 'Unknown State'
      if (id) stateMap[id] = { _id: id, name }
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
      .include('treatment', 'department', 'hospital', 'HospitalMaster', 'branch', 'BranchesMaster')
      .limit(1000)
      .find()

    console.log('[DEBUG] fetchAllSpecialists:', res.items.length)
    const specialistsWithTreatments = res.items.filter((s: any) => s.treatment && s.treatment.length > 0)
    console.log('  - Specialists with treatments:', specialistsWithTreatments.length)

    // Check for hospital/branch references
    const specialistsWithHospital = res.items.filter((s: any) => s.hospital || s.HospitalMaster || s.branch || s.BranchesMaster)
    console.log('  - Specialists with hospital/branch refs:', specialistsWithHospital.length)

    memoryCache.set(cacheKey, res.items, CACHE_CONFIG.HOSPITALS * 1000)
    return res.items
  })
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
    .limit(Math.min(sortedIds.length, 500))
    .find()

  const result = res.items.reduce((acc, item) => {
    acc[item._id!] = mapper(item)
    return acc
  }, {} as Record<string, T>)

  memoryCache.set(cacheKey, result, CACHE_CONFIG.HOSPITALS * 1000)
  return result
}

// Cache version - increment to clear all caches
const CACHE_VERSION = 4
export function clearCMSCache() {
  console.log('[DEBUG] CMS Cache cleared (version:', CACHE_VERSION + 1, ')')
}

// =============================================================================
// MAIN DATA SERVICE - SIMPLIFIED TREATMENT MAPPING
// =============================================================================

export async function getAllCMSData(): Promise<CMSDataResponse> {
  const cacheKey = `cms_all_data_v${CACHE_VERSION}`
  const cached = memoryCache.get<CMSDataResponse>(cacheKey)
  if (cached) {
    console.log('[DEBUG] Using cached CMS data')
    return cached
  }

  return memoryCache.dedupe(cacheKey, async () => {
    console.log('[DEBUG] =========================================')
    console.log('[DEBUG] FETCHING FRESH CMS DATA')
    console.log('[DEBUG] =========================================')
    
    // Fetch all base data in parallel
    const [rawHospitals, rawBranches, rawTreatments, rawCities, rawSpecialists] = await Promise.all([
      fetchAllHospitals(),
      fetchAllBranches(),
      fetchAllTreatments(),
      fetchAllCities(),
      fetchAllSpecialists(),
    ])

    console.log('[DEBUG] Raw data counts:')
    console.log('  - rawHospitals:', rawHospitals.length)
    console.log('  - rawBranches:', rawBranches.length)
    console.log('  - rawTreatments:', rawTreatments.length)
    console.log('  - rawCities:', rawCities.length)
    console.log('  - rawSpecialists:', rawSpecialists.length)

    const stateMap = await fetchAllStates()

    // Build cities map
    const citiesMap = new Map<string, CityData>()
    rawCities.forEach((city: any) => {
      if (city._id) citiesMap.set(city._id, mapCityWithStateRef(city, stateMap))
    })

    // =============================================================================
    // STEP 1: Build treatment name-to-ID map for fuzzy matching
    // =============================================================================
    console.log('[DEBUG] STEP 1: Building treatment name map...')
    const treatmentNameToId = new Map<string, string>()
    const treatmentIdToData = new Map<string, any>()
    
    rawTreatments.forEach((item: any) => {
      const id = item._id || item.ID
      const name = getValue(item, 'treatmentName', 'Treatment Name', 'title', 'name')
      if (id && name) {
        treatmentNameToId.set(name.toLowerCase(), id)
        treatmentIdToData.set(id, item)
      }
    })
    console.log('  - Unique treatment names:', treatmentNameToId.size)

    // =============================================================================
    // STEP 2: Separate branches into standalone and grouped
    // =============================================================================
    console.log('[DEBUG] STEP 2: Separating branches...')
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
          if (!branchesByHospital.has(hid)) branchesByHospital.set(hid, [])
          branchesByHospital.get(hid)!.push(branch)
        })
      }
    })
    console.log('  - Standalone branches:', standaloneBranches.length)
    console.log('  - Grouped branches:', groupedBranches.length)

    // =============================================================================
    // STEP 3: Build treatment-to-branch mapping (comprehensive)
    // =============================================================================
    console.log('[DEBUG] STEP 3: Building treatment-to-branch mapping...')
    
    // Map: treatmentID -> Set<branchID>
    const treatmentToBranches = new Map<string, Set<string>>()
    // Map: branchID -> treatmentIDs (reverse lookup)
    const branchToTreatments = new Map<string, Set<string>>()
    // Map: specialistID -> treatmentIDs
    const specialistToTreatments = new Map<string, Set<string>>()

    // PATH A: Direct treatment references on branches
    console.log('  - Path A: Direct treatment references on branches')
    let pathACount = 0
    rawBranches.forEach((branch: any) => {
      const treatments = branch.treatment || branch.data?.treatment || []
      const treatmentArray = Array.isArray(treatments) ? treatments : [treatments].filter(Boolean)
      const branchId = branch._id || branch.ID
      
      if (!branchToTreatments.has(branchId)) branchToTreatments.set(branchId, new Set())
      
      treatmentArray.forEach((t: any) => {
        const treatmentId = t?._id || t?.ID || t
        if (treatmentId) {
          pathACount++
          if (!treatmentToBranches.has(treatmentId)) treatmentToBranches.set(treatmentId, new Set())
          treatmentToBranches.get(treatmentId)!.add(branchId)
          branchToTreatments.get(branchId)!.add(treatmentId)
        }
      })
    })
    console.log('    Direct branch→treatment links:', pathACount)

    // PATH B: Treatments from specialists on branches
    console.log('  - Path B: Treatments from specialists on branches')
    let pathBCount = 0
    rawBranches.forEach((branch: any) => {
      const specialists = branch.specialist || branch.data?.specialist || []
      const specialistArray = Array.isArray(specialists) ? specialists : [specialists].filter(Boolean)
      const branchId = branch._id || branch.ID

      specialistArray.forEach((spec: any) => {
        const specId = spec?._id || spec?.ID
        if (specId) {
          const specTreatments = spec.treatment || spec.data?.treatment || []
          const specTreatArray = Array.isArray(specTreatments) ? specTreatments : [specTreatments].filter(Boolean)
          
          if (!specialistToTreatments.has(specId)) specialistToTreatments.set(specId, new Set())
          
          specTreatArray.forEach((t: any) => {
            const treatmentId = t?._id || t?.ID || t
            if (treatmentId) {
              pathBCount++
              specialistToTreatments.get(specId)!.add(treatmentId)
              if (!treatmentToBranches.has(treatmentId)) treatmentToBranches.set(treatmentId, new Set())
              treatmentToBranches.get(treatmentId)!.add(branchId)
              if (!branchToTreatments.has(branchId)) branchToTreatments.set(branchId, new Set())
              branchToTreatments.get(branchId)!.add(treatmentId)
            }
          })
        }
      })
    })
    console.log('    Branch→Specialist→Treatment links:', pathBCount)

    // PATH C: Treatments from TreatmentMaster's branches field
    console.log('  - Path C: TreatmentMaster → branches reference')
    let pathCCount = 0
    rawTreatments.forEach((treatment: any) => {
      const treatmentId = treatment._id || treatment.ID
      const treatmentBranches = treatment.branches || []
      const treatmentBranchesArray = Array.isArray(treatmentBranches) ? treatmentBranches : [treatmentBranches].filter(Boolean)
      
      if (!treatmentToBranches.has(treatmentId)) treatmentToBranches.set(treatmentId, new Set())
      
      treatmentBranchesArray.forEach((b: any) => {
        const branchId = b?._id || b?.ID || b
        if (branchId) {
          pathCCount++
          treatmentToBranches.get(treatmentId)!.add(branchId)
          if (!branchToTreatments.has(branchId)) branchToTreatments.set(branchId, new Set())
          branchToTreatments.get(branchId)!.add(treatmentId)
        }
      })
    })
    console.log('    TreatmentMaster→branches links:', pathCCount)

    // PATH D: Treatments linked via specialist's treatment field
    console.log('  - Path D: Specialists → treatments field')
    let pathDCount = 0
    rawSpecialists.forEach((spec: any) => {
      const specId = spec._id || spec.ID
      const specTreatments = spec.treatment || []
      const specTreatArray = Array.isArray(specTreatments) ? specTreatments : [specTreatments].filter(Boolean)
      
      if (!specialistToTreatments.has(specId)) specialistToTreatments.set(specId, new Set())
      
      specTreatArray.forEach((t: any) => {
        const treatmentId = t?._id || t?.ID || t
        if (treatmentId) {
          pathDCount++
          specialistToTreatments.get(specId)!.add(treatmentId)
        }
      })
    })
    console.log('    Specialist→Treatment links:', pathDCount)

    // PATH E: Fallback - match treatment names with specialists
    console.log('  - Path E: Treatment name matching with specialists')
    let pathECount = 0
    rawSpecialists.forEach((spec: any) => {
      const specId = spec._id || spec.ID
      const specName = (getValue(spec, 'specialty', 'Specialty Name', 'title', 'name') || '').toLowerCase()
      
      // Match treatment names that contain specialist name
      const treatmentNames = Array.from(treatmentNameToId.keys())
      treatmentNames.forEach((treatmentName) => {
        if (treatmentName.includes(specName) || specName.includes(treatmentName)) {
          if (!specialistToTreatments.has(specId)) specialistToTreatments.set(specId, new Set())
          if (!specialistToTreatments.get(specId)!.has(treatmentNameToId.get(treatmentName)!)) {
            pathECount++
            specialistToTreatments.get(specId)!.add(treatmentNameToId.get(treatmentName)!)
          }
        }
      })
    })
    console.log('    Name-based matches:', pathECount)

    console.log('[DEBUG] Total treatment→branch mappings:', treatmentToBranches.size)
    console.log('[DEBUG] Total branch→treatment mappings:', branchToTreatments.size)

    // =============================================================================
    // STEP 4: Batch fetch related data
    // =============================================================================
    console.log('[DEBUG] STEP 4: Batch fetching related data...')
    
    // Collect all IDs
    const allDoctorIds = new Set<string>()
    const allAccreditationIds = new Set<string>()
    const allSpecialistIds = new Set<string>()
    const allTreatmentIds = new Set<string>()
    const allBranchIds = new Set<string>()

    // Collect ALL specialist IDs from SpecialistsMaster
    rawSpecialists.forEach((s: any) => {
      const id = s._id || s.ID
      if (id) allSpecialistIds.add(id)
      
      // Also collect branch IDs that specialists reference
      const branchRef = s.branch || s.BranchesMaster
      if (branchRef) {
        if (Array.isArray(branchRef)) {
          branchRef.forEach((b: any) => {
            const bid = b?._id || b?.ID || b
            if (bid) allBranchIds.add(bid)
          })
        } else if (typeof branchRef === 'object') {
          const bid = branchRef._id || branchRef.ID
          if (bid) allBranchIds.add(bid)
        } else if (typeof branchRef === 'string') {
          allBranchIds.add(branchRef)
        }
      }
    })
    console.log('  - Total specialists from SpecialistsMaster:', allSpecialistIds.size)
    console.log('  - Branch IDs referenced by specialists:', allBranchIds.size)
    
    // Collect IDs from branches
    rawBranches.forEach((branch: any) => {
      const mapped = mapBranch(branch)
      extractIds(mapped.doctors).forEach((id) => allDoctorIds.add(id))
      extractIds(mapped.accreditation).forEach((id) => allAccreditationIds.add(id))
      extractIds(mapped.treatments).forEach((id) => allTreatmentIds.add(id))
      extractIds(mapped.specialists).forEach((id) => allSpecialistIds.add(id))
      allBranchIds.add(branch._id || branch.ID)
    })

    // Add treatment IDs from mappings
    treatmentToBranches.forEach((_, treatmentId) => allTreatmentIds.add(treatmentId))
    // Add specialist IDs from mappings
    specialistToTreatments.forEach((_, specialistId) => allSpecialistIds.add(specialistId))

    console.log('  - Doctor IDs:', allDoctorIds.size)
    console.log('  - Accreditation IDs:', allAccreditationIds.size)
    console.log('  - Treatment IDs:', allTreatmentIds.size)
    console.log('  - Specialist IDs:', allSpecialistIds.size)

    // Batch fetch
    const [doctorsMap, accreditationsMap, specialistsMap] = await Promise.all([
      fetchByIds(COLLECTIONS.DOCTORS, Array.from(allDoctorIds), mapDoctor),
      fetchByIds(COLLECTIONS.ACCREDITATIONS, Array.from(allAccreditationIds), (item: any) => ({
        _id: item._id || item.ID,
        title: getValue(item, 'title', 'Title') || 'Unknown Accreditation',
        image: item.image || item.data?.image || null,
      })),
      fetchByIds(COLLECTIONS.SPECIALTIES, Array.from(allSpecialistIds), (item: any) => ({
        _id: item._id || item.ID,
        name: getValue(item, 'specialty', 'Specialty Name', 'title', 'name') || 'Unknown Specialist',
        treatments: extractMultiReference(item.treatment, 'treatmentName', 'Treatment Name', 'title', 'name'),
        branch: extractMultiReference(item.branch, 'branchName', 'Branch Name'),
      })),
    ])

    // Fetch additional branches referenced by specialists
    const existingBranchIds = new Set(rawBranches.map((b: any) => b._id || b.ID))
    const missingBranchIds = Array.from(allBranchIds).filter((id) => !existingBranchIds.has(id))
    
    if (missingBranchIds.length > 0) {
      console.log('  - Fetching', missingBranchIds.length, 'branches referenced by specialists...')
      const missingBranches = await fetchByIds(
        COLLECTIONS.BRANCHES,
        missingBranchIds,
        mapBranch
      )
      console.log('  - Found', Object.keys(missingBranches).length, 'additional branches')
      Object.values(missingBranches).forEach((b: any) => {
        rawBranches.push(b)
      })
    }

    // =============================================================================
    // STEP 5: Build hospitals with enriched branches
    // =============================================================================
    console.log('[DEBUG] STEP 5: Building hospitals with enriched branches...')
    
    const hospitals: HospitalData[] = []

    // First, process regular hospitals from HospitalMaster
    const processedHospitalIds = new Set<string>()
    rawHospitals.forEach((rawHospital: any) => {
      const hospitalId = rawHospital._id || rawHospital.ID
      if (hospitalId) processedHospitalIds.add(hospitalId)
    })
    
    // Check if specialists reference hospitals not in HospitalMaster
    const specialistsHospitalIds = new Set<string>()
    rawSpecialists.forEach((spec: any) => {
      const hospitalRef = spec.hospital || spec.HospitalMaster
      if (hospitalRef) {
        if (Array.isArray(hospitalRef)) {
          hospitalRef.forEach((h: any) => {
            const id = h?._id || h?.ID || h
            if (id && typeof id === 'string') specialistsHospitalIds.add(id)
          })
        } else if (typeof hospitalRef === 'object') {
          const id = hospitalRef._id || hospitalRef.ID
          if (id && typeof id === 'string') specialistsHospitalIds.add(id)
        } else if (typeof hospitalRef === 'string') {
          specialistsHospitalIds.add(hospitalRef)
        }
      }
    })
    
    // Find hospital IDs that are referenced but not in HospitalMaster
    const missingHospitalIds = Array.from(specialistsHospitalIds).filter(
      (id) => !processedHospitalIds.has(id)
    )
    
    if (missingHospitalIds.length > 0) {
      console.log('  - Found', missingHospitalIds.length, 'hospitals referenced by specialists but missing from HospitalMaster')
      // Fetch and add these hospitals
      const missingHospitals = await fetchByIds(
        COLLECTIONS.HOSPITALS,
        missingHospitalIds,
        mapHospital
      )
      console.log('  - Fetched missing hospitals:', Object.keys(missingHospitals).length)
      Object.values(missingHospitals).forEach((h) => {
        rawHospitals.push(h as any)
        processedHospitalIds.add(h._id)
      })
    }
    
    // Also check if branches reference hospitals not in HospitalMaster
    const branchesHospitalIds = new Set<string>()
    rawBranches.forEach((branch: any) => {
      const hospitalIds = extractHospitalIds(branch)
      hospitalIds.forEach((hid) => branchesHospitalIds.add(hid))
    })
    
    const missingFromBranches = Array.from(branchesHospitalIds).filter(
      (id) => !processedHospitalIds.has(id)
    )
    
    if (missingFromBranches.length > 0) {
      console.log('  - Found', missingFromBranches.length, 'hospitals referenced by branches but missing from HospitalMaster')
      const missingBranchHospitals = await fetchByIds(
        COLLECTIONS.HOSPITALS,
        missingFromBranches,
        mapHospital
      )
      console.log('  - Fetched branch-referenced hospitals:', Object.keys(missingBranchHospitals).length)
      Object.values(missingBranchHospitals).forEach((h) => {
        if (!processedHospitalIds.has(h._id)) {
          rawHospitals.push(h as any)
          processedHospitalIds.add(h._id)
        }
      })
    }

    // Process regular hospitals
    rawHospitals.forEach((rawHospital: any) => {
      const hospital = mapHospital(rawHospital)
      const hospitalBranches = branchesByHospital.get(hospital._id) || []

      const enrichedBranches = hospitalBranches.map((b: any) => {
        const mapped = mapBranch(b)
        const branchId = mapped._id
        
        // Collect ALL treatments for this branch from multiple sources
        const allBranchTreatmentIds = new Set<string>()
        
        // Source 1: Direct branch treatments (Path A)
        const directTreatments = b.treatment || b.data?.treatment || []
        const directTreatArray = Array.isArray(directTreatments) ? directTreatments : [directTreatments].filter(Boolean)
        let directCount = 0
        directTreatArray.forEach((t: any) => {
          const tid = t?._id || t?.ID || t
          if (tid) {
            allBranchTreatmentIds.add(tid)
            directCount++
          }
        })
        
        // Source 2: Treatments from specialists on this branch (Path B)
        const specialists = b.specialist || b.data?.specialist || []
        const specArray = Array.isArray(specialists) ? specialists : [specialists].filter(Boolean)
        let specTreatCount = 0
        specArray.forEach((spec: any) => {
          const specId = spec?._id || spec?.ID
          if (specId) {
            const specTreatments = specialistToTreatments.get(specId) || new Set()
            specTreatments.forEach((tid) => {
              if (allBranchTreatmentIds.add(tid)) specTreatCount++
            })
          }
        })
        
        // Source 3: From branchToTreatments mapping (fallback)
        const mappedTreatments = branchToTreatments.get(branchId) || new Set()
        let mappedCount = 0
        mappedTreatments.forEach((tid) => {
          if (allBranchTreatmentIds.add(tid)) mappedCount++
        })
        
        if (directCount > 0 || specTreatCount > 0 || mappedCount > 0) {
          console.log(`[DEBUG] Branch ${mapped.branchName}: direct=${directCount}, fromSpecialists=${specTreatCount}, fromMapping=${mappedCount}, total=${allBranchTreatmentIds.size}`)
        }
        
        const branchTreatments = Array.from(allBranchTreatmentIds)
          .map((tid) => {
            const treatment = mapTreatment(treatmentIdToData.get(tid) || { _id: tid })
            treatment.branchesAvailableAt = null
            return treatment
          })

        return {
          ...mapped,
          doctors: mapped.doctors.map((d: any) => doctorsMap[d._id] || d),
          specialists: mapped.specialists.map((s: any) => {
            const specData = specialistsMap[s._id] || s
            // Enrich specialist with treatments from mapping
            const specId = s._id
            const specTreatments = specialistToTreatments.get(specId) || new Set()
            return {
              ...specData,
              treatments: Array.from(specTreatments).map((tid) => 
                mapTreatment(treatmentIdToData.get(tid) || {})
              ),
            }
          })
          // ALSO: Add specialists that reference this branch from their data
          .concat(
            Object.values(specialistsMap).filter((spec: any) => {
              if (!spec.branch) return false
              return spec.branch.some((b: any) => {
                const bid = b._id || b.ID || b
                return bid === branchId || bid === mapped._id
              })
            })
          ),
          city: mapped.city.map((c: any) => {
            const enrichedCity = citiesMap.get(c._id)
            if (enrichedCity && enrichedCity.state && enrichedCity.state !== 'Unknown State') {
              return enrichedCity
            }
            const cityName = c.name || c.cityName || 'Unknown City'
            const normalizedCity = cityName.toLowerCase().trim()
            return {
              _id: c._id,
              cityName,
              state: CITY_TO_STATE_FALLBACK[normalizedCity] || 'Unknown State',
              country: 'India',
            }
          }),
          accreditation: mapped.accreditation.map((a: any) => accreditationsMap[a._id] || a),
          treatments: branchTreatments,
        }
      })

      // Collect unique items from branches
      const uniqueDoctors = new Map<string, DoctorData>()
      const uniqueTreatments = new Map<string, TreatmentData>()
      const uniqueAccreditations = new Map<string, any>()

      enrichedBranches.forEach((branch) => {
        branch.doctors.forEach((d: DoctorData) => d._id && uniqueDoctors.set(d._id, d))
        branch.treatments.forEach((t: TreatmentData) => t._id && uniqueTreatments.set(t._id, t))
        branch.accreditation.forEach((a: any) => a._id && uniqueAccreditations.set(a._id, a))
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
      const branchId = mapped._id
      
      // Collect ALL treatments for this branch from multiple sources
      const allBranchTreatmentIds = new Set<string>()
      
      // Source 1: Direct branch treatments
      const directTreatments = branch.treatment || branch.data?.treatment || []
      const directTreatArray = Array.isArray(directTreatments) ? directTreatments : [directTreatments].filter(Boolean)
      directTreatArray.forEach((t: any) => {
        const tid = t?._id || t?.ID || t
        if (tid) allBranchTreatmentIds.add(tid)
      })
      
      // Source 2: Treatments from specialists on this branch
      const specialists = branch.specialist || branch.data?.specialist || []
      const specArray = Array.isArray(specialists) ? specialists : [specialists].filter(Boolean)
      specArray.forEach((spec: any) => {
        const specId = spec?._id || spec?.ID
        if (specId) {
          const specTreatments = specialistToTreatments.get(specId) || new Set()
          specTreatments.forEach((tid) => allBranchTreatmentIds.add(tid))
        }
      })
      
      // Source 3: From branchToTreatments mapping (fallback)
      const mappedTreatments = branchToTreatments.get(branchId) || new Set()
      mappedTreatments.forEach((tid) => allBranchTreatmentIds.add(tid))
      
      const branchTreatments = Array.from(allBranchTreatmentIds)
        .map((tid) => {
          const treatment = mapTreatment(treatmentIdToData.get(tid) || { _id: tid })
          treatment.branchesAvailableAt = null
          return treatment
        })

      const enrichedBranch = {
        ...mapped,
        doctors: mapped.doctors.map((d: any) => doctorsMap[d._id] || d),
        specialists: mapped.specialists.map((s: any) => {
          const specData = specialistsMap[s._id] || s
          const specId = s._id
          const specTreatments = specialistToTreatments.get(specId) || new Set()
          return {
            ...specData,
            treatments: Array.from(specTreatments).map((tid) => 
              mapTreatment(treatmentIdToData.get(tid) || {})
            ),
          }
        })
        // ALSO: Add specialists that reference this branch from their data
        .concat(
          Object.values(specialistsMap).filter((spec: any) => {
            if (!spec.branch) return false
            return spec.branch.some((b: any) => {
              const bid = b._id || b.ID || b
              return bid === branchId || bid === mapped._id
            })
          })
        ),
        city: mapped.city.map((c: any) => {
          const enrichedCity = citiesMap.get(c._id)
          if (enrichedCity && enrichedCity.state && enrichedCity.state !== 'Unknown State') {
            return enrichedCity
          }
          const cityName = c.name || c.cityName || 'Unknown City'
          const normalizedCity = cityName.toLowerCase().trim()
          return {
            _id: c._id,
            cityName,
            state: CITY_TO_STATE_FALLBACK[normalizedCity] || 'Unknown State',
            country: 'India',
          }
        }),
        accreditation: mapped.accreditation.map((a: any) => accreditationsMap[a._id] || a),
        treatments: branchTreatments,
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

    console.log('[DEBUG] Built', hospitals.length, 'hospitals (from HospitalMaster:', rawHospitals.length, '+ standalone:', standaloneBranches.length, ')')

    // =============================================================================
    // STEP 6: Build comprehensive treatments array with branchesAvailableAt
    // =============================================================================
    console.log('[DEBUG] STEP 6: Building treatments with branchesAvailableAt...')
    
    // Build hospital lookup by ID
    const hospitalById = new Map<string, any>()
    hospitals.forEach((h: any) => {
      if (h._id) hospitalById.set(h._id, h)
    })

    // Build all treatments with branch availability
    const allTreatmentsSet = new Set<string>()
    
    // Add from treatmentNameToId map (TreatmentMaster)
    treatmentNameToId.forEach((_, name) => {
      const id = treatmentNameToId.get(name)
      if (id) allTreatmentsSet.add(id)
    })
    
    // Add from treatmentToBranches map (any treatment linked to branches)
    treatmentToBranches.forEach((_, treatmentId) => {
      allTreatmentsSet.add(treatmentId)
    })

    console.log('  - Total unique treatments to process:', allTreatmentsSet.size)

    const finalTreatments: ExtendedTreatmentData[] = Array.from(allTreatmentsSet).map((treatmentId) => {
      const treatmentData = treatmentIdToData.get(treatmentId) || {}
      const treatment = mapTreatment(treatmentData)
      
      // Find all branches offering this treatment
      const branchIds = treatmentToBranches.get(treatmentId) || new Set<string>()
      const branchesAvailableAt: TreatmentLocation[] = []

      branchIds.forEach((branchId) => {
        // Find this branch in any hospital
        hospitals.forEach((hospital) => {
          const branch = hospital.branches?.find((b: any) => b._id === branchId)
          if (branch) {
            branchesAvailableAt.push({
              branchId: branch._id,
              branchName: branch.branchName,
              hospitalName: hospital.hospitalName,
              hospitalId: hospital._id,
              cities: branch.city || [],
              departments: [],
              cost: treatment.cost || null,
            })
          }
        })
      })

      return {
        ...treatment,
        branchesAvailableAt,
        departments: [],
      }
    })

    console.log('[DEBUG] Final treatments count:', finalTreatments.length)

    const response: CMSDataResponse = {
      hospitals,
      treatments: finalTreatments,
      totalHospitals: hospitals.length,
      totalTreatments: finalTreatments.length,
      lastUpdated: new Date().toISOString(),
    }

    console.log('[DEBUG] =========================================')
    console.log('[DEBUG] CMS DATA LOAD COMPLETE')
    console.log('[DEBUG] Hospitals:', hospitals.length)
    console.log('[DEBUG] Treatments:', finalTreatments.length)
    console.log('[DEBUG] =                                       =============')

    memoryCache.set(cacheKey, response, CACHE_CONFIG.HOSPITALS * 1000)
    return response
  })
}

export async function getHospitalBySlug(slug: string): Promise<HospitalDetailResponse> {
  const cacheKey = `hospital_slug_${slug}`
  const cached = memoryCache.get<HospitalDetailResponse>(cacheKey)
  if (cached) return cached

  return memoryCache.dedupe<HospitalDetailResponse>(cacheKey, async () => {
    console.log('[DEBUG] Fetching hospital by slug:', slug)

    // Fetch all CMS data first
    const { hospitals, treatments } = await getAllCMSData()

    // Find hospital by slug
    const hospital = hospitals.find((h) => {
      // Check hospital name slug
      const hospitalSlug = generateSlug(h.hospitalName)
      if (hospitalSlug === slug) return true

      // Check if any branch matches
      return h.branches.some((b) => {
        const branchSlug = generateSlug(b.branchName)
        return branchSlug === slug
      })
    })

    if (!hospital) {
      return {
        hospital: null,
        similarHospitals: [],
        error: 'Hospital not found',
      }
    }

    // Find similar hospitals (same specialty, different hospital)
    const similarHospitals = hospitals
      .filter((h) => h._id !== hospital._id)
      .filter((h) =>
        h.specialty.some((s) =>
          hospital.specialty.some((hs) => s._id === hs._id)
        )
      )
      .slice(0, 3)

    return {
      hospital,
      similarHospitals,
    }
  })
}

export async function getTreatmentBySlug(slug: string): Promise<ExtendedTreatmentData | null> {
  console.log('[DEBUG] Fetching treatment by slug:', slug)
  
  const { treatments } = await getAllCMSData()
  
  const treatment = treatments.find((t) => {
    const treatmentSlug = generateSlug(t.name)
    return treatmentSlug === slug
  })
  
  return treatment || null
}
