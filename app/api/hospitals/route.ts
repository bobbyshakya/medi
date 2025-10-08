// app/api/hospitals/route.ts
import { wixServerClient } from "@/lib/wixServer"
import type { NextRequest } from "next/server"

// Collection IDs
const COLLECTIONS = {
  HOSPITALS: "HospitalList",
  BRANCHES: "hospitalbrancheslist",
  CITIES: "CityMaster",
  DOCTORS: "doctor",
  TREATMENTS: "Treatments"
}

const DEFAULT_LIMIT = 50

// Helper to extract multi-reference data
const extractReferences = (field: any) => {
  if (!field) return []
  return Array.isArray(field) ? field : [field]
}

// Helper to extract IDs from references
const extractReferenceIds = (field: any): string[] => {
  return extractReferences(field).map((item: any) => item._id || item).filter(Boolean)
}

// Map city data with proper field mapping
const mapCity = (city: any) => {
  if (!city) return null
  
  return {
    id: city._id,
    name: city["city name"] || city.cityName || city.name || "Unknown City",
    state: city.state ? {
      id: city.state._id,
      name: city.state["State Name"] || city.state.name || "Unknown State"
    } : null,
    country: city.contery ? {
      id: city.contery._id,
      name: city.contery["Country Name"] || city.contery.name || "Unknown Country"
    } : null,
  }
}

// Map treatment data
const mapTreatment = (treatment: any) => {
  if (!treatment) return null
  
  return {
    id: treatment._id,
    name: treatment["Treatment Name"] || treatment.name || "Unknown Treatment",
    category: treatment.Category || treatment.category || "General",
    description: treatment.Description || treatment.description || "",
    duration: treatment.Duration || treatment.duration || "",
    cost: treatment.Cost || treatment.cost || ""
  }
}

// Map doctor data with treatments
const mapDoctor = (doctor: any) => {
  if (!doctor) return null
  
  const treatmentRefs = extractReferences(doctor.treatments || doctor.Treatments)
  const treatments = treatmentRefs.map(mapTreatment).filter(Boolean)

  return {
    id: doctor._id,
    name: doctor["Doctor Name"] || doctor.name || "Unknown Doctor",
    slug: doctor["Doctor Slug"] || doctor.slug || "",
    specialty: doctor.Specialty || doctor.Specialist || "General",
    designation: doctor.Designation || "",
    experience: doctor.Experience || doctor.experience || "",
    phone: doctor["Contact Phone"] || doctor.phone || "",
    email: doctor["Contact Email"] || doctor.email || "",
    image: doctor["Doctor Image"] || doctor.imageUrl || "",
    pageUrl: doctor["Doctor Page URL"] || doctor.pageUrl || "",
    treatments: treatments,
    treatmentCount: treatments.length
  }
}

// Map branch data with proper multi-reference handling
const mapBranch = (branch: any) => {
  if (!branch) return null

  // Primary location (city) - handle multi-reference
  let primaryLocation = null
  let primaryLocationName = ""
  
  if (branch["primary Location"]) {
    if (Array.isArray(branch["primary Location"])) {
      if (branch["primary Location"].length > 0) {
        primaryLocation = mapCity(branch["primary Location"][0])
        primaryLocationName = primaryLocation?.name || ""
      }
    } else {
      primaryLocation = mapCity(branch["primary Location"])
      primaryLocationName = primaryLocation?.name || ""
    }
  }

  // Extract city name from address if primary location is empty
  if (!primaryLocationName && branch["Address"]) {
    const address = branch["Address"]
    // Simple city extraction from address (can be enhanced)
    const cityMatch = address.match(/(Delhi|Mumbai|Chennai|Bangalore|Hyderabad|Kolkata|Pune|Gurgaon|Noida|Mohali|Patiala|Dehradun|Goa|Ludhiana|Patna)/i)
    if (cityMatch) {
      primaryLocationName = cityMatch[0]
    }
  }

  // Hospital references
  const hospitalRefs = extractReferences(branch["HospitalList_branches"])
  const hospitalIds = hospitalRefs.map((hosp: any) => hosp._id || hosp).filter(Boolean)
  
  const hospitals = hospitalRefs.map((hosp: any) => ({
    id: hosp._id,
    name: hosp.Name || hosp.name || "Unknown Hospital"
  }))

  // Doctor references
  const doctorRefs = extractReferences(branch["doctor_hospitalBranch"])
  const doctorIds = doctorRefs.map((doc: any) => doc._id || doc).filter(Boolean)
  const doctors = doctorRefs.map(mapDoctor).filter(Boolean)

  return {
    // CSV Fields (exact match with Wix CMS)
    "Branch Name": branch["Branch Name"] || branch.branchName || "Unknown Branch",
    "primary Location": primaryLocationName,
    "HospitalList_branches": hospitalIds,
    "Branch Image": branch["Branch Image"] || "",
    "Slug": branch.Slug || branch.slug || "",
    "Address": branch.Address || branch.address || "",
    "Pin Code": branch["Pin Code"] || branch.pinCode || "",
    "Phone": branch.Phone || branch.phone || "",
    "Email": branch.Email || branch.email || "",
    "Branch Image (Image URL)": branch["Branch Image (Image URL)"] || branch["Branch Image"] || branch.branchImageUrl || "",
    "Map Embed (URL)": branch["Map Embed (URL)"] || branch.mapEmbedUrl || "",
    "doctor_hospitalBranch": doctorIds,
    
    // System Fields
    "ID": branch._id,
    "Created date": branch._createdDate,
    "Updated date": branch._updatedDate,
    "Owner": branch._owner || "",

    // Enhanced data
    id: branch._id,
    location: primaryLocation,
    hospitals: hospitals,
    doctors: doctors,
    doctorCount: doctors.length
  }
}

