// app/api/hospitals/route.ts - Cleaned and optimized version
import { NextResponse } from "next/server"
import { wixClient } from "@/lib/wixClient"

const COLLECTIONS = {
  BRANCHES: "BranchesMaster",
  DOCTORS: "DoctorMaster", 
  CITIES: "CityMaster",
  TREATMENTS: "TreatmentMaster",
  HOSPITALS: "HospitalMaster"
}

// Utility function to get value from nested fields
function getValue(item: any, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = item?.[key]
    if (value !== undefined && value !== null && value !== "") {
      return value
    }
  }
  return null
}

// Data mapping functions
const DataMappers = {
  hospital: (item: any) => ({
    _id: item._id || item.ID,
    name: getValue(item, "Hospital Name", "hospitalName", "name") || "Hospital",
    slug: getValue(item, "slug", "Slug"),
    image: item["Hospital Image"] || item.hospitalImage || item.image,
    logo: item["Logo"] || item.logo,
    yearEstablished: getValue(item, "Year Established", "yearEstablished"),
    accreditation: getValue(item, "Accreditation", "accreditation"),
    beds: getValue(item, "No. of Beds", "noOfBeds", "beds"),
    emergencyServices: getValue(item, "Emergency Services", "emergencyServices"),
    description: getValue(item, "Description", "description"),
    website: getValue(item, "Website", "website"),
    email: getValue(item, "Email", "email"),
    contactNumber: getValue(item, "Contact Number", "contactNumber"),
  }),

  branch: (item: any) => ({
    _id: item._id || item.ID,
    name: getValue(item, "Branch Name", "branchName", "name") || "Branch",
    address: getValue(item, "Address", "address"),
    city: ReferenceMapper.multiReference(item.city, "city name", "cityName", "name"),
    contactNumber: getValue(item, "Phone", "Phone", "contactNumber"),
    email: getValue(item, "Email", "email"),
    totalBeds: getValue(item, "Total Beds", "totalBeds"),
    icuBeds: getValue(item, "ICU Beds", "icuBeds"),
    emergencyContact: getValue(item, "Emergency Contact", "emergencyContact"),
    branchImage: getValue(item, "Branch Image", "branchImage", "image"),
    description: getValue(item, "Description", "description"),
    doctors: ReferenceMapper.multiReference(item.doctor, "Doctor Name", "doctorName", "name"),
    treatments: ReferenceMapper.multiReference(item.treatment, "Treatment Name", "treatment", "name"),
  }),

  doctor: (item: any) => ({
    _id: item._id || item.ID,
    name: getValue(item, "Doctor Name", "doctorName", "name") || "Doctor",
    specialization: getValue(item, "Specialization", "specialization"),
    qualification: getValue(item, "Qualification", "qualification"),
    experience: getValue(item, "experienceYears", "experience"),
    designation: getValue(item, "Designation", "designation"),
    languagesSpoken: getValue(item, "Languages Spoken", "languagesSpoken"),
    about: getValue(item, "About Doctor", "aboutDoctor"),
    profileImage: item["profileImage"] || item.profileImage,
    cityId: getValue(item, "City (ID)", "cityId"),
    stateId: getValue(item, "State (ID)", "stateId"),
    countryId: getValue(item, "Country (ID)", "countryId"),
    treatments: ReferenceMapper.multiReference(item.treatment, "Treatment Name", "treatmentName", "name"),
  }),

  city: (item: any) => ({
    _id: item._id || item.ID,
    name: getValue(item, "city name", "cityName", "name") || "City",
    state: getValue(item, "state", "stateName"),
    country: getValue(item, "contery", "country", "countryName"),
  }),

  treatment: (item: any) => ({
    _id: item._id || item.ID,
    name: getValue(item, "Treatment Name", "treatmentName", "name") || "Treatment",
    description: getValue(item, "Description", "description"),
    category: getValue(item, "Category", "category"),
    treatmentImage: item["Treatment Image"] || item.treatmentImage || item.image,
    duration: getValue(item, "Duration", "duration"),
    cost: getValue(item, "Cost", "cost", "price"),
  })
}

