// app/treatment/[slug]/utils.ts
// Optimized utility functions for treatment slug page with direct CMS integration

import { getAllCMSData, generateSlug as cmsGenerateSlug } from '@/lib/cms'
import type {
  HospitalData,
  BranchData,
  DoctorData,
  TreatmentData,
  ExtendedTreatmentData,
  CityData,
  DepartmentData,
  SpecializationData,
} from '@/lib/cms/types'

/**
 * Extended treatment with hospitals and doctors data
 */
export interface TreatmentWithHospitalsAndDoctors {
  treatment: ExtendedTreatmentData
  hospitals: HospitalTreatmentInfo[]
  allDoctors: DoctorInfo[]
  totalHospitals: number
  totalDoctors: number
}

/**
 * Hospital info with treatment-specific data
 */
export interface HospitalTreatmentInfo {
  hospital: HospitalData
  branches: BranchTreatmentInfo[]
  doctors: DoctorInfo[]
}

/**
 * Branch info with treatment-specific data
 */
export interface BranchTreatmentInfo {
  branch: BranchData
  treatmentCost: string | null
  treatmentDuration: string | null
  matchingDoctors: DoctorInfo[]
}

/**
 * Doctor info with location data
 */
export interface DoctorInfo {
  doctor: DoctorData
  hospitals: {
    hospitalId: string
    hospitalName: string
    hospitalLogo: string | null
    branchId?: string
    branchName?: string
    cities: CityData[]
  }[]
  departments: DepartmentData[]
  totalExperience: number
}

/**
 * Generate URL-friendly slug from treatment name
 */
export function generateSlug(name: string | null | undefined): string {
  return cmsGenerateSlug(name)
}

/**
 * Normalize slug for comparison
 */
function normalizeSlug(slug: string): string {
  return slug.toLowerCase().trim().replace(/[-_]+/g, '-')
}

/**
 * Check if treatment matches by name (case-insensitive)
 */
function treatmentMatchesName(treatment: TreatmentData, name: string): boolean {
  const treatmentName = treatment.name?.toLowerCase() || ''
  const searchName = name.toLowerCase()
  return treatmentName === searchName || treatmentName.includes(searchName)
}

/**
 * Find treatment and map hospital/doctor data properly
 * Uses direct CMS library for efficient data access
 */
export async function findTreatmentWithHospitalsAndDoctors(
  slug: string
): Promise<TreatmentWithHospitalsAndDoctors | null> {
  try {
    // Fetch all CMS data using the centralized service
    const { treatments, hospitals } = await getAllCMSData()
    
    if (!treatments || !hospitals) {
      console.warn('CMS data not available')
      return null
    }
    
    // Normalize slug
    const normalizedSlug = normalizeSlug(slug)
    
    // Find treatment by slug
    const treatment = treatments.find((t: ExtendedTreatmentData) => {
      const treatmentSlug = generateSlug(t.name)
      return treatmentSlug === normalizedSlug || treatmentSlug === slug
    })
    
    if (!treatment) {
      console.warn('Treatment not found for slug:', slug)
      return null
    }
    
    // Build treatment name for matching
    const treatmentName = treatment.name?.toLowerCase() || ''
    
    // Build treatment-department lookup
    const treatmentDeptNames = new Set(
      treatment.departments?.map(d => d.name?.toLowerCase()) || []
    )
    
    // Map hospitals and branches offering this treatment
    const hospitalTreatmentMap = new Map<string, HospitalTreatmentInfo>()
    const allDoctorsMap = new Map<string, DoctorInfo>()
    
    for (const hospital of hospitals) {
      let hospitalHasTreatment = false
      const branchesWithTreatment: BranchTreatmentInfo[] = []
      
      for (const branch of hospital.branches || []) {
        // Check if branch offers this treatment
        const branchTreatments = [
          ...(branch.treatments || []),
          ...(branch.specialists || []).flatMap((s: SpecializationData) => s.treatments || [])
        ]
        
        const offersTreatment = branchTreatments.some((t: TreatmentData) =>
          treatmentMatchesName(t, treatmentName) ||
          generateSlug(t.name) === generateSlug(treatment.name)
        )
        
        if (!offersTreatment) continue
        hospitalHasTreatment = true
        
        // Find matching doctors for this branch/treatment
        const matchingDoctors: DoctorInfo[] = []
        
        // Get all doctors for this branch (including hospital-level doctors)
        const branchDoctors = [
          ...(branch.doctors || []),
          ...(hospital.doctors || [])
        ]
        
        for (const doc of branchDoctors) {
          // Check if doctor matches this treatment via departments
          const docDepts = doc.specialization?.flatMap((s: SpecializationData) =>
            s.department?.map(d => d.name?.toLowerCase() || '') || []
          ) || []
          
          const deptMatch = docDepts.some(d =>
            treatmentDeptNames.has(d) ||
            treatmentDeptNames.has(d.replace('department of ', ''))
          )
          
          if (!deptMatch) continue
          
          // Build doctor info
          if (!allDoctorsMap.has(doc._id)) {
            const doctorLocations: DoctorInfo['hospitals'] = []
            
            doctorLocations.push({
              hospitalId: hospital._id,
              hospitalName: hospital.hospitalName,
              hospitalLogo: hospital.logo || null,
              branchId: branch._id,
              branchName: branch.branchName,
              cities: branch.city || []
            })
            
            const expYears = parseInt(doc.experienceYears || '0', 10)
            
            const allDepts: DepartmentData[] = []
            doc.specialization?.forEach((s: SpecializationData) => {
              s.department?.forEach((d: DepartmentData) => {
                if (!allDepts.some(existing => existing._id === d._id)) {
                  allDepts.push(d)
                }
              })
            })
            
            allDoctorsMap.set(doc._id, {
              doctor: doc,
              hospitals: doctorLocations,
              departments: allDepts,
              totalExperience: expYears
            })
          } else {
            // Add branch location to existing doctor
            const existingDoc = allDoctorsMap.get(doc._id)!
            const hasLocation = existingDoc.hospitals.some(
              loc => loc.hospitalId === hospital._id && loc.branchId === branch._id
            )
            if (!hasLocation) {
              existingDoc.hospitals.push({
                hospitalId: hospital._id,
                hospitalName: hospital.hospitalName,
                hospitalLogo: hospital.logo || null,
                branchId: branch._id,
                branchName: branch.branchName,
                cities: branch.city || []
              })
            }
          }
          
          const docInfo = allDoctorsMap.get(doc._id)!
          if (!matchingDoctors.some(m => m.doctor._id === doc._id)) {
            matchingDoctors.push(docInfo)
          }
        }
        
        // Extract treatment cost and duration from branch data
        const treatmentData = branch.treatments?.find((t: TreatmentData) =>
          generateSlug(t.name) === generateSlug(treatment.name)
        )
        
        branchesWithTreatment.push({
          branch,
          treatmentCost: treatmentData?.cost || null,
          treatmentDuration: treatmentData?.duration || null,
          matchingDoctors
        })
      }
      
      if (branchesWithTreatment.length > 0) {
        // Collect doctors for this hospital (from all branches)
        const hospitalDoctors: DoctorInfo[] = []
        const doctorIds = new Set<string>()
        
        for (const b of branchesWithTreatment) {
          for (const doc of b.matchingDoctors) {
            if (!doctorIds.has(doc.doctor._id)) {
              doctorIds.add(doc.doctor._id)
              hospitalDoctors.push(doc)
            }
          }
        }
        
        hospitalTreatmentMap.set(hospital._id, {
          hospital,
          branches: branchesWithTreatment,
          doctors: hospitalDoctors
        })
      }
    }
    
    // Convert maps to arrays and sort
    const hospitalsArray = Array.from(hospitalTreatmentMap.values())
      .sort((a, b) => a.hospital.hospitalName.localeCompare(b.hospital.hospitalName))
    
    const doctorsArray = Array.from(allDoctorsMap.values())
      .sort((a, b) => b.totalExperience - a.totalExperience)
    
    return {
      treatment,
      hospitals: hospitalsArray,
      allDoctors: doctorsArray,
      totalHospitals: hospitalsArray.length,
      totalDoctors: doctorsArray.length
    }
  } catch (error) {
    console.error('Error finding treatment with hospitals and doctors:', error)
    return null
  }
}

/**
 * Legacy function - kept for backward compatibility
 */
export async function findTreatmentWithDoctors(slug: string) {
  const result = await findTreatmentWithHospitalsAndDoctors(slug)
  
  if (!result) return null
  
  // Convert to legacy format
  const branchesOfferingTreatment = result.hospitals.flatMap(h =>
    h.branches.map(b => ({
      ...b.branch,
      hospitalName: h.hospital.hospitalName,
      hospitalId: h.hospital._id,
      hospitalLogo: h.hospital.logo,
      matchingDoctors: b.matchingDoctors
    }))
  )
  
  return {
    treatment: result.treatment,
    branchesOfferingTreatment,
    allMatchingDoctors: result.allDoctors.map(d => d.doctor)
  }
}
