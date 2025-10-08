// --- Collection IDs for Wix Data Queries ---
export const COLLECTION_IDS = {
  HOSPITALS: "HospitalList",
  BRANCHES: "hospitalbrancheslist",
  DOCTORS: "doctor",
  CITIES: "CityMaster",
  STATES: "StateMaster",
  COUNTRIES: "CountryMaster",
} as const

export const DEFAULT_LIMIT = 50

// ----------------------------------------------------------------------
// Helper to map doctor data
// ----------------------------------------------------------------------
export function mapDoctors(doctorsData: any[]) {
  if (!Array.isArray(doctorsData)) return []

  return doctorsData.map((doctor: any) => ({
    _id: doctor._id,
    name: doctor["Doctor Name"] || doctor.name || "Unknown Doctor",
    slug: doctor["Doctor Slug"] || doctor.slug || "",
    hospitalName: doctor["Hospital Name"] || "",
    branchName: doctor["Branch Name"] || "",
    specialty: doctor.Specialty || doctor.Specialist || doctor.specialty || "General",
    designation: doctor.Designation || doctor.designation || "",
    contactPhone: doctor["Contact Phone"] || doctor.phone || "",
    contactEmail: doctor["Contact Email"] || doctor.email || "",
    doctorPageUrl: doctor["Doctor Page URL"] || doctor.pageUrl || "",
    imageUrl: doctor["Doctor Image"] || doctor.imageUrl || "",
    hospitalBranch: doctor["Hospital Branch"] || "",
    createdDate: doctor._createdDate,
    updatedDate: doctor._updatedDate,
  }))
}

// ----------------------------------------------------------------------
// Helper to map country data
// ----------------------------------------------------------------------
export function mapCountryData(country: any) {
  if (!country) return null

  return {
    _id: country._id,
    name: country["Country Name"] || country.name || country.title || "Unknown Country",
    createdDate: country._createdDate,
    updatedDate: country._updatedDate,
  }
}

// ----------------------------------------------------------------------
// Helper to map state data
// ----------------------------------------------------------------------
export function mapStateData(state: any) {
  if (!state) return null

  return {
    _id: state._id,
    name: state["State Name"] || state.name || state.title || "Unknown State",
    country: mapCountryData(state.country),
    createdDate: state._createdDate,
    updatedDate: state._updatedDate,
  }
}

// ----------------------------------------------------------------------
// Helper to map city data
// ----------------------------------------------------------------------
export function mapCityData(city: any) {
  if (!city) return null

  const cityName = city["city name"] || city.cityName || city.name || "Unknown City"

  let stateData = null
  if (city.state) {
    stateData = Array.isArray(city.state)
      ? city.state.length > 0
        ? mapStateData(city.state[0])
        : null
      : mapStateData(city.state)
  }

  let countryData = null
  if (city.country) {
    countryData = Array.isArray(city.country)
      ? city.country.length > 0
        ? mapCountryData(city.country[0])
        : null
      : mapCountryData(city.country)
  }

  return {
    _id: city._id,
    name: cityName,
    state: stateData,
    country: countryData,
    createdDate: city._createdDate,
    updatedDate: city._updatedDate,
  }
}

// ----------------------------------------------------------------------
// Helper to map branch data
// ----------------------------------------------------------------------
export function mapBranchData(branch: any) {
  if (!branch) return null

  let primaryLocationData = branch.primaryLocation || branch["Primary Location"] || null
  // Handle multi-reference: if array, take the first item
  if (Array.isArray(primaryLocationData) && primaryLocationData.length > 0) {
    primaryLocationData = primaryLocationData[0]
  }

  const doctorsData = branch.doctor_hospitalBranch || []
  const doctors = mapDoctors(doctorsData)
  const primaryLocation = mapCityData(primaryLocationData)

  return {
    _id: branch._id,
    branchName: branch["Branch Name"] || branch.branchName || "Unknown Branch",
    slug: branch.Slug || branch.slug || "",
    address: branch.Address || branch.address || "",
    pinCode: branch["Pin Code"] || branch.pinCode || "",
    phone: branch.Phone || branch.phone || "",
    email: branch.Email || branch.email || "",
    branchImageUrl: branch["Branch Image (Image URL)"] || branch["Branch Image"] || branch.branchImageUrl || "",
    mapEmbedUrl: branch["Map Embed (URL)"] || branch.mapEmbedUrl || "",
    primaryLocation,
    doctors,
    createdDate: branch._createdDate,
    updatedDate: branch._updatedDate,
  }
}

// ----------------------------------------------------------------------
// Helper to map hospital data
// ----------------------------------------------------------------------
export function mapHospitalData(hospital: any) {
  if (!hospital) return null

  const rawBranches = hospital.branches || hospital.HospitalList_branches || []
  const mappedBranches = rawBranches.map(mapBranchData).filter(Boolean)

  let gallery = []
  if (hospital["Gallery (Image URLs)"]) {
    gallery = Array.isArray(hospital["Gallery (Image URLs)"])
      ? hospital["Gallery (Image URLs)"]
      : [hospital["Gallery (Image URLs)"]]
  }

  let specialtiesTags = []
  if (hospital["Multi-Specialty"]) {
    specialtiesTags = Array.isArray(hospital["Multi-Specialty"])
      ? hospital["Multi-Specialty"]
      : [hospital["Multi-Specialty"]]
  }

  return {
    _id: hospital._id,
    name: hospital.Name || hospital.name || "Unknown Hospital",
    slug: hospital.Slug || hospital.slug || "",
    logo: hospital["Logo (Image URL)"] || hospital.logo || "",
    bannerImage: hospital["Banner Image (Image URL)"] || hospital.bannerImage || "",
    description: hospital.Description || hospital.description || "",
    establishedDate: hospital["Established Date"] || hospital.establishedDate || null,
    specialtiesTags,
    gallery,
    branches: mappedBranches,
    branchCount: mappedBranches.length,
    createdDate: hospital._createdDate,
    updatedDate: hospital._updatedDate,
  }
}

// ----------------------------------------------------------------------
// Filters
// ----------------------------------------------------------------------
export function filterBranchesByLocation(branches: any[], cityId?: string, stateId?: string, countryId?: string) {
  if (!cityId && !stateId && !countryId) return branches

  return branches.filter((branch: any) => {
    const location = branch.primaryLocation
    if (!location) return false
    if (cityId && location._id !== cityId) return false
    if (stateId && location.state?._id !== stateId) return false
    if (countryId && location.country?._id !== countryId) return false
    return true
  })
}

export function filterHospitalsByLocation(hospitals: any[], cityId?: string, stateId?: string, countryId?: string) {
  if (!cityId && !stateId && !countryId) return hospitals

  return hospitals
    .map((hospital: any) => {
      const filteredBranches = filterBranchesByLocation(hospital.branches || [], cityId, stateId, countryId)
      if (filteredBranches.length === 0) return null
      return { ...hospital, branches: filteredBranches, branchCount: filteredBranches.length }
    })
    .filter(Boolean)
}