// Reference mapping utilities
const ReferenceMapper = {
  multiReference: (field: any, ...nameFields: string[]): any[] => {
    if (!field) return []

    if (Array.isArray(field)) {
      return field
        .map((item: any) => {
          if (typeof item === "string") {
            return { _id: item }
          }
          
          const mappedItem: any = {
            _id: item?._id || item?.ID,
            name: getValue(item, ...nameFields) || "Item",
          }

          // Enhanced mapping based on reference type
          if (nameFields.includes("Doctor Name")) {
            mappedItem.specialization = getValue(item, "Specialization", "specialization")
            mappedItem.qualification = getValue(item, "Qualification", "qualification")
            mappedItem.experience = getValue(item, "Experience (Years)", "experience")
            mappedItem.profileImage = getValue(item, "Profile Image", "profileImage")
            mappedItem.designation = getValue(item, "Designation", "designation")
          }
          
          if (nameFields.includes("Treatment Name")) {
            mappedItem.description = getValue(item, "Description", "description")
            mappedItem.category = getValue(item, "Category", "category")
            mappedItem.duration = getValue(item, "Duration", "duration")
            mappedItem.cost = getValue(item, "Cost", "cost")
          }
          
          if (nameFields.includes("city name")) {
            mappedItem.state = getValue(item, "state", "stateName")
            mappedItem.country = getValue(item, "contery", "country")
          }

          return mappedItem
        })
        .filter(Boolean)
    }

    return []
  },

  extractIds: (references: any[]): string[] => {
    return references
      .map((ref) => {
        if (typeof ref === "string") return ref
        if (ref?._id) return ref._id
        return null
      })
      .filter((id): id is string => id !== null)
  },

  extractHospitalIds: (branch: any): string[] => {
    const ids = new Set<string>()
    const fieldsToCheck = [
      branch?.hospital,
      branch?.HospitalMaster_branches,
      branch?.Hospital,
      branch?.hospitalId,
      branch?.["Hospital (ID)"]
    ]

    fieldsToCheck.forEach(field => {
      if (!field) return
      if (typeof field === "string") {
        ids.add(field)
      } else if (Array.isArray(field)) {
        field.forEach(item => {
          if (typeof item === "string") ids.add(item)
          else if (item?._id) ids.add(item._id)
        })
      } else if (typeof field === "object" && field?._id) {
        ids.add(field._id)
      }
    })

    return Array.from(ids)
  }
}

// Data fetching utilities
const DataFetcher = {
  async searchIdsByName(collectionId: string, nameFields: string[], query: string): Promise<string[]> {
    const idSet = new Set<string>()

    for (const field of nameFields) {
      try {
        const result = await wixClient.items
          .query(collectionId)
          .contains(field as any, query)
          .limit(500)
          .find()
        
        result.items.forEach((item: any) => {
          if (item?._id) idSet.add(item._id)
        })
      } catch (error) {
        console.warn(`Search failed for ${collectionId}.${field}:`, error)
      }
    }

    return Array.from(idSet)
  },

  async fetchCollectionData(collectionId: string, ids: string[], mapper: Function) {
    if (!ids.length) return {}

    try {
      const result = await wixClient.items
        .query(collectionId)
        .hasSome("_id", ids)
        .find()

      return result.items.reduce((acc, item) => {
        acc[item._id!] = mapper(item)
        return acc
      }, {} as Record<string, any>)
    } catch (error) {
      console.error(`Error fetching ${collectionId}:`, error)
      return {}
    }
  },

  async fetchDoctorsWithTreatments(doctorIds: string[]) {
    if (!doctorIds.length) return {}

    try {
      const doctors = await wixClient.items
        .query(COLLECTIONS.DOCTORS)
        .hasSome("_id", doctorIds)
        .include("treatment")
        .find()

      return doctors.items.reduce((acc, doctor) => {
        acc[doctor._id!] = DataMappers.doctor(doctor)
        return acc
      }, {} as Record<string, any>)
    } catch (error) {
      console.error("Error fetching doctors with treatments:", error)
      return {}
    }
  }
}

// Query builder
const QueryBuilder = {
  buildBranchQuery(
    hospitalIds?: string[],
    cityIds?: string[],
    doctorIds?: string[],
    treatmentIds?: string[],
    includeReferences = false
  ) {
    let query = wixClient.items.query(COLLECTIONS.BRANCHES).descending("_createdDate")

    if (includeReferences) {
      query = query
        .include("hospital")
        .include("HospitalMaster_branches")
        .include("doctor")
        .include("treatment")
        .include("city")
    }

    if (hospitalIds?.length) {
      query = query.hasSome("HospitalMaster_branches" as any, hospitalIds)
    }
    if (cityIds?.length) {
      query = query.hasSome("city" as any, cityIds)
    }
    if (doctorIds?.length) {
      query = query.hasSome("doctor" as any, doctorIds)
    }
    if (treatmentIds?.length) {
      query = query.hasSome("treatment" as any, treatmentIds)
    }

    return query
  },

  async getHospitalIdsFromBranchFilters(
    cityIds?: string[],
    doctorIds?: string[],
    treatmentIds?: string[]
  ): Promise<string[]> {
    if (!cityIds?.length && !doctorIds?.length && !treatmentIds?.length) {
      return []
    }

    try {
      const branchQuery = this.buildBranchQuery(undefined, cityIds, doctorIds, treatmentIds, true)
      const branches = await branchQuery.limit(1000).find()

      const hospitalIds = new Set<string>()
      branches.items.forEach((branch: any) => {
        ReferenceMapper.extractHospitalIds(branch).forEach(id => hospitalIds.add(id))
      })

      return Array.from(hospitalIds)
    } catch (error) {
      console.error("Error getting hospital IDs from branch filters:", error)
      return []
    }
  }
}

