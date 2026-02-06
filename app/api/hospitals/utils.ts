// app/api/hospitals/utils.ts
// Utility functions for hospitals API

/**
 * Simple in-memory cache with TTL for performance optimization
 */
export class MemoryCache<T> {
  private cache = new Map<string, { data: T; expiry: number }>();

  set(key: string, data: T, ttlMs: number = 10 * 60 * 1000) {
    this.cache.set(key, { data, expiry: Date.now() + ttlMs });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  clear() {
    this.cache.clear();
  }
}

// Global caches for API data to reduce database queries
export const doctorsCache = new MemoryCache<Record<string, any>>();
export const citiesCache = new MemoryCache<Record<string, any>>();
export const treatmentsCache = new MemoryCache<Record<string, any>>();
export const specialistsCache = new MemoryCache<Record<string, any>>();
export const accreditationsCache = new MemoryCache<Record<string, any>>();
export const branchesCache = new MemoryCache<any[]>();


/**
 * Normalizes Delhi NCR city data.
 * @param cityData - The city data to normalize
 * @returns Normalized city data
 */
export const normalizeDelhiNCR = (cityData: any) => {
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



/**
 * Checks if ShowHospital is true for a branch.
 * @param branch - The branch item
 * @returns True if the branch should show as a hospital
 */
export const shouldShowHospital = (branch: any): boolean => {
  // Check the ShowHospital boolean field from CMS
  const showHospital = branch?.ShowHospital ?? branch?.data?.ShowHospital ?? branch?.showHospital ?? branch?.data?.showHospital;
  // Handle different possible formats: boolean, string, number, etc.
  if (showHospital === true || showHospital === "true" || showHospital === 1 || showHospital === "1" || showHospital === "yes") {
    return true;
  }
  if (showHospital === false || showHospital === "false" || showHospital === 0 || showHospital === "0" || showHospital === "no") {
    return false;
  }
  // If the field is not set or undefined/null, default to false
  if (showHospital === null || showHospital === undefined) {
    return false;
  }
  // For any other unexpected value, default to false
  return false;
};

/**
 * Checks if ShowHospital is true for a hospital.
 * @param hospital - The hospital item
 * @returns True if the hospital should show
 */
export const shouldShowHospitalForHospital = (hospital: any): boolean => {
  // Check the ShowHospital boolean field from CMS on hospital record
  const showHospital = hospital?.ShowHospital ?? hospital?.data?.ShowHospital ?? hospital?.showHospital ?? hospital?.data?.showHospital;
  // Handle different possible formats: boolean, string, number, etc.
  if (showHospital === true || showHospital === "true" || showHospital === 1 || showHospital === "1" || showHospital === "yes") return true;
  if (showHospital === false || showHospital === "false" || showHospital === 0 || showHospital === "0" || showHospital === "no") {
    return false;
  }
  // If the field is not set or undefined/null, default to true for backward compatibility
  if (showHospital === null || showHospital === undefined) return true;
  // For any other unexpected value, default to true
  return true;
};

/**
 * Checks if a branch is standalone (not part of a hospital group).
 * @param branch - The branch item
 * @returns True if the branch is standalone
 */
export const isStandaloneBranch = (branch: any): boolean => {
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

/**
 * Infers the Indian state from a city name.
 * This is used as a fallback when city-state mapping from CMS is missing.
 * @param cityName - The name of the city
 * @returns The inferred state name
 */
export const inferStateFromCityName = (cityName: string | null | undefined): string => {
  if (!cityName || typeof cityName !== 'string') return 'Unknown State';

  const city = cityName.toLowerCase().trim();

  // Delhi NCR handling (already normalized by normalizeDelhiNCR, but check anyway)
  const delhiNCRCities = ['delhi', 'new delhi', 'gurugram', 'gurgaon', 'noida', 'faridabad', 'ghaziabad', 'greater noida'];
  if (delhiNCRCities.some(c => city.includes(c))) {
    return 'Delhi NCR';
  }

  // Maharashtra
  const maharashtraCities = ['mumbai', 'pune', 'nashik', 'nagpur', 'aurangabad', 'kolhapur', 'navi mumbai', 'thane', 'solapur', 'akola', 'amaravati', 'amravati', 'latur', 'wardha', 'nanded', 'osmanabad', 'parbhani', 'jalna', 'beed', 'hingoli', 'washim', 'buldhana', 'yavatmal', 'satara', 'ratnagiri', 'sindhudurg', 'raigad', 'palghar'];
  if (maharashtraCities.some(c => city === c || city.includes(c))) {
    return 'Maharashtra';
  }

  // Gujarat
  const gujaratCities = ['ahmedabad', 'surat', 'vadodara', 'rajkot', 'jamnagar', 'bhavnagar', 'junagadh', 'gandhinagar', 'bharuch', 'anand', 'navsari', 'valsad', 'porbandar', 'mehsana', 'palanpur', 'banaskantha', 'sabarkantha', 'aravalli', 'kheda', 'panchmahals', 'dahod', 'mahisagar', 'sabarkantha'];
  if (gujaratCities.some(c => city === c || city.includes(c))) {
    return 'Gujarat';
  }

  // Karnataka
  const karnatakaCities = ['bangalore', 'bengaluru', 'mysore', 'mangalore', 'hubli', 'belgaum', 'dharwad', 'belagavi', 'bellary', 'tumkur', 'shimoga', 'udupi', 'chitradurga', 'madanapalle', 'kolar', 'raichur', 'bidar', 'gulbarga', 'hassan', 'mandya', 'dakshina kannada', 'uttara kannada'];
  if (karnatakaCities.some(c => city === c || city.includes(c))) {
    return 'Karnataka';
  }

  // Tamil Nadu
  const tamilNaduCities = ['chennai', 'coimbatore', 'madurai', 'trichy', 'tiruchirappalli', 'salem', 'vellore', 'tirunelveli', 'thoothukudi', 'dindigul', 'thanjavur', 'nagercoil', 'kanchipuram', 'chengalpattu', 'krishnagiri', 'dharmapuri', 'namakkal', 'perambalur', 'ariyalur', 'cuddalore', 'villupuram', ' Kallakurichi'];
  if (tamilNaduCities.some(c => city === c || city.includes(c))) {
    return 'Tamil Nadu';
  }

  // Telangana / Andhra Pradesh
  const telanganaCities = ['hyderabad', 'secunderabad', 'warangal', 'karimnagar', 'khammam', 'nizamabad', 'ramagundam', 'siddipet', 'jagtial', 'mahbubnagar', 'nalgonda', 'suryapet', 'miryalaguda', 'medak', 'sangareddy', 'yadadri'];
  const andhraCities = ['vizag', 'visakhapatnam', 'vijayawada', 'guntur', 'nellore', 'kakinada', 'tirupati', 'kurnool', 'rajahmundry', 'kadapa', 'ananthapur', 'ongole', 'eluru', 'machilipatnam'];
  if (telanganaCities.some(c => city === c || city.includes(c)) || city.includes('hyderabad')) {
    return 'Telangana';
  }
  if (andhraCities.some(c => city === c || city.includes(c))) {
    return 'Andhra Pradesh';
  }

  // West Bengal
  const westBengalCities = ['kolkata', 'howrah', 'asansol', 'durgapur', 'siliguri', 'kharagpur', 'murshidabad', 'bardhaman', 'berhampore', 'malda', 'bishnupur'];
  if (westBengalCities.some(c => city === c || city.includes(c))) {
    return 'West Bengal';
  }

  // Rajasthan
  const rajasthanCities = ['jaipur', 'jodhpur', 'udaipur', 'kota', 'bikaner', 'ajmer', 'beawar', 'bhilwara', 'alwar', 'sikar', 'Jhansi'];
  if (rajasthanCities.some(c => city === c || city.includes(c))) {
    return 'Rajasthan';
  }

  // Uttar Pradesh
  const upCities = ['lucknow', 'kanpur', 'varanasi', 'prayagraj', 'agra', ' Meerut', 'aligarh', 'bareilly', 'gorakhpur', 'moradabad', 'saharanpur', 'gorakhpur', 'jhansi', 'lucanow'];
  if (upCities.some(c => city === c || city.includes(c))) {
    return 'Uttar Pradesh';
  }

  // Kerala
  const keralaCities = ['kochi', 'thiruvananthapuram', 'kozhikode', 'kollam', 'palakkad', 'thrissur', 'kannur', 'alappuzha', 'kottayam', 'mavelikkara'];
  if (keralaCities.some(c => city === c || city.includes(c))) {
    return 'Kerala';
  }

  // Madhya Pradesh
  const mpCities = ['indore', 'bhopal', 'gwalior', 'jabalpur', 'ujjain', 'dewasa', 'sagar', 'dhar'];
  if (mpCities.some(c => city === c || city.includes(c))) {
    return 'Madhya Pradesh';
  }

  // Punjab
  const punjabCities = ['amritsar', 'ludhiana', 'jalandhar', 'patiala', 'bathinda', 'hoshiarpur', 'moga', 'firozpur', 'kapurthala'];
  if (punjabCities.some(c => city === c || city.includes(c))) {
    return 'Punjab';
  }

  // Chandigarh
  if (city.includes('chandigarh')) {
    return 'Chandigarh';
  }

  // Odisha
  const odishaCities = ['bhubaneswar', 'cuttack', 'rourkela', 'berhampur', 'sambalpur', 'puri'];
  if (odishaCities.some(c => city === c || city.includes(c))) {
    return 'Odisha';
  }

  // Bihar
  const biharCities = ['patna', 'muzaffarpur', 'gaya', 'bhagalpur', 'darbhanga', 'purnea', 'bihar Sharif', 'katihar', 'begusarai'];
  if (biharCities.some(c => city === c || city.includes(c))) {
    return 'Bihar';
  }

  // Jharkhand
  const jharkhandCities = ['ranchi', 'jamshedpur', 'dhanbad', 'bokaro', 'hazaribagh'];
  if (jharkhandCities.some(c => city === c || city.includes(c))) {
    return 'Jharkhand';
  }

  // Uttarakhand
  const uttarakhandCities = ['dehradun', 'haridwar', 'roorkee', ' Haldwani', 'rudrapur', 'kashipur'];
  if (uttarakhandCities.some(c => city === c || city.includes(c))) {
    return 'Uttarakhand';
  }

  // Himachal Pradesh
  const hpCities = ['shimla', 'manali', 'dharamshala', 'kullu', 'mandi', 'solan'];
  if (hpCities.some(c => city === c || city.includes(c))) {
    return 'Himachal Pradesh';
  }

  // Goa
  const goaCities = ['panaji', 'margao', 'vasco da gama', 'mormugao', 'ponda', 'mapusa'];
  if (goaCities.some(c => city === c || city.includes(c))) {
    return 'Goa';
  }

  // Northeast states
  const neCities = {
    'assam': ['guwahati', 'silchar', 'dibrugarh', 'jorhat', 'tezpur'],
    'manipur': ['imphal'],
    'meghalaya': ['shillong', 'tura'],
    'nagaland': ['kohima', 'dimapur'],
    'tripura': ['agartala'],
    'mizoram': ['aizawl'],
    'arunachal pradesh': ['itanagar']
  };

  for (const [state, citiesList] of Object.entries(neCities)) {
    if (citiesList.some(c => city === c || city.includes(c))) {
      return state.charAt(0).toUpperCase() + state.slice(1);
    }
  }

  return 'Unknown State';
};