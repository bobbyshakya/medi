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
      return typeof value === 'string' ? value : String(value)
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

async function fetchAllCities(): Promise<any[]> {
  const cacheKey = 'all_cities'
  const cached = memoryCache.get<any[]>(cacheKey)
  if (cached) return cached

  return memoryCache.dedupe(cacheKey, async () => {
    const res = await wixClient.items.query(COLLECTIONS.CITIES).limit(500).find()

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

  const [doctors, cities, accreditations] = await Promise.all([
    loadDoctors ? fetchByIds(COLLECTIONS.DOCTORS, Array.from(doctorIds), mapDoctor) : {} as Record<string, DoctorData>,
    loadCities ? fetchByIds(COLLECTIONS.CITIES, Array.from(cityIds), mapCity) : {} as Record<string, CityData>,
    loadAccreditations ? fetchByIds(COLLECTIONS.ACCREDITATIONS, Array.from(accreditationIds), mapAccreditation) : {} as Record<string, AccreditationData>,
  ])

  return mappedBranches.map((branch) => ({
    ...branch,
    doctors: branch.doctors.map((d: any) => (doctors as Record<string, DoctorData>)[d._id] || d),
    city: branch.city.map((c: any) => (cities as Record<string, CityData>)[c._id] || c),
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
    const [rawHospitals, rawBranches, rawTreatments, rawCities, rawSpecialists] = await Promise.all([
      fetchAllHospitals(),
      fetchAllBranches(),
      fetchAllTreatments(),
      fetchAllCities(),
      fetchAllSpecialists(),
    ])

    // Build cities map
    const citiesMap = new Map<string, CityData>()
    rawCities.forEach((city: any) => {
      if (city._id) {
        citiesMap.set(city._id, mapCity(city))
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

    rawBranches.forEach((branch: any) => {
      const mapped = mapBranch(branch)
      extractIds(mapped.doctors).forEach((id) => allDoctorIds.add(id))
      extractIds(mapped.accreditation).forEach((id) => allAccreditationIds.add(id))
      extractIds(mapped.treatments).forEach((id) => allTreatmentIds.add(id))
    })

    // Batch fetch related data
    const [doctorsMap, accreditationsMap, treatmentsMap] = await Promise.all([
      fetchByIds(COLLECTIONS.DOCTORS, Array.from(allDoctorIds), mapDoctor),
      fetchByIds(COLLECTIONS.ACCREDITATIONS, Array.from(allAccreditationIds), mapAccreditation),
      fetchByIds(COLLECTIONS.TREATMENTS, Array.from(allTreatmentIds), mapTreatment),
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
          city: mapped.city.map((c: any) => citiesMap.get(c._id) || c),
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
        city: mapped.city.map((c: any) => citiesMap.get(c._id) || c),
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
    hospitals.forEach((hospital) => {
      hospital.branches.forEach((branch) => {
        // Get specialist IDs from branch
        const branchSpecialistIds = extractIds(branch.specialists || [])
        
        branchSpecialistIds.forEach((specId) => {
          // Get treatments linked to this specialist
          const specTreatmentIds = specialistTreatmentMap.get(specId)
          if (specTreatmentIds) {
            specTreatmentIds.forEach((treatmentId) => {
              if (!treatmentBranchMap.has(treatmentId)) {
                treatmentBranchMap.set(treatmentId, new Map())
              }
              const branchMap = treatmentBranchMap.get(treatmentId)!
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
            })
          }
        })
      })
    })

    const treatments: ExtendedTreatmentData[] = rawTreatments.map((item: any) => {
      const treatment = mapTreatment(item)
      const branchesMap = treatmentBranchMap.get(treatment._id)
      return {
        ...treatment,
        branchesAvailableAt: branchesMap ? Array.from(branchesMap.values()) : [],
        departments: [],
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
 */
export async function getHospitalBySlug(slug: string): Promise<HospitalDetailResponse> {
  const { hospitals } = await getAllCMSData()

  const normalizedSlug = slug.toLowerCase().trim()
  const hospital = hospitals.find((h) => {
    const hospitalSlug = generateSlug(h.hospitalName)
    return hospitalSlug === normalizedSlug || h._id === slug
  })

  if (!hospital) {
    return { hospital: null, similarHospitals: [], error: 'Hospital not found' }
  }

  // Find similar hospitals (same city or accreditations)
  const hospitalCity = hospital.branches[0]?.city[0]?.cityName
  const hospitalAccreditations = new Set(hospital.accreditations.map((a) => a.title))

  const similarHospitals = hospitals
    .filter((h) => {
      if (h._id === hospital._id) return false
      const hCity = h.branches[0]?.city[0]?.cityName
      const hasMatchingCity = hCity === hospitalCity
      const hasMatchingAccreditation = h.accreditations.some((a) => hospitalAccreditations.has(a.title))
      return hasMatchingCity || hasMatchingAccreditation
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