// Main API handler
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    
    // Parse query parameters
    const params = {
      q: url.searchParams.get("q")?.trim(),
      cityId: url.searchParams.get("cityId")?.trim(),
      doctorId: url.searchParams.get("doctorId")?.trim(),
      treatmentId: url.searchParams.get("treatmentId")?.trim(),
      cityText: url.searchParams.get("city")?.trim(),
      doctorText: url.searchParams.get("doctor")?.trim(),
      treatmentText: url.searchParams.get("treatment")?.trim(),
      hospitalId: url.searchParams.get("hospitalId")?.trim(),
      page: Math.max(0, Number(url.searchParams.get("page") || "0")),
      pageSize: Math.min(50, Number(url.searchParams.get("pageSize") || "20"))
    }

    console.log("Fetching hospitals with filters:", params)

    // Process text searches to get IDs
    const [cityIdsFromText, doctorIdsFromText, treatmentIdsFromText] = await Promise.all([
      params.cityText ? DataFetcher.searchIdsByName(COLLECTIONS.CITIES, ["city name", "cityName", "name"], params.cityText) : Promise.resolve([]),
      params.doctorText ? DataFetcher.searchIdsByName(COLLECTIONS.DOCTORS, ["Doctor Name", "doctorName", "name"], params.doctorText) : Promise.resolve([]),
      params.treatmentText ? DataFetcher.searchIdsByName(COLLECTIONS.TREATMENTS, ["Treatment Name", "treatmentName", "name"], params.treatmentText) : Promise.resolve([])
    ])

    // Combine IDs from different sources
    const cityIds = [...cityIdsFromText, ...(params.cityId ? [params.cityId] : [])]
    const doctorIds = [...doctorIdsFromText, ...(params.doctorId ? [params.doctorId] : [])]
    const treatmentIds = [...treatmentIdsFromText, ...(params.treatmentId ? [params.treatmentId] : [])]

    // Get hospital IDs from branch filters
    let hospitalIds: string[] = []
    if (cityIds.length || doctorIds.length || treatmentIds.length) {
      hospitalIds = await QueryBuilder.getHospitalIdsFromBranchFilters(cityIds, doctorIds, treatmentIds)
      console.log("Hospital IDs from branch filters:", hospitalIds.length)

      if (hospitalIds.length === 0) {
        return NextResponse.json({
          items: [],
          total: 0,
          ...params
        })
      }
    }

    // Build hospital query
    let hospitalQuery = wixClient.items
      .query(COLLECTIONS.HOSPITALS)
      .descending("_createdDate")
      .limit(params.pageSize)
      .skip(params.page * params.pageSize)

    if (params.hospitalId) {
      hospitalQuery = hospitalQuery.eq("_id", params.hospitalId)
    } else if (hospitalIds.length > 0) {
      hospitalQuery = hospitalQuery.hasSome("_id", hospitalIds)
    }

    // Apply text search to hospitals
    if (params.q) {
      const searchHospitalIds = await DataFetcher.searchIdsByName(COLLECTIONS.HOSPITALS, ["name", "Hospital Name", "hospitalName"], params.q)
      
      if (searchHospitalIds.length === 0) {
        return NextResponse.json({
          items: [],
          total: 0,
          ...params
        })
      }

      if (hospitalIds.length > 0) {
        const intersection = hospitalIds.filter(id => searchHospitalIds.includes(id))
        if (intersection.length === 0) {
          return NextResponse.json({
            items: [],
            total: 0,
            ...params
          })
        }
        hospitalQuery = hospitalQuery.hasSome("_id", intersection)
      } else {
        hospitalQuery = hospitalQuery.hasSome("_id", searchHospitalIds)
      }
    }

    // Fetch hospitals
    const hospitalsResult = await hospitalQuery.find()
    console.log("Fetched hospitals count:", hospitalsResult.items.length)

    // Fetch related branches and enrich data
    const enrichedHospitals = await enrichHospitalsWithRelatedData(
      hospitalsResult.items,
      cityIds,
      doctorIds,
      treatmentIds
    )

    return NextResponse.json({
      items: enrichedHospitals,
      total: hospitalsResult.totalCount || enrichedHospitals.length,
      ...params
    })

  } catch (error) {
    console.error("Error fetching hospitals:", error)
    return NextResponse.json(
      { error: "Failed to fetch hospitals", details: String(error) }, 
      { status: 500 }
    )
  }
}

// Helper function to enrich hospitals with related data
async function enrichHospitalsWithRelatedData(
  hospitals: any[], 
  cityIds: string[], 
  doctorIds: string[], 
  treatmentIds: string[]
) {
  const hospitalIds = hospitals.map(h => h._id!)

  // Fetch branches for these hospitals
  let branchesResult = { items: [] }
  if (hospitalIds.length > 0) {
    branchesResult = await QueryBuilder.buildBranchQuery(
      hospitalIds, undefined, undefined, undefined, true
    )
      .limit(1000)
      .find()
  }

  console.log("Fetched branches count:", branchesResult.items.length)

  // Group branches by hospital and collect reference IDs
  const branchesByHospital: Record<string, any[]> = {}
  const allDoctorIds = new Set<string>()
  const allCityIds = new Set<string>()
  const allTreatmentIds = new Set<string>()

  branchesResult.items.forEach((branch) => {
    const hospitalIdsFromBranch = ReferenceMapper.extractHospitalIds(branch)
    hospitalIdsFromBranch.forEach((hospitalId) => {
      if (hospitalId && hospitalIds.includes(hospitalId)) {
        if (!branchesByHospital[hospitalId]) {
          branchesByHospital[hospitalId] = []
        }
        const mappedBranch = DataMappers.branch(branch)
        branchesByHospital[hospitalId].push(mappedBranch)

        // Collect IDs for additional data
        ReferenceMapper.extractIds(mappedBranch.doctors).forEach(id => allDoctorIds.add(id))
        ReferenceMapper.extractIds(mappedBranch.city).forEach(id => allCityIds.add(id))
        ReferenceMapper.extractIds(mappedBranch.treatments).forEach(id => allTreatmentIds.add(id))
      }
    })
  })

  // Fetch all related data
  const [doctorsData, citiesData, treatmentsData] = await Promise.all([
    DataFetcher.fetchDoctorsWithTreatments(Array.from(allDoctorIds)),
    DataFetcher.fetchCollectionData(COLLECTIONS.CITIES, Array.from(allCityIds), DataMappers.city),
    DataFetcher.fetchCollectionData(COLLECTIONS.TREATMENTS, Array.from(allTreatmentIds), DataMappers.treatment)
  ])

  // Build final hospital objects with enriched data
  return hospitals.map((hospital) => {
    const hospitalBranches = branchesByHospital[hospital._id!] || []

    // Filter branches based on criteria
    const hasCityFilter = cityIds.length > 0
    const hasTreatmentFilter = treatmentIds.length > 0
    
    const filteredBranches = hospitalBranches.filter((branch) => {
      const cityMatch = !hasCityFilter || 
        branch.city?.some((city: any) => cityIds.includes(city._id))
      const treatmentMatch = !hasTreatmentFilter || 
        branch.treatments?.some((treatment: any) => treatmentIds.includes(treatment._id))
      return cityMatch && treatmentMatch
    })

    // Enrich branches with complete data
    const enrichedBranches = filteredBranches.map(branch => ({
      ...branch,
      doctors: branch.doctors.map((doctor: any) => doctorsData[doctor._id] || doctor),
      city: branch.city.map((city: any) => citiesData[city._id] || city),
      treatments: branch.treatments.map((treatment: any) => treatmentsData[treatment._id] || treatment)
    }))

    // Aggregate unique doctors and treatments from filtered branches
    const uniqueDoctors = new Map()
    const uniqueTreatments = new Map()

    enrichedBranches.forEach(branch => {
      branch.doctors.forEach((doctor: any) => {
        if (doctor._id && !uniqueDoctors.has(doctor._id)) {
          uniqueDoctors.set(doctor._id, doctor)
        }
      })
      branch.treatments.forEach((treatment: any) => {
        if (treatment._id && !uniqueTreatments.has(treatment._id)) {
          uniqueTreatments.set(treatment._id, treatment)
        }
      })
    })

    return {
      ...DataMappers.hospital(hospital),
      branches: enrichedBranches,
      doctors: Array.from(uniqueDoctors.values()),
      treatments: Array.from(uniqueTreatments.values())
    }
  })
}