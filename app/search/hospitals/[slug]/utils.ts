// Helper functions for hospital branch page

export const getWixImageUrl = (imageStr: string | null | undefined): string | null => {
  if (!imageStr || typeof imageStr !== "string") return null

  // Handle Wix image URLs
  if (imageStr.startsWith("wix:image://v1/")) {
    const parts = imageStr.split("/")
    return parts.length >= 4 ? `https://static.wixstatic.com/media/${parts[3]}` : null
  }

  // Handle direct URLs
  if (imageStr.startsWith("http://") || imageStr.startsWith("https://")) {
    return imageStr
  }

  // Handle relative paths
  if (imageStr.startsWith("/")) {
    return imageStr
  }

  return null
}

export const getHospitalImage = (imageData: any): string | null => getWixImageUrl(imageData)
export const getBranchImage = (imageData: any): string | null => getWixImageUrl(imageData)
export const getHospitalLogo = (imageData: any): string | null => getWixImageUrl(imageData)
export const getDoctorImage = (imageData: any): string | null => getWixImageUrl(imageData)
export const getTreatmentImage = (imageData: any): string | null => getWixImageUrl(imageData)

export const getShortDescription = (richContent: any, maxLength: number = 100): string => {
  if (typeof richContent === 'string') {
    const text = richContent.replace(/<[^>]*>/g, '').trim()
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }
  if (!richContent?.nodes) return ''
  let text = ''
  for (const node of richContent.nodes) {
    if (node.type === 'PARAGRAPH' && text.length < maxLength) {
      const paraText = node.nodes?.map((n: any) => n.text || '').join(' ').trim()
      text += (text ? ' ' : '') + paraText
    }
    if (text.length >= maxLength) break
  }
  return text.trim().length > maxLength ? text.trim().substring(0, maxLength) + '...' : text.trim()
}

export const generateSlug = (name: string | null | undefined): string => {
  if (!name || typeof name !== 'string') return ''
  return name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
}

export const extractUniqueTreatments = (branch: any): any[] => {
  const uniqueTreatments = {} as { [key: string]: any }

  // Include treatments directly associated with the branch
  if (branch?.treatments && Array.isArray(branch.treatments)) {
    branch.treatments.forEach((treatment: any) => {
      if (treatment && (treatment._id || treatment.name)) {
        const key = treatment._id || treatment.name
        if (!uniqueTreatments[key]) {
          uniqueTreatments[key] = {
            ...treatment,
            specialistName: 'Direct Treatment',
            _id: treatment._id || key,
            name: treatment.name || treatment.treatmentName,
            description: treatment.description || '',
            startingCost: treatment.startingCost || treatment.averageCost,
            treatmentImage: treatment.treatmentImage || treatment.image
          }
        }
      }
    })
  }

  // Include treatments from specialists (enriched data from Wix CMS)
  if (branch?.specialists && Array.isArray(branch.specialists)) {
    branch.specialists.forEach((specialist: any) => {
      const specialistName = specialist.name || specialist.specialty || 'Unknown Specialist'
      if (specialist.treatments && Array.isArray(specialist.treatments)) {
        specialist.treatments.forEach((treatment: any) => {
          if (treatment && (treatment._id || treatment.name)) {
            const key = treatment._id || `${treatment.name || 'n/a'}-${specialistName}`
            if (!uniqueTreatments[key]) {
              uniqueTreatments[key] = {
                ...treatment,
                specialistName,
                _id: treatment._id || key,
                name: treatment.name || treatment.treatmentName,
                description: treatment.description || '',
                startingCost: treatment.startingCost || treatment.averageCost,
                treatmentImage: treatment.treatmentImage || treatment.image
              }
            }
          }
        })
      }
    })
  }

  // Include treatments from specialization that are marked as treatments
  if (branch?.specialization && Array.isArray(branch.specialization)) {
    branch.specialization.forEach((spec: any) => {
      if (spec && spec.isTreatment && (spec._id || spec.name)) {
        const key = spec._id || spec.name
        if (!uniqueTreatments[key]) {
          uniqueTreatments[key] = {
            ...spec,
            specialistName: 'Specialized Treatment',
            _id: spec._id || key,
            name: spec.name || spec.treatmentName,
            description: spec.description || '',
            startingCost: spec.startingCost || spec.averageCost,
            treatmentImage: spec.treatmentImage || spec.image
          }
        }
      }
    })
  }

  // Include treatments from doctors' specializations
  if (branch?.doctors && Array.isArray(branch.doctors)) {
    branch.doctors.forEach((doctor: any) => {
      const doctorName = doctor.doctorName || doctor.name || 'Unknown Doctor'
      if (doctor.specialization && Array.isArray(doctor.specialization)) {
        doctor.specialization.forEach((spec: any) => {
          if (spec && spec.treatments && Array.isArray(spec.treatments)) {
            spec.treatments.forEach((treatment: any) => {
              if (treatment && (treatment._id || treatment.name)) {
                const key = treatment._id || `${treatment.name || 'n/a'}-${doctorName}`
                if (!uniqueTreatments[key]) {
                  uniqueTreatments[key] = {
                    ...treatment,
                    specialistName: doctorName,
                    _id: treatment._id || key,
                    name: treatment.name || treatment.treatmentName,
                    description: treatment.description || '',
                    startingCost: treatment.startingCost || treatment.averageCost,
                    treatmentImage: treatment.treatmentImage || treatment.image
                  }
                }
              }
            })
          }
        })
      }
    })
  }

  return Object.values(uniqueTreatments)
}

/**
 * Extract treatments from ALL branches of a group hospital.
 * This ensures that when viewing a group hospital, treatments from all
 * branches are collected and displayed together.
 */
export const extractTreatmentsFromAllBranches = (hospitalData: any): any[] => {
  const uniqueTreatments = {} as { [key: string]: any }

  // Helper to add a treatment to the unique collection
  const addTreatment = (treatment: any, sourceName: string) => {
    if (!treatment || !(treatment._id || treatment.name)) return
    const key = treatment._id || treatment.name
    if (!uniqueTreatments[key]) {
      uniqueTreatments[key] = {
        ...treatment,
        specialistName: sourceName,
        _id: treatment._id || key,
        name: treatment.name || treatment.treatmentName,
        description: treatment.description || '',
        startingCost: treatment.startingCost || treatment.averageCost,
        treatmentImage: treatment.treatmentImage || treatment.image
      }
    }
  }

  // 1. Include treatments directly associated with the hospital (main treatments)
  if (hospitalData?.treatments && Array.isArray(hospitalData.treatments)) {
    hospitalData.treatments.forEach((treatment: any) => {
      addTreatment(treatment, 'Hospital Treatment')
    })
  }

  // 2. Include treatments from ALL branches
  if (hospitalData?.branches && Array.isArray(hospitalData.branches)) {
    hospitalData.branches.forEach((branch: any) => {
      const branchName = branch.branchName || 'Unknown Branch'

      // Treatments directly on branch
      if (branch.treatments && Array.isArray(branch.treatments)) {
        branch.treatments.forEach((treatment: any) => {
          addTreatment(treatment, `${branchName} - Direct`)
        })
      }

      // Treatments from specialists in this branch
      if (branch.specialists && Array.isArray(branch.specialists)) {
        branch.specialists.forEach((specialist: any) => {
          const specialistName = specialist.name || specialist.specialty || 'Unknown Specialist'
          if (specialist.treatments && Array.isArray(specialist.treatments)) {
            specialist.treatments.forEach((treatment: any) => {
              addTreatment(treatment, `${branchName} - ${specialistName}`)
            })
          }
        })
      }

      // Treatments from specialization
      if (branch.specialization && Array.isArray(branch.specialization)) {
        branch.specialization.forEach((spec: any) => {
          if (spec && spec.isTreatment) {
            addTreatment(spec, `${branchName} - Specialized`)
          }
        })
      }

      // Treatments from doctors' specializations
      if (branch.doctors && Array.isArray(branch.doctors)) {
        branch.doctors.forEach((doctor: any) => {
          const doctorName = doctor.doctorName || doctor.name || 'Unknown Doctor'
          if (doctor.specialization && Array.isArray(doctor.specialization)) {
            doctor.specialization.forEach((spec: any) => {
              if (spec && spec.treatments && Array.isArray(spec.treatments)) {
                spec.treatments.forEach((treatment: any) => {
                  addTreatment(treatment, `${branchName} - ${doctorName}`)
                })
              }
            })
          }
        })
      }
    })
  }

  return Object.values(uniqueTreatments)
}

// NEW: Function to fetch hospital data by slug using unified CMS API
// IMPORTANT: Uses direct CMS library call instead of API route to avoid production issues
// with self-referential API calls and environment variable configuration
import { getHospitalBySlug as getHospitalFromCMS } from '@/lib/cms'

export const fetchHospitalBySlug = async (slug: string) => {
  console.time('fetchHospitalBySlug total')

  try {
    console.time('CMS direct call')
    // Direct call to CMS library - avoids API route issues in production
    const result = await getHospitalFromCMS(slug)
    console.timeEnd('CMS direct call')
    
    if (result.hospital) {
      console.timeEnd('fetchHospitalBySlug total')
      return result.hospital
    }
    
    // Try fallback with normalized slug
    const normalizedSlug = slug.toLowerCase().trim().replace(/[-_]+/g, '-')
    if (normalizedSlug !== slug) {
      console.time('CMS fallback call')
      const fallbackResult = await getHospitalFromCMS(normalizedSlug)
      console.timeEnd('CMS fallback call')
      
      if (fallbackResult.hospital) {
        console.timeEnd('fetchHospitalBySlug total')
        return fallbackResult.hospital
      }
    }
    
    console.timeEnd('fetchHospitalBySlug total')
    return null
  } catch (error) {
    console.error('Error fetching hospital by slug:', error)
    console.timeEnd('fetchHospitalBySlug total')
    return null
  }
}