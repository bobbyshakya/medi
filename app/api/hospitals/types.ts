// app/api/hospitals/types.ts
// Optimized type definitions for hospitals API

export interface HospitalFilters {
  branchIds?: string[]
  cityIds?: string[]
  doctorIds?: string[]
  specialtyIds?: string[]
  accreditationIds?: string[]
  treatmentIds?: string[]
  specialistIds?: string[]
  departmentIds?: string[]
}

export interface ApiParams {
  q?: string
  slug?: string
  page: number
  pageSize: number
  cursor?: string
  hospitalId?: string
  hospitalText?: string
  branchText?: string
  cityText?: string
  doctorText?: string
  specialtyText?: string
  accreditationText?: string
  treatmentText?: string
  specialistText?: string
  departmentText?: string
  branchId?: string
  cityId?: string
  doctorId?: string
  specialtyId?: string
  accreditationId?: string
  treatmentId?: string
  specialistId?: string
  departmentId?: string
  includeStandalone: boolean
  minimal: boolean
  showHospital: boolean
}

export interface FilterIds {
  branch: string[]
  city: string[]
  doctor: string[]
  specialty: string[]
  accreditation: string[]
  treatment: string[]
  specialist: string[]
  department: string[]
}

export interface ApiResponse {
  items: any[]
  total: number
  page: number
  pageSize: number
  regularCount: number
  standaloneCount: number
  filteredCount: number
  hasMore: boolean
  nextCursor?: string
}

export interface PaginatedApiResponse<T> extends ApiResponse {
  items: T[]
}

export interface HospitalData {
  _id: string
  hospitalName: string
  description: string
  specialty: any[]
  yearEstablished?: string | null
  hospitalImage?: string
  logo?: string
  isStandalone?: boolean
  originalBranchId?: string
  branches: any[]
  doctors: any[]
  specialists: any[]
  treatments: any[]
  accreditations: any[]
  showHospital: boolean
}

export interface BranchData {
  _id: string
  branchName: string
  address?: string | null
  city: any[]
  specialty: any[]
  accreditation: any[]
  description: string
  totalBeds?: string | null
  noOfDoctors?: string | null
  yearEstablished?: string | null
  branchImage?: string
  logo?: string
  doctors: any[]
  specialists: any[]
  treatments: any[]
  specialization: any[]
  popular: boolean
  isStandalone: boolean
  showHospital: boolean
}

export interface DoctorData {
  _id: string
  doctorName: string
  specialization: any[]
  qualification?: string | null
  experienceYears?: string | null
  designation?: string | null
  aboutDoctor: string
  aboutDoctorHtml: string
  profileImage?: string
  popular: boolean
}

export interface CityData {
  _id: string
  cityName: string
  stateId?: string
  state: string
  countryId?: string
  country: string
}

// =============================================================================
// PERFORMANCE OPTIMIZATION TYPES
// =============================================================================

export interface LazyLoadConfig {
  loadBranches: boolean
  loadDoctors: boolean
  loadCities: boolean
  loadAccreditations: boolean
  loadTreatments: boolean
  loadSpecialists: boolean
  limitBranches?: number
}

export interface QueryOptimizationConfig {
  useCursorPagination: boolean
  parallelFetch: boolean
  cacheResults: boolean
  lazyLoadRelated: boolean
}