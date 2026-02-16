'use client'

// hooks/useCMSData.ts
// Optimized hook with progressive loading - fast initial load + background full load

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  HospitalData,
  BranchData,
  DoctorData,
  ExtendedDoctorData,
  ExtendedTreatmentData,
  FilterState,
  FilterKey,
  FilterValue,
  FilterOption,
  DepartmentData,
  CityData,
} from '@/lib/cms/types'

// =============================================================================
// TYPES
// =============================================================================

type AvailableOptions = Record<FilterKey, FilterOption[]>

interface CMSApiResponse {
  hospitals: HospitalData[]
  treatments: ExtendedTreatmentData[]
  doctors: DoctorData[]
  totalHospitals: number
  totalTreatments: number
  totalDoctors: number
  hasMore: boolean
  lastUpdated: string
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const isUUID = (str: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)
}

const getVisibleFiltersByView = (view: FilterState['view']): FilterKey[] => {
  switch (view) {
    case 'hospitals':
      return ['branch', 'treatment', 'city', 'state']
    case 'doctors':
      return ['doctor', 'specialization', 'treatment', 'city']
    case 'treatments':
      return ['treatment', 'city']
    default:
      return ['doctor', 'city']
  }
}

const enforceOnePrimaryFilter = (
  key: FilterKey,
  prevFilters: FilterState,
  newFilterValue: FilterValue
): FilterState => {
  let newFilters = { ...prevFilters, [key]: newFilterValue }
  const primaryKeys: FilterKey[] = ['doctor', 'treatment', 'branch']

  if (primaryKeys.includes(key) && (newFilterValue.id || newFilterValue.query)) {
    primaryKeys.forEach((primaryKey) => {
      if (primaryKey !== key) {
        newFilters = { ...newFilters, [primaryKey]: { id: '', query: '' } }
      }
    })
    newFilters = { ...newFilters, department: { id: '', query: '' }, specialization: { id: '', query: '' } }
  }
  return newFilters
}

// =============================================================================
// FILTERING FUNCTIONS
// =============================================================================

interface BranchWithHospital extends BranchData {
  hospitalName: string
  hospitalLogo?: string | null
  hospitalId: string
}

