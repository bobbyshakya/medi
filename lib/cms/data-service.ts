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
// STATE INFERENCE HELPER
// =============================================================================

/**
 * Infers the Indian state from a city name.
 * This is used as a fallback when city-state mapping from CMS is missing.
 */
function inferStateFromCityName(cityName: string | null | undefined): string {
  if (!cityName || typeof cityName !== 'string') return 'Unknown State';

  const city = cityName.toLowerCase().trim();

  // Delhi NCR handling
  const delhiNCRCities = ['delhi', 'new delhi', 'gurugram', 'gurgaon', 'noida', 'faridabad', 'ghaziabad', 'greater noida'];
  if (delhiNCRCities.some(c => city.includes(c))) return 'Delhi NCR';

  // Maharashtra
  const maharashtraCities = ['mumbai', 'pune', 'nashik', 'nagpur', 'aurangabad', 'kolhapur', 'navi mumbai', 'thane', 'solapur', 'akola', 'amaravati'];
  if (maharashtraCities.some(c => city === c || city.includes(c))) return 'Maharashtra';

  // Gujarat
  const gujaratCities = ['ahmedabad', 'surat', 'vadodara', 'rajkot', 'jamnagar', 'bhavnagar', 'junagadh', 'gandhinagar', 'bharuch', 'anand', 'navsari', 'valsad'];
  if (gujaratCities.some(c => city === c || city.includes(c))) return 'Gujarat';

  // Karnataka
  const karnatakaCities = ['bangalore', 'bengaluru', 'mysore', 'mangalore', 'hubli', 'belgaum', 'belagavi', 'dharwad'];
  if (karnatakaCities.some(c => city === c || city.includes(c))) return 'Karnataka';

  // Tamil Nadu
  const tamilNaduCities = ['chennai', 'coimbatore', 'madurai', 'trichy', 'tiruchirappalli', 'salem', 'vellore', 'tirunelveli'];
  if (tamilNaduCities.some(c => city === c || city.includes(c))) return 'Tamil Nadu';

  // Telangana / Andhra Pradesh
  const telanganaCities = ['hyderabad', 'secunderabad', 'warangal', 'karimnagar', 'khammam', 'nizamabad'];
  const andhraCities = ['vizag', 'visakhapatnam', 'vijayawada', 'guntur', 'nellore', 'tirupati', 'kurnool'];
  if (telanganaCities.some(c => city === c || city.includes(c))) return 'Telangana';
  if (andhraCities.some(c => city === c || city.includes(c))) return 'Andhra Pradesh';

  // West Bengal
  const westBengalCities = ['kolkata', 'howrah', 'asansol', 'durgapur', 'siliguri'];
  if (westBengalCities.some(c => city === c || city.includes(c))) return 'West Bengal';

  // Rajasthan
  const rajasthanCities = ['jaipur', 'jodhpur', 'udaipur', 'kota', 'bikaner', 'ajmer'];
  if (rajasthanCities.some(c => city === c || city.includes(c))) return 'Rajasthan';

  // Uttar Pradesh
  const upCities = ['lucknow', 'kanpur', 'varanasi', 'prayagraj', 'agra', 'meerut', 'aligarh', 'bareilly'];
  if (upCities.some(c => city === c || city.includes(c))) return 'Uttar Pradesh';

  // Kerala
  const keralaCities = ['kochi', 'thiruvananthapuram', 'kozhikode', 'kollam', 'palakkad', 'thrissur', 'kannur'];
  if (keralaCities.some(c => city === c || city.includes(c))) return 'Kerala';

  // Madhya Pradesh
  const mpCities = ['indore', 'bhopal', 'gwalior', 'jabalpur', 'ujjain'];
  if (mpCities.some(c => city === c || city.includes(c))) return 'Madhya Pradesh';

  // Punjab
  const punjabCities = ['amritsar', 'ludhiana', 'jalandhar', 'patiala', 'bathinda'];
  if (punjabCities.some(c => city === c || city.includes(c))) return 'Punjab';

  // Chandigarh
  if (city.includes('chandigarh')) return 'Chandigarh';

  // Odisha
  const odishaCities = ['bhubaneswar', 'cuttack', 'rourkela', 'sambalpur'];
  if (odishaCities.some(c => city === c || city.includes(c))) return 'Odisha';

  // Bihar
  const biharCities = ['patna', 'muzaffarpur', 'gaya', 'bhagalpur', 'darbhanga'];
  if (biharCities.some(c => city === c || city.includes(c))) return 'Bihar';

  // Jharkhand
  const jharkhandCities = ['ranchi', 'jamshedpur', 'dhanbad', 'bokaro'];
  if (jharkhandCities.some(c => city === c || city.includes(c))) return 'Jharkhand';

  // Uttarakhand
  const uttarakhandCities = ['dehradun', 'haridwar', 'roorkee', 'haldwani'];
  if (uttarakhandCities.some(c => city === c || city.includes(c))) return 'Uttarakhand';

  // Northeast states
  const neCities: Record<string, string[]> = {
    'Assam': ['guwahati', 'silchar', 'dibrugarh'],
    'Manipur': ['imphal'],
    'Meghalaya': ['shillong', 'tura'],
    'Nagaland': ['kohima', 'dimapur'],
    'Tripura': ['agartala'],
    'Mizoram': ['aizawl'],
    'Arunachal Pradesh': ['itanagar']
  };

  for (const [state, citiesList] of Object.entries(neCities)) {
    if (citiesList.some(c => city === c || city.includes(c))) return state;
  }

  return 'Unknown State';
}

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

