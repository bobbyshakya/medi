// app/api/hospitals/route.ts
import { NextResponse } from "next/server"
import { wixClient } from "@/lib/wixClient"

const COLLECTIONS = {
  BRANCHES: "BranchesMaster",
  DOCTORS: "DoctorMaster",
  CITIES: "CityMaster",
  HOSPITALS: "HospitalMaster",
  ACCREDITATIONS: "Accreditation",
  SPECIALTIES: "SpecialistsMaster",
  DEPARTMENTS: "Department",
  TREATMENTS: "TreatmentMaster",
  STATES: "StateMaster",
  COUNTRIES: "CountryMaster",
}

// ==============================
// HELPER FUNCTIONS
// ==============================

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

// DYNAMIC DELHI NCR DETECTION AND NORMALIZATION
const normalizeDelhiNCR = (cityData: any) => {
  const cityName = (cityData.cityName || "").toLowerCase().trim();
  const stateName = (cityData.state || "").toLowerCase().trim();
  
  const isDelhiNCRCity = 
    cityName.includes("delhi") || 
    cityName.includes("gurugram") || 
    cityName.includes("gurgaon") ||
    cityName.includes("noida") ||
    cityName.includes("faridabad") ||
    cityName.includes("ghaziabad");
  
  const isDelhiNCRState = 
    stateName.includes("delhi") || 
    stateName.includes("ncr") ||
    stateName === "delhi ncr";
  
  const isDelhiNCRRegion = 
    (stateName === "haryana" || stateName.includes("haryana")) && 
    (cityName.includes("gurugram") || cityName.includes("gurgaon") || cityName.includes("faridabad")) ||
    (stateName === "uttar pradesh" || stateName.includes("uttar pradesh") || stateName.includes("up")) && 
    (cityName.includes("noida") || cityName.includes("ghaziabad") || cityName.includes("greater noida"));
  
  if (isDelhiNCRCity || isDelhiNCRState || isDelhiNCRRegion) {
    return {
      ...cityData,
      cityName: cityData.cityName || "Unknown City",
      state: "Delhi NCR",
      country: "India",
    };
  }
  
  return {
    ...cityData,
    cityName: cityData.cityName || "Unknown City",
    state: cityData.state || "Unknown State",
    country: cityData.country || (cityData.state && cityData.state !== "Unknown State" ? "India" : "Unknown Country"),
  };
};

function extractRichText(richContent: any): string {
  if (!richContent) return ""
  if (typeof richContent === "string") return richContent.trim()

  if (richContent.data && richContent.data.aboutDoctor !== undefined) {
    richContent = richContent.data
  }

  try {
    if (richContent.nodes && Array.isArray(richContent.nodes)) {
      return richContent.nodes
        .map((node: any) => {
          if (node.nodes && Array.isArray(node.nodes)) {
            return node.nodes.map((child: any) => child.textData?.text || child.text || "").join("")
          }
          return node.textData?.text || node.text || ""
        })
        .filter(Boolean)
        .join("\n")
        .trim()
    }
  } catch (e) {
    console.warn("Rich text parse failed:", e)
  }

  return String(richContent).trim() || ""
}

function extractRichTextHTML(richContent: any): string {
  if (!richContent) return ""
  if (typeof richContent === "string") return richContent

  if (richContent.data) richContent = richContent.data

  let html = ""
  try {
    if (richContent.nodes && Array.isArray(richContent.nodes)) {
      richContent.nodes.forEach((node: any) => {
        const text =
          node.nodes?.map((n: any) => n.textData?.text || n.text || "").join("") ||
          node.textData?.text ||
          node.text ||
          ""

        switch (node.type) {
          case "PARAGRAPH":
            html += `<p>${text}</p>`
            break
          case "HEADING_ONE":
            html += `<h1>${text}</h1>`
            break
          case "HEADING_TWO":
            html += `<h2>${text}</h2>`
            break
          case "HEADING_THREE":
            html += `<h3>${text}</h3>`
            break
          case "BULLETED_LIST":
            html += "<ul>"
            node.nodes?.forEach((li: any) => {
              const liText = li.nodes?.map((n: any) => n.textData?.text || n.text || "").join("")
              html += `<li>${liText}</li>`
            })
            html += "</ul>"
            break
          case "ORDERED_LIST":
            html += "<ol>"
            node.nodes?.forEach((li: any) => {
              const liText = li.nodes?.map((n: any) => n.textData?.text || n.text || "").join("")
              html += `<li>${liText}</li>`
            })
            html += "</ol>"
            break
          default:
            if (text) html += `<p>${text}</p>`
        }
      })
      return html || extractRichText(richContent)
    }
  } catch (e) {
    console.warn("HTML parse failed:", e)
  }

  return extractRichText(richContent)
}

function getValue(item: any, ...keys: string[]): string | null {
  for (const key of keys) {
    const val = item?.[key] ?? item?.data?.[key]
    if (val !== undefined && val !== null && val !== "") {
      return String(val).trim()
    }
  }
  return null
}

// Helper function to check if ShowHospital is true
const shouldShowHospital = (branch: any): boolean => {
  // Check ShowHospital field from multiple possible locations
  const showHospital = 
    branch.showHospital || 
    branch.ShowHospital || 
    branch.data?.showHospital || 
    branch.data?.ShowHospital;
  
  // Return true if showHospital is explicitly true, false otherwise
  return showHospital === true || showHospital === "true";
};

// ==============================
// UPDATED HELPER: Check if branch is standalone
// ==============================