const getMatchingBranches = (
  hospitals: HospitalData[],
  filters: FilterState,
  allTreatments: ExtendedTreatmentData[]
): BranchWithHospital[] => {
  if (!hospitals?.length) {
    console.log('[Filter] No hospitals to filter')
    return []
  }

  const { city, state, specialization, branch, department, treatment, location, doctor } = filters
  const lowerCity = city.query.toLowerCase()
  const lowerState = state.query.toLowerCase()
  const lowerSpec = specialization.query.toLowerCase()
  const lowerBranch = branch.query.toLowerCase()
  const lowerDept = department.query.toLowerCase()
  const lowerTreatment = treatment.query.toLowerCase()
  const lowerDoctor = doctor.query.toLowerCase()
  const lowerLocation = location.query.toLowerCase()

  console.log('[Filter] Starting filter with:', {
    hospitalCount: hospitals.length,
    treatmentId: treatment.id,
    treatmentQuery: treatment.query,
    cityQuery: city.query,
    stateQuery: state.query
  })

  // Build comprehensive treatment-to-branch mapping
  const treatmentBranchIds = new Set<string>()
  const treatmentNameMatches = new Set<string>()

  if (treatment.id || lowerTreatment) {
    // Step 1: Find matching treatment IDs and names from allTreatments (TreatmentMaster)
    allTreatments.forEach((t) => {
      const matchesId = treatment.id && t._id === treatment.id
      const matchesQuery = lowerTreatment && t.name && t.name.toLowerCase().includes(lowerTreatment)
      
      if (matchesId || matchesQuery) {
        // Add treatment name for matching in hospital branches
        if (t.name) treatmentNameMatches.add(t.name.toLowerCase())
        
        // Add branches from TreatmentMaster's branchesAvailableAt
        t.branchesAvailableAt?.forEach((loc) => {
          if (loc.branchId) treatmentBranchIds.add(loc.branchId)
        })
      }
    })

    // Step 2: Also check TreatmentMaster's branchesAvailableAt when treatment ID is selected
    if (treatment.id) {
      allTreatments.forEach((t) => {
        if (t._id === treatment.id) {
          t.branchesAvailableAt?.forEach((loc) => {
            if (loc.branchId) treatmentBranchIds.add(loc.branchId)
          })
        }
      })
    }

    // Step 3: Also check hospital branches for treatments by name AND ID
    hospitals.forEach((h) => {
      // Check hospital-level treatments
      h.treatments?.forEach((t) => {
        const matchesId = treatment.id && t._id === treatment.id
        const matchesQuery = lowerTreatment && t.name && t.name.toLowerCase().includes(lowerTreatment)
        const matchesName = t.name && treatmentNameMatches.has(t.name.toLowerCase())
        
        if (matchesId || matchesQuery || matchesName) {
          // Add ALL branches of this hospital
          h.branches?.forEach((b) => {
            if (b._id) treatmentBranchIds.add(b._id)
          })
        }
      })

      // Check branch-level treatments
      h.branches?.forEach((b) => {
        const hasTreatment = b.treatments?.some((t) => {
          const matchesId = treatment.id && t._id === treatment.id
          const matchesQuery = lowerTreatment && t.name && t.name.toLowerCase().includes(lowerTreatment)
          const matchesName = t.name && treatmentNameMatches.has(t.name.toLowerCase())
          return matchesId || matchesQuery || matchesName
        })
        
        // Also check specialization treatments
        const hasSpecTreatment = b.specialization?.some((s) => {
          if (s.isTreatment) {
            const matchesId = treatment.id && s._id === treatment.id
            const matchesQuery = lowerTreatment && s.name && s.name.toLowerCase().includes(lowerTreatment)
            const matchesName = s.name && treatmentNameMatches.has(s.name.toLowerCase())
            return matchesId || matchesQuery || matchesName
          }
          return false
        })

        // Check specialists → treatments chain
        const hasSpecialistTreatment = b.specialists?.some((spec: any) => {
          // Check if specialist has matching treatments
          return spec.treatments?.some((t: any) => {
            const matchesId = treatment.id && t._id === treatment.id
            const matchesQuery = lowerTreatment && t.name && t.name.toLowerCase().includes(lowerTreatment)
            const matchesName = t.name && treatmentNameMatches.has(t.name.toLowerCase())
            return matchesId || matchesQuery || matchesName
          })
        })
        
        if (hasTreatment || hasSpecTreatment || hasSpecialistTreatment) {
          if (b._id) treatmentBranchIds.add(b._id)
        }
      })
    })

    // If treatment filter is active but no matching branches found, return empty
    if (treatmentBranchIds.size === 0) return []
  }

  // Filter and collect results
  const filteredResult = hospitals
    .flatMap((h) =>
      h.branches?.map((b) => ({
        ...b,
        hospitalName: h.hospitalName,
        hospitalLogo: h.logo,
        hospitalId: h._id,
      })) || []
    )
    .filter((b) => {
      // Treatment filter
      if ((treatment.id || lowerTreatment) && !treatmentBranchIds.has(b._id)) {
        return false
      }

      // City filter
      if (
        (city.id || lowerCity) &&
        !b.city.some(
          (c) =>
            (city.id && c._id === city.id) || (lowerCity && c.cityName.toLowerCase().includes(lowerCity))
        )
      ) {
        return false
      }

      // State filter
      if (
        (state.id || lowerState) &&
        !b.city.some(
          (c) =>
            (state.id && c.state === state.id) || (lowerState && (c.state || '').toLowerCase().includes(lowerState))
        )
      ) {
        return false
      }

      // Location filter (city or state)
      if (
        (location.id || lowerLocation) &&
        !b.city.some(
          (c) =>
            (location.id && `city:${c._id}` === location.id) ||
            (location.id && `state:${c.state}` === location.id) ||
            (lowerLocation && c.cityName.toLowerCase().includes(lowerLocation)) ||
            (lowerLocation && (c.state || '').toLowerCase().includes(lowerLocation))
        )
      ) {
        return false
      }

      // Branch filter
      if (
        (branch.id || lowerBranch) &&
        branch.id !== b._id &&
        !(lowerBranch && b.branchName.toLowerCase().includes(lowerBranch))
      ) {
        return false
      }

      // Department filter
      const allDepartments = (b.specialists || []).flatMap((spec) => spec.department || [])
      if (
        (department.id || lowerDept) &&
        !allDepartments.some(
          (d: DepartmentData) =>
            (department.id && d._id === department.id) ||
            (lowerDept && d.name.toLowerCase().includes(lowerDept))
        )
      ) {
        return false
      }

      // Specialization filter
      if (specialization.id || lowerSpec) {
        const hasSpec =
          b.specialization?.some(
            (s) =>
              (specialization.id && s._id === specialization.id) ||
              (lowerSpec && (s.name || '').toLowerCase().includes(lowerSpec))
          ) ||
          b.doctors?.some((d) =>
            d.specialization?.some(
              (s) =>
                (specialization.id && s._id === specialization.id) ||
                (lowerSpec && (s.name || '').toLowerCase().includes(lowerSpec))
            )
          )
        if (!hasSpec) return false
      }

      // Doctor filter - show only branches where this doctor works
      if (doctor.id || lowerDoctor) {
        const hasDoctor = b.doctors?.some((d: any) => {
          const matchesId = doctor.id && d._id === doctor.id
          const matchesQuery = lowerDoctor && d.doctorName?.toLowerCase().includes(lowerDoctor)
          return matchesId || matchesQuery
        })
        if (!hasDoctor) return false
      }

      return true
    })

  // Log filter results with comprehensive mapping
  console.log('[Filter] Debug - allTreatments count:', allTreatments.length)
  console.log('[Filter] Debug - allHospitals count:', hospitals.length)
  console.log('[Filter] Debug - total branches:', hospitals.flatMap(h => h.branches || []).length)
  
  // Debug: sample first Apollo hospital branches
  const sampleHospital = hospitals.find(h => h.hospitalName?.includes('Apollo'))
  if (sampleHospital) {
    console.log('[Filter] Debug - Sample Apollo hospital:', sampleHospital.hospitalName, {
      branchesCount: sampleHospital.branches?.length,
      sampleBranch: sampleHospital.branches?.[0] ? {
        name: sampleHospital.branches[0].branchName,
        specializationCount: sampleHospital.branches[0].specialization?.length || 0,
        specialistsCount: sampleHospital.branches[0].specialists?.length || 0,
        doctorsCount: sampleHospital.branches[0].doctors?.length || 0,
      } : null
    })
  }
  
  // Build specialist mapping from branches
  const specialistMapping = filteredResult.reduce((acc: Record<string, { count: number, branches: string[] }>, branch) => {
    // Get specializations from branch
    branch.specialization?.forEach((spec: any) => {
      const specName = spec.name || 'Unknown'
      if (!acc[specName]) {
        acc[specName] = { count: 0, branches: [] }
      }
      acc[specName].count++
      if (branch.branchName && !acc[specName].branches.includes(branch.branchName)) {
        acc[specName].branches.push(branch.branchName)
      }
    })
    // Also get from specialists
    branch.specialists?.forEach((spec: any) => {
      const specName = spec.name || 'Unknown'
      if (!acc[specName]) {
        acc[specName] = { count: 0, branches: [] }
      }
      // Only increment if not already counted from specialization
      if (!branch.specialization?.some((s: any) => s.name === specName)) {
        acc[specName].count++
      }
      if (branch.branchName && !acc[specName].branches.includes(branch.branchName)) {
        acc[specName].branches.push(branch.branchName)
      }
    })
    return acc
  }, {})

  // Build treatment mapping from branches
  const treatmentMapping = filteredResult.reduce((acc: Record<string, { count: number, branches: string[] }>, branch) => {
    branch.treatments?.forEach((t: any) => {
      const tName = t.name || t.treatmentName || 'Unknown'
      if (!acc[tName]) {
        acc[tName] = { count: 0, branches: [] }
      }
      acc[tName].count++
      if (branch.branchName && !acc[tName].branches.includes(branch.branchName)) {
        acc[tName].branches.push(branch.branchName)
      }
    })
    // Also check specialist treatments
    branch.specialists?.forEach((spec: any) => {
      spec.treatments?.forEach((t: any) => {
        const tName = t.name || t.treatmentName || 'Unknown'
        if (!acc[tName]) {
          acc[tName] = { count: 0, branches: [] }
        }
        if (!branch.treatments?.some((bt: any) => (bt.name || bt.treatmentName) === tName)) {
          acc[tName].count++
        }
        if (branch.branchName && !acc[tName].branches.includes(branch.branchName)) {
          acc[tName].branches.push(branch.branchName)
        }
      })
    })
    return acc
  }, {})

  // Build hospital → branch → specialist mapping (detailed per branch)
  const branchSpecialistMapping = filteredResult.reduce((acc: Record<string, { hospital: string, specialists: string[] }>, branch) => {
    const branchName = branch.branchName || 'Unknown Branch'
    const hospitalName = branch.hospitalName || 'Unknown Hospital'
    const key = `${hospitalName}|${branchName}`
    
    if (!acc[key]) {
      acc[key] = { hospital: hospitalName, specialists: [] }
    }
    
    // Debug: log branch data structure
    if (key.includes('Apollo')) {
      console.log('[Filter] Debug branch:', branchName, {
        specializationCount: branch.specialization?.length || 0,
        specialistsCount: branch.specialists?.length || 0,
        doctorsCount: branch.doctors?.length || 0,
        specialization: branch.specialization?.slice(0, 5),
        specialists: branch.specialists?.slice(0, 5)
      })
    }
    
    // Add branch's own specializations
    branch.specialization?.forEach((s: any) => {
      const specName = s.name || ''
      if (specName && !acc[key].specialists.includes(specName)) {
        acc[key].specialists.push(specName)
      }
    })
    
    // Add specialists
    branch.specialists?.forEach((spec: any) => {
      const specName = spec.name || ''
      if (specName && !acc[key].specialists.includes(specName)) {
        acc[key].specialists.push(specName)
      }
    })
    
    // Add doctors' specializations
    branch.doctors?.forEach((doc: any) => {
      const specs = Array.isArray(doc.specialization) ? doc.specialization : doc.specialization ? [doc.specialization] : []
      specs.forEach((s: any) => {
        const specName = typeof s === 'string' ? s : (s.name || '')
        if (specName && !acc[key].specialists.includes(specName)) {
          acc[key].specialists.push(specName)
        }
      })
    })
    
    return acc
  }, {})

  console.log('[Filter] Results:', {
    totalHospitals: hospitals.length,
    totalBranches: hospitals.flatMap(h => h.branches || []).length,
    filteredBranches: filteredResult.length,
    appliedFilters: {
      treatment: !!treatment.id || !!lowerTreatment,
      city: !!city.id || !!lowerCity,
      state: !!state.id || !!lowerState,
      branch: !!branch.id || !!lowerBranch,
      department: !!department.id || !!lowerDept,
      specialization: !!specialization.id || !!lowerSpec,
      doctor: !!doctor.id || !!lowerDoctor,
      location: !!location.id || !!lowerLocation
    },
    // Specialist mapping (top 20)
    specialistMapping: Object.fromEntries(
      Object.entries(specialistMapping)
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 20)
        .map(([name, data]) => [name, { branchesCount: data.count, branches: data.branches.slice(0, 8) }])
    ),
    totalSpecializations: Object.keys(specialistMapping).length,
    // Treatment mapping (top 15)
    treatmentMapping: Object.fromEntries(
      Object.entries(treatmentMapping)
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 15)
        .map(([name, data]) => [name, { branchesCount: data.count }])
    ),
    totalTreatments: Object.keys(treatmentMapping).length,
    // Detailed branch → specialist mapping (all branches with all specialists)
    branchSpecialistMapping: Object.fromEntries(
      Object.entries(branchSpecialistMapping)
        .sort(([,a], [,b]) => b.specialists.length - a.specialists.length)
        .slice(0, 20)
        .map(([key, data]) => [key, { specialistsCount: data.specialists.length, specialists: data.specialists }])
    ),
    totalBranchesWithSpecialists: Object.keys(branchSpecialistMapping).length
  })

  return filteredResult
}