// Enhanced mapCity function that resolves state from StateMaster
function mapCityWithStateRef(item: any, stateMap: Record<string, { _id: string; name: string }>): CityData {
  const cityName = getValue(item, 'cityName', 'city name', 'name', 'City Name') || 'Unknown City'
  
  // Try to get state from reference first (Wix CMS stores state as a reference)
  let state = 'Unknown State'
  let stateId: string | undefined = undefined
  
  const stateRef = item.state || item.State || item.stateRef || item.state_master || item.stateMaster || item.StateMaster || item.StateMaster_state
  
  if (stateRef) {
    if (typeof stateRef === 'object') {
      // Direct state object with name
      state = getValue(stateRef, 'state', 'State Name', 'name', 'title', 'State', 'stateName', 'StateName') || 'Unknown State'
      stateId = stateRef._id || stateRef.ID
    } else if (typeof stateRef === 'string') {
      // It's an ID reference - lookup in stateMap
      stateId = stateRef
      const resolvedState = stateMap[stateRef]
      if (resolvedState) {
        state = resolvedState.name
      }
    }
  }
  
  // Direct string fallback
  if (state === 'Unknown State') {
    state = getValue(item, 'state', 'State Name', 'stateName') || 'Unknown State'
  }
  
  // Gujarat fallback cities including Navsari (for cities without proper state reference)
  const lowerCityName = cityName.toLowerCase()
  if (state === 'Unknown State') {
    if (lowerCityName.includes("navsari") || lowerCityName.includes("ahmedabad") || 
        lowerCityName.includes("surat") || lowerCityName.includes("vadodara") ||
        lowerCityName.includes("rajkot") || lowerCityName.includes("bharuch") ||
        lowerCityName.includes("jamnagar") || lowerCityName.includes("gandhinagar") ||
        lowerCityName.includes(" Anand") || lowerCityName.includes("anand")) {
      state = "Gujarat"
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

async function fetchAllStates(): Promise<Record<string, { _id: string; name: string }>> {
  const cacheKey = 'all_states_map'
  const cached = memoryCache.get<Record<string, { _id: string; name: string }>>(cacheKey)
  if (cached) return cached

  return memoryCache.dedupe(cacheKey, async () => {
    const res = await wixClient.items
      .query(COLLECTIONS.STATES)
      .limit(500)
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
    // Fetch cities with state reference included
    const res = await wixClient.items
      .query(COLLECTIONS.CITIES)
      .include('state', 'State', 'stateRef', 'stateMaster')
      .limit(500)
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
      const enrichedCity = (cities as Record<string, CityData>)[c._id]
      if (enrichedCity && enrichedCity.state && enrichedCity.state !== 'Unknown State') {
        return enrichedCity
      }
      const inferredState = inferStateFromCityName(c.name || c.cityName)
      return {
        _id: c._id,
        cityName: c.name || c.cityName || 'Unknown City',
        state: inferredState,
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
    // Fetch all base data in parallel including states
    const [rawHospitals, rawBranches, rawTreatments, rawCities, rawSpecialists] = await Promise.all([
      fetchAllHospitals(),
      fetchAllBranches(),
      fetchAllTreatments(),
      fetchAllCities(),
      fetchAllSpecialists(),
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

    // Batch fetch related data
    const [doctorsMap, accreditationsMap, treatmentsMap, specialistsMap] = await Promise.all([
      fetchByIds(COLLECTIONS.DOCTORS, Array.from(allDoctorIds), mapDoctor),
      fetchByIds(COLLECTIONS.ACCREDITATIONS, Array.from(allAccreditationIds), mapAccreditation),
      fetchByIds(COLLECTIONS.TREATMENTS, Array.from(allTreatmentIds), mapTreatment),
      fetchByIds(COLLECTIONS.SPECIALTIES, Array.from(allSpecialistIds), mapSpecialistWithTreatments),
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
            const inferredState = inferStateFromCityName(c.name || c.cityName)
            return {
              _id: c._id,
              cityName: c.name || c.cityName || 'Unknown City',
              state: inferredState,
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
          const inferredState = inferStateFromCityName(c.name || c.cityName)
          return {
            _id: c._id,
            cityName: c.name || c.cityName || 'Unknown City',
            state: inferredState,
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
                entry.branches.set(branch._id, {
                  branchId: branch._id,
                  branchName: branch.branchName,
                  hospitalName: hospital.hospitalName,
                  hospitalId: hospital._id,
                  cities: branch.city,
                  departments: [],
                  cost: null,
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
            })
          }
        })
      })
    })

    // Build extended treatments from rawTreatments
    const treatments: ExtendedTreatmentData[] = rawTreatments.map((item: any) => {
      const treatment = mapTreatment(item)
      const branchesMap = treatmentBranchMap.get(treatment._id)
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
      totalHospitals: hospitals.length,
      totalTreatments: treatments.length,
      lastUpdated: new Date().toISOString(),
    }

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
    .slice(0, 6)

  return { hospital, similarHospitals }
}

/**
 * Search hospitals by query
 */
export async function searchHospitals(query: string): Promise<HospitalData[]> {
  const { hospitals } = await getAllCMSData()
  const normalizedQuery = query.toLowerCase().trim()

  if (!normalizedQuery) return hospitals

  return hospitals.filter((h) => {
    const nameMatch = h.hospitalName.toLowerCase().includes(normalizedQuery)
    const cityMatch = h.branches.some((b) => b.city.some((c) => c.cityName.toLowerCase().includes(normalizedQuery)))
    const treatmentMatch = h.treatments.some((t) => t.name.toLowerCase().includes(normalizedQuery))
    return nameMatch || cityMatch || treatmentMatch
  })
}

// Export cached version for server components
export const getCachedCMSData = createCachedFetcher(getAllCMSData, ['cms-all-data'], {
  revalidate: CACHE_CONFIG.HOSPITALS,
  tags: [CACHE_TAGS.ALL_DATA],
})
