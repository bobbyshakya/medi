// app/api/hospitals/mappers.ts
// Data mapping functions

import { getValue, extractRichText, extractRichTextHTML } from './shared-utils'
import { normalizeDelhiNCR } from './utils'
import type { HospitalData, BranchData, DoctorData, CityData } from './types'

/**
 * Maps hospital data from Wix
 */
export const DataMappers = {
  hospital: (item: any, isFromBranch: boolean = false): HospitalData => {
    if (isFromBranch) {
      const branchLogo =
        item.logo ||
        item.data?.logo ||
        item.Logo ||
        item.data?.Logo ||
        item.branchLogo ||
        item.data?.branchLogo ||
        item.hospitalLogo ||
        item.data?.hospitalLogo

      return {
        _id: `standalone-${item._id || item.ID}`,
        hospitalName: getValue(item, "branchName", "hospitalName", "Hospital Name") || "Unknown Hospital",
        description: extractRichText(item.description || item.data?.description || item.Description),
        specialty: ReferenceMapper.multiReference(item.specialty, "specialty", "Specialty Name", "title", "name"),
        yearEstablished: getValue(item, "yearEstablished", "Year Established"),
        hospitalImage: item.branchImage || item.hospitalImage || item.data?.branchImage || item.data?.hospitalImage || item["Branch Image"],
        logo: branchLogo,
        isStandalone: true,
        originalBranchId: item._id || item.ID,
        branches: [],
        doctors: [],
        specialists: [],
        treatments: [],
        accreditations: [],
        showHospital: getValue(item, "showHospital") === "true",
      }
    }

    return {
      _id: item._id || item.ID,
      hospitalName: getValue(item, "hospitalName", "Hospital Name") || "Unknown Hospital",
      description: extractRichText(item.description || item.data?.description || item.Description),
      specialty: ReferenceMapper.multiReference(item.specialty, "specialty", "Specialty Name", "title", "name"),
      yearEstablished: getValue(item, "yearEstablished", "Year Established"),
      hospitalImage: item.hospitalImage || item.data?.hospitalImage || item["hospitalImage"],
      logo: item.logo || item.data?.logo || item.Logo,
      isStandalone: false,
      branches: [],
      doctors: [],
      specialists: [],
      treatments: [],
      accreditations: [],
      showHospital: getValue(item, "showHospital") === "true",
    }
  },

  branch: (item: any): BranchData => ({
    _id: item._id || item.ID,
    branchName: getValue(item, "branchName", "Branch Name") || "Unknown Branch",
    address: getValue(item, "address", "Address"),
    city: ReferenceMapper.multiReference(item.city, "cityName", "city name", "name"),
    specialty: ReferenceMapper.multiReference(item.specialty, "specialization", "Specialty Name", "title", "name"),
    accreditation: ReferenceMapper.multiReference(item.accreditation, "title", "Title"),
    description: extractRichText(item.description || item.data?.description || item.Description),
    totalBeds: getValue(item, "totalBeds", "Total Beds"),
    noOfDoctors: getValue(item, "noOfDoctors", "No of Doctors"),
    yearEstablished: getValue(item, "yearEstablished"),
    branchImage: item.branchImage || item.data?.branchImage || item["Branch Image"],
    logo: item.logo || item.data?.logo || item.Logo,
    doctors: ReferenceMapper.multiReference(item.doctor, "doctorName", "Doctor Name"),
    specialists: ReferenceMapper.multiReference(item.specialist, "specialty", "Specialty Name", "title", "name"),
    treatments: ReferenceMapper.multiReference(
      item.treatment || item["treatment"],
      "treatmentName",
      "Treatment Name",
      "title",
      "name",
    ),
    specialization: [
      ...ReferenceMapper.multiReference(item.specialty, "specialty", "Specialty Name", "title", "name"),
      ...ReferenceMapper.multiReference(
        item.treatment || item["treatment"],
        "treatmentName",
        "Treatment Name",
        "title",
        "name",
      ).map((t) => ({
        ...t,
        name: t.name + " (Treatment)",
        isTreatment: true,
      })),
    ],
    popular: getValue(item, "popular") === "true",
    isStandalone: false, // Will be set by helper
    showHospital: getValue(item, "showHospital") === "true", // Will be set by helper
  }),

  doctor: (item: any): DoctorData => {
    const aboutField = item.aboutDoctor || item["aboutDoctor"] || item.data?.aboutDoctor || item.data?.["aboutDoctor"]
    const specialization = ReferenceMapper.multiReference(
      item.specialization || item["specialization"],
      "specialty",
      "Specialty Name",
      "title",
      "name",
    )

    return {
      _id: item._id || item.ID,
      doctorName: getValue(item, "doctorName", "Doctor Name") || "Unknown Doctor",
      specialization,
      qualification: getValue(item, "qualification", "Qualification"),
      experienceYears: getValue(item, "experienceYears", "Experience (Years)"),
      designation: getValue(item, "designation", "Designation"),
      aboutDoctor: extractRichText(aboutField),
      aboutDoctorHtml: extractRichTextHTML(aboutField),
      profileImage: item["profileImage"] || item["profile Image"] || item.profileImage || item.data?.profileImage,
      popular: getValue(item, "popular") === "true",
    }
  },

  cityWithFullRefs: (item: any, stateMap: Record<string, any>, countryMap: Record<string, any>): CityData => {
    const cityName = getValue(item, "cityName", "city name", "name", "City Name") || "Unknown City"

    // Extract state reference from multiple possible field names
    const stateField = item.state || item.State || item.stateRef || item.state_master || item.stateMaster || item.StateMaster || item.StateMaster_state || item.state_master
    
    let stateRefs: any[] = []
    let stateId: string | null = null
    let stateName = "Unknown State"
    let countryName = "India"
    let resolvedCountryId: string | null = null

    // Handle different state field formats
    if (stateField) {
      if (Array.isArray(stateField) && stateField.length > 0) {
        // Array of state references
        stateRefs = stateField.filter(Boolean)
      } else if (typeof stateField === 'object') {
        // Single state reference object
        stateRefs = [stateField]
      } else if (typeof stateField === 'string' && stateField.trim()) {
        // Direct state ID or name string
        stateId = stateField.trim()
      }
    }

    // If we have state references, process them
    if (stateRefs.length > 0) {
      const stateRef = stateRefs[0]
      const refId = stateRef._id || stateRef.ID || stateRef.data?._id
      const refName = getValue(stateRef, "state", "State Name", "name", "title", "State", "stateName", "StateName", "state_name", "displayName")

      if (refId) {
        stateId = refId
      }

      if (refName && refName !== "Unknown" && refName !== "ID Reference") {
        stateName = refName
      }
    }

    // Try to look up state in the map if we have an ID
    if (stateId && stateMap[stateId]) {
      const fullState = stateMap[stateId]
      if (fullState) {
        if (fullState.name && fullState.name !== "Unknown State") {
          stateName = fullState.name
        }
        // Get country from state
        if (fullState.country && Array.isArray(fullState.country) && fullState.country.length > 0) {
          const countryRef = fullState.country[0]
          resolvedCountryId = countryRef._id
          const mappedCountry = resolvedCountryId ? countryMap[resolvedCountryId] : null
          countryName = mappedCountry?.name || countryRef?.name || "India"
        }
      }
    } else if (stateId && stateRefs.length > 0 && !stateRefs[0]?.name) {
      // State ID not found in map, try to get name from the state field itself
      if (typeof stateField === 'object' && stateField) {
        const embeddedName = getValue(stateField, "state", "State Name", "name", "title", "State", "stateName")
        if (embeddedName && embeddedName !== "Unknown State") {
          stateName = embeddedName
        }
      } else if (typeof stateField === 'string' && stateField.trim()) {
        // It's a direct state name string
        stateName = stateField.trim()
      }
    }

    // Fallback: infer state from city name if still unknown
    const lowerCityName = cityName.toLowerCase()
    if (stateName === "Unknown State" || !stateName) {
      const cityStateMapping: Record<string, string> = {
        // Maharashtra
        'mumbai': 'Maharashtra', 'pune': 'Maharashtra', 'nashik': 'Maharashtra',
        'nagpur': 'Maharashtra', 'aurangabad': 'Maharashtra', 'kolhapur': 'Maharashtra',
        'navi mumbai': 'Maharashtra', 'thane': 'Maharashtra', 'solapur': 'Maharashtra',
        // Tamil Nadu
        'chennai': 'Tamil Nadu', 'coimbatore': 'Tamil Nadu', 'madurai': 'Tamil Nadu',
        'trichy': 'Tamil Nadu', 'tiruchirappalli': 'Tamil Nadu', 'salem': 'Tamil Nadu',
        'vellore': 'Tamil Nadu',
        // Karnataka
        'bangalore': 'Karnataka', 'bengaluru': 'Karnataka', 'mysore': 'Karnataka',
        'mangalore': 'Karnataka', 'hubli': 'Karnataka', 'belgaum': 'Karnataka',
        // Telangana/Andhra Pradesh
        'hyderabad': 'Telangana/Andhra Pradesh', 'vizag': 'Telangana/Andhra Pradesh',
        'vijayawada': 'Telangana/Andhra Pradesh', 'visakhapatnam': 'Telangana/Andhra Pradesh',
        'secunderabad': 'Telangana/Andhra Pradesh', 'warangal': 'Telangana/Andhra Pradesh',
        // West Bengal
        'kolkata': 'West Bengal', 'howrah': 'West Bengal', 'asansol': 'West Bengal',
        'durgapur': 'West Bengal', 'siliguri': 'West Bengal',
        // Gujarat
        'ahmedabad': 'Gujarat', 'surat': 'Gujarat', 'vadodara': 'Gujarat',
        'navsari': 'Gujarat', 'rajkot': 'Gujarat', 'jamnagar': 'Gujarat',
        'bharuch': 'Gujarat', 'gandhinagar': 'Gujarat', 'bhavnagar': 'Gujarat',
        // Rajasthan
        'jaipur': 'Rajasthan', 'jodhpur': 'Rajasthan', 'udaipur': 'Rajasthan',
        'kota': 'Rajasthan', 'bikaner': 'Rajasthan', 'ajmer': 'Rajasthan',
        // Delhi NCR
        'delhi': 'Delhi NCR', 'new delhi': 'Delhi NCR', 'gurugram': 'Delhi NCR',
        'gurgaon': 'Delhi NCR', 'noida': 'Delhi NCR', 'faridabad': 'Delhi NCR',
        'ghaziabad': 'Delhi NCR', 'greater noida': 'Delhi NCR',
        // Other major cities
        'kochi': 'Kerala', 'thiruvananthapuram': 'Kerala', 'kozhikode': 'Kerala',
        'lucknow': 'Uttar Pradesh', 'kanpur': 'Uttar Pradesh', 'varanasi': 'Uttar Pradesh',
        'prayagraj': 'Uttar Pradesh', 'agra': 'Uttar Pradesh',
        'chandigarh': 'Chandigarh', 'panchkula': 'Chandigarh',
        'bhubaneswar': 'Odisha', 'cuttack': 'Odisha',
        'indore': 'Madhya Pradesh', 'bhopal': 'Madhya Pradesh', 'gwalior': 'Madhya Pradesh',
        'patna': 'Bihar', 'muzaffarpur': 'Bihar', 'gaya': 'Bihar',
        'dehradun': 'Uttarakhand', 'haridwar': 'Uttarakhand', 'roorkee': 'Uttarakhand',
        'shimla': 'Himachal Pradesh', 'manali': 'Himachal Pradesh',
        'srinagar': 'Jammu and Kashmir', 'jammu': 'Jammu and Kashmir',
        'guwahati': 'Assam', 'shillong': 'Meghalaya', 'dimapur': 'Nagaland',
        'imphal': 'Manipur', 'aizawl': 'Mizoram', 'agartala': 'Tripura',
        'panaji': 'Goa', 'margao': 'Goa', 'vasco da gama': 'Goa',
        'amritsar': 'Punjab', 'ludhiana': 'Punjab', 'jalandhar': 'Punjab',
        'ranchi': 'Jharkhand', 'jamshedpur': 'Jharkhand', 'dhanbad': 'Jharkhand',
        'akola': 'Maharashtra', 'amaravati': 'Maharashtra',
      }
      
      // Check for partial matches
      for (const [city, state] of Object.entries(cityStateMapping)) {
        if (lowerCityName.includes(city) || lowerCityName === city) {
          stateName = state
          break
        }
      }
    }

    const cityData = {
      _id: item._id,
      cityName: cityName,
      stateId: stateId || undefined,
      state: stateName,
      countryId: resolvedCountryId || undefined,
      country: countryName,
    }

    // Apply Delhi NCR normalization
    return normalizeDelhiNCR(cityData)
  },

  accreditation: (item: any) => ({
    _id: item._id,
    title: getValue(item, "title", "Title") || "Unknown Accreditation",
    image: item.image || item.data?.image || item.Image,
  }),

  specialty: (item: any) => ({
    _id: item._id,
    specialty: getValue(item, "specialty", "Specialty Name", "title", "name") || "Unknown Specialty",
  }),

  country: (item: any) => ({
    _id: item._id,
    name: getValue(item, "countryName", "Country Name", "Country", "name", "title") || "Unknown Country",
  }),

  state: (item: any) => ({
    _id: item._id,
    name: getValue(item, "state", "State Name", "State", "name", "title", "stateName", "StateName", "state_name", "displayName") || "Unknown State",
    country: ReferenceMapper.multiReference(item.country || item.CountryMaster_state || item.Country || item.countryRef || item.country_ref, "country", "Country Name", "Country", "name", "title"),
  }),

  department: (item: any) => ({
    _id: item._id || item.ID,
    name: getValue(item, "department", "Name") || "Unknown Department",
  }),

  specialist: (item: any) => ({
    _id: item._id || item.ID,
    name: getValue(item, "specialty", "Specialty Name", "title", "name") || "Unknown Specialist",
    department: ReferenceMapper.multiReference(item.department, "department", "Name"),
    treatments: ReferenceMapper.multiReference(
      item.treatment || item["treatment"],
      "treatmentName",
      "Treatment Name",
      "title",
      "name",
    ),
  }),

  treatment: (item: any) => ({
    _id: item._id || item.ID,
    name: getValue(item, "treatmentName", "Treatment Name", "title", "name") || "Unknown Treatment",
    description: extractRichText(item.Description || item.description),
    startingCost: getValue(item, "averageCost", "Starting Cost"),
    treatmentImage: item["treatmentImage"] || item.treatmentImage || item.data?.["treatment image"],
    popular: getValue(item, "popular") === "true",
    category: getValue(item, "category", "Category"),
    duration: getValue(item, "duration", "Duration"),
    cost: getValue(item, "cost", "Cost", "averageCost"),
  }),
}

/**
 * Reference mapping utilities
 */
export const ReferenceMapper = {
  multiReference: (field: any, ...nameKeys: string[]): any[] => {
    let items = []
    if (field) {
      items = Array.isArray(field) ? field : [field]
    }

    return items
      .filter(Boolean)
      .map((ref: any) => {
        if (typeof ref !== "object" && typeof ref !== "string") return null

        if (typeof ref === "string") return { _id: ref, name: "ID Reference" }

        if (typeof ref === "object") {
          const name = getValue(ref, ...nameKeys) || ref.name || ref.title || "Unknown"
          const id = ref._id || ref.ID || ref.data?._id || ref.wixId

          const finalName = name === "Unknown" ? (id ? "ID Reference" : "Unknown") : name
          return finalName && id ? { _id: id, name: finalName, ...ref } : null
        }
        return null
      })
      .filter(Boolean)
  },

  extractIds: (refs: any[]): string[] =>
    refs.map((r) => (typeof r === "string" ? r : r?._id || r?.ID || r?.data?._id)).filter(Boolean) as string[],

  extractHospitalIds: (branch: any): string[] => {
    const set = new Set<string>()
    const keys = ["hospital", "HospitalMaster_branches", "hospitalGroup", "Hospital Group Master"]

    keys.forEach((k) => {
      const val = branch[k] || branch.data?.[k]
      if (!val) return
      if (typeof val === "string") set.add(val)
      else if (Array.isArray(val)) {
        val.forEach((i: any) => {
          const id = typeof i === "string" ? i : i?._id || i?.ID || i?.data?._id
          id && set.add(id)
        })
      } else if (val?._id || val?.ID || val?.data?._id) {
        set.add(val._id || val.ID || val.data._id)
      }
    })

    const directHospitalRef = branch.hospital || branch.data?.hospital
    if (directHospitalRef) {
      if (typeof directHospitalRef === "string") {
        set.add(directHospitalRef)
      } else if (Array.isArray(directHospitalRef)) {
        directHospitalRef.forEach((h: any) => {
          const id = typeof h === "string" ? h : h?._id || h?.ID || h?.data?._id
          id && set.add(id)
        })
      } else if (directHospitalRef?._id || directHospitalRef?.ID || directHospitalRef?.data?._id) {
        set.add(directHospitalRef._id || directHospitalRef.ID || directHospitalRef.data._id)
      }
    }

    return Array.from(set)
  },
}