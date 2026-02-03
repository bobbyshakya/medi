import type { HospitalType, FilterState, ExtendedDoctorType, ExtendedTreatmentType, FilterKey, SpecialtyType, DepartmentType, CityType, BranchType, TreatmentLocation, FilterValue, DoctorType, TreatmentType } from '@/types/search'

export const getVisibleFiltersByView = (view: FilterState['view']): FilterKey[] => {
  switch (view) {
    case "hospitals": return ["branch", "treatment", "city", "state"]
    case "doctors": return ["doctor", "specialization", "treatment", "city"]
    case "treatments": return ["treatment", "city"]
    default: return ["doctor", "city"]
  }
}

export const enforceOnePrimaryFilter = (key: FilterKey, prevFilters: FilterState, newFilterValue: FilterValue): FilterState => {
  let newFilters = { ...prevFilters, [key]: newFilterValue }
  const primaryKeys: FilterKey[] = ['doctor', 'treatment', 'branch']

  if (primaryKeys.includes(key as any) && (newFilterValue.id || newFilterValue.query)) {
    primaryKeys.forEach(primaryKey => {
      if (primaryKey !== key) {
        newFilters = { ...newFilters, [primaryKey]: { id: "", query: "" } }
      }
    })

    newFilters = { ...newFilters, department: { id: "", query: "" }, specialization: { id: "", query: "" } }
  }
  return newFilters
}

export const matchesSpecialization = (specialization: any, id: string, text: string) => {
  if (!specialization) return false
  const specs = Array.isArray(specialization) ? specialization : [specialization]
  const lowerText = text.toLowerCase()
  return specs.some((spec) => {
    const specId = spec._id || (typeof spec === 'string' ? spec : '')
    const specName = String(spec.name || spec.title || spec.specialty || (typeof spec === 'string' ? spec : ''))
    if (id && specId === id) return true
    if (lowerText && specName.toLowerCase().includes(lowerText)) return true
    return false
  })
}

export const getMatchingBranches = (hospitals: HospitalType[], filters: FilterState, allExtendedTreatments: ExtendedTreatmentType[]) => {
  if (!hospitals || !Array.isArray(hospitals)) return []
  const { city, state, specialization, branch, department, treatment, location } = filters
  const lowerCity = city.query.toLowerCase()
  const lowerState = state.query.toLowerCase()
  const lowerSpec = specialization.query.toLowerCase()
  const lowerBranch = branch.query.toLowerCase()
  const lowerDept = department.query.toLowerCase()
  const lowerTreatment = treatment.query.toLowerCase()
  const lowerLocation = location.query.toLowerCase()

  // Build a comprehensive map of treatment names to branches from hospital data
  const treatmentNameToBranchIds = new Map<string, Set<string>>()
  const treatmentBranchIds = new Set<string>()
  const treatmentLocationMap = new Map<string, { hospitalId: string; branchName: string; cities: any[] }>()
  
  // First, build a map of treatment names from allExtendedTreatments (TreatmentMaster)
  const treatmentMasterMap = new Map<string, ExtendedTreatmentType>()
  allExtendedTreatments.forEach(t => {
    if (t._id && t.name) {
      treatmentMasterMap.set(t._id, t)
      treatmentMasterMap.set(t.name.toLowerCase(), t)
    }
  })
  
  // Extract treatments from hospitals to build name-to-branch mapping
  hospitals.forEach(h => {
    // Check treatments at hospital level
    h.treatments?.forEach(t => {
      if (t._id && t.name) {
        const nameKey = t.name.toLowerCase()
        if (!treatmentNameToBranchIds.has(nameKey)) {
          treatmentNameToBranchIds.set(nameKey, new Set())
        }
        h.branches?.forEach(b => {
          if (b._id) {
            treatmentNameToBranchIds.get(nameKey)!.add(b._id)
            treatmentBranchIds.add(b._id)
            treatmentLocationMap.set(b._id, {
              hospitalId: h._id,
              branchName: b.branchName || "",
              cities: b.city || [],
            })
          }
        })
      }
    })
    
    // Check treatments at branch level
    h.branches?.forEach(b => {
      b.treatments?.forEach(t => {
        if (t._id && t.name) {
          const nameKey = t.name.toLowerCase()
          if (!treatmentNameToBranchIds.has(nameKey)) {
            treatmentNameToBranchIds.set(nameKey, new Set())
          }
          if (b._id) {
            treatmentNameToBranchIds.get(nameKey)!.add(b._id)
            if (!treatmentLocationMap.has(b._id)) {
              treatmentBranchIds.add(b._id)
              treatmentLocationMap.set(b._id, {
                hospitalId: h._id,
                branchName: b.branchName || "",
                cities: b.city || [],
              })
            }
          }
        }
      })
    })
  })

  // Also check specialists' treatments
  hospitals.forEach(h => {
    h.branches?.forEach(b => {
      b.specialists?.forEach(s => {
        s.treatments?.forEach(t => {
          if (t._id && t.name) {
            const nameKey = t.name.toLowerCase()
            if (!treatmentNameToBranchIds.has(nameKey)) {
              treatmentNameToBranchIds.set(nameKey, new Set())
            }
            if (b._id) {
              treatmentNameToBranchIds.get(nameKey)!.add(b._id)
            }
          }
        })
      })
    })
  })

  // Handle treatment filter - match by ID or name
  let activeTreatmentIds: string[] = []
  if (treatment.id || lowerTreatment) {
    // If we have a treatment ID, try to find it in TreatmentMaster or by name
    if (treatment.id) {
      // Check if treatment ID exists in TreatmentMaster
      if (treatmentMasterMap.has(treatment.id)) {
        const tmTreatment = treatmentMasterMap.get(treatment.id)!
        // Add branches from TreatmentMaster's branchesAvailableAt
        tmTreatment.branchesAvailableAt?.forEach(loc => {
          if (loc.branchId) {
            treatmentBranchIds.add(loc.branchId)
            if (!treatmentLocationMap.has(loc.branchId)) {
              treatmentLocationMap.set(loc.branchId, {
                hospitalId: loc.hospitalId,
                branchName: loc.branchName || "",
                cities: loc.cities || [],
              })
            }
          }
        })
      }
      
      // Also try to find by treatment name from the ID
      const treatmentFromMap = allExtendedTreatments.find(t => t._id === treatment.id)
      if (treatmentFromMap?.name) {
        const nameKey = treatmentFromMap.name.toLowerCase()
        const branchIds = treatmentNameToBranchIds.get(nameKey)
        if (branchIds) {
          branchIds.forEach(bid => treatmentBranchIds.add(bid))
        }
      }
    }
    
    // If we have a text search, find matching treatment names
    if (lowerTreatment) {
      // Find treatment names that contain the search text
      treatmentNameToBranchIds.forEach((branchIds, treatmentName) => {
        if (treatmentName.includes(lowerTreatment)) {
          branchIds.forEach(bid => treatmentBranchIds.add(bid))
        }
      })
      
      // Also check TreatmentMaster treatment names
      treatmentMasterMap.forEach((tmTreatment, key) => {
        if (typeof key === 'string' && key.includes(lowerTreatment) && tmTreatment._id) {
          tmTreatment.branchesAvailableAt?.forEach(loc => {
            if (loc.branchId) {
              treatmentBranchIds.add(loc.branchId)
              if (!treatmentLocationMap.has(loc.branchId)) {
                treatmentLocationMap.set(loc.branchId, {
                  hospitalId: loc.hospitalId,
                  branchName: loc.branchName || "",
                  cities: loc.cities || [],
                })
              }
            }
          })
        }
      })
    }
    
    // If we have treatment filter but no matching branches found, return empty
    if ((treatment.id || lowerTreatment) && treatmentBranchIds.size === 0) {
      return []
    }
  }

  return hospitals
    .flatMap((h) => h.branches?.map((b) => ({ ...b, hospitalName: h.hospitalName, hospitalLogo: h.logo, hospitalId: h._id })) || [])
    .filter((b) => {
      // If treatment filter is active, only include branches that offer that treatment
      if (treatment.id || lowerTreatment) {
        // Check if this branch is in the treatment's branches
        if (!treatmentBranchIds.has(b._id)) {
          return false
        }
      }

      // City/State/Location filtering - when treatment is active, only check cities from treatment-specific branches
      const citiesToCheck = (treatment.id || lowerTreatment) && treatmentLocationMap.has(b._id)
        ? treatmentLocationMap.get(b._id)!.cities
        : b.city

      if ((city.id || lowerCity) && !citiesToCheck.some((c) => (city.id && c._id === city.id) || (lowerCity && (c.cityName ?? '').toLowerCase().includes(lowerCity)))) return false
      if ((state.id || lowerState) && !citiesToCheck.some((c) => (state.id && c.state === state.id) || (lowerState && (c.state ?? '').toLowerCase().includes(lowerState)))) return false
      if ((location.id || lowerLocation) && !citiesToCheck.some((c) =>
        (location.id && `city:${c._id}` === location.id) ||
        (location.id && `state:${c.state}` === location.id) ||
        (lowerLocation && (c.cityName ?? '').toLowerCase().includes(lowerLocation)) ||
        (lowerLocation && (c.state ?? '').toLowerCase().includes(lowerLocation))
      )) return false
      if ((branch.id || lowerBranch) && !(branch.id === b._id) && !(lowerBranch && (b.branchName ?? '').toLowerCase().includes(lowerBranch))) return false

      const allDepartments = (b.specialists || []).flatMap(spec => spec.department || [])
      if ((department.id || lowerDept) && !allDepartments.some((d) => (department.id && d._id === department.id) || (lowerDept && (d.name ?? '').toLowerCase().includes(lowerDept)))) return false

      if (specialization.id || lowerSpec) {
        const hasSpec = b.specialization?.some((s) => (specialization.id && s._id === specialization.id) || (lowerSpec && ((s.name ?? '').toLowerCase().includes(lowerSpec) || (s.title ?? '').toLowerCase().includes(lowerSpec))))
          || b.doctors?.some(d => matchesSpecialization(d.specialization, specialization.id, lowerSpec))
        if (!hasSpec) return false
      }

      return true
    })
}

export const getAllExtendedDoctors = (hospitals: HospitalType[]): ExtendedDoctorType[] => {
  if (!hospitals || !Array.isArray(hospitals)) return []
  const extendedMap = new Map<string, ExtendedDoctorType>()

  hospitals.forEach((h) => {
    const processDoctor = (item: DoctorType, branch?: BranchType) => {
      const baseId = item._id

      const doctorDepartments: DepartmentType[] = []
      const specs = Array.isArray(item.specialization) ? item.specialization : item.specialization ? [item.specialization] : []
      specs.forEach((spec: any) => {
        if (typeof spec === 'object' && spec?.department) {
          spec.department.forEach((dept: DepartmentType) => {
            doctorDepartments.push(dept)
          })
        }
      })
      const uniqueDepartments = Array.from(new Map(doctorDepartments.map(dept => [dept._id, dept])).values())

      const defaultBranch = h.branches[0]
      const location = {
        hospitalName: h.hospitalName,
        hospitalId: h._id,
        branchName: branch?.branchName || defaultBranch?.branchName,
        branchId: branch?._id || defaultBranch?._id,
        cities: branch?.city || defaultBranch?.city || [],
      }

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
      } else {
        extendedMap.set(baseId, {
          ...item,
          baseId: baseId,
          locations: [location],
          departments: uniqueDepartments,
        } as ExtendedDoctorType)
      }
    }

    h.doctors?.forEach((d) => processDoctor(d))
    h.branches?.forEach((b) => {
      b.doctors?.forEach((d) => processDoctor(d, b))
    })
  })

  return Array.from(extendedMap.values())
}

export const getDoctorsByTreatment = (hospitals: HospitalType[], treatmentId: string, allTreatments: ExtendedTreatmentType[]): ExtendedDoctorType[] => {
  if (!hospitals || !Array.isArray(hospitals)) return []
  if (!treatmentId) return getAllExtendedDoctors(hospitals)

  // Get branches that offer this treatment
  const treatmentBranchIds = new Set<string>()
  allTreatments.forEach(t => {
    if (t._id === treatmentId) {
      t.branchesAvailableAt?.forEach(loc => {
        if (loc.branchId) {
          treatmentBranchIds.add(loc.branchId)
        }
      })
    }
  })

  // Get all doctors and filter by treatment
  const allDoctors = getAllExtendedDoctors(hospitals)
  
  return allDoctors.filter(doctor => {
    // Check if doctor is associated with any branch that offers the treatment
    return doctor.locations.some(loc => {
      if (loc.branchId && treatmentBranchIds.has(loc.branchId)) {
        return true
      }
      // Also check if the branch name matches (fallback)
      if (loc.branchName) {
        const matchingBranch = allTreatments.find(t => 
          t._id === treatmentId && 
          t.branchesAvailableAt?.some(b => b.branchName === loc.branchName)
        )
        return !!matchingBranch
      }
      return false
    })
  })
}

export const getAllExtendedTreatments = (hospitals: HospitalType[]): ExtendedTreatmentType[] => {
  if (!hospitals || !Array.isArray(hospitals)) return []
  const extended = new Map<string, ExtendedTreatmentType>()
  hospitals.forEach((h) => {
    const processTreatment = (item: TreatmentType, branch?: BranchType, departments: DepartmentType[] = []) => {
      const baseId = item._id
      if (!extended.has(baseId)) {
        extended.set(baseId, {
          ...item,
          cost: item.cost ?? 'Price Varies',
          branchesAvailableAt: [],
          departments: [],
        } as ExtendedTreatmentType)
      }
      const existingTreatment = extended.get(baseId)!
      const location: TreatmentLocation = {
        branchId: branch?._id,
        branchName: branch?.branchName,
        hospitalName: h.hospitalName,
        hospitalId: h._id,
        cities: branch?.city || [],
        departments: Array.from(new Map(departments.map(dept => [dept._id, dept])).values()),
        cost: item.cost,
      }

      const isLocationDuplicate = existingTreatment.branchesAvailableAt.some(
        loc => loc.hospitalId === h._id && (loc.branchId === branch?._id || (!loc.branchId && !branch?._id))
      )

      if (!isLocationDuplicate) {
        existingTreatment.branchesAvailableAt.push(location)

        const allDepts = [...existingTreatment.departments, ...departments]
        existingTreatment.departments = Array.from(new Map(allDepts.map(dept => [dept._id, dept])).values())
      }
    }

    h.treatments?.forEach((item) => processTreatment(item))
    h.branches?.forEach((b) => {
      const branchTreatments = [...(b.treatments || []), ...(b.specialists || []).flatMap(s => s.treatments || [])]
      branchTreatments.forEach((item) => {
        const treatmentDepartments: DepartmentType[] = []
        b.specialists?.forEach(spec => {
          const hasThisTreatment = spec.treatments?.some(t => t._id === item._id)
          if (hasThisTreatment && spec.department) treatmentDepartments.push(...spec.department)
        })
        processTreatment(item, b, treatmentDepartments)
      })
    })
  })
  return Array.from(extended.values())
}