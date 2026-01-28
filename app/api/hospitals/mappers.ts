// app/api/hospitals/mappers.ts
// Data mapping functions

import { getValue, extractRichText, extractRichTextHTML } from './shared-utils'
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

    let stateRefs = ReferenceMapper.multiReference(
      item.state || item.State || item.stateRef || item.state_master || item.stateMaster || item.StateMaster || item.StateMaster_state || item.state_master,
      "state", "State Name", "name", "title", "State", "stateName", "StateName", "state_name", "displayName"
    )

    if (stateRefs.length === 0) {
      const directState = getValue(item, "state", "State", "stateName", "State Name")
      if (directState) {
        stateRefs = [{ name: directState, _id: `direct-${cityName.toLowerCase()}` }]
      }
    }

    let stateName = "Unknown State"
    let countryName = "Unknown Country"
    let stateId: string | null = null
    let countryId: string | null = null

    if (stateRefs.length > 0) {
      const stateRef = stateRefs[0]
      stateId = stateRef._id && !stateRef._id.startsWith('direct-') ? stateRef._id : null

      if (stateId && stateMap[stateId]) {
        const fullState = stateMap[stateId]
        if (fullState.name && fullState.name !== "Unknown State") {
          stateName = fullState.name

          if (fullState.country && fullState.country.length > 0) {
            const countryRef = fullState.country[0]
            countryId = countryRef._id
            const mappedCountry = countryId ? countryMap[countryId] : null
            countryName = mappedCountry?.name || countryRef.name || "India"
          } else {
            countryName = "India"
          }
        }
      } else {
        if (stateRef.name && stateRef.name !== "ID Reference" && stateRef.name !== "Unknown") {
          stateName = stateRef.name
          countryName = "India"
        }
      }
    }

    if (stateName === "Unknown State" && item.state && typeof item.state === 'object') {
      const embeddedState = Array.isArray(item.state) ? item.state[0] : item.state
      if (embeddedState) {
        const embeddedName = getValue(embeddedState, "state", "State Name", "name", "title", "State", "stateName")
        if (embeddedName && embeddedName !== "Unknown State") {
          stateName = embeddedName
          countryName = "India"
        }
      }
    }

    const lowerCityName = cityName.toLowerCase()
    if (stateName === "Unknown State") {
      if (lowerCityName.includes("mumbai") || lowerCityName.includes("pune") || lowerCityName.includes("nashik") ||
          lowerCityName.includes("nagpur") || lowerCityName.includes("aurangabad")) {
        stateName = "Maharashtra"
        countryName = "India"
      } else if (lowerCityName.includes("chennai") || lowerCityName.includes("coimbatore") ||
                 lowerCityName.includes("madurai")) {
        stateName = "Tamil Nadu"
        countryName = "India"
      } else if (lowerCityName.includes("bangalore") || lowerCityName.includes("bengaluru") ||
                 lowerCityName.includes("mysore")) {
        stateName = "Karnataka"
        countryName = "India"
      } else if (lowerCityName.includes("hyderabad") || lowerCityName.includes("vizag") ||
                 lowerCityName.includes("vijayawada")) {
        stateName = "Telangana/Andhra Pradesh"
        countryName = "India"
      } else if (lowerCityName.includes("kolkata") || lowerCityName.includes("howrah") ||
                 lowerCityName.includes("asansol")) {
        stateName = "West Bengal"
        countryName = "India"
      } else if (lowerCityName.includes("ahmedabad") || lowerCityName.includes("surat") ||
                 lowerCityName.includes("vadodara")) {
        stateName = "Gujarat"
        countryName = "India"
      } else if (lowerCityName.includes("jaipur") || lowerCityName.includes("jodhpur") ||
                 lowerCityName.includes("udaipur")) {
        stateName = "Rajasthan"
        countryName = "India"
      }
    }

    const cityData = {
      _id: item._id,
      cityName: cityName,
      stateId: stateId || undefined,
      state: stateName,
      countryId: countryId || undefined,
      country: countryName,
    }

    return cityData // Note: normalizeDelhiNCR removed for now, can be added back if needed
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