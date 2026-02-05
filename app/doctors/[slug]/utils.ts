// app/doctors/[slug]/utils.ts
// Simplified utility functions for doctor slug page data fetching

import { getAllCMSData, generateSlug as cmsGenerateSlug } from '@/lib/cms'
import type {
  HospitalData,
  BranchData,
  DoctorData,
  TreatmentData,
  CityData,
  DepartmentData,
  SpecializationData,
} from '@/lib/cms/types'

/**
 * Doctor data with all related information
 */
export interface DoctorDataWithLocations extends DoctorData {
  baseId: string
  locations: DoctorLocation[]
  departments: DepartmentData[]
  relatedTreatments: TreatmentData[]
}

/**
 * Location where doctor practices
 */
export interface DoctorLocation {
  hospitalId: string
  hospitalName: string
  hospitalLogo: string | null
  branchId?: string
  branchName?: string
  cities: CityData[]
}

/**
 * Hospital data with enriched branches
 */
export interface EnrichedHospitalData extends HospitalData {
  city?: CityData[]
}

/**
 * Generate URL-friendly slug from name
 */
export function slugify(name: string | null | undefined): string {
  return cmsGenerateSlug(name)
}

/**
 * Normalize slug for comparison
 */
function normalizeSlug(slug: string): string {
  return slug.toLowerCase().trim().replace(/[-_]+/g, '-')
}

/**
 * Merge treatments from different sources avoiding duplicates
 */
function mergeTreatmentsArray(existing: TreatmentData[] | undefined, current: TreatmentData[] | undefined): TreatmentData[] {
  const allTreatments = [...(existing || []), ...(current || [])]
  const treatmentMap = new Map<string, TreatmentData>()
  
  allTreatments.forEach(t => {
    if (t._id) {
      treatmentMap.set(t._id, t)
    }
  })
  
  return Array.from(treatmentMap.values())
}

/**
 * Get all doctors with their locations from hospitals data
 */
function extractDoctorsWithLocations(hospitals: HospitalData[]): DoctorDataWithLocations[] {
  const extendedMap = new Map<string, DoctorDataWithLocations>()
  
  hospitals.forEach((h) => {
    const processDoctor = (item: DoctorData, branch?: BranchData) => {
      const baseId = item._id || item.doctorName
      
      if (!baseId || !item.doctorName) return
      
      const doctorDepartments: DepartmentData[] = []
      item.specialization?.forEach((spec: SpecializationData) => {
        spec.department?.forEach((dept: DepartmentData) => {
          doctorDepartments.push(dept)
        })
      })
      const uniqueDepartments = Array.from(new Map(doctorDepartments.map(dept => [dept._id, dept])).values())
      
      const location: DoctorLocation = {
        hospitalId: h._id,
        hospitalName: h.hospitalName,
        hospitalLogo: h.logo || null,
        branchId: branch?._id,
        branchName: branch?.branchName,
        cities: (branch as any)?.city || [],
      }
      
      let treatmentsFromThisLocation: TreatmentData[] = []
      
      treatmentsFromThisLocation = mergeTreatmentsArray(
        branch?.treatments,
        h.treatments
      )
      
      const doctorTreatments = item.specialization?.flatMap((spec: SpecializationData) => spec.treatments || []) || []
      treatmentsFromThisLocation = mergeTreatmentsArray(treatmentsFromThisLocation, doctorTreatments)
      
      const doctorSpecNames = item.specialization?.map((s: SpecializationData) => typeof s === 'string' ? s : s.name).filter(Boolean) || []
      h.specialists?.forEach((spec: SpecializationData) => {
        if (doctorSpecNames.includes(spec.name)) {
          treatmentsFromThisLocation = mergeTreatmentsArray(treatmentsFromThisLocation, spec.treatments)
        }
      })
      
      branch?.specialists?.forEach((spec: SpecializationData) => {
        if (doctorSpecNames.includes(spec.name)) {
          treatmentsFromThisLocation = mergeTreatmentsArray(treatmentsFromThisLocation, spec.treatments)
        }
      })
      
      if (extendedMap.has(baseId)) {
        const existingDoctor = extendedMap.get(baseId)!
        
        const isLocationDuplicate = existingDoctor.locations.some(
          loc => loc.hospitalId === h._id && (loc.branchId === branch?._id || (!loc.branchId && !branch?._id))
        )
        if (!isLocationDuplicate) {
          existingDoctor.locations.push(location)
        }
        
        const allDepts = [...existingDoctor.departments, ...uniqueDepartments]
        existingDoctor.departments = Array.from(new Map(allDepts.map(dept => [dept._id, dept])).values())
        
        existingDoctor.relatedTreatments = mergeTreatmentsArray(existingDoctor.relatedTreatments, treatmentsFromThisLocation)
        
      } else {
        const expYears = parseInt(item.experienceYears || '0', 10)
        
        extendedMap.set(baseId, {
          ...item,
          baseId,
          locations: [location],
          departments: uniqueDepartments,
          relatedTreatments: treatmentsFromThisLocation,
        } as DoctorDataWithLocations)
      }
    }
    
    h.doctors.forEach((d: DoctorData) => processDoctor(d))
    h.branches.forEach((b: BranchData) => {
      b.doctors.forEach((d: DoctorData) => processDoctor(d, b))
    })
  })
  
  return Array.from(extendedMap.values())
}

/**
 * Find doctor by slug and return with all related data
 * Uses direct CMS library for efficient data access
 */
export async function findDoctorBySlug(slug: string): Promise<DoctorDataWithLocations | null> {
  try {
    const normalizedSlug = normalizeSlug(slug)
    
    // Fetch all CMS data using the centralized service
    const { hospitals } = await getAllCMSData()
    
    if (!hospitals) {
      console.warn('CMS data not available')
      return null
    }
    
    // Get all doctors with locations
    const allDoctors = extractDoctorsWithLocations(hospitals)
    
    // Find doctor by slug
    const foundDoctor = allDoctors.find((d: DoctorDataWithLocations) => {
      const doctorSlug = slugify(d.doctorName)
      return doctorSlug === normalizedSlug || doctorSlug === slug
    })
    
    if (!foundDoctor) {
      console.warn('Doctor not found for slug:', slug)
      return null
    }
    
    return foundDoctor
  } catch (error) {
    console.error('Error finding doctor by slug:', error)
    return null
  }
}

/**
 * Get all hospitals data for doctor page
 */
export async function getAllHospitalsData(): Promise<HospitalData[]> {
  try {
    const { hospitals } = await getAllCMSData()
    return hospitals || []
  } catch (error) {
    console.error('Error fetching hospitals data:', error)
    return []
  }
}

/**
 * Get all doctors with their locations from hospitals data
 */
export async function getAllDoctorsWithLocations(): Promise<DoctorDataWithLocations[]> {
  try {
    const { hospitals } = await getAllCMSData()
    if (!hospitals) return []
    return extractDoctorsWithLocations(hospitals)
  } catch (error) {
    console.error('Error getting doctors with locations:', error)
    return []
  }
}