// Map hospital data with branches
const mapHospital = (hospital: any) => {
  if (!hospital) return null

  // Process branches
  const branchRefs = extractReferences(hospital.branches || hospital.HospitalList_branches)
  const branches = branchRefs.map(mapBranch).filter(Boolean)

  // Group branches by city
  const branchesByCity = branches.reduce((acc: any, branch: any) => {
    const cityName = branch["primary Location"] || "Unknown City"
    if (!acc[cityName]) acc[cityName] = []
    acc[cityName].push(branch)
    return acc
  }, {})

  // Multi-specialty tags
  const specialties = extractReferences(hospital["Multi-Specialty"])

  // Gallery images
  const gallery = extractReferences(hospital["Gallery (Image URLs)"])

  return {
    // CSV Fields (exact match with Wix CMS)
    "Name": hospital.Name || hospital.name || "Unknown Hospital",
    "Slug": hospital.Slug || hospital.slug || "",
    "branches": extractReferenceIds(hospital.branches || hospital.HospitalList_branches),
    "Logo (Image URL)": hospital["Logo (Image URL)"] || hospital.logo || "",
    "Banner Image (Image URL)": hospital["Banner Image (Image URL)"] || hospital.bannerImage || "",
    "Description": hospital.Description || hospital.description || "",
    "Established Date": hospital["Established Date"] || hospital.establishedDate || "",
    "Multi-Specialty": specialties,
    "Gallery (Image URLs)": gallery,
    
    // System Fields
    "ID": hospital._id,
    "Created date": hospital._createdDate,
    "Updated date": hospital._updatedDate,
    "Owner": hospital._owner || "",

    // Enhanced data
    id: hospital._id,
    branches: branches,
    branchesByCity: branchesByCity,
    branchCount: branches.length,
    specialties: specialties,
    gallery: gallery
  }
}

// GET - Fetch hospitals with branches and doctors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const skip = parseInt(searchParams.get("skip") || "0")
    const limit = Math.min(parseInt(searchParams.get("limit") || DEFAULT_LIMIT.toString()), 100)
    const search = searchParams.get("search") || ""
    const hospitalId = searchParams.get("hospitalId") || ""
    const city = searchParams.get("city") || ""

    // Build query with ALL necessary includes
    let query = wixServerClient.items
      .query(COLLECTIONS.HOSPITALS)
      .include(
        "branches",
        "branches.primaryLocation",
        "branches.primaryLocation.state",
        "branches.primaryLocation.contery",
        "branches.HospitalList_branches",
        "branches.doctor_hospitalBranch",
        "branches.doctor_hospitalBranch.treatments"
      )
      .skip(skip)
      .limit(limit)

    // Apply filters
    if (search) query = query.contains("Name", search)
    if (hospitalId) query = query.eq("_id", hospitalId)

    const response = await query.find({ consistentRead: true })

    if (!response?.items?.length) {
      return Response.json({
        data: [],
        totalCount: 0,
        hasMore: false,
        message: "No hospitals found"
      }, {
        status: 200,
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      })
    }

    // Map hospitals with branches
    const hospitals = response.items.map(mapHospital).filter(Boolean)

    // Filter by city if specified
    const filteredHospitals = city ? 
      hospitals.filter((hospital: any) => 
        Object.keys(hospital.branchesByCity).some(cityName => 
          cityName.toLowerCase().includes(city.toLowerCase())
        )
      ) : 
      hospitals

    const hasMore = (response.totalCount || 0) > skip + filteredHospitals.length

    return Response.json({
      data: filteredHospitals,
      totalCount: filteredHospitals.length,
      hasMore,
      filters: { search, hospitalId, city }
    }, {
      status: 200,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    })

  } catch (error: any) {
    console.error("GET Error:", error)
    return Response.json({
      error: "Failed to fetch hospitals",
      message: error.message,
      data: [],
      totalCount: 0
    }, {
      status: 500,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    })
  }
}

// POST - Additional endpoints
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, limit = 50, skip = 0, search, hospitalId, city } = body

    if (action === 'getBranches') {
      let query = wixServerClient.items
        .query(COLLECTIONS.BRANCHES)
        .include(
          "primaryLocation",
          "primaryLocation.state",
          "primaryLocation.contery",
          "HospitalList_branches",
          "doctor_hospitalBranch",
          "doctor_hospitalBranch.treatments"
        )
        .limit(Math.min(limit, 100))
        .skip(skip)

      if (search) query = query.contains("Branch Name", search)
      if (hospitalId) query = query.eq("HospitalList_branches", hospitalId)

      const response = await query.find({ consistentRead: true })

      const branches = response.items?.map(mapBranch).filter(Boolean) || []

      // Filter by city
      const filteredBranches = city ? 
        branches.filter((branch: any) => 
          branch["primary Location"]?.toLowerCase().includes(city.toLowerCase())
        ) : 
        branches

      return Response.json({
        data: filteredBranches,
        totalCount: filteredBranches.length,
        success: true
      }, {
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      })
    }

    return Response.json({
      error: "Invalid action",
      message: "Supported actions: getBranches"
    }, {
      status: 400,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    })

  } catch (error: any) {
    console.error("POST Error:", error)
    return Response.json({
      error: "Failed to process request",
      message: error.message,
      success: false
    }, {
      status: 500,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    })
  }
}

// CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}