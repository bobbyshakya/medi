// lib/cms/types.ts
// Unified type definitions for CMS data

export interface CityData {
  _id: string
  cityName: string
  state: string
  country: string
  stateId?: string
  countryId?: string
}

export interface DepartmentData {
  _id: string
  name: string
}

export interface AccreditationData {
  _id: string
  title: string
  image?: string | null
}

export interface SpecializationData {
  _id: string
  name: string
  isTreatment?: boolean
  department?: DepartmentData[]
  treatments?: TreatmentData[]
}

export interface TreatmentData {
  _id: string
  name: string
  description?: string | null
  category?: string | null
  duration?: string | null
  cost?: string | null
  treatmentImage?: string | null
  popular?: boolean
  // Branch references - populated from CMS via treatmentBranchMap
  branchesAvailableAt?: TreatmentLocation[] | null
}

export interface DoctorData {
  _id: string
  doctorName: string
  specialization: SpecializationData[]
  qualification?: string | null
  experienceYears?: string | null
  designation?: string | null
  aboutDoctor?: string | null
  aboutDoctorHtml?: string | null
  profileImage?: string | null
  popular?: boolean
}

export interface BranchData {
  _id: string
  branchName: string
  address?: string | null
  city: CityData[]
  specialty: SpecializationData[]
  accreditation: AccreditationData[]
  description?: string | null
  totalBeds?: string | null
  noOfDoctors?: string | null
  yearEstablished?: string | null
  branchImage?: string | null
  logo?: string | null
  doctors: DoctorData[]
  specialists: SpecializationData[]
  treatments: TreatmentData[]
  specialization: SpecializationData[]
  popular?: boolean
  isStandalone?: boolean
  showHospital?: boolean
}

export interface HospitalData {
  _id: string
  hospitalName: string
  description?: string | null
  specialty: SpecializationData[]
  yearEstablished?: string | null
  hospitalImage?: string | null
  logo?: string | null
  isStandalone?: boolean
  originalBranchId?: string
  branches: BranchData[]
  doctors: DoctorData[]
  specialists: SpecializationData[]
  treatments: TreatmentData[]
  accreditations: AccreditationData[]
  showHospital?: boolean
}

// Extended types for client-side use
export interface ExtendedDoctorData extends DoctorData {
  baseId: string
  locations: {
    hospitalName: string
    hospitalId: string
    branchName?: string
    branchId?: string
    cities: CityData[]
  }[]
  departments: DepartmentData[]
  filteredLocations?: {
    hospitalName: string
    hospitalId: string
    branchName?: string
    branchId?: string
    cities: CityData[]
  }[]
}

export interface TreatmentLocation {
  branchId?: string
  branchName?: string
  hospitalName: string
  hospitalId: string
  cities: CityData[]
  departments: DepartmentData[]
  cost?: string | null
}

export interface ExtendedTreatmentData extends TreatmentData {
  branchesAvailableAt: TreatmentLocation[]
  departments: DepartmentData[]
}

// API Response types
export interface CMSDataResponse {
  hospitals: HospitalData[]
  treatments: ExtendedTreatmentData[]
  doctors: DoctorData[]
  totalHospitals: number
  totalTreatments: number
  totalDoctors: number
  lastUpdated: string
}

export interface HospitalDetailResponse {
  hospital: HospitalData | null
  similarHospitals: HospitalData[]
  error?: string
}

// Filter types
export type FilterKey = 'city' | 'state' | 'treatment' | 'specialization' | 'department' | 'doctor' | 'branch' | 'location'

export interface FilterValue {
  id: string
  query: string
}

export interface FilterState {
  view: 'hospitals' | 'doctors' | 'treatments'
  city: FilterValue
  state: FilterValue
  treatment: FilterValue
  specialization: FilterValue
  department: FilterValue
  doctor: FilterValue
  branch: FilterValue
  location: FilterValue
  sortBy: 'all' | 'popular' | 'az' | 'za'
}

// Utility type for filter options
export interface FilterOption {
  id: string
  name: string
}
