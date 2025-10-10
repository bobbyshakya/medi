import { NextResponse } from "next/server"
import { wixClient } from "@/lib/wixClient"
// Assuming these types are defined in your project
import type {
  Hospital,
  HospitalWithBranchPreview,
  Branch,
  Doctor,
  City, // Assuming you have City and Treatment types
  Treatment, // Assuming you have City and Treatment types
} from "@/types/hospital"

const HOSPITAL_COLLECTION_ID = "HospitalMaster"
const BRANCHES_COLLECTION = "BranchesMaster"
const DOCTOR_COLLECTION_ID = "DoctorMaster"
const CITY_COLLECTION_ID = "CityMaster"
const TREATMENT_COLLECTION_ID = "TreatmentMaster"
const BRANCHES_FIELD = "branches"

// Helper: safely extract value
function val(item: any, ...keys: string[]) {
  for (const k of keys) {
    const v = item?.[k]
    if (v !== undefined && v !== null && v !== "") return v
  }
  return undefined
}

// ✅ Map DoctorMaster (Added explicit return type: Doctor)
function mapDoctor(item: any): Doctor {
  return {
    _id: item._id || item.ID || item.id,
    name: val(item, "DoctorName", "Doctor Name", "name") ?? "Doctor",
    specialization: val(item, "specialization") ?? "specialization",
    qualification: val(item, "qualification") ?? "",
    experienceYears: val(item, "experienceYears") ?? "",
    designation: val(item, "designation") ?? "",
    languagesSpoken: val(item, "languagesSpoken") ?? "",
    about: val(item, "aboutDoctor") ?? "",
    profileImage: val(item, "profileImage", "Profile Image") ?? null,
    // BranchesMaster_doctor: item.BranchesMaster_doctor || [],
  }
}

// ✅ Map CityMaster (Added explicit return type: City)
function mapCity(item: any): City {
  return {
    _id: item._id || item.ID,
    name: val(item, "City Name", "cityName") ?? "City",
    stateId: val(item, "State (ID)") ?? null,
    countryId: val(item, "Country (ID)") ?? null,
  }
}

// ✅ Map TreatmentMaster (Added explicit return type: Treatment)
function mapTreatment(item: any): Treatment {
  return {
    _id: item._id || item.ID,
    name: val(item, "Treatment Name", "name") ?? "Treatment",
    slug: val(item, "slug", "Slug") ?? null,
    description: val(item, "Description") ?? null,
  }
}

// ✅ Map BranchMaster
function mapBranch(
  branch: any,
  doctorList: Doctor[],
  cityList: City[], // Changed type to City[]
  treatmentList: Treatment[] // Changed type to Treatment[]
): Branch & {
  doctors: Doctor[]
  cities: City[] // Changed type to City[]
  treatments: Treatment[] // Changed type to Treatment[]
} {
  const doctorRefs = Array.isArray(branch?.doctor) ? branch.doctor : []
  const cityRefs = Array.isArray(branch?.city) ? branch.city : []
  const treatmentRefs = Array.isArray(branch?.treatment) ? branch.treatment : []

  // Ensure reference objects are handled correctly for lookup
  const doctors = doctorRefs
    .map((d: any) =>
      typeof d === "string"
        ? doctorList.find(dd => dd._id === d)
        : doctorList.find(dd => dd._id === d?._id)
    )
    .filter((d): d is Doctor => Boolean(d)) // Type guard for filtering

  const cities = cityRefs
    .map((c: any) =>
      typeof c === "string"
        ? cityList.find(cc => cc._id === c)
        : cityList.find(cc => cc._id === c?._id)
    )
    .filter((c): c is City => Boolean(c)) // Type guard for filtering

  const treatments = treatmentRefs
    .map((t: any) =>
      typeof t === "string"
        ? treatmentList.find(tt => tt._id === t)
        : treatmentList.find(tt => tt._id === t?._id)
    )
    .filter((t): t is Treatment => Boolean(t)) // Type guard for filtering

  return {
    _id: branch._id,
    slug: branch.slug ?? null,
    name: val(branch, "Branch Name", "branchName", "name"),
    image: val(branch, "Branch Image", "branchImage", "image"),
    address: val(branch, "address"),
    phone: val(branch, "phone"),
    email: val(branch, "email"),
    totalBeds: val(branch, "totalBeds"),
    icuBeds: val(branch, "icuBeds"),
    emergencyContact: val(branch, "emergencyContact"),
    doctors,
    cities,
    treatments,
  } as Branch & { doctors: Doctor[]; cities: City[]; treatments: Treatment[] } // Type assertion to satisfy return type
}

// ✅ Map HospitalMaster
function mapHospital(item: any): Hospital {
  return {
    _id: item._id || item.ID,
    slug: val(item, "slug", "Slug") ?? null,
    name: val(item, "Hospital Name", "hospitalName", "name") ?? "Hospital",
    image: val(item, "Hospital Image", "hospitalImage", "image") ?? null,
    logo: val(item, "Logo", "logo") ?? null,
    yearEstablished: val(item, "Year Established", "yearEstablished") ?? null,
    accreditation: val(item, "Accreditation", "accreditation") ?? null,
    beds: val(item, "No. of Beds", "noOfBeds", "beds") ?? null,
    emergencyServices: val(item, "Emergency Services", "emergencyServices") ?? null,
    description: val(item, "Description", "description") ?? null,
    website: val(item, "Website", "website") ?? null,
    email: val(item, "Email", "email") ?? null,
    contactNumber: val(item, "Contact Number", "contactNumber") ?? null,
    countryId: val(item, "Country (ID)", "countryId") ?? null,
    city: val(item, "city", "City") ?? null,
  }
}

// ✅ Fetch all related collections
async function getAllDoctors(): Promise<Doctor[]> {
  const res = await wixClient.items
    .query(DOCTOR_COLLECTION_ID)
    .limit(1000)
    .find({ consistentRead: true })
  return (res?.items || []).map(mapDoctor)
}

// Added explicit return type: Promise<City[]>
async function getAllCities(): Promise<City[]> {
  const res = await wixClient.items
    .query(CITY_COLLECTION_ID)
    .limit(1000)
    .find({ consistentRead: true })
  return (res?.items || []).map(mapCity)
}

// Added explicit return type: Promise<Treatment[]>
async function getAllTreatments(): Promise<Treatment[]> {
  const res = await wixClient.items
    .query(TREATMENT_COLLECTION_ID)
    .limit(1000)
    .find({ consistentRead: true })
  return (res?.items || []).map(mapTreatment)
}

// ✅ Fetch branches for each hospital
async function getBranchesForHospitals(
  hospitalIds: string[],
  doctorList: Doctor[],
  cityList: City[], // Changed type to City[]
  treatmentList: Treatment[] // Changed type to Treatment[]
) {
  const branchesByHospital: Record<string, any[]> = {}

  for (const hospitalId of hospitalIds) {
    // Note: wixClient.items.queryReferenced may not support the full WixDataQuery interface
    // but the parameters look correct for WixData.queryReferencedItems.
    const res: any = await wixClient.items.queryReferenced(
      HOSPITAL_COLLECTION_ID,
      hospitalId,
      BRANCHES_FIELD,
      { limit: 1000, offset: 0 }
    )
    const items =
      res?.items || res?.referencedItems || res?.data?.items || res?.results || []
    branchesByHospital[hospitalId] = items.map((b: any) =>
      mapBranch(b, doctorList, cityList, treatmentList)
    )
  }

  return branchesByHospital
}

// ✅ API Route (Added explicit return type: Promise<NextResponse>)
export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url)
  const q = url.searchParams.get("q")?.trim()
  const slug = url.searchParams.get("slug")?.trim()
  const cityId = url.searchParams.get("cityId")?.trim()
  const doctorId = url.searchParams.get("doctorId")?.trim()
  const page = Number(url.searchParams.get("page") || "0")
  const pageSize = slug ? 1 : Math.min(50, Number(url.searchParams.get("pageSize") || "20"))

  // Fetch related collections
  const [doctorList, cityList, treatmentList] = await Promise.all([
    getAllDoctors(),
    getAllCities(),
    getAllTreatments(),
  ])

  // Build hospital query
  let query = wixClient.items
    .query(HOSPITAL_COLLECTION_ID)
    .descending("_createdDate")

  // FIX: Removed `as any` from query field names for better type inference/safety
  // Assuming the wix-client library supports string literal for field names.
  // If `wixClient.items.query` is not typed correctly, you might need to keep `as any`.
  // The original code's use of `as any` is to bypass a TypeScript error due to
  // the WixDataQuery type not knowing the collection's field names.
  // We'll revert to the original `as any` to ensure compilation with the existing types,
  // but this is a *type* error, not a *runtime* error.

  if (slug) {
    query = query.eq("Slug" as any, slug)
  } else {
    if (q) query = query.contains("Hospital Name" as any, q)
    if (cityId) query = query.eq("City (ID)" as any, cityId)

    // Filter hospitals by doctorId
    let hospitalIds: string[] | undefined
    if (doctorId) {
      const branchesWithDoctor = await wixClient.items
        .query(BRANCHES_COLLECTION)
        .contains("doctor", doctorId)
        .find()

      // The mapping logic for hospital IDs is complex due to Wix's reference handling
      // and looks correct for mapping multiple references from branch to hospital.
      hospitalIds = Array.from(
        new Set(
          branchesWithDoctor.items.flatMap((b: any) =>
            Array.isArray(b.hospital)
              ? b.hospital.map((h: any) => h?._id).filter(Boolean)
              : b.hospital?._id
              ? [b.hospital._id]
              : []
          )
        )
      )
      if (hospitalIds.length > 0) query = query.hasSome("_id", hospitalIds)
    }
  }

  // Fetch hospitals
  const res = await query
    .skip(slug ? 0 : page * pageSize)
    .limit(pageSize)
    .find({ consistentRead: true })

  const hospitals = (res?.items || []).map(mapHospital)
  const hospitalIdsToFetch = hospitals.map(h => h._id)

  // Fetch branches
  const branchesByHospital = await getBranchesForHospitals(
    hospitalIdsToFetch,
    doctorList,
    cityList,
    treatmentList
  )

  // For single hospital, include all branches, not just preview
  const output: (Hospital | HospitalWithBranchPreview)[] = hospitals.map(h => {
    const branches = branchesByHospital[h._id] || []
    if (slug) {
      return {
        ...h,
        branches, // Full Branch data
      } as Hospital // Type assertion for correct return structure
    }
    return {
      ...h,
      branchesCount: branches.length,
      branchesPreview: branches.slice(0, 2), // Branch preview
    } as HospitalWithBranchPreview // Type assertion for correct return structure
  })

  if (slug) {
    return NextResponse.json({
      item: output[0] || null,
    })
  }

  return NextResponse.json({
    items: output,
    totalCount: res?.totalCount ?? output.length,
    page,
    pageSize,
  })
}