const getAllExtendedDoctors = (hospitals: HospitalData[]): ExtendedDoctorData[] => {
  if (!hospitals?.length) return []

  const extendedMap = new Map<string, ExtendedDoctorData>()

  hospitals.forEach((h) => {
    const processDoctor = (item: any, branch?: BranchData) => {
      const baseId = item._id
      if (!baseId) return

      const doctorDepartments: DepartmentData[] = []
      const specs = Array.isArray(item.specialization) ? item.specialization : item.specialization ? [item.specialization] : []
      specs.forEach((spec: any) => {
        if (typeof spec === 'object' && spec?.department) {
          spec.department.forEach((dept: DepartmentData) => {
            doctorDepartments.push(dept)
          })
        }
      })
      const uniqueDepartments = Array.from(new Map(doctorDepartments.map((dept) => [dept._id, dept])).values())

      const defaultBranch = h.branches?.[0]
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
          (loc) => loc.hospitalId === h._id && (loc.branchId === branch?._id || (!loc.branchId && !branch?._id))
        )
        if (!isLocationDuplicate) {
          existingDoctor.locations.push(location)
        }
        const allDepts = [...existingDoctor.departments, ...uniqueDepartments]
        existingDoctor.departments = Array.from(new Map(allDepts.map((dept) => [dept._id, dept])).values())
      } else {
        extendedMap.set(baseId, {
          ...item,
          baseId,
          locations: [location],
          departments: uniqueDepartments,
        })
      }
    }

    h.doctors?.forEach((d) => processDoctor(d))
    h.branches?.forEach((b) => {
      b.doctors?.forEach((d) => processDoctor(d, b))
    })
  })

  return Array.from(extendedMap.values())
}

const getDoctorsByTreatment = (
  hospitals: HospitalData[],
  treatmentId: string,
  allTreatments: ExtendedTreatmentData[]
): ExtendedDoctorData[] => {
  if (!hospitals?.length) return []
  if (!treatmentId) return getAllExtendedDoctors(hospitals)

  // Check if treatmentId is a UUID or a query slug
  const isUUID = (str: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)
  const isTreatmentQuery = !isUUID(treatmentId)

  const treatmentBranchIds = new Set<string>()
  const lowerTreatmentQuery = isTreatmentQuery ? treatmentId.toLowerCase() : ''

  allTreatments.forEach((t) => {
    const matchesId = !isTreatmentQuery && t._id === treatmentId
    const matchesQuery = isTreatmentQuery && t.name && t.name.toLowerCase().includes(lowerTreatmentQuery)
    
    if (matchesId || matchesQuery) {
      t.branchesAvailableAt?.forEach((loc) => {
        if (loc.branchId) treatmentBranchIds.add(loc.branchId)
      })
    }
  })

  // Also check hospital-level treatments for additional branch matches
  if (!isTreatmentQuery && treatmentBranchIds.size === 0) {
    hospitals.forEach((h) => {
      h.treatments?.forEach((t) => {
        if (t._id === treatmentId) {
          h.branches?.forEach((b) => {
            if (b._id) treatmentBranchIds.add(b._id)
          })
        }
      })
      
      h.branches?.forEach((b) => {
        const hasTreatment = b.treatments?.some((t) => t._id === treatmentId)
        if (hasTreatment && b._id) {
          treatmentBranchIds.add(b._id)
        }
      })
    })
  }

  const allDoctors = getAllExtendedDoctors(hospitals)
  return allDoctors.filter((doctor) =>
    doctor.locations.some((loc) => loc.branchId && treatmentBranchIds.has(loc.branchId))
  )
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export const useCMSData = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const fullDataLoadedRef = useRef(false)

  // Step 1: Fast initial load with first 50 items
  const { data: initialData, isLoading: initialLoading } = useQuery({
    queryKey: ['cms', 'initial'],
    queryFn: async () => {
      const res = await fetch('/api/cms?action=all&pageSize=50')
      if (!res.ok) throw new Error('Failed to fetch initial CMS data')
      const data = await res.json() as CMSApiResponse
      console.log('[CMS] Initial data fetched:', { 
        hospitals: data.hospitals?.length || 0, 
        treatments: data.treatments?.length || 0,
        totalHospitals: data.totalHospitals 
      })
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  })

  // Step 2: Background load ALL data after initial load completes
  const { data: fullData, isLoading: fullLoading } = useQuery({
    queryKey: ['cms', 'full'],
    queryFn: async () => {
      // Fetch with larger pageSize to get all records (max 1000 due to Wix API limit)
      const res = await fetch('/api/cms?action=all&pageSize=1000')
      if (!res.ok) throw new Error('Failed to fetch full CMS data')
      const data = await res.json() as CMSApiResponse
      fullDataLoadedRef.current = true
      console.log('[CMS] Full data loaded:', { 
        hospitals: data.hospitals?.length || 0, 
        treatments: data.treatments?.length || 0,
        totalHospitals: data.totalHospitals,
        totalTreatments: data.totalTreatments
      })
      return data
    },
    enabled: !initialLoading && !!initialData, // Only start after initial load
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000,
  })

  // Use full data if available, otherwise use initial data
  const cmsData = fullData || initialData
  const loading = initialLoading
  const isLoadingMore = fullLoading && !fullData

  const allHospitals = cmsData?.hospitals || []
  const allTreatments = cmsData?.treatments || []
  const allDoctors = cmsData?.doctors || []

  // Initialize filters from URL
  const [filters, setFilters] = useState<FilterState>(() => {
    const getParam = (key: string) => searchParams.get(key)
    const initialView = (getParam('view') as FilterState['view']) || 'hospitals'
    const getFilterState = (key: string): FilterValue => {
      const value = getParam(key)
      if (!value) return { id: '', query: '' }
      return isUUID(value) ? { id: value, query: '' } : { id: '', query: value }
    }
    return {
      view: initialView,
      city: getFilterState('city'),
      state: getFilterState('state'),
      treatment: getFilterState('treatment'),
      specialization: getFilterState('specialization'),
      department: getFilterState('department'),
      doctor: getFilterState('doctor'),
      branch: getFilterState('branch'),
      location: getFilterState('location'),
      sortBy: 'all',
    }
  })

  // Log filter changes for debugging
  useEffect(() => {
    console.log('[Filter] Filters updated:', JSON.stringify(filters, (key, value) => {
      if (key === 'sortBy') return value
      return value
    }, 2))
  }, [filters])

  // Filter update handlers
  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const updateSubFilter = useCallback(<K extends FilterKey>(key: K, subKey: 'id' | 'query', value: string) => {
    setFilters((prev) => {
      const newFilterValue: FilterValue = { ...prev[key], [subKey]: value }
      let newFilters = { ...prev, [key]: newFilterValue } as FilterState
      newFilters = enforceOnePrimaryFilter(key, newFilters, newFilterValue)
      return newFilters
    })
  }, [])

  const clearFilters = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      city: { id: '', query: '' },
      state: { id: '', query: '' },
      treatment: { id: '', query: '' },
      specialization: { id: '', query: '' },
      department: { id: '', query: '' },
      doctor: { id: '', query: '' },
      branch: { id: '', query: '' },
      location: { id: '', query: '' },
      sortBy: 'all',
    }))
  }, [])

  // Computed filtered results
  const filteredBranches = useMemo(
    () => getMatchingBranches(allHospitals, filters, allTreatments),
    [allHospitals, filters, allTreatments]
  )

  const filteredDoctors = useMemo(() => {
    // First try to use doctors from CMS data directly
    if (allDoctors.length > 0) {
      if (filters.treatment.id || filters.treatment.query) {
        // Filter by treatment
        const treatmentParam = filters.treatment.id || filters.treatment.query
        return getDoctorsByTreatment(allHospitals, treatmentParam, allTreatments)
      }
      // Map CMS doctors to ExtendedDoctorData format for compatibility
      return allDoctors.map(d => {
        // Extract specialization names for display
        const specs = d.specialization || []
        const specNames = Array.isArray(specs) 
          ? specs.map((s: any) => s.name || s.title || s.specialty || 'Unknown').filter(Boolean)
          : []
        
        return {
          ...d,
          baseId: d._id,
          // Add location from hospital if doctor is linked to any hospital
          locations: [],
          departments: [],
          // Override specialization with properly formatted array for display
          specialization: specNames.length > 0 
            ? specNames.map((name: string) => ({ _id: '', name, department: [], treatments: [] }))
            : []
        } as ExtendedDoctorData
      })
    }
    // Fallback to extracting from hospitals
    if (filters.treatment.id || filters.treatment.query) {
      // Use treatment ID if available, otherwise use the query
      const treatmentParam = filters.treatment.id || filters.treatment.query
      return getDoctorsByTreatment(allHospitals, treatmentParam, allTreatments)
    }
    return getAllExtendedDoctors(allHospitals)
  }, [allDoctors, allHospitals, filters.treatment, allTreatments])

  const filteredTreatments = useMemo(() => {
    // If a specific treatment ID is selected, show only that treatment
    if (filters.treatment.id) {
      return allTreatments.filter((t) => t._id === filters.treatment.id)
    }

    // If a treatment query (slug) is provided, filter by treatment name
    if (filters.treatment.query) {
      const lowerQuery = filters.treatment.query.toLowerCase()
      return allTreatments.filter((t) => 
        t.name && t.name.toLowerCase().includes(lowerQuery)
      )
    }

    // If a doctor is selected, show only treatments related to that doctor
    if (filters.doctor.id || filters.doctor.query) {
      const lowerDoctorQuery = filters.doctor.query.toLowerCase()
      const doctorTreatmentIds = new Set<string>()
      const doctorTreatmentNames = new Set<string>()

      // Find the selected doctor and get their specializations/treatments
      allHospitals.forEach((h) => {
        h.doctors?.forEach((d: any) => {
          const matchesId = filters.doctor.id && d._id === filters.doctor.id
          const matchesQuery = lowerDoctorQuery && d.doctorName?.toLowerCase().includes(lowerDoctorQuery)
          
          if (matchesId || matchesQuery) {
            // Get treatments from doctor's specializations
            const specs = Array.isArray(d.specialization) ? d.specialization : d.specialization ? [d.specialization] : []
            specs.forEach((spec: any) => {
              // Get treatments from specialist
              spec.treatments?.forEach((t: any) => {
                if (t._id) doctorTreatmentIds.add(t._id)
                if (t.name) doctorTreatmentNames.add(t.name.toLowerCase())
              })
            })
          }
        })

        // Also check branch-level doctors
        h.branches?.forEach((b) => {
          b.doctors?.forEach((d: any) => {
            const matchesId = filters.doctor.id && d._id === filters.doctor.id
            const matchesQuery = lowerDoctorQuery && d.doctorName?.toLowerCase().includes(lowerDoctorQuery)
            
            if (matchesId || matchesQuery) {
              // Get treatments from this branch
              b.treatments?.forEach((t: any) => {
                if (t._id) doctorTreatmentIds.add(t._id)
                if (t.name) doctorTreatmentNames.add(t.name.toLowerCase())
              })

              // Get treatments from specialists at this branch
              b.specialists?.forEach((spec: any) => {
                spec.treatments?.forEach((t: any) => {
                  if (t._id) doctorTreatmentIds.add(t._id)
                  if (t.name) doctorTreatmentNames.add(t.name.toLowerCase())
                })
              })

              // Get treatments from doctor's specializations
              const specs = Array.isArray(d.specialization) ? d.specialization : d.specialization ? [d.specialization] : []
              specs.forEach((spec: any) => {
                spec.treatments?.forEach((t: any) => {
                  if (t._id) doctorTreatmentIds.add(t._id)
                  if (t.name) doctorTreatmentNames.add(t.name.toLowerCase())
                })
              })
            }
          })
        })
      })

      // Filter treatments by doctor's related treatments
      return allTreatments.filter((t) => {
        return doctorTreatmentIds.has(t._id) || 
               (t.name && doctorTreatmentNames.has(t.name.toLowerCase()))
      })
    }

    if (filters.view === 'treatments') {
      return allTreatments
    }

    // Extract treatments from hospitals AND branches and merge with TreatmentMaster data
    const treatmentMap = new Map<string, ExtendedTreatmentData>()
    
    // First, add all treatments from TreatmentMaster
    allTreatments.forEach((t) => {
      treatmentMap.set(t._id, { ...t })
    })
    
    // Then, add treatments from hospitals that might not be in TreatmentMaster
    allHospitals.forEach((h) => {
      h.treatments?.forEach((t) => {
        if (!treatmentMap.has(t._id)) {
          treatmentMap.set(t._id, {
            ...t,
            branchesAvailableAt: [],
            departments: [],
          })
        }
      })
      
      // Also add treatments from hospital branches
      h.branches?.forEach((b) => {
        b.treatments?.forEach((t: any) => {
          const tid = t._id || t.name || ''
          if (tid && !treatmentMap.has(tid)) {
            treatmentMap.set(tid, {
              _id: tid,
              name: t.name || t.treatmentName || '',
              branchesAvailableAt: [],
              departments: [],
            })
          }
        })
        
        // Also add treatments from branch specialists
        b.specialists?.forEach((spec: any) => {
          spec.treatments?.forEach((t: any) => {
            const tid = t._id || t.name || ''
            if (tid && !treatmentMap.has(tid)) {
              treatmentMap.set(tid, {
                _id: tid,
                name: t.name || t.treatmentName || '',
                branchesAvailableAt: [],
                departments: [],
              })
            }
          })
        })
      })
    })
    // Add debug logging
    console.log('[Filter] Debug - filteredTreatments computed:', {
      fromAllTreatments: allTreatments.length,
      fromHospitals: allHospitals.length,
      totalFiltered: Array.from(treatmentMap.values()).length,
      view: filters.view
    })
    
    return Array.from(treatmentMap.values())
  }, [allHospitals, filters.view, filters.treatment, filters.doctor, allTreatments])

  const currentCount = useMemo(() => {
    switch (filters.view) {
      case 'doctors':
        return filteredDoctors.length
      case 'treatments':
        return filteredTreatments.length
      default:
        return filteredBranches.length
    }
  }, [filters.view, filteredBranches, filteredDoctors, filteredTreatments])

  // Available filter options
  const availableOptions = useMemo(() => {
    const visibleKeys = getVisibleFiltersByView(filters.view)
    const options: AvailableOptions = {
      city: [],
      state: [],
      treatment: [],
      specialization: [],
      department: [],
      doctor: [],
      branch: [],
      location: [],
    }

    // Cities
    const cities = new Map<string, FilterOption>()
    filteredBranches.forEach((b) => {
      b.city?.forEach((c) => {
        if (c._id && c.cityName && !cities.has(c._id)) {
          cities.set(c._id, { id: c._id, name: c.cityName })
        }
      })
    })
    options.city = Array.from(cities.values())

    // Locations (cities + states)
    const locations = new Map<string, FilterOption>()
    filteredBranches.forEach((b) => {
      b.city?.forEach((c) => {
        if (c._id && c.cityName) {
          locations.set(`city:${c._id}`, { id: `city:${c._id}`, name: c.cityName })
        }
        if (c.state) {
          const stateId = `state:${c.state}`
          if (!locations.has(stateId)) {
            locations.set(stateId, { id: stateId, name: c.state })
          }
        }
      })
    })
    options.location = Array.from(locations.values())

    // Branches
    if (visibleKeys.includes('branch')) {
      options.branch = filteredBranches.map((b) => ({ id: b._id || '', name: b.branchName || '' }))
    }

    // Treatments - from allTreatments AND branch-level treatments
    // Only include treatments that have at least one branch available
    if (visibleKeys.includes('treatment')) {
      const treatments = new Map<string, FilterOption>()
      
      // First: add treatments from allTreatments (TreatmentMaster)
      allTreatments
        .filter((t) => t.branchesAvailableAt && t.branchesAvailableAt.length > 0)
        .forEach((t) => {
          if (t._id && t.name) {
            treatments.set(t._id, { id: t._id, name: t.name })
          }
        })
      
      console.log('[Filter] Debug - treatments from TreatmentMaster:', treatments.size)
      
      // Second: add branch-level treatments
      filteredBranches.forEach((b) => {
        b.treatments?.forEach((t: any) => {
          const id = t._id || t.name || ''
          const name = t.name || t.treatmentName || ''
          if (id && name && !treatments.has(id)) {
            treatments.set(id, { id, name })
          }
        })
        // Also get from specialists
        b.specialists?.forEach((spec: any) => {
          spec.treatments?.forEach((t: any) => {
            const id = t._id || t.name || ''
            const name = t.name || t.treatmentName || ''
            if (id && name && !treatments.has(id)) {
              treatments.set(id, { id, name })
            }
          })
        })
      })
      
      console.log('[Filter] Debug - total treatments after adding branches:', treatments.size)
      
      options.treatment = Array.from(treatments.values())
    }

    // Doctors
    if (visibleKeys.includes('doctor')) {
      options.doctor = filteredDoctors.map((d) => ({ id: d._id || '', name: d.doctorName || '' }))
    }

    // Specializations - from doctors AND branches
    if (visibleKeys.includes('specialization')) {
      const specs = new Map<string, FilterOption>()
      
      // First: collect from filteredDoctors
      filteredDoctors.forEach((d) => {
        const specsArr = Array.isArray(d.specialization) ? d.specialization : d.specialization ? [d.specialization] : []
        specsArr.forEach((s: any) => {
          const id = typeof s === 'string' ? s : s._id
          const name = typeof s === 'string' ? s : s.name || s.title || ''
          if (id && name && !specs.has(id)) {
            specs.set(id, { id, name })
          }
        })
      })
      
      // Second: collect from filteredBranches (branch-level specializations)
      filteredBranches.forEach((b) => {
        // Branch's own specializations
        b.specialization?.forEach((s: any) => {
          const id = s._id || s.name || ''
          const name = s.name || s.title || ''
          if (id && name && !specs.has(id)) {
            specs.set(id, { id, name })
          }
        })
        // Branch's specialists' specializations
        b.specialists?.forEach((spec: any) => {
          const id = spec._id || spec.name || ''
          const name = spec.name || spec.title || ''
          if (id && name && !specs.has(id)) {
            specs.set(id, { id, name })
          }
        })
      })
      
      options.specialization = Array.from(specs.values())
    }

    // Departments - from doctors AND branches/specialists
    if (visibleKeys.includes('department')) {
      const depts = new Map<string, FilterOption>()
      
      // First: collect from filteredDoctors
      filteredDoctors.forEach((d) => {
        d.departments?.forEach((dept) => {
          if (dept._id && dept.name && !depts.has(dept._id)) {
            depts.set(dept._id, { id: dept._id, name: dept.name })
          }
        })
      })
      
      // Second: collect from filteredBranches (branch specialists' departments)
      filteredBranches.forEach((b) => {
        // Branch specialists' departments
        b.specialists?.forEach((spec: any) => {
          spec.department?.forEach((dept: any) => {
            const id = dept._id || dept.name || ''
            const name = dept.name || ''
            if (id && name && !depts.has(id)) {
              depts.set(id, { id, name })
            }
          })
        })
      })
      
      options.department = Array.from(depts.values())
    }

    return options
  }, [filters.view, filteredBranches, filteredDoctors, allTreatments])

  const getFilterValueDisplay = useCallback(
    (key: FilterKey, currentFilters: FilterState, currentAvailableOptions: AvailableOptions) => {
      const filter = currentFilters[key]
      if (!filter.id && !filter.query) return null

      const options = currentAvailableOptions[key]
      if (options?.length) {
        const found = options.find((opt) => opt.id === filter.id)
        return found?.name || filter.query || filter.id || null
      }
      return filter.query || filter.id || null
    },
    []
  )

  // Sync filters with URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.view !== 'hospitals') params.set('view', filters.view)
    if (filters.city.id) params.set('city', filters.city.id)
    else if (filters.city.query) params.set('city', filters.city.query)
    if (filters.state.id) params.set('state', filters.state.id)
    else if (filters.state.query) params.set('state', filters.state.query)
    if (filters.treatment.id) params.set('treatment', filters.treatment.id)
    else if (filters.treatment.query) params.set('treatment', filters.treatment.query)
    if (filters.specialization.id) params.set('specialization', filters.specialization.id)
    else if (filters.specialization.query) params.set('specialization', filters.specialization.query)
    if (filters.department.id) params.set('department', filters.department.id)
    else if (filters.department.query) params.set('department', filters.department.query)
    if (filters.doctor.id) params.set('doctor', filters.doctor.id)
    else if (filters.doctor.query) params.set('doctor', filters.doctor.query)
    if (filters.branch.id) params.set('branch', filters.branch.id)
    else if (filters.branch.query) params.set('branch', filters.branch.query)
    if (filters.location.id) params.set('location', filters.location.id)
    else if (filters.location.query) params.set('location', filters.location.query)

    const currentParams = searchParams.toString()
    const newParams = params.toString()

    if (currentParams !== newParams) {
      router.replace(`${pathname}?${newParams}`, { scroll: false })
    }
  }, [filters, pathname, router, searchParams])

  return {
    loading,
    isLoadingMore, // New: indicates background loading
    isFullDataLoaded: fullDataLoadedRef.current || !!fullData, // New: indicates all data loaded
    filters,
    updateFilter,
    updateSubFilter,
    clearFilters,
    availableOptions,
    filteredBranches,
    filteredDoctors,
    filteredTreatments,
    currentCount,
    totalCount: cmsData?.totalHospitals || 0, // New: total count from API
    getFilterValueDisplay,
    // Raw data access
    allHospitals,
    allTreatments,
  }
}

// Export for backward compatibility
export { useCMSData as useHospitalsData }
