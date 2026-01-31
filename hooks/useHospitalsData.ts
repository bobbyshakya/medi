"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useQuery } from '@tanstack/react-query'
import type { HospitalType, ExtendedDoctorType, ExtendedTreatmentType, FilterState, FilterKey, FilterValue, OptionType } from '@/types/search'
import { matchesSpecialization, getAllExtendedDoctors, getAllExtendedTreatments, getMatchingBranches, getVisibleFiltersByView, enforceOnePrimaryFilter } from '@/utils/search'
import { isUUID, generateSlug } from '@/types/search'
import type { CityType, DepartmentType, TreatmentLocation, BranchType } from '@/types/search'

export const useHospitalsData = () => {
   const searchParams = useSearchParams()
   const router = useRouter()
   const pathname = usePathname()

   // Use React Query for data fetching
   const { data: hospitalsData, isLoading: loading } = useQuery({
     queryKey: ['hospitals', 'search'],
     queryFn: async () => {
       const res = await fetch('/api/hospitals?search=true&pageSize=1000&page=0')
       if (!res.ok) throw new Error('Failed to fetch hospital data')
       return res.json() as Promise<{ items: HospitalType[], total: number }>
     },
     staleTime: 5 * 60 * 1000, // 5 minutes
     gcTime: 10 * 60 * 1000, // 10 minutes
   })

   // Fetch all treatments directly from TreatmentMaster collection
   const { data: allTreatmentsData } = useQuery({
     queryKey: ['treatments', 'all'],
     queryFn: async () => {
       const res = await fetch('/api/treatments?pageSize=500')
       if (!res.ok) throw new Error('Failed to fetch treatments')
       return res.json() as Promise<{ items: ExtendedTreatmentType[], total: number }>
     },
     staleTime: 5 * 60 * 1000, // 5 minutes
     gcTime: 10 * 60 * 1000, // 10 minutes
   })

   const allTreatmentsFromApi = allTreatmentsData?.items || []

   const allHospitals = hospitalsData?.items || []

  const [filters, setFilters] = useState<FilterState>(() => {
    const getParam = (key: string) => searchParams.get(key)
    const initialView = (getParam("view") as "doctors" | "treatments" | "hospitals" | null) || "hospitals"
    const getFilterState = (key: string) => {
      const value = getParam(key)
      if (!value) return { id: "", query: "" }
      if (isUUID(value)) {
        return { id: value, query: "" }
      } else {
        return { id: "", query: value }
      }
    }
    return {
      view: initialView,
      city: getFilterState("city"),
      state: getFilterState("state"),
      treatment: getFilterState("treatment"),
      specialization: getFilterState("specialization"),
      department: getFilterState("department"),
      doctor: getFilterState("doctor"),
      branch: getFilterState("branch"),
      location: getFilterState("location"),
      sortBy: "all",
    }
  })

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateSubFilter = useCallback(<K extends FilterKey>(key: K, subKey: "id" | "query", value: string) => {
    setFilters(prev => {
      const newFilterValue: FilterValue = { ...prev[key], [subKey]: value }
      let newFilters = {
        ...prev,
        [key]: newFilterValue,
      } as FilterState
      newFilters = enforceOnePrimaryFilter(key, newFilters, newFilterValue)
      return newFilters
    })
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      city: { id: "", query: "" },
      state: { id: "", query: "" },
      treatment: { id: "", query: "" },
      specialization: { id: "", query: "" },
      department: { id: "", query: "" },
      doctor: { id: "", query: "" },
      branch: { id: "", query: "" },
      location: { id: "", query: "" },
      sortBy: "all",
    }))
  }, [])


  const allExtendedDoctors = useMemo(() => getAllExtendedDoctors(allHospitals), [allHospitals])
  
  // Use treatments from API (which now includes branchesAvailableAt mapping)
  // Fall back to hospital-derived treatments if API data is not available
  const treatmentsForView = useMemo(() => {
    if (filters.view === 'treatments' && allTreatmentsFromApi.length > 0) {
      // Use API treatments with branchesAvailableAt mapping
      return allTreatmentsFromApi
    }
    // Fallback to hospital-derived treatments
    return getAllExtendedTreatments(allHospitals)
  }, [filters.view, allTreatmentsFromApi, allHospitals])

  const visibleHospitals = useMemo(() => allHospitals.filter(h => h.showHospital !== false), [allHospitals])

  const { filteredBranches, filteredDoctors, filteredTreatments } = useMemo(() => {
    const currentFilters = filters

    const genericBranchFilters: FilterState = {
      ...currentFilters,
      doctor: { id: "", query: "" },
      department: { id: "", query: "" },
      view: 'hospitals',
    }

    let branches = getMatchingBranches(visibleHospitals, genericBranchFilters, treatmentsForView)

    let matchingBranchIds: string[] | null = null
    if (currentFilters.branch.id || currentFilters.branch.query) {
      matchingBranchIds = branches.map(b => b._id).filter(Boolean)
    }

    let doctors = allExtendedDoctors

    if (currentFilters.city.id || currentFilters.city.query) {
      const lowerCityQuery = currentFilters.city.query.toLowerCase()
      doctors = doctors.filter(d =>
        d.locations.some(loc =>
          loc.cities.some(c =>
            (currentFilters.city.id && c._id === currentFilters.city.id) ||
            (lowerCityQuery && (c.cityName ?? '').toLowerCase().includes(lowerCityQuery))
          )
        )
      )
    }

    if (currentFilters.state.id || currentFilters.state.query) {
      const lowerStateQuery = currentFilters.state.query.toLowerCase()
      doctors = doctors.filter(d =>
        d.locations.some(loc =>
          loc.cities.some(c =>
            (currentFilters.state.id && c.state === currentFilters.state.id) ||
            (lowerStateQuery && (c.state ?? '').toLowerCase().includes(lowerStateQuery))
          )
        )
      )
    }

    if (currentFilters.location.id || currentFilters.location.query) {
      const lowerLocQuery = currentFilters.location.query.toLowerCase()
      doctors = doctors.filter(d =>
        d.locations.some(loc =>
          loc.cities.some(c =>
            (currentFilters.location.id && `city:${c._id}` === currentFilters.location.id) ||
            (currentFilters.location.id && `state:${c.state}` === currentFilters.location.id) ||
            (lowerLocQuery && (c.cityName ?? '').toLowerCase().includes(lowerLocQuery)) ||
            (lowerLocQuery && (c.state ?? '').toLowerCase().includes(lowerLocQuery))
          )
        )
      )
    }

    if (currentFilters.doctor.id) {
      doctors = doctors.filter(d => d.baseId === currentFilters.doctor.id)
    } else if (currentFilters.doctor.query) {
      const lowerQuery = currentFilters.doctor.query.toLowerCase()
      doctors = doctors.filter(d => (d.doctorName ?? '').toLowerCase().includes(lowerQuery))
    }

    if (currentFilters.specialization.id) {
      const specId = currentFilters.specialization.id
      doctors = doctors.filter(d => matchesSpecialization(d.specialization, specId, ""))
    } else if (currentFilters.specialization.query) {
      const lowerQuery = currentFilters.specialization.query.toLowerCase()
      doctors = doctors.filter(d => matchesSpecialization(d.specialization, "", lowerQuery))
    }

    let matchingLocationKeysForDoctors: Set<string> | null = null
    let matchingSpecialtyNamesForDoctors = new Set<string>()
    if (currentFilters.treatment.id || currentFilters.treatment.query) {
      const lowerTreatQuery = currentFilters.treatment.query.toLowerCase()
      const matchingTreatments = treatmentsForView.filter(t =>
        (currentFilters.treatment.id && t._id === currentFilters.treatment.id) ||
        (lowerTreatQuery && (t.name ?? '').toLowerCase().includes(lowerTreatQuery))
      )

      matchingTreatments.forEach(t => {
        t.departments.forEach(d => matchingSpecialtyNamesForDoctors.add(d.name.toLowerCase()))
      })

      if (matchingTreatments.length > 0) {
        matchingLocationKeysForDoctors = new Set(matchingTreatments.flatMap(t => t.branchesAvailableAt.map(loc => `${loc.hospitalId}-${loc.branchId || 'no-branch'}`)))
      }

      if (matchingSpecialtyNamesForDoctors.size > 0) {
        const deptMatch = (d: ExtendedDoctorType) => {
          const specs = Array.isArray(d.specialization) ? d.specialization : d.specialization ? [d.specialization] : []
          return specs.some((spec: any) =>
            (spec.department || []).some((dept: any) => matchingSpecialtyNamesForDoctors.has(dept.name.toLowerCase()))
          )
        }
        if (matchingLocationKeysForDoctors && matchingLocationKeysForDoctors.size > 0) {
          doctors = doctors.filter(d =>
            d.locations.some(loc => matchingLocationKeysForDoctors!.has(`${loc.hospitalId}-${loc.branchId || 'no-branch'}`)) && deptMatch(d)
          )
        } else {
          doctors = doctors.filter(deptMatch)
        }
      } else if (currentFilters.treatment.id) {
        doctors = []
      }
    }

    const processedDoctors = doctors.map((d: ExtendedDoctorType) => {
      const locFilter = (loc: any) => {
        let match = true
        if (currentFilters.city.id || currentFilters.city.query) {
          const lower = currentFilters.city.query.toLowerCase()
          match = match && loc.cities.some((c: CityType) =>
            (currentFilters.city.id && c._id === currentFilters.city.id) ||
            (lower && (c.cityName ?? '').toLowerCase().includes(lower))
          )
        }
        if (currentFilters.state.id || currentFilters.state.query) {
          const lower = currentFilters.state.query.toLowerCase()
          match = match && loc.cities.some((c: CityType) =>
            (currentFilters.state.id && c.state === currentFilters.state.id) ||
            (lower && (c.state ?? '').toLowerCase().includes(lower))
          )
        }
        if (matchingLocationKeysForDoctors) {
          match = match && matchingLocationKeysForDoctors.has(`${loc.hospitalId}-${loc.branchId || 'no-branch'}`)
        }
        return match
      }
      return {
        ...d,
        filteredLocations: d.locations.filter(locFilter)
      }
    })

    let treatments = treatmentsForView

    if (currentFilters.city.id || currentFilters.city.query) {
      const lowerCityQuery = currentFilters.city.query.toLowerCase()
      treatments = treatments.filter(t =>
        t.branchesAvailableAt.some(loc =>
          loc.cities.some(c =>
            (currentFilters.city.id && c._id === currentFilters.city.id) ||
            (lowerCityQuery && (c.cityName ?? '').toLowerCase().includes(lowerCityQuery))
          )
        )
      )
    }

    if (currentFilters.state.id || currentFilters.state.query) {
      const lowerStateQuery = currentFilters.state.query.toLowerCase()
      treatments = treatments.filter(t =>
        t.branchesAvailableAt.some(loc =>
          loc.cities.some(c =>
            (currentFilters.state.id && c.state === currentFilters.state.id) ||
            (lowerStateQuery && (c.state ?? '').toLowerCase().includes(lowerStateQuery))
          )
        )
      )
    }

    if (currentFilters.location.id || currentFilters.location.query) {
      const lowerLocQuery = currentFilters.location.query.toLowerCase()
      treatments = treatments.filter(t =>
        t.branchesAvailableAt.some(loc =>
          loc.cities.some(c =>
            (currentFilters.location.id && `city:${c._id}` === currentFilters.location.id) ||
            (currentFilters.location.id && `state:${c.state}` === currentFilters.location.id) ||
            (lowerLocQuery && (c.cityName ?? '').toLowerCase().includes(lowerLocQuery)) ||
            (lowerLocQuery && (c.state ?? '').toLowerCase().includes(lowerLocQuery))
          )
        )
      )
    }

    if (currentFilters.treatment.id) {
      treatments = treatments.filter(t => t._id === currentFilters.treatment.id)
    } else if (currentFilters.treatment.query) {
      const lowerQuery = currentFilters.treatment.query.toLowerCase()
      treatments = treatments.filter(t => (t.name ?? '').toLowerCase().includes(lowerQuery))
    }

    let matchingDoctorLocationKeys: Set<string> | null = null
    let matchingDeptsFromDoctors: Set<string> | null = null
    if (currentFilters.view === 'doctors' && ((currentFilters.doctor.id || currentFilters.doctor.query) || (currentFilters.specialization.id || currentFilters.specialization.query))) {
      matchingDeptsFromDoctors = new Set(processedDoctors.flatMap((d: ExtendedDoctorType) => d.departments.map((dept: DepartmentType) => dept.name.toLowerCase())))
      if (processedDoctors.length > 0) {
        matchingDoctorLocationKeys = new Set(processedDoctors.flatMap((d: ExtendedDoctorType) => d.locations.map(loc => `${loc.hospitalId}-${loc.branchId || 'no-branch'}`)))
      }
    }

    if (matchingDoctorLocationKeys && matchingDeptsFromDoctors) {
      treatments = treatments.filter(t =>
        t.branchesAvailableAt.some(loc =>
          matchingDoctorLocationKeys!.has(`${loc.hospitalId}-${loc.branchId || 'no-branch'}`) &&
          loc.departments.some((dept: DepartmentType) => matchingDeptsFromDoctors!.has(dept.name.toLowerCase()))
        )
      )
    } else if (matchingDoctorLocationKeys) {
      treatments = treatments.filter(t => t.branchesAvailableAt.some(loc => matchingDoctorLocationKeys!.has(`${loc.hospitalId}-${loc.branchId || 'no-branch'}`)))
    } else if (matchingDeptsFromDoctors) {
      treatments = treatments.filter(t => t.departments.some(dept => matchingDeptsFromDoctors!.has(dept.name.toLowerCase())))
    }

    if (matchingBranchIds) {
      treatments = treatments.filter(t =>
        t.branchesAvailableAt.some(loc => matchingBranchIds!.includes(loc.branchId || ''))
      )
    }

    const processedTreatments = treatments.map((t: ExtendedTreatmentType) => {
      const locFilter = (loc: TreatmentLocation) => {
        let match = true
        if (currentFilters.city.id || currentFilters.city.query) {
          const lower = currentFilters.city.query.toLowerCase()
          match = match && loc.cities.some((c: CityType) =>
            (currentFilters.city.id && c._id === currentFilters.city.id) ||
            (lower && (c.cityName ?? '').toLowerCase().includes(lower))
          )
        }
        if (currentFilters.state.id || currentFilters.state.query) {
          const lower = currentFilters.state.query.toLowerCase()
          match = match && loc.cities.some((c: CityType) =>
            (currentFilters.state.id && c.state === currentFilters.state.id) ||
            (lower && (c.state ?? '').toLowerCase().includes(lower))
          )
        }
        if (currentFilters.location.id || currentFilters.location.query) {
          const lower = currentFilters.location.query.toLowerCase()
          match = match && loc.cities.some((c: CityType) =>
            (currentFilters.location.id && `city:${c._id}` === currentFilters.location.id) ||
            (currentFilters.location.id && `state:${c.state}` === currentFilters.location.id) ||
            (lower && (c.cityName ?? '').toLowerCase().includes(lower)) ||
            (lower && (c.state ?? '').toLowerCase().includes(lower))
          )
        }
        if (matchingBranchIds) {
          match = match && matchingBranchIds.includes(loc.branchId || '')
        }
        if (matchingDoctorLocationKeys) {
          match = match && matchingDoctorLocationKeys.has(`${loc.hospitalId}-${loc.branchId || 'no-branch'}`)
        }
        return match
      }
      return {
        ...t,
        filteredBranchesAvailableAt: t.branchesAvailableAt.filter(locFilter)
      }
    })

    let filteredDoctorsFinal = processedDoctors
    let filteredTreatmentsFinal = processedTreatments

    if (currentFilters.sortBy === "popular") {
      branches = branches.filter((b) => b.popular)
      filteredDoctorsFinal = filteredDoctorsFinal.filter((d) => d.popular)
      filteredTreatmentsFinal = filteredTreatmentsFinal.filter((t) => t.popular)
    }

    if (currentFilters.sortBy === "az" || currentFilters.sortBy === "all") {
      branches.sort((a, b) => (a.branchName ?? '').localeCompare(b.branchName ?? ''))
      filteredDoctorsFinal.sort((a, b) => (a.doctorName ?? '').localeCompare(b.doctorName ?? ''))
      filteredTreatmentsFinal.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
    }

    if (currentFilters.sortBy === "za") {
      branches.sort((a, b) => (b.branchName ?? '').localeCompare(a.branchName ?? ''))
      filteredDoctorsFinal.sort((a, b) => (b.doctorName ?? '').localeCompare(a.doctorName ?? ''))
      filteredTreatmentsFinal.sort((a, b) => (b.name ?? '').localeCompare(a.name ?? ''))
    }

    return { filteredBranches: branches, filteredDoctors: filteredDoctorsFinal, filteredTreatments: filteredTreatmentsFinal }
  }, [visibleHospitals, allExtendedDoctors, treatmentsForView, filters])

  const getUniqueOptions = useCallback((
    field: FilterKey,
    contextBranches: (BranchType & { hospitalName: string, hospitalLogo: string | null, hospitalId: string })[],
    contextDoctors: ExtendedDoctorType[],
    contextTreatments: ExtendedTreatmentType[],
  ) => {
    const map = new Map<string, string>()

    if (field === "city") {
      if (filters.view === 'hospitals') {
        contextBranches.forEach(b => {
          (b.city || []).forEach((item: any) => {
            const id = item._id
            const name = item.cityName
            if (id && name) map.set(id, name)
          })
        })
      } else if (filters.view === 'doctors') {
        contextDoctors.forEach(d => {
          (d.filteredLocations || d.locations).forEach(loc => {
            loc.cities.forEach(c => {
              const id = c._id
              const name = c.cityName
              if (id && name) map.set(id, name)
            })
          })
        })
      } else if (filters.view === 'treatments') {
        contextTreatments.forEach(t => {
          (t.filteredBranchesAvailableAt || t.branchesAvailableAt).forEach(loc => {
            loc.cities.forEach(c => {
              const id = c._id
              const name = c.cityName
              if (id && name) map.set(id, name)
            })
          })
        })
      }
    } else if (field === "state") {
      if (filters.view === 'hospitals') {
        contextBranches.forEach(b => {
          (b.city || []).forEach((item: any) => {
            const id = item.state
            const name = item.state
            if (id && name) map.set(id, name)
          })
        })
      } else if (filters.view === 'doctors') {
        contextDoctors.forEach(d => {
          (d.filteredLocations || d.locations).forEach(loc => {
            loc.cities.forEach(c => {
              const id = c.state
              const name = c.state
              if (id && name) map.set(id, name)
            })
          })
        })
      } else if (filters.view === 'treatments') {
        contextTreatments.forEach(t => {
          (t.filteredBranchesAvailableAt || t.branchesAvailableAt).forEach(loc => {
            loc.cities.forEach(c => {
              const id = c.state
              const name = c.state
              if (id && name) map.set(id, name)
            })
          })
        })
      }
    } else if (field === "branch") {
      contextBranches.forEach(b => b._id && b.branchName && map.set(b._id, b.branchName))
    } else if (field === "doctor") {
      contextDoctors.forEach(d => {
        if (d.baseId && d.doctorName) map.set(d.baseId, d.doctorName)
      })
    } else if (field === "treatment") {
      contextTreatments.forEach(t => {
        if (t._id && t.name) map.set(t._id, t.name)
      })
    } else if (field === "specialization") {
      contextDoctors.forEach(d => {
        const specs = Array.isArray(d.specialization) ? d.specialization : d.specialization ? [d.specialization] : []
        specs.forEach(spec => {
          const id = typeof spec === 'object' ? spec._id : spec
          const name = typeof spec === 'object' ? (spec.name || spec.title) : spec
          if (id && name) map.set(id, name)
        })
      })
    } else if (field === "department") {
      contextDoctors.forEach(d => {
        d.departments?.forEach(item => {
          const id = item._id
          const name = item.name || item.title
          if (id && name) map.set(id, name)
        })
      })
    } else if (field === "location") {
      const cityMap = new Map<string, string>()
      const stateMap = new Map<string, string>()

      const addCitiesAndStates = (cities: CityType[]) => {
        cities.forEach(c => {
          if (c._id && c.cityName) cityMap.set(c._id, c.cityName)
          if (c.state) stateMap.set(c.state, c.state)
        })
      }

      if (filters.view === 'hospitals') {
        contextBranches.forEach(b => addCitiesAndStates(b.city || []))
      } else if (filters.view === 'doctors') {
        contextDoctors.forEach(d => {
          (d.filteredLocations || d.locations).forEach(loc => addCitiesAndStates(loc.cities))
        })
      } else if (filters.view === 'treatments') {
        contextTreatments.forEach(t => {
          (t.filteredBranchesAvailableAt || t.branchesAvailableAt).forEach(loc => addCitiesAndStates(loc.cities))
        })
      }

      cityMap.forEach((name, id) => map.set(`city:${id}`, ` ${name}`))
      stateMap.forEach((name, id) => map.set(`state:${id}`, ` ${name}`))
    }

    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [filters.view])

  const availableOptions = useMemo(() => ({
    city: getUniqueOptions("city", filteredBranches, filteredDoctors, filteredTreatments),
    state: getUniqueOptions("state", filteredBranches, filteredDoctors, filteredTreatments),
    treatment: getUniqueOptions("treatment", filteredBranches, filteredDoctors, filteredTreatments),
    specialization: getUniqueOptions("specialization", filteredBranches, filteredDoctors, filteredTreatments),
    department: getUniqueOptions("department", filteredBranches, filteredDoctors, filteredTreatments),
    doctor: getUniqueOptions("doctor", filteredBranches, filteredDoctors, filteredTreatments),
    branch: getUniqueOptions("branch", filteredBranches, filteredDoctors, filteredTreatments),
    location: getUniqueOptions("location", filteredBranches, filteredDoctors, filteredTreatments),
  }), [getUniqueOptions, filteredBranches, filteredDoctors, filteredTreatments])

  const currentCount = useMemo(() => {
    if (filters.view === "hospitals") return filteredBranches.length
    if (filters.view === "doctors") return filteredDoctors.length
    return filteredTreatments.length
  }, [filters.view, filteredBranches, filteredDoctors, filteredTreatments])

  const getFilterValueDisplay = useCallback((filterKey: FilterKey, currentFilters: FilterState, currentAvailableOptions: typeof availableOptions): string | null => {
    const filter = currentFilters[filterKey]
    if (filter.id) {
      if (filterKey === 'location') {
        const opt = currentAvailableOptions.location.find(o => o.id === filter.id)
        return opt ? opt.name.replace(/^(City|State): /, '') : filter.id
      }
      return currentAvailableOptions[filterKey as keyof typeof currentAvailableOptions]?.find(o => o.id === filter.id)?.name || filter.id
    }
    if (filter.query) {
      return filter.query
    }
    return null
  }, [])

  useEffect(() => {
    const params: string[] = []
    if (filters.view !== "hospitals") params.push(`view=${filters.view}`)
    const activeKeys: FilterKey[] = getVisibleFiltersByView(filters.view);
    ['branch', 'city', 'state', 'specialization', 'treatment', 'doctor', 'department', 'location'].forEach(keyStr => {
      const key = keyStr as FilterKey
      if (activeKeys.includes(key) || filters[key].id || filters[key].query) {
        const display = getFilterValueDisplay(key, filters, availableOptions)
        if (display) {
          params.push(`${key}=${generateSlug(display)}`)
        }
      }
    })
    const newQueryString = params.length > 0 ? "?" + params.join("&") : ""
    const targetUrlPath = `/search${newQueryString}`
    const currentSearch = searchParams.toString()
    const currentUrl = pathname + (currentSearch ? `?${currentSearch}` : "")
    if (currentUrl !== targetUrlPath) {
      router.replace(targetUrlPath, { scroll: false })
    }
  }, [filters, availableOptions, getFilterValueDisplay, searchParams, pathname, router])

  useEffect(() => {
    if (loading || allHospitals.length === 0) return;

    const resolveToId = function<T>(key: FilterKey, allItems: T[], getId: (item: T) => string, getName: (item: T) => string) {
      const filter = filters[key];
      if (filter.query && !filter.id) {
        const exact = allItems.find(item => generateSlug(getName(item)) === filter.query);
        if (exact) {
          updateSubFilter(key, 'id', getId(exact));
          updateSubFilter(key, 'query', '');
        }
      }
    };

    // treatment
    resolveToId('treatment', treatmentsForView, t => t._id, t => t.name);

    // doctor
    resolveToId('doctor', allExtendedDoctors, d => d.baseId, d => d.doctorName);

    // branch
    const allBranchesFlat = visibleHospitals.flatMap(h => h.branches.map(b => ({ ...b, _id: b._id, name: b.branchName })));
    resolveToId('branch', allBranchesFlat, b => b._id, b => b.name);

    // city
    const allCitiesList = visibleHospitals.flatMap(h => h.branches.flatMap(b => b.city));
    const uniqueCities = Array.from(new Map(allCitiesList.map(c => [c._id, c])).values());
    resolveToId('city', uniqueCities, c => c._id, c => c.cityName);

    // state
    const allStatesList = visibleHospitals.flatMap(h => h.branches.flatMap(b => b.city.map(c => c.state).filter(Boolean)));
    const uniqueStates = Array.from(new Set(allStatesList)) as string[];
    resolveToId('state', uniqueStates, s => s, s => s);

    // specialization
    if (filters.specialization.query && !filters.specialization.id) {
      const allSpecs = allExtendedDoctors.flatMap(d => {
        const specs = Array.isArray(d.specialization) ? d.specialization : d.specialization ? [d.specialization] : []
        return specs.filter((s: any) => s?._id && (s.name || s.title))
      });
      const exactSpec = allSpecs.find((s: any) => generateSlug(s.name || s.title || '') === filters.specialization.query);
      if (exactSpec && typeof exactSpec === 'object' && exactSpec._id) {
        updateSubFilter('specialization', 'id', exactSpec._id);
        updateSubFilter('specialization', 'query', '');
      }
    }

    // department
    if (filters.department.query && !filters.department.id) {
      const allDepts = allExtendedDoctors.flatMap(d => d.departments || []);
      const uniqueDepts = Array.from(new Map(allDepts.map((d: DepartmentType) => [d._id, d])).values());
      const exactDept = uniqueDepts.find((d: DepartmentType) => generateSlug(d.name) === filters.department.query);
      if (exactDept) {
        updateSubFilter('department', 'id', exactDept._id);
        updateSubFilter('department', 'query', '');
      }
    }
  }, [loading, visibleHospitals, filters, updateSubFilter, treatmentsForView, allExtendedDoctors])

  return {
    loading,
    filters,
    updateFilter,
    updateSubFilter,
    clearFilters,
    availableOptions,
    filteredBranches,
    filteredDoctors,
    filteredTreatments,
    currentCount,
    getFilterValueDisplay,
  }
}