const isStandaloneBranch = (branch: any): boolean => {
  // Check if branch has NO hospital group reference
  const hospitalGroupRefs = [
    branch.HospitalMaster_branches,
    branch.data?.HospitalMaster_branches,
    branch.hospitalGroup,
    branch.data?.hospitalGroup,
    branch["Hospital Group Master"],
    branch.data?.["Hospital Group Master"]
  ];
  
  // Check if ANY hospital group reference exists
  const hasHospitalGroupRef = hospitalGroupRefs.some(ref => {
    if (!ref) return false;
    if (typeof ref === 'string' && ref.trim() !== '') return true;
    if (Array.isArray(ref) && ref.length > 0) return true;
    if (typeof ref === 'object' && Object.keys(ref).length > 0) return true;
    return false;
  });
    
  // Check if branch has direct hospital reference
  const directHospitalRef = branch.hospital || branch.data?.hospital;
  const hasDirectHospitalRef = 
    (typeof directHospitalRef === 'string' && directHospitalRef.trim() !== '') ||
    (Array.isArray(directHospitalRef) && directHospitalRef.length > 0) ||
    (typeof directHospitalRef === 'object' && directHospitalRef !== null);
    
  // If there's no hospital group reference AND no direct hospital reference,
  // then this is a standalone branch that should be treated as individual hospital
  return !hasHospitalGroupRef && !hasDirectHospitalRef;
};

// DATA MAPPERS
const DataMappers = {
  // UPDATED: Enhanced hospital mapper to handle standalone branches with logo support
  hospital: (item: any, isFromBranch: boolean = false) => {
    // If this is a hospital created from a standalone branch, use branch data
    if (isFromBranch) {
      // Get logo from branch data - check multiple possible field names
      const branchLogo = 
        item.logo || 
        item.data?.logo || 
        item.Logo || 
        item.data?.Logo ||
        item.branchLogo || 
        item.data?.branchLogo ||
        item.hospitalLogo || 
        item.data?.hospitalLogo;
      
      return {
        _id: `standalone-${item._id || item.ID}`, // Prefix to avoid conflicts
        hospitalName: getValue(item, "branchName", "hospitalName", "Hospital Name") || "Unknown Hospital",
        description: extractRichText(item.description || item.data?.description || item.Description),
        specialty: ReferenceMapper.multiReference(item.specialty, "specialty", "Specialty Name", "title", "name"),
        yearEstablished: getValue(item, "yearEstablished", "Year Established"),
        hospitalImage: item.branchImage || item.hospitalImage || item.data?.branchImage || item.data?.hospitalImage || item["Branch Image"],
        logo: branchLogo, // Use logo from branch for standalone hospitals
        isStandalone: true, // Flag to identify standalone hospitals
        originalBranchId: item._id || item.ID, // Store original branch ID
      }
    }
    
    // Original hospital mapping logic for group hospitals
    return {
      _id: item._id || item.ID,
      hospitalName: getValue(item, "hospitalName", "Hospital Name") || "Unknown Hospital",
      description: extractRichText(item.description || item.data?.description || item.Description),
      specialty: ReferenceMapper.multiReference(item.specialty, "specialty", "Specialty Name", "title", "name"),
      yearEstablished: getValue(item, "yearEstablished", "Year Established"),
      hospitalImage: item.hospitalImage || item.data?.hospitalImage || item["hospitalImage"],
      logo: item.logo || item.data?.logo || item.Logo, // Logo for group hospitals
      isStandalone: false, // Regular hospital
    }
  },

  branch: (item: any) => ({
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
    logo: item.logo || item.data?.logo || item.Logo, // NEW: Add logo to branch mapper
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
    isStandalone: isStandaloneBranch(item), // Flag for standalone branches
    showHospital: shouldShowHospital(item), // Add showHospital flag
  }),

  doctor: (item: any) => {
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
  
  // IMPROVED: Better state and country resolution with enhanced debugging
  cityWithFullRefs: (item: any, stateMap: Record<string, any>, countryMap: Record<string, any>) => {
    const cityName = getValue(item, "cityName", "city name", "name", "City Name") || "Unknown City"
    
    // Extract state reference with multiple possible field names
    let stateRefs = ReferenceMapper.multiReference(
      item.state || item.State || item.stateRef || item.state_master || item.stateMaster || item.StateMaster || item.StateMaster_state || item.state_master,
      "state", "State Name", "name", "title", "State", "stateName", "StateName", "state_name", "displayName"
    )
    
    // If stateRefs is empty, try to get state directly from the item
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
    
    // Enhanced state resolution logic
    if (stateRefs.length > 0) {
      const stateRef = stateRefs[0]
      stateId = stateRef._id && !stateRef._id.startsWith('direct-') ? stateRef._id : null
      
      // Try to get state from map first
      if (stateId && stateMap[stateId]) {
        const fullState = stateMap[stateId]
        if (fullState.name && fullState.name !== "Unknown State") {
          stateName = fullState.name
          
          // Resolve country from state
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
        // Use state reference name if available
        if (stateRef.name && stateRef.name !== "ID Reference" && stateRef.name !== "Unknown") {
          stateName = stateRef.name
          countryName = "India"
        }
      }
    }
    
    // If still unknown, try to extract from embedded state object
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
    
    // Specific Indian state detection based on city name patterns
    const lowerCityName = cityName.toLowerCase()
    if (stateName === "Unknown State") {
      // Common Indian state patterns
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
      stateId: stateId,
      state: stateName,
      countryId: countryId,
      country: countryName,
    }
    
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

// REFERENCE MAPPER
const ReferenceMapper = {
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
        return null;
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
    
    // Handle direct hospital reference for standalone hospitals
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

// DATA FETCHER
const DataFetcher = {
  async searchIds(collection: string, fields: string[], query: string): Promise<string[]> {
    const ids = new Set<string>()
    for (const field of fields) {
      try {
        const res = await wixClient.items
          .query(collection)
          .contains(field as any, query)
          .limit(500)
          .find()
        res.items.forEach((i: any) => i._id && ids.add(i._id))
      } catch (e) {
        console.warn(`Search failed on ${collection}.${field}:`, e)
      }
    }
    return Array.from(ids)
  },

  async searchHospitalBySlug(slug: string): Promise<string[]> {
    if (!slug) return []

    const directSearchIds = await this.searchIds(COLLECTIONS.HOSPITALS, ["hospitalName"], slug)
    if (directSearchIds.length) return directSearchIds

    try {
        const res = await wixClient.items
            .query(COLLECTIONS.HOSPITALS)
            .limit(500)
            .find()

        const matchingHospital = res.items.find(item => {
            const hospitalName = getValue(item, "hospitalName", "Hospital Name") || ""
            return generateSlug(hospitalName) === slug
        })

        return matchingHospital ? [matchingHospital._id!] : []
    } catch(e) {
        console.warn("Slug search fallback failed:", e)
        return []
    }
  },

  async fetchByIds(collection: string, ids: string[], mapper: (i: any) => any) {
    if (!ids.length) return {}
    const res = await wixClient.items.query(collection).hasSome("_id", ids).find()
    return res.items.reduce(
      (acc, item) => {
        acc[item._id!] = mapper(item)
        return acc
      },
      {} as Record<string, any>,
    )
  },

  async fetchCountries(ids: string[]) {
    if (!ids.length) return {}
    const res = await wixClient.items.query(COLLECTIONS.COUNTRIES).hasSome("_id", ids).find()
    return res.items.reduce((acc, item) => {
      acc[item._id!] = DataMappers.country(item)
      return acc
    }, {} as Record<string, any>)
  },
  
  // IMPROVED: Fetch all states at once for better performance
  async fetchAllStates() {
    try {
      const res = await wixClient.items
        .query(COLLECTIONS.STATES)
        .limit(500)
        .include("country", "CountryMaster_state")
        .find()
      
      const stateMap: Record<string, any> = {}
      const countryIds = new Set<string>()
      
      // First pass: create state map and collect country IDs
      res.items.forEach((item: any) => {
        const state = DataMappers.state(item)
        stateMap[item._id!] = state
        
        // Extract country IDs
        if (state.country && Array.isArray(state.country)) {
          state.country.forEach((c: any) => c._id && countryIds.add(c._id))
        }
      })
      
      // Fetch all countries
      const countriesMap = await this.fetchCountries(Array.from(countryIds))
      
      // Second pass: resolve country references
      Object.keys(stateMap).forEach(stateId => {
        const state = stateMap[stateId]
        if (state.country && Array.isArray(state.country)) {
          state.country = state.country.map((c: any) => countriesMap[c._id] || c)
        }
      })
      
      return stateMap
    } catch (error) {
      console.warn("Failed to fetch all states:", error)
      return {}
    }
  },

  async fetchCitiesWithStateAndCountry(ids: string[]) {
    if (!ids.length) return {}

    try {
      // First, fetch all states for reference
      const allStates = await this.fetchAllStates()
      
      // Fetch cities with their state references
      const cityRes = await wixClient.items
        .query(COLLECTIONS.CITIES)
        .hasSome("_id", ids)
        .include("state", "State", "stateRef", "stateMaster")
        .limit(500)
        .find()
      
      // Extract state IDs from city references
      const stateIds = new Set<string>()
      
      cityRes.items.forEach((city: any) => {
        // Try multiple ways to get state reference
        const stateField = city.state || city.State || city.stateRef || city.stateMaster
        if (stateField) {
          if (Array.isArray(stateField)) {
            stateField.forEach((s: any) => {
              const stateId = s?._id || s?.ID
              if (stateId) stateIds.add(stateId)
            })
          } else if (typeof stateField === 'object') {
            const stateId = stateField._id || stateField.ID
            if (stateId) stateIds.add(stateId)
          } else if (typeof stateField === 'string') {
            stateIds.add(stateField)
          }
        }
      })
      
      // Get specific states referenced by cities
      let cityStateMap = {}
      if (stateIds.size > 0) {
        cityStateMap = await this.fetchStatesWithCountry(Array.from(stateIds))
      }
      
      // Combine all states and city-specific states
      const statesMap = { ...allStates, ...cityStateMap }
      
      // Extract country IDs from states
      const countryIds = new Set<string>()
      Object.values(statesMap).forEach((state: any) => {
        if (state.country && Array.isArray(state.country)) {
          state.country.forEach((c: any) => c._id && countryIds.add(c._id))
        }
      })
      
      // Fetch countries
      const countriesMap = await this.fetchCountries(Array.from(countryIds))
      
      // Map cities with state and country data
      return cityRes.items.reduce((acc, item) => {
        acc[item._id!] = DataMappers.cityWithFullRefs(item, statesMap, countriesMap)
        return acc
      }, {} as Record<string, any>)
      
    } catch (error) {
      console.error("Error fetching cities:", error)
      return {}
    }
  },

  async fetchStatesWithCountry(ids: string[]) {
    if (!ids.length) return {}

    try {
      const res = await wixClient.items
        .query(COLLECTIONS.STATES)
        .hasSome("_id", ids)
        .include("country", "CountryMaster_state")
        .find()

      const countryIds = new Set<string>()
      res.items.forEach((s) => {
        const countryRefs = ReferenceMapper.multiReference(
          s.country || s.CountryMaster_state,
          "country", "Country Name", "Country", "name", "title"
        )
        ReferenceMapper.extractIds(countryRefs).forEach((id) => countryIds.add(id))
      })

      const countries = await DataFetcher.fetchCountries(Array.from(countryIds))

      return res.items.reduce((acc, item) => {
        const state = DataMappers.state(item)
        state.country = state.country.map((c: any) => countries[c._id] || c)
        acc[item._id!] = state
        return acc
      }, {} as Record<string, any>)
    } catch (error) {
      console.warn("Failed to fetch specific states:", error)
      return {}
    }
  },

  async fetchDoctors(ids: string[]) {
    if (!ids.length) return {}
    const res = await wixClient.items.query(COLLECTIONS.DOCTORS).hasSome("_id", ids).include("specialization").find()

    const specialistIds = new Set<string>()
    res.items.forEach((d) => {
      const specs = d.specialization || d.data?.specialization || []
      ;(Array.isArray(specs) ? specs : [specs]).forEach((s: any) => {
        const id = s?._id || s?.ID || s
        id && specialistIds.add(id)
      })
    })

    const enrichedSpecialists = await DataFetcher.fetchSpecialistsWithDeptAndTreatments(Array.from(specialistIds))

    return res.items.reduce(
      (acc, d) => {
        const doctor = DataMappers.doctor(d)
        doctor.specialization = doctor.specialization.map((spec: any) => enrichedSpecialists[spec._id] || spec)
        acc[d._id!] = doctor
        return acc
      },
      {} as Record<string, any>,
    )
  },

  async fetchSpecialistsWithDeptAndTreatments(specialistIds: string[]) {
    if (!specialistIds.length) return {}

    const res = await wixClient.items
      .query(COLLECTIONS.SPECIALTIES)
      .hasSome("_id", specialistIds)
      .include("department", "treatment")
      .find()

    const treatmentIds = new Set<string>()
    const departmentIds = new Set<string>()

    res.items.forEach((s) => {
      const treatments = s.treatment || s.data?.treatment || []
      ;(Array.isArray(treatments) ? treatments : [treatments]).forEach((t: any) => {
        const id = t?._id || t?.ID || t
        id && treatmentIds.add(id)
      })

      const dept = s.department || s.data?.department
      if (dept) {
        const id = typeof dept === "string" ? dept : dept?._id || dept?.ID
        id && departmentIds.add(id)
      }
    })

    const [treatments, departments] = await Promise.all([
      DataFetcher.fetchByIds(COLLECTIONS.TREATMENTS, Array.from(treatmentIds), DataMappers.treatment),
      DataFetcher.fetchByIds(COLLECTIONS.DEPARTMENTS, Array.from(departmentIds), DataMappers.department),
    ])

    return res.items.reduce(
      (acc, item) => {
        const spec = DataMappers.specialist(item)
        acc[item._id!] = {
          ...spec,
          department: spec.department.map((d) => departments[d._id] || d),
          treatments: spec.treatments.map((t) => treatments[t._id] || t),
        }
        return acc
      },
      {} as Record<string, any>,
    )
  },

  async fetchTreatmentsWithFullData(treatmentIds: string[]) {
    if (!treatmentIds.length) return {}

    const res = await wixClient.items.query(COLLECTIONS.TREATMENTS).hasSome("_id", treatmentIds).find()

    return res.items.reduce(
      (acc, item) => {
        acc[item._id!] = DataMappers.treatment(item)
        return acc
      },
      {} as Record<string, any>,
    )
  },

  // UPDATED: Fetch all branches with ShowHospital filter and include logo field
  async fetchAllBranches() {
    try {
      // Fetch all branches where ShowHospital === true and include logo field
      const res = await wixClient.items
        .query(COLLECTIONS.BRANCHES)
        .eq("showHospital", true)  // Filter by ShowHospital field
        .include(
          "hospital",
          "HospitalMaster_branches",
          "city",
          "doctor",
          "specialty",
          "accreditation",
          "treatment",
          "specialist",
        )
        .limit(1000)
        .find()

      console.log(`Fetched ${res.items.length} branches where ShowHospital === true`)
      return res.items
    } catch (error) {
      console.error("Error fetching branches:", error)
      return []
    }
  },

  // UPDATED: Fetch branches by IDs with ShowHospital filter
  async fetchBranchesByIds(ids: string[]) {
    if (!ids.length) return []
    
    try {
      // Fetch branches by IDs where ShowHospital === true
      const res = await wixClient.items
        .query(COLLECTIONS.BRANCHES)
        .hasSome("_id", ids)
        .eq("showHospital", true)  // Filter by ShowHospital field
        .include(
          "hospital",
          "HospitalMaster_branches",
          "city",
          "doctor",
          "specialty",
          "accreditation",
          "treatment",
          "specialist",
        )
        .limit(1000)
        .find()

      console.log(`Fetched ${res.items.length} branches by IDs where ShowHospital === true`)
      return res.items
    } catch (error) {
      console.error("Error fetching branches by IDs:", error)
      return []
    }
  },

  // UPDATED: Search branches with ShowHospital filter
  async searchBranches(field: string, query: string) {
    try {
      const res = await wixClient.items
        .query(COLLECTIONS.BRANCHES)
        .contains(field as any, query)
        .eq("showHospital", true)  // Filter by ShowHospital field
        .limit(500)
        .find()
      
      return res.items.map((i: any) => i._id).filter(Boolean)
    } catch (e) {
      console.warn(`Search failed on ${COLLECTIONS.BRANCHES}.${field}:`, e)
      return []
    }
  },
}

// QUERY BUILDER
const QueryBuilder = {
  async getHospitalIds(filters: {
    branchIds?: string[]
    cityIds?: string[]
    doctorIds?: string[]
    specialtyIds?: string[]
    accreditationIds?: string[]
    treatmentIds?: string[]
    specialistIds?: string[]
    departmentIds?: string[]
  }): Promise<string[]> {
    let { branchIds, cityIds, doctorIds, specialtyIds, accreditationIds, treatmentIds, specialistIds, departmentIds } =
      filters
    if (
      !branchIds?.length &&
      !cityIds?.length &&
      !doctorIds?.length &&
      !specialtyIds?.length &&
      !accreditationIds?.length &&
      !treatmentIds?.length &&
      !specialistIds?.length &&
      !departmentIds?.length
    )
      return []

    if (departmentIds?.length) {
      const res = await wixClient.items
        .query(COLLECTIONS.SPECIALTIES)
        .hasSome("department", departmentIds)
        .limit(500)
        .find()
      const addIds = res.items.map((i) => i._id).filter(Boolean)
      specialistIds = [...(specialistIds || []), ...addIds]
    }

    // UPDATED: Add ShowHospital filter
    const query = wixClient.items
      .query(COLLECTIONS.BRANCHES)
      .eq("showHospital", true)  // Filter by ShowHospital field
      .include(
        "hospital",
        "HospitalMaster_branches",
        "city",
        "doctor",
        "specialty",
        "accreditation",
        "treatment",
        "specialist",
      )

    if (branchIds?.length) query.hasSome("_id", branchIds)
    if (cityIds?.length) query.hasSome("city", cityIds)
    if (doctorIds?.length) query.hasSome("doctor", doctorIds)
    if (specialtyIds?.length) query.hasSome("specialty", specialtyIds)
    if (accreditationIds?.length) query.hasSome("accreditation", accreditationIds)
    if (treatmentIds?.length) query.hasSome("treatment", treatmentIds)
    if (specialistIds?.length) query.hasSome("specialist", specialistIds)

    const result = await query.limit(1000).find()
    const hospitalIds = new Set<string>()
    result.items.forEach((b: any) => ReferenceMapper.extractHospitalIds(b).forEach((id) => hospitalIds.add(id)))
    return Array.from(hospitalIds)
  },
}

// ENRICH HOSPITALS - UPDATED TO SUPPORT BOTH GROUPED AND STANDALONE HOSPITALS
async function enrichHospitals(
  hospitals: any[],
  filterIds: {
    city: string[]
    doctor: string[]
    specialty: string[]
    accreditation: string[]
    branch: string[]
    treatment: string[]
    specialist: string[]
    department: string[]
  },
) {
  const hospitalIds = hospitals.map((h) => h._id!).filter(Boolean)

  // STEP 1: Fetch branches for grouped hospitals with ShowHospital filter
  const groupedBranchesRes = await wixClient.items
    .query(COLLECTIONS.BRANCHES)
    .eq("showHospital", true)  // Filter by ShowHospital field
    .include(
      "hospital",
      "HospitalMaster_branches",
      "city",
      "doctor",
      "specialty",
      "accreditation",
      "treatment",
      "specialist",
    )
    .hasSome("HospitalMaster_branches", hospitalIds)
    .limit(1000)
    .find()

  // STEP 2: Fetch branches for standalone hospitals with ShowHospital filter
  const standaloneBranchesRes = await wixClient.items
    .query(COLLECTIONS.BRANCHES)
    .eq("showHospital", true)  // Filter by ShowHospital field
    .include(
      "hospital",
      "HospitalMaster_branches",
      "city",
      "doctor",
      "specialty",
      "accreditation",
      "treatment",
      "specialist",
    )
    .hasSome("hospital", hospitalIds) // This is the key difference - direct hospital reference
    .limit(1000)
    .find()

  // Combine both branch results
  const allBranches = [...groupedBranchesRes.items, ...standaloneBranchesRes.items]
  
  // Create a map to deduplicate branches by ID
  const uniqueBranchesMap = new Map<string, any>()
  allBranches.forEach((b: any) => {
    if (b._id) {
      uniqueBranchesMap.set(b._id, b)
    }
  })
  
  const uniqueBranches = Array.from(uniqueBranchesMap.values())

  const branchesByHospital: Record<string, any[]> = {}
  const doctorIds = new Set<string>()
  const cityIds = new Set<string>()
  const specialtyIds = new Set<string>()
  const accreditationIds = new Set<string>()
  const treatmentIds = new Set<string>()
  const specialistIds = new Set<string>()

  // Process all branches (both grouped and standalone)
  uniqueBranches.forEach((b: any) => {
    // Get hospital IDs from both grouping and direct references
    const hIds = new Set<string>()
    
    // Add hospital IDs from group reference (existing logic)
    ReferenceMapper.extractHospitalIds(b).forEach((id) => hIds.add(id))
    
    // Add hospital IDs from direct hospital reference (new logic)
    const directHospitalRefs = ReferenceMapper.multiReference(
      b.hospital || b.data?.hospital,
      "hospitalName", "Hospital Name"
    )
    directHospitalRefs.forEach((h: any) => {
      if (h._id) hIds.add(h._id)
    })

    // Add branch to all relevant hospitals
    hIds.forEach((hid) => {
      if (hospitalIds.includes(hid)) {
        if (!branchesByHospital[hid]) branchesByHospital[hid] = []
        const mapped = DataMappers.branch(b)
        branchesByHospital[hid].push(mapped)

        // Collect IDs for enrichment
        ReferenceMapper.extractIds(mapped.doctors).forEach((id) => doctorIds.add(id))
        ReferenceMapper.extractIds(mapped.city).forEach((id) => cityIds.add(id))
        ReferenceMapper.extractIds(mapped.accreditation).forEach((id) => accreditationIds.add(id))
        ReferenceMapper.extractIds(mapped.specialists).forEach((id) => specialistIds.add(id))
        ReferenceMapper.extractIds(mapped.treatments).forEach((id) => treatmentIds.add(id))

        mapped.specialization.forEach((s: any) => {
          if (s.isTreatment) {
            treatmentIds.add(s._id)
          } else {
            specialtyIds.add(s._id)
          }
        })
      }
    })
  })

  const [doctors, cities, accreditations, treatments, enrichedSpecialists] = await Promise.all([
    DataFetcher.fetchDoctors(Array.from(doctorIds)),
    DataFetcher.fetchCitiesWithStateAndCountry(Array.from(cityIds)),
    DataFetcher.fetchByIds(COLLECTIONS.ACCREDITATIONS, Array.from(accreditationIds), DataMappers.accreditation),
    DataFetcher.fetchTreatmentsWithFullData(Array.from(treatmentIds)),
    DataFetcher.fetchSpecialistsWithDeptAndTreatments(Array.from(new Set([...specialtyIds, ...specialistIds]))),
  ])

  return hospitals.map((hospital) => {
    const rawBranches = branchesByHospital[hospital._id!] || []
    const filteredBranches = rawBranches.filter((b) => {
      const matchBranch = !filterIds.branch.length || filterIds.branch.includes(b._id)
      const matchCity = !filterIds.city.length || b.city.some((c: any) => filterIds.city.includes(c._id))
      const matchDoctor = !filterIds.doctor.length || b.doctors.some((d: any) => filterIds.doctor.includes(d._id))
      const matchSpecialty =
        !filterIds.specialty.length ||
        b.specialization.some((s: any) => !s.isTreatment && filterIds.specialty.includes(s._id))
      const matchTreatment =
        !filterIds.treatment.length || b.treatments.some((t: any) => filterIds.treatment.includes(t._id))
      const matchSpecialist =
        !filterIds.specialist.length || b.specialists.some((s: any) => filterIds.specialist.includes(s._id))
      const matchDepartment =
        !filterIds.department.length ||
        b.specialists.some((s: any) => s.department.some((d: any) => filterIds.department.includes(d._id)))
      const matchAccred =
        !filterIds.accreditation.length || b.accreditation.some((a: any) => filterIds.accreditation.includes(a._id))
      return (
        matchBranch &&
        matchCity &&
        matchDoctor &&
        matchSpecialty &&
        matchTreatment &&
        matchSpecialist &&
        matchDepartment &&
        matchAccred
      )
    })

    const enrichedBranches = filteredBranches.map((b) => {
      let enrichedCities = b.city.map((c: any) => {
        const enrichedCity = cities[c._id] || c
        return normalizeDelhiNCR(enrichedCity)
      })
      
      if (enrichedCities.length === 0) {
        enrichedCities = [normalizeDelhiNCR({
          _id: `fallback-${b._id}`,
          cityName: "Unknown City",
          state: "Unknown State",
          country: "Unknown Country",
        })]
      }
      
      return {
        ...b,
        doctors: b.doctors.map((d: any) => doctors[d._id] || d),
        city: enrichedCities,
        accreditation: b.accreditation.map((a: any) => accreditations[a._id] || a),
        specialists: b.specialists.map((s: any) => enrichedSpecialists[s._id] || s),
        treatments: b.treatments.map((t: any) => treatments[t._id] || t),
        specialization: b.specialization.map((s: any) => {
          if (s.isTreatment) {
            return treatments[s._id] || s
          } else {
            return enrichedSpecialists[s._id] || s
          }
        }),
      }
    })

    const uniqueDoctors = new Map()
    const uniqueSpecialists = new Map()
    const uniqueTreatments = new Map()

    enrichedBranches.forEach((b) => {
      b.doctors.forEach((d: any) => d._id && uniqueDoctors.set(d._id, d))
      b.specialists.forEach((s: any) => s._id && uniqueSpecialists.set(s._id, s))
      b.treatments.forEach((t: any) => t._id && uniqueTreatments.set(t._id, t))
    })

    const mapped = DataMappers.hospital(hospital)

    return {
      ...mapped,
      branches: enrichedBranches,
      doctors: Array.from(uniqueDoctors.values()),
      specialists: Array.from(uniqueSpecialists.values()),
      treatments: Array.from(uniqueTreatments.values()),
      accreditations: enrichedBranches.flatMap((b) => b.accreditation),
    }
  })
}

// SIMPLIFIED: Get all hospitals (both from HospitalMaster and standalone branches)
async function getAllHospitals(
  filterIds: {
    city: string[]
    doctor: string[]
    specialty: string[]
    accreditation: string[]
    branch: string[]
    treatment: string[]
    specialist: string[]
    department: string[]
  },
  searchQuery?: string,
  includeStandalone: boolean = true,
  minimal: boolean = false
) {
  // Fetch regular hospitals from HospitalMaster
  const regularHospitalsQuery = wixClient.items
    .query(COLLECTIONS.HOSPITALS)
    .include("specialty")
    .descending("_createdDate")
    .limit(1000)
    .find()

  // UPDATED: Fetch all branches with ShowHospital filter
  const allBranches = await DataFetcher.fetchAllBranches()

  // Separate branches into standalone and grouped
  const standaloneBranches: any[] = []
  const groupedBranches: any[] = []

  allBranches.forEach(branch => {
    if (isStandaloneBranch(branch)) {
      standaloneBranches.push(branch)
    } else {
      groupedBranches.push(branch)
    }
  })

  console.log(`Found ${standaloneBranches.length} standalone branches and ${groupedBranches.length} grouped branches (all with ShowHospital === true)`)

  // Process regular hospitals
  const regularHospitalsResult = await regularHospitalsQuery
  const regularHospitals = regularHospitalsResult.items

  // Convert standalone branches to hospital objects
  let standaloneHospitals: any[] = []
  if (includeStandalone) {
    const doctorIds = new Set<string>()
    const cityIds = new Set<string>()
    const accreditationIds = new Set<string>()
    const treatmentIds = new Set<string>()
    const specialistIds = new Set<string>()
    const specialtyIds = new Set<string>()

    // Map standalone branches
    standaloneBranches.forEach(branch => {
      const mapped = DataMappers.branch(branch)
      
      // Collect IDs for enrichment
      ReferenceMapper.extractIds(mapped.doctors).forEach((id) => doctorIds.add(id))
      ReferenceMapper.extractIds(mapped.city).forEach((id) => cityIds.add(id))
      ReferenceMapper.extractIds(mapped.accreditation).forEach((id) => accreditationIds.add(id))
      ReferenceMapper.extractIds(mapped.specialists).forEach((id) => specialistIds.add(id))
      ReferenceMapper.extractIds(mapped.treatments).forEach((id) => treatmentIds.add(id))

      mapped.specialization.forEach((s: any) => {
        if (s.isTreatment) {
          treatmentIds.add(s._id)
        } else {
          specialtyIds.add(s._id)
        }
      })
    })

    // Filter standalone branches based on filterIds
    const filteredStandaloneBranches = standaloneBranches.filter(branch => {
      const mapped = DataMappers.branch(branch)
      
      const matchBranch = !filterIds.branch.length || filterIds.branch.includes(mapped._id)
      const matchCity = !filterIds.city.length || mapped.city.some((c: any) => filterIds.city.includes(c._id))
      const matchDoctor = !filterIds.doctor.length || mapped.doctors.some((d: any) => filterIds.doctor.includes(d._id))
      const matchSpecialty =
        !filterIds.specialty.length ||
        mapped.specialization.some((s: any) => !s.isTreatment && filterIds.specialty.includes(s._id))
      const matchTreatment =
        !filterIds.treatment.length || mapped.treatments.some((t: any) => filterIds.treatment.includes(t._id))
      const matchSpecialist =
        !filterIds.specialist.length || mapped.specialists.some((s: any) => filterIds.specialist.includes(s._id))
      const matchDepartment =
        !filterIds.department.length ||
        mapped.specialists.some((s: any) => s.department.some((d: any) => filterIds.department.includes(d._id)))
      const matchAccred =
        !filterIds.accreditation.length || mapped.accreditation.some((a: any) => filterIds.accreditation.includes(a._id))
      
      return (
        matchBranch &&
        matchCity &&
        matchDoctor &&
        matchSpecialty &&
        matchTreatment &&
        matchSpecialist &&
        matchDepartment &&
        matchAccred
      )
    })

    // Fetch all related data for enrichment
    const [doctors, cities, accreditations, treatments, enrichedSpecialists] = await Promise.all([
      DataFetcher.fetchDoctors(Array.from(doctorIds)),
      DataFetcher.fetchCitiesWithStateAndCountry(Array.from(cityIds)),
      DataFetcher.fetchByIds(COLLECTIONS.ACCREDITATIONS, Array.from(accreditationIds), DataMappers.accreditation),
      DataFetcher.fetchTreatmentsWithFullData(Array.from(treatmentIds)),
      DataFetcher.fetchSpecialistsWithDeptAndTreatments(Array.from(new Set([...specialtyIds, ...specialistIds]))),
    ])

    // Convert filtered standalone branches to hospitals
    standaloneHospitals = filteredStandaloneBranches.map(branch => {
      const mappedBranch = DataMappers.branch(branch)
      
      // Enrich branch data
      const enrichedBranch = {
        ...mappedBranch,
        doctors: mappedBranch.doctors.map((d: any) => doctors[d._id] || d),
        city: mappedBranch.city.map((c: any) => {
          const enrichedCity = cities[c._id] || c
          return normalizeDelhiNCR(enrichedCity)
        }),
        accreditation: mappedBranch.accreditation.map((a: any) => accreditations[a._id] || a),
        specialists: mappedBranch.specialists.map((s: any) => enrichedSpecialists[s._id] || s),
        treatments: mappedBranch.treatments.map((t: any) => treatments[t._id] || t),
        specialization: mappedBranch.specialization.map((s: any) => {
          if (s.isTreatment) {
            return treatments[s._id] || s
          } else {
            return enrichedSpecialists[s._id] || s
          }
        }),
      }

      // Create hospital from branch with logo support
      const hospital = DataMappers.hospital(branch, true)
      
      // Collect unique doctors, specialists, and treatments
      const uniqueDoctors = new Map()
      const uniqueSpecialists = new Map()
      const uniqueTreatments = new Map()

      enrichedBranch.doctors.forEach((d: any) => d._id && uniqueDoctors.set(d._id, d))
      enrichedBranch.specialists.forEach((s: any) => s._id && uniqueSpecialists.set(s._id, s))
      enrichedBranch.treatments.forEach((t: any) => t._id && uniqueTreatments.set(t._id, t))

      return {
        ...hospital,
        branches: [enrichedBranch], // Standalone hospital has exactly one branch (itself)
        doctors: Array.from(uniqueDoctors.values()),
        specialists: Array.from(uniqueSpecialists.values()),
        treatments: Array.from(uniqueTreatments.values()),
        accreditations: enrichedBranch.accreditation,
      }
    })
  }

  // Enrich regular hospitals
  let enrichedRegularHospitals: any[] = []
  if (regularHospitals.length > 0) {
    if (minimal) {
      enrichedRegularHospitals = regularHospitals.map(h => ({
        _id: h._id,
        hospitalName: getValue(h, "hospitalName", "Hospital Name") || "Unknown Hospital"
      }))
    } else {
      enrichedRegularHospitals = await enrichHospitals(regularHospitals, filterIds)
    }
  }

  // Combine all hospitals
  const allHospitals = [...enrichedRegularHospitals, ...standaloneHospitals]

  // Apply search query if provided
  if (searchQuery) {
    const searchSlug = generateSlug(searchQuery)
    return allHospitals.filter(hospital => {
      const hospitalSlug = generateSlug(hospital.hospitalName || "")
      return hospitalSlug.includes(searchSlug) || 
             hospital.hospitalName.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }

  return allHospitals
}

// GET /api/hospitals
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const params = {
      q: url.searchParams.get("q")?.trim() || "",
      page: Math.max(0, Number(url.searchParams.get("page") || 0)),
      pageSize: Math.min(1000, Number(url.searchParams.get("pageSize") || 100)),
      hospitalId: url.searchParams.get("hospitalId")?.trim(),
      hospitalText: url.searchParams.get("hospital")?.trim(),
      branchText: url.searchParams.get("branch")?.trim(),
      cityText: url.searchParams.get("city")?.trim(),
      doctorText: url.searchParams.get("doctor")?.trim(),
      specialtyText: url.searchParams.get("specialty")?.trim(),
      accreditationText: url.searchParams.get("accreditation")?.trim(),
      treatmentText: url.searchParams.get("treatment")?.trim(),
      specialistText: url.searchParams.get("specialist")?.trim(),
      departmentText: url.searchParams.get("department")?.trim(),
      branchId: url.searchParams.get("branchId"),
      cityId: url.searchParams.get("cityId"),
      doctorId: url.searchParams.get("doctorId"),
      specialtyId: url.searchParams.get("specialtyId"),
      accreditationId: url.searchParams.get("accreditationId"),
      treatmentId: url.searchParams.get("treatmentId"),
      specialistId: url.searchParams.get("specialistId"),
      departmentId: url.searchParams.get("departmentId"),
      includeStandalone: url.searchParams.get("includeStandalone") !== "false", // Default to true
      minimal: url.searchParams.get("minimal") === "true", // New parameter for minimal data
    }

    // UPDATED: Use new searchBranches method with ShowHospital filter
    const [
      branchIdsFromText,
      cityIdsFromText,
      doctorIdsFromText,
      specialtyIdsFromText,
      accreditationIdsFromText,
      treatmentIdsFromText,
      specialistIdsFromText,
      departmentIdsFromText,
    ] = await Promise.all([
      params.branchText
        ? DataFetcher.searchBranches("branchName", params.branchText)
        : Promise.resolve([]),
      params.cityText ? DataFetcher.searchIds(COLLECTIONS.CITIES, ["cityName"], params.cityText) : Promise.resolve([]),
      params.doctorText
        ? DataFetcher.searchIds(COLLECTIONS.DOCTORS, ["doctorName"], params.doctorText)
        : Promise.resolve([]),
      params.specialtyText
        ? DataFetcher.searchIds(COLLECTIONS.SPECIALTIES, ["specialty"], params.specialtyText)
        : Promise.resolve([]),
      params.accreditationText
        ? DataFetcher.searchIds(COLLECTIONS.ACCREDITATIONS, ["title"], params.accreditationText)
        : Promise.resolve([]),
      params.treatmentText
        ? DataFetcher.searchIds(COLLECTIONS.TREATMENTS, ["treatmentName"], params.treatmentText)
        : Promise.resolve([]),
      params.specialistText
        ? DataFetcher.searchIds(COLLECTIONS.SPECIALTIES, ["specialty"], params.specialistText)
        : Promise.resolve([]),
      params.departmentText
        ? DataFetcher.searchIds(COLLECTIONS.DEPARTMENTS, ["department", "Name"], params.departmentText)
        : Promise.resolve([]),
    ])

    const filterIds = {
      branch: [...branchIdsFromText, ...(params.branchId ? [params.branchId] : [])],
      city: [...cityIdsFromText, ...(params.cityId ? [params.cityId] : [])],
      doctor: [...doctorIdsFromText, ...(params.doctorId ? [params.doctorId] : [])],
      specialty: [...specialtyIdsFromText, ...(params.specialtyId ? [params.specialtyId] : [])],
      accreditation: [...accreditationIdsFromText, ...(params.accreditationId ? [params.accreditationId] : [])],
      treatment: [...treatmentIdsFromText, ...(params.treatmentId ? [params.treatmentId] : [])],
      specialist: [...specialistIdsFromText, ...(params.specialistId ? [params.specialistId] : [])],
      department: [...departmentIdsFromText, ...(params.departmentId ? [params.departmentId] : [])],
    }

    console.log("Filter IDs:", filterIds)
    console.log("Include standalone:", params.includeStandalone)
    console.log("Search query:", params.q)

    // Get all hospitals (both regular and standalone)
    const allHospitals = await getAllHospitals(
      filterIds,
      params.q || undefined,
      params.includeStandalone,
      params.minimal
    )

    // Count regular hospitals
    const regularHospitalCount = (await wixClient.items.query(COLLECTIONS.HOSPITALS).limit(1).find()).totalCount || 0
    
    // Count standalone hospitals (only those with ShowHospital === true)
    const allBranches = await DataFetcher.fetchAllBranches()
    const standaloneBranchesCount = allBranches.filter(branch => isStandaloneBranch(branch)).length

    // Apply pagination
    const startIndex = params.page * params.pageSize
    const endIndex = startIndex + params.pageSize
    const paginatedHospitals = allHospitals.slice(startIndex, endIndex)

    return NextResponse.json({
      items: paginatedHospitals,
      total: allHospitals.length,
      page: params.page,
      pageSize: params.pageSize,
      regularCount: regularHospitalCount,
      standaloneCount: standaloneBranchesCount,
      filteredCount: allHospitals.length,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error: any) {
    console.error("API Error:", error)
    const errorMessage = error.message || "An unknown error occurred on the server."
    return NextResponse.json({ error: "Failed to fetch hospitals", details: errorMessage }, { status: 500 })
  }
}