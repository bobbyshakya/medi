import type { HospitalType, FilterState, ExtendedDoctorType, ExtendedTreatmentType, FilterKey, SpecialtyType, DepartmentType, CityType, BranchType, TreatmentLocation, FilterValue, DoctorType, TreatmentType } from '@/types/search'

export const getVisibleFiltersByView = (view: FilterState['view']): FilterKey[] => {
  switch (view) {
    case "hospitals": return ["branch", "treatment", "city"]
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

  // Build a Set of valid branch IDs from treatment branchesAvailableAt
  const treatmentBranchIds = new Set<string>()
  const treatmentLocationMap = new Map<string, { hospitalId: string; branchName: string; cities: any[] }>()
  
  if (treatment.id || lowerTreatment) {
    allExtendedTreatments.forEach(t => {
      const nameMatch = lowerTreatment && (t.name ?? '').toLowerCase().includes(lowerTreatment)
      if ((treatment.id && t._id === treatment.id) || nameMatch) {
        // Add all branches available at this treatment
        t.branchesAvailableAt?.forEach(loc => {
          if (loc.branchId) {
            treatmentBranchIds.add(loc.branchId)
            treatmentLocationMap.set(loc.branchId, {
              hospitalId: loc.hospitalId,
              branchName: loc.branchName || "",
              cities: loc.cities || [],
            })
          }
        })
      }
    })
    
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
        // Check if this branch is in the treatment's branchesAvailableAt
        if (!treatmentBranchIds.has(b._id)) {
          return false
        }
      }

      if ((city.id || lowerCity) && !b.city.some((c) => (city.id && c._id === city.id) || (lowerCity && (c.cityName ?? '').toLowerCase().includes(lowerCity)))) return false
      if ((state.id || lowerState) && !b.city.some((c) => (state.id && c.state === state.id) || (lowerState && (c.state ?? '').toLowerCase().includes(lowerState)))) return false
      if ((location.id || lowerLocation) && !b.city.some((c) =>
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