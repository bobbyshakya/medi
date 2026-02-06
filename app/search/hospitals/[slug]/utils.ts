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

export const extractUniqueTreatments = (branch: any, hospitalTreatments?: any[]): any[] => {
  const uniqueTreatments = {} as { [key: string]: any }
  const processedKeys = new Set<string>(); // Track processed keys to prevent undefined keys

  // Helper to normalize treatment data from CMS
  // This ensures field names match what TreatmentCard component expects
  const normalizeTreatment = (treatment: any, specialistName: string): any => {
    if (!treatment) return null;
    
    // Get unique key - use multiple fallback strategies
    const id = treatment._id || treatment.ID;
    const treatmentName = treatment.name || treatment.treatmentName || treatment.title;
    
    // Create a unique key - prioritize _id, then name, then generate from content
    let key = id;
    if (!key && treatmentName) {
      key = `name-${treatmentName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;
    }
    if (!key) {
      // Generate a unique key from the treatment content itself
      key = `auto-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    if (processedKeys.has(key)) {
      return null; // Already processed
    }
    processedKeys.add(key);
    
    return {
      _id: id || key,
      name: treatmentName || treatment.title || 'Unknown Treatment',
      title: treatmentName || treatment.title || 'Unknown Treatment',
      description: treatment.description || treatment.Description || '',
      startingCost: treatment.cost || treatment.startingCost || treatment.averageCost || null,
      cost: treatment.cost || treatment.startingCost || treatment.averageCost || null,
      treatmentImage: treatment.treatmentImage || treatment.image || treatment.treatmentimage || null,
      image: treatment.treatmentImage || treatment.image || treatment.treatmentimage || null,
      specialistName: specialistName,
      popular: treatment.popular === true || treatment.popular === 'true',
    };
  };

  // First, add hospital-level treatments (these have full details from CMS)
  if (hospitalTreatments && Array.isArray(hospitalTreatments)) {
    hospitalTreatments.forEach((treatment: any) => {
      const normalized = normalizeTreatment(treatment, 'Hospital Treatment');
      if (normalized) uniqueTreatments[normalized._id] = normalized;
    });
  }

  // Include treatments directly associated with the branch
  if (branch?.treatments && Array.isArray(branch.treatments)) {
    branch.treatments.forEach((treatment: any) => {
      const normalized = normalizeTreatment(treatment, 'Direct Treatment');
      if (normalized) {
        // Don't override if hospital treatment already exists with more info
        if (!uniqueTreatments[normalized._id]) {
          uniqueTreatments[normalized._id] = normalized;
        }
      }
    });
  }

  // Include treatments from specialists (enriched data from Wix CMS)
  if (branch?.specialists && Array.isArray(branch.specialists)) {
    branch.specialists.forEach((specialist: any) => {
      const specialistName = specialist.name || specialist.specialty || 'Unknown Specialist';
      if (specialist.treatments && Array.isArray(specialist.treatments)) {
        specialist.treatments.forEach((treatment: any) => {
          const normalized = normalizeTreatment(treatment, specialistName);
          if (normalized) {
            if (!uniqueTreatments[normalized._id]) {
              uniqueTreatments[normalized._id] = normalized;
            }
          }
        });
      }
    });
  }

  // Include treatments from specialization that are marked as treatments
  if (branch?.specialization && Array.isArray(branch.specialization)) {
    branch.specialization.forEach((spec: any) => {
      if (spec && spec.isTreatment) {
        const normalized = normalizeTreatment(spec, 'Specialized Treatment');
        if (normalized) {
          if (!uniqueTreatments[normalized._id]) {
            uniqueTreatments[normalized._id] = normalized;
          }
        }
      }
    });
  }

  // Include treatments from doctors' specializations
  if (branch?.doctors && Array.isArray(branch.doctors)) {
    branch.doctors.forEach((doctor: any) => {
      const doctorName = doctor.doctorName || doctor.name || 'Unknown Doctor';
      if (doctor.specialization && Array.isArray(doctor.specialization)) {
        doctor.specialization.forEach((spec: any) => {
          if (spec && spec.treatments && Array.isArray(spec.treatments)) {
            spec.treatments.forEach((treatment: any) => {
              const normalized = normalizeTreatment(treatment, doctorName);
              if (normalized) {
                if (!uniqueTreatments[normalized._id]) {
                  uniqueTreatments[normalized._id] = normalized;
                }
              }
            });
          }
        });
      }
    });
  }

  return Object.values(uniqueTreatments);
}

/**
 * Extract treatments from ALL branches of a group hospital.
 * This ensures that when viewing a group hospital, treatments from all
 * branches are collected and displayed together.
 */
export const extractTreatmentsFromAllBranches = (hospitalData: any): any[] => {
  const uniqueTreatments = {} as { [key: string]: any }
  const processedKeys = new Set<string>(); // Track processed keys to prevent undefined keys

  // Helper to normalize treatment data from CMS
  // This ensures field names match what TreatmentCard component expects
  const addTreatment = (treatment: any, sourceName: string) => {
    if (!treatment) return;
    
    // Get unique key - use multiple fallback strategies
    const id = treatment._id || treatment.ID;
    const treatmentName = treatment.name || treatment.treatmentName || treatment.title;
    
    // Create a unique key - prioritize _id, then name, then generate from content
    let key = id;
    if (!key && treatmentName) {
      key = `name-${treatmentName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;
    }
    if (!key) {
      // Generate a unique key from the treatment content itself
      key = `auto-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Check if already processed
    if (processedKeys.has(key)) {
      return; // Already processed - but check if we should update with more info
    }
    
    processedKeys.add(key);
    
    // Normalize all field names to match TreatmentCard expectations
    uniqueTreatments[key] = {
      _id: id || key,
      name: treatmentName || treatment.title || 'Unknown Treatment',
      title: treatmentName || treatment.title || 'Unknown Treatment',
      description: treatment.description || treatment.Description || '',
      startingCost: treatment.cost || treatment.startingCost || treatment.averageCost || null,
      cost: treatment.cost || treatment.startingCost || treatment.averageCost || null,
      treatmentImage: treatment.treatmentImage || treatment.image || treatment.treatmentimage || null,
      image: treatment.treatmentImage || treatment.image || treatment.treatmentimage || null,
      specialistName: sourceName.split(' - ').pop() || sourceName, // Just the specialist name without branch prefix
      popular: treatment.popular === true || treatment.popular === 'true',
    };
  };

  // 1. Include treatments directly associated with the hospital (main treatments) - these have full details from CMS
  if (hospitalData?.treatments && Array.isArray(hospitalData.treatments)) {
    hospitalData.treatments.forEach((treatment: any) => {
      addTreatment(treatment, 'Hospital Treatment')
    })
  }

  // 2. Include treatments from ALL branches
  if (hospitalData?.branches && Array.isArray(hospitalData.branches)) {
    hospitalData.branches.forEach((branch: any, branchIndex: number) => {
      const branchName = branch.branchName || `Branch ${branchIndex + 1}`

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
  try {
    // Direct call to CMS library - avoids API route issues in production
    const result = await getHospitalFromCMS(slug)
    
    if (result.hospital) {
      return result.hospital
    }
    
    // Try fallback with normalized slug
    const normalizedSlug = slug.toLowerCase().trim().replace(/[-_]+/g, '-')
    if (normalizedSlug !== slug) {
      const fallbackResult = await getHospitalFromCMS(normalizedSlug)
      
      if (fallbackResult.hospital) {
        return fallbackResult.hospital
      }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching hospital by slug:', error)
    return null
  }
}

// NEW: Fetch treatments from CMS and match to hospital specialties
// This is used when treatments are not directly linked to hospital/branch in CMS
import { getAllCMSData } from '@/lib/cms'

export const fetchTreatmentsByHospitalSpecialties = async (hospitalData: any): Promise<any[]> => {
  try {
    const { treatments: allTreatments } = await getAllCMSData()
    
    if (!allTreatments || allTreatments.length === 0) {
      return []
    }
    
    // Collect all specialty names from hospital
    const specialtyNames = new Set<string>()
    
    // Add specialist names
    hospitalData.branches?.forEach((branch: any) => {
      branch.specialists?.forEach((spec: any) => {
        if (spec.name) specialtyNames.add(spec.name.toLowerCase())
        // Also add specialty field if it exists
        if (spec.specialty) specialtyNames.add(spec.specialty.toLowerCase())
      })
      
      // Add specialization names
      branch.specialization?.forEach((spec: any) => {
        if (spec.name) {
          // Remove (Treatment) suffix for matching
          const cleanName = spec.name.replace(/\s*\(Treatment\)\s*/gi, '').trim()
          specialtyNames.add(cleanName.toLowerCase())
        }
      })
      
      // Add doctors' specialization names
      branch.doctors?.forEach((doctor: any) => {
        doctor.specialization?.forEach((spec: any) => {
          if (spec.name) specialtyNames.add(spec.name.toLowerCase())
        })
      })
    })
    
    // Match treatments to specialties
    const matchedTreatments = allTreatments.filter((treatment: any) => {
      const treatmentName = (treatment.name || '').toLowerCase()
      
      // Check if treatment name contains any specialty name
      for (const specialty of specialtyNames) {
        if (treatmentName.includes(specialty) || specialty.includes(treatmentName)) {
          return true
        }
      }
      
      // Also check if specialty is in treatment description
      const treatmentDesc = (treatment.description || '').toLowerCase()
      for (const specialty of specialtyNames) {
        if (treatmentDesc.includes(specialty)) {
          return true
        }
      }
      
      return false
    })
    
    // Normalize matched treatments to match TreatmentCard expectations
    return matchedTreatments.map((treatment: any) => ({
      _id: treatment._id,
      name: treatment.name || treatment.title || 'Unknown Treatment',
      title: treatment.name || treatment.title || 'Unknown Treatment',
      description: treatment.description || treatment.Description || '',
      startingCost: treatment.cost || treatment.startingCost || treatment.averageCost || null,
      cost: treatment.cost || treatment.startingCost || treatment.averageCost || null,
      treatmentImage: treatment.treatmentImage || treatment.image || null,
      image: treatment.treatmentImage || treatment.image || null,
      specialistName: 'Available Treatment',
      popular: treatment.popular === true || treatment.popular === 'true',
    }))
  } catch (error) {
    console.error('Error fetching treatments by specialties:', error)
    return []
  }
}