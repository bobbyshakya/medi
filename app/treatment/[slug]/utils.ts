// app/treatment/[slug]/utils.ts
// Optimized utility functions for treatment slug page with direct CMS integration

import { getAllCMSData, generateSlug as cmsGenerateSlug } from "@/lib/cms"
import type {
  HospitalData,
  BranchData,
  DoctorData,
  TreatmentData,
  ExtendedTreatmentData,
  CityData,
  DepartmentData,
  SpecializationData,
  TreatmentLocation,
} from "@/lib/cms/types"

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
  return slug.toLowerCase().trim().replace(/[-_]+/g, "-")
}

/**
 * Check if treatment matches by name (case-insensitive, flexible matching)
 */
function treatmentMatchesName(treatment: TreatmentData | SpecializationData, searchName: string): boolean {
  const treatmentName = treatment.name?.toLowerCase() || ""
  const searchLower = searchName.toLowerCase()
  
  // Exact match
  if (treatmentName === searchLower) return true
  
  // Treatment name contains search term
  if (treatmentName.includes(searchLower)) return true
  
  // Search term contains treatment name
  if (searchLower.includes(treatmentName)) return true
  
  // Compare slugs
  const treatmentSlug = generateSlug(treatment.name)
  const searchSlug = generateSlug(searchName)
  if (treatmentSlug === searchSlug) return true
  
  return false
}

/**
 * Extract cost from treatment (handles various field names)
 */
function getTreatmentCost(treatment: any): string | null {
  return treatment.cost || treatment.treatmentCost || treatment.price || treatment.amount || null
}

/**
 * Extract duration from treatment (handles various field names)
 */
function getTreatmentDuration(treatment: any): string | null {
  return treatment.duration || treatment.treatmentDuration || treatment.time || null
}

/**
 * Check if a branch offers a specific treatment by checking all treatment references
 * This is a helper function to improve treatment matching
 */
function findMatchingTreatmentOnBranch(
  branch: any,
  treatmentName: string,
  treatmentSlug: string,
  treatmentId: string
): TreatmentData | null {
  // Check branch treatments directly
  const branchTreatments = branch.treatments || []
  
  for (const t of branchTreatments) {
    const tSlug = generateSlug(t.name)
    const tId = t._id
    const tName = t.name?.toLowerCase() || ""
    
    if (tId === treatmentId || tSlug === treatmentSlug || tName === treatmentName.toLowerCase()) {
      return t
    }
    
    // Also check via treatmentMatchesName
    if (treatmentMatchesName(t, treatmentName)) {
      return t
    }
  }
  
  // Check specialization treatments (including isTreatment flag)
  for (const spec of branch.specialization || []) {
    // Check if the specialization itself is marked as a treatment
    if (spec.isTreatment && spec.name) {
      const specSlug = generateSlug(spec.name)
      if (specSlug === treatmentSlug || spec.name?.toLowerCase() === treatmentName.toLowerCase()) {
        return spec
      }
    }
    
    // Check treatments within specialization
    for (const t of spec.treatments || []) {
      const tSlug = generateSlug(t.name)
      if (tSlug === treatmentSlug || t.name?.toLowerCase() === treatmentName.toLowerCase()) {
        return t
      }
      if (treatmentMatchesName(t, treatmentName)) {
        return t
      }
    }
  }
  
  // Check specialist treatments
  for (const spec of branch.specialists || []) {
    // Check if the specialist is marked as a treatment
    if (spec.isTreatment && spec.name) {
      const specSlug = generateSlug(spec.name)
      if (specSlug === treatmentSlug || spec.name?.toLowerCase() === treatmentName.toLowerCase()) {
        return spec
      }
    }
    
    // Check treatments within specialists
    for (const t of spec.treatments || []) {
      const tSlug = generateSlug(t.name)
      if (tSlug === treatmentSlug || t.name?.toLowerCase() === treatmentName.toLowerCase()) {
        return t
      }
      if (treatmentMatchesName(t, treatmentName)) {
        return t
      }
    }
  }
  
  return null
}

/**
 * Build a mapping of branch IDs that offer each treatment
 * Uses the pre-populated branchesAvailableAt from getAllCMSData
 * Stores mappings by: treatment slug, treatment ID, and treatment name
 */
function buildTreatmentToBranchesMap(treatments: ExtendedTreatmentData[]): Map<string, TreatmentLocation[]> {
  const treatmentToBranches = new Map<string, TreatmentLocation[]>()
  
  treatments.forEach((treatment) => {
    const treatmentSlug = generateSlug(treatment.name)
    const treatmentId = treatment._id
    const treatmentName = treatment.name?.toLowerCase()
    const branches = treatment.branchesAvailableAt || []
    
    if (branches.length > 0) {
      // Store by slug
      treatmentToBranches.set(treatmentSlug, branches)
      
      // Also store by ID
      if (treatmentId) {
        treatmentToBranches.set(treatmentId, branches)
      }
      
      // Also store by name (normalized)
      if (treatmentName) {
        treatmentToBranches.set(treatmentName, branches)
      }
      
      console.log(`[TreatmentPage] Treatment "${treatment.name}" -> branches: ${branches.length}`)
    }
  })
  
  return treatmentToBranches
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
      console.warn("[TreatmentPage] CMS data not available")
      return null
    }
    
    console.log("[TreatmentPage] Total treatments:", treatments.length)
    console.log("[TreatmentPage] Total hospitals:", hospitals.length)
    
    // Normalize slug
    const normalizedSlug = normalizeSlug(slug)
    
    // Find treatment by slug
    const treatment = treatments.find((t: ExtendedTreatmentData) => {
      const treatmentSlug = generateSlug(t.name)
      return treatmentSlug === normalizedSlug || treatmentSlug === slug
    })
    
    if (!treatment) {
      console.warn("[TreatmentPage] Treatment not found for slug:", slug)
      return null
    }
    
    console.log("[TreatmentPage] Found treatment:", treatment.name)
    console.log("[TreatmentPage] Treatment departments:", treatment.departments?.length || 0)
    
    // Build treatment name for matching
    const treatmentName = treatment.name?.toLowerCase() || ""
    const treatmentSlug = generateSlug(treatment.name)
    
    // Build treatment-department lookup (both name and slug)
    const treatmentDeptNames = new Set<string>()
    const treatmentDeptSlugs = new Set<string>()
    
    treatment.departments?.forEach((d) => {
      if (d.name) {
        treatmentDeptNames.add(d.name.toLowerCase())
        treatmentDeptSlugs.add(generateSlug(d.name))
      }
    })
    
    console.log("[TreatmentPage] Looking for treatment:", treatmentName)
    console.log("[TreatmentPage] Department names to match:", Array.from(treatmentDeptNames))
    
    // Build mapping of which branches offer this treatment
    const treatmentToBranchesMap = buildTreatmentToBranchesMap(treatments)
    const targetTreatmentBranches = treatmentToBranchesMap.get(treatmentSlug) || []
    console.log("[TreatmentPage] Target treatment branches:", targetTreatmentBranches.length)
    
    // Build a set of branch IDs that offer this treatment
    const targetBranchIds = new Set(targetTreatmentBranches.map((b) => b.branchId).filter(Boolean))
    
    // Map hospitals and branches offering this treatment
    const hospitalTreatmentMap = new Map<string, HospitalTreatmentInfo>()
    const allDoctorsMap = new Map<string, DoctorInfo>()
    
    for (const hospital of hospitals) {
      console.log("[TreatmentPage] Checking hospital:", hospital.hospitalName)
      
      let hospitalHasTreatment = false
      const branchesWithTreatment: BranchTreatmentInfo[] = []
      
      // Check hospital-level treatments first
      const hospitalTreatments = hospital.treatments || []
      console.log("[TreatmentPage] Hospital treatments count:", hospitalTreatments.length)
      
      const hospitalOffersTreatment = hospitalTreatments.some((t: TreatmentData) =>
        treatmentMatchesName(t, treatmentName) ||
        generateSlug(t.name) === treatmentSlug
      )
      
      // Also check hospital specialty treatments
      const hospitalSpecialties = hospital.specialty || []
      const hospitalOffersViaSpecialty = hospitalSpecialties.some((s: SpecializationData) => {
        const specTreatments = s.treatments || []
        return specTreatments.some((t: TreatmentData) =>
          treatmentMatchesName(t, treatmentName) ||
          generateSlug(t.name) === treatmentSlug
        )
      })
      
      if (hospitalOffersTreatment || hospitalOffersViaSpecialty) {
        hospitalHasTreatment = true
        console.log("[TreatmentPage] Hospital offers treatment via hospital-level or specialty")
      }
      
      for (const branch of hospital.branches || []) {
        console.log("[TreatmentPage] Checking branch:", branch.branchName)
        
        // Check if this branch offers the treatment
        const branchId = branch._id
        let offersTreatment = false
        let matchingTreatment: TreatmentData | null = null
        
        // First, try using the new helper function to find matching treatment on branch
        const foundTreatment = findMatchingTreatmentOnBranch(branch, treatmentName, treatmentSlug, treatment._id)
        if (foundTreatment) {
          offersTreatment = true
          matchingTreatment = foundTreatment
        } else if (branchId && targetBranchIds.has(branchId)) {
          // This branch is in the target treatment's branches
          offersTreatment = true
          // Find the matching treatment from the treatments collection
          matchingTreatment = treatments.find((t: TreatmentData) =>
            treatmentMatchesName(t, treatmentName) ||
            generateSlug(t.name) === treatmentSlug
          ) || null
        } else {
          // Fallback: Check treatments directly on branch (old logic kept for compatibility)
          const branchTreatments = [
            ...(branch.treatments || []),
            ...(branch.specialization || []).flatMap((s: SpecializationData) => s.treatments || []),
            ...(branch.specialists || []).flatMap((s: SpecializationData) => s.treatments || []),
          ]
          
          console.log("[TreatmentPage] Branch treatments count:", branchTreatments.length)
          
          const match = branchTreatments.find((t: TreatmentData) =>
            treatmentMatchesName(t, treatmentName) ||
            generateSlug(t.name) === treatmentSlug
          )
          
          if (match) {
            offersTreatment = true
            matchingTreatment = match
          }
        }
        
        if (!offersTreatment) {
          // Also check via department matching
          const branchDepts = [
            ...(branch.specialization || []),
            ...(branch.specialists || []),
          ]
          
          const deptMatch = branchDepts.some((dept: SpecializationData) => {
            const deptName = dept.name?.toLowerCase() || ""
            const deptSlug = generateSlug(dept.name)
            
            // Check if any treatment department matches
            return (
              treatmentDeptNames.has(deptName) ||
              treatmentDeptSlugs.has(deptSlug) ||
              Array.from(treatmentDeptNames).some((td) => deptName.includes(td)) ||
              Array.from(treatmentDeptSlugs).some((td) => deptSlug.includes(td))
            )
          })
          
          if (!deptMatch) continue
          
          offersTreatment = true
          hospitalHasTreatment = true
          console.log("[TreatmentPage] Branch matches via department:", branch.branchName)
        } else {
          hospitalHasTreatment = true
          console.log("[TreatmentPage] Branch offers treatment:", branch.branchName)
        }
        
        // Find matching doctors for this branch/treatment
        const matchingDoctors: DoctorInfo[] = []
        
        // Get all doctors for this branch (including hospital-level doctors)
        const branchDoctors = [
          ...(branch.doctors || []),
          ...(hospital.doctors || []),
        ]
        
        console.log("[TreatmentPage] Total doctors to check:", branchDoctors.length)
        
        for (const doc of branchDoctors) {
          // Check if doctor matches this treatment via departments
          const docSpecializations = doc.specialization || []
          
          const deptMatch = docSpecializations.some((s: SpecializationData) => {
            const specName = s.name?.toLowerCase() || ""
            const specSlug = generateSlug(s.name)
            
            // Check if specialization matches any treatment department
            return (
              treatmentDeptNames.has(specName) ||
              treatmentDeptSlugs.has(specSlug) ||
              Array.from(treatmentDeptNames).some((td) => specName.includes(td)) ||
              Array.from(treatmentDeptSlugs).some((td) => specSlug.includes(td))
            )
          })
          
          if (!deptMatch) continue
          
          console.log("[TreatmentPage] Doctor matches:", doc.doctorName)
          
          // Build doctor info
          if (!allDoctorsMap.has(doc._id)) {
            const doctorLocations: DoctorInfo["hospitals"] = []
            
            doctorLocations.push({
              hospitalId: hospital._id,
              hospitalName: hospital.hospitalName,
              hospitalLogo: hospital.logo || null,
              branchId: branch._id,
              branchName: branch.branchName,
              cities: branch.city || [],
            })
            
            const expYears = parseInt(doc.experienceYears || "0", 10)
            
            // Collect all departments from doctor's specializations
            const allDepts: DepartmentData[] = []
            doc.specialization?.forEach((s: SpecializationData) => {
              s.department?.forEach((d: DepartmentData) => {
                if (!allDepts.some((existing) => existing._id === d._id)) {
                  allDepts.push(d)
                }
              })
            })
            
            const doctorInfo: DoctorInfo = {
              doctor: doc,
              hospitals: doctorLocations,
              departments: allDepts,
              totalExperience: expYears,
            }
            
            allDoctorsMap.set(doc._id, doctorInfo)
          } else {
            // Add this hospital/branch to existing doctor's locations
            const existingDoc = allDoctorsMap.get(doc._id)!
            const locationExists = existingDoc.hospitals.some(
              (loc) => loc.branchId === branch._id
            )
            
            if (!locationExists) {
              existingDoc.hospitals.push({
                hospitalId: hospital._id,
                hospitalName: hospital.hospitalName,
                hospitalLogo: hospital.logo || null,
                branchId: branch._id,
                branchName: branch.branchName,
                cities: branch.city || [],
              })
            }
          }
          
          matchingDoctors.push(allDoctorsMap.get(doc._id)!)
        }
        
        // Extract cost and duration from matching treatment
        const treatmentCost = matchingTreatment ? getTreatmentCost(matchingTreatment) : null
        const treatmentDuration = matchingTreatment ? getTreatmentDuration(matchingTreatment) : null
        
        branchesWithTreatment.push({
          branch,
          treatmentCost,
          treatmentDuration,
          matchingDoctors,
        })
      }
      
      if (branchesWithTreatment.length > 0) {
        // Collect all unique doctors for this hospital
        const hospitalDoctors: DoctorInfo[] = []
        const processedDoctorIds = new Set<string>()
        
        branchesWithTreatment.forEach((branchInfo) => {
          branchInfo.matchingDoctors.forEach((doc) => {
            if (!processedDoctorIds.has(doc.doctor._id)) {
              processedDoctorIds.add(doc.doctor._id)
              hospitalDoctors.push(doc)
            }
          })
        })
        
        hospitalTreatmentMap.set(hospital._id, {
          hospital,
          branches: branchesWithTreatment,
          doctors: hospitalDoctors,
        })
      }
    }
    
    // Build result
    const resultHospitals = Array.from(hospitalTreatmentMap.values())
    const allDoctors = Array.from(allDoctorsMap.values())
    
    console.log("[TreatmentPage] Final hospitals:", resultHospitals.length)
    console.log("[TreatmentPage] Final doctors:", allDoctors.length)
    
    return {
      treatment,
      hospitals: resultHospitals,
      allDoctors,
      totalHospitals: resultHospitals.length,
      totalDoctors: allDoctors.length,
    }
  } catch (error) {
    console.error("[TreatmentPage] Error finding treatment:", error)
    return null
  }
}
