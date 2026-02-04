// app/treatment/[slug]/utils.ts
// Utility functions for treatment slug page

import { getTreatmentBySlug, getAllCMSData, generateSlug } from '@/lib/cms'

/**
 * Get treatment data by slug with branch availability
 * Uses direct CMS library call to avoid API route issues in production
 */
export const fetchTreatmentBySlug = async (slug: string) => {
  try {
    const treatment = await getTreatmentBySlug(slug)
    return treatment
  } catch (error) {
    console.error('Error fetching treatment by slug:', error)
    return null
  }
}

/**
 * Get all treatments with extended data (for treatment page)
 * Uses direct CMS library call
 */
export const fetchAllTreatmentsData = async () => {
  try {
    const { treatments, hospitals } = await getAllCMSData()
    return { treatments, hospitals }
  } catch (error) {
    console.error('Error fetching treatments data:', error)
    return { treatments: [], hospitals: [] }
  }
}

/**
 * Extended treatment with matching doctors
 */
export interface TreatmentWithDoctors {
  treatment: any
  branchesOfferingTreatment: any[]
  allMatchingDoctors: any[]
}

/**
 * Find treatment and collect matching doctors
 * This replaces the getAllExtendedTreatments and getAllExtendedDoctors logic
 */
export const findTreatmentWithDoctors = async (slug: string): Promise<TreatmentWithDoctors | null> => {
  try {
    const { treatments, hospitals } = await fetchAllTreatmentsData()
    
    // Normalize slug
    const normalizedSlug = slug.toLowerCase().trim().replace(/[-_]+/g, '-')
    
    // Find treatment
    const treatment = treatments.find((t: any) => {
      const treatmentSlug = generateSlug(t.name)
      return treatmentSlug === normalizedSlug || treatmentSlug === slug
    })
    
    if (!treatment) {
      return null
    }
    
    // Collect all extended doctors
    const allExtendedDoctors = getAllExtendedDoctors(hospitals)
    
    // Get treatment department names for matching
    const lowerTreatmentDepts = treatment.departments?.map((d: any) => d.name.toLowerCase()) || []
    
    // Collect all branches offering this treatment with matching doctors
    const branchesOfferingTreatment: any[] = []
    const uniqueDoctorsIds = new Set<string>()
    
    hospitals.forEach((hospital: any) => {
      hospital.branches.forEach((branch: any) => {
        const branchTreatments = [
          ...(branch.treatments || []),
          ...(branch.specialists || []).flatMap((s: any) => s.treatments || [])
        ]
        
        if (branchTreatments.some((t: any) => generateSlug(t.name) === generateSlug(treatment.name))) {
          // Find matching doctors for this branch
          const matchingDoctorsForBranch = allExtendedDoctors.filter((doctor: any) => {
            const hasLocationInThisBranch = doctor.locations?.some((loc: any) =>
              loc.hospitalId === hospital._id &&
              (loc.branchId === branch._id || !loc.branchId)
            )
            const deptMatch = doctor.departments?.some((dept: any) =>
              lowerTreatmentDepts.includes(dept.name.toLowerCase())
            )
            return hasLocationInThisBranch && deptMatch
          })
          
          // Add doctors to unique set
          matchingDoctorsForBranch.forEach((doc: any) => {
            uniqueDoctorsIds.add(doc._id)
          })
          
          branchesOfferingTreatment.push({
            ...branch,
            hospitalName: hospital.hospitalName,
            hospitalId: hospital._id,
            hospitalLogo: hospital.logo,
            matchingDoctors: matchingDoctorsForBranch
          })
        }
      })
    })
    
    // Collect unique matching doctors across ALL branches
    const allMatchingDoctors = Array.from(uniqueDoctorsIds)
      .map((id: string) => allExtendedDoctors.find((d: any) => d._id === id))
      .filter(Boolean)
      .sort((a: any, b: any) => {
        const expA = parseInt(a.experienceYears || '0', 10)
        const expB = parseInt(b.experienceYears || '0', 10)
        return expB - expA
      })
    
    return {
      treatment,
      branchesOfferingTreatment,
      allMatchingDoctors
    }
  } catch (error) {
    console.error('Error finding treatment with doctors:', error)
    return null
  }
}

/**
 * Get all extended doctors from hospitals (copied from treatment page)
 */
function getAllExtendedDoctors(hospitals: any[]): any[] {
  const extendedMap = new Map<string, any>()
  
  hospitals.forEach((h) => {
    const processDoctor = (item: any, branch?: any) => {
      const baseId = item._id
      
      const doctorDepartments: any[] = []
      item.specialization?.forEach((spec: any) => {
        spec.department?.forEach((dept: any) => {
          doctorDepartments.push(dept)
        })
      })
      const uniqueDepartments = Array.from(new Map(doctorDepartments.map((dept: any) => [dept._id, dept])).values())
      
      const location = {
        hospitalName: h.hospitalName,
        hospitalId: h._id,
        branchName: branch?.branchName,
        branchId: branch?._id,
        cities: branch?.city || [],
      }
      
      if (extendedMap.has(baseId)) {
        const existingDoctor = extendedMap.get(baseId)
        
        const isLocationDuplicate = existingDoctor.locations?.some(
          (loc: any) => loc.hospitalId === h._id && (loc.branchId === branch?._id || (!loc.branchId && !branch?._id))
        )
        
        if (!isLocationDuplicate) {
          existingDoctor.locations.push(location)
        }
        
        const allDepts = [...existingDoctor.departments, ...uniqueDepartments]
        existingDoctor.departments = Array.from(new Map(allDepts.map((dept: any) => [dept._id, dept])).values())
        
      } else {
        extendedMap.set(baseId, {
          ...item,
          locations: [location],
          departments: uniqueDepartments,
        })
      }
    }
    
    h.doctors?.forEach((d: any) => processDoctor(d))
    
    h.branches?.forEach((b: any) => {
      b.doctors?.forEach((d: any) => processDoctor(d, b))
    })
  })
  
  return Array.from(extendedMap.values())
}
