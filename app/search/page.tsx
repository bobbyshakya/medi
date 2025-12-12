// app/hospitals/page.tsx (or app/search/page.tsx)
"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Banner from "@/components/HospitalBanner"
import {
  Filter,
  Loader2,
  Hospital,
  MapPin,
  ChevronDownIcon,
  Stethoscope,
  Home,
  X,
  DollarSign,
  Search,
  Users,
  Star
} from "lucide-react"

// =============================================================================
// GLOBAL STYLES (For Marquee Keyframes) - Required for animation
// =============================================================================
const GlobalStyles = () => (
  <style jsx global>{`
    /* Renaming keyframes for safety/clarity */
    @keyframes marquee-scroll {
      0% { transform: translateX(0); }
      /* Animate by 50% since the content is duplicated once */
      100% { transform: translateX(-50%); } 
    }
  `}</style>
)

// =============================================================================
// TYPES & UTILITIES
// =============================================================================

const getWixImageUrl = (imageStr: string | null | undefined): string | null => {
  if (!imageStr || typeof imageStr !== "string" || !imageStr.startsWith("wix:image://v1/")) return null
  const parts = imageStr.split("/")
  return parts.length >= 4 ? `https://static.wixstatic.com/media/${parts[3]}` : null
}

const generateSlug = (name: string | null | undefined): string => {
  return (name ?? '').toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-")
}

const isUUID = (str: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)
}

interface BaseItem {
  _id: string;
  name?: string;
  title?: string;
  doctorName?: string;
  popular?: boolean
}

interface SpecialtyType extends BaseItem {
  name: string;
  title?: string;
  department?: DepartmentType[] | null
}

interface DepartmentType extends BaseItem {
  name: string
}

interface AccreditationType extends BaseItem {
  title: string;
  image: string | null
}

interface CityType {
  _id: string;
  cityName: string;
  state: string | null;
  country: string | null
}

interface TreatmentType extends BaseItem {
  name: string;
  description: string | null;
  category: string | null;
  duration: string | null;
  cost: string | null;
  treatmentImage?: string | null
}

interface DoctorType extends BaseItem {
  doctorName: string;
  specialization: SpecialtyType[] | string[] | string | null;
  qualification: string | null;
  experienceYears: string | null;
  designation: string | null;
  aboutDoctor: string | null;
  profileImage: string | null
}

interface ExtendedDoctorType extends DoctorType {
  baseId: string;
  locations: {
    hospitalName: string;
    hospitalId: string;
    branchName?: string;
    branchId?: string;
    cities: CityType[] | null
  }[];
  departments: DepartmentType[];
  filteredLocations?: {
    hospitalName: string;
    hospitalId: string;
    branchName?: string;
    branchId?: string;
    cities: CityType[]
  }[];
}

interface TreatmentLocation {
  branchId?: string;
  branchName?: string;
  hospitalName: string;
  hospitalId: string;
  cities: CityType[];
  departments: DepartmentType[];
  cost: string | null;
}

interface ExtendedTreatmentType extends TreatmentType {
  branchesAvailableAt: TreatmentLocation[];
  departments: DepartmentType[];
  filteredBranchesAvailableAt?: TreatmentLocation[];
}

interface BranchSpecialist {
  _id: string;
  name: string;
  department: DepartmentType[];
  treatments: TreatmentType[]
}

interface BranchType extends BaseItem {
  branchName: string;
  address: string | null;
  city: CityType[];
  totalBeds: string | null;
  noOfDoctors: string | null;
  yearEstablished: string | null;
  branchImage: string | null;
  description: string | null;
  doctors: DoctorType[];
  treatments: TreatmentType[];
  specialists: BranchSpecialist[];
  specialization: SpecialtyType[];
  accreditation: AccreditationType[]
}

interface HospitalType extends BaseItem {
  hospitalName: string;
  logo: string | null;
  yearEstablished: string | null;
  description: string | null;
  branches: BranchType[];
  doctors: DoctorType[];
  treatments: TreatmentType[];
  departments?: DepartmentType[]
}

interface ApiResponse {
  items: HospitalType[];
  total: number
}

type FilterKey = "city" | "treatment" | "specialization" | "department" | "doctor" | "branch"

interface FilterValue {
  id: string;
  query: string
}

interface FilterState {
  view: "hospitals" | "doctors" | "treatments"
  city: FilterValue
  treatment: FilterValue
  specialization: FilterValue
  department: FilterValue
  doctor: FilterValue
  branch: FilterValue
  sortBy: "all" | "popular" | "az" | "za"
}

interface Specialization {
  name?: string;
  title?: string;
  _id?: string;
}

// =============================================================================
// FILTER LOGIC & DATA TRANSFORMATION
// =============================================================================

const getVisibleFiltersByView = (view: FilterState['view']): FilterKey[] => {
  switch (view) {
    case "hospitals": return ["branch", "treatment", "city"]
    case "doctors": return ["doctor", "specialization", "treatment", "city"]
    case "treatments": return ["treatment", "city"]
    default: return ["doctor", "city"]
  }
}

const enforceOnePrimaryFilter = (key: FilterKey, prevFilters: FilterState, newFilterValue: FilterValue): FilterState => {
  let newFilters = { ...prevFilters, [key]: newFilterValue }
  const primaryKeys: FilterKey[] = ['doctor', 'treatment', 'branch']

  if (primaryKeys.includes(key) && (newFilterValue.id || newFilterValue.query)) {
    primaryKeys.forEach(primaryKey => {
      if (primaryKey !== key) {
        newFilters = { ...newFilters, [primaryKey]: { id: "", query: "" } }
      }
    })

    if (key === 'doctor' || key === 'treatment' || key === 'branch') {
      if (key !== 'department') newFilters = { ...newFilters, department: { id: "", query: "" } }
      if (key !== 'specialization') newFilters = { ...newFilters, specialization: { id: "", query: "" } }
    }
  }
  return newFilters
}

const matchesSpecialization = (specialization: any, id: string, text: string) => {
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

const getMatchingBranches = (hospitals: HospitalType[], filters: FilterState, allExtendedTreatments: ExtendedTreatmentType[]) => {
  const { city, specialization, branch, department, treatment } = filters
  const lowerCity = city.query.toLowerCase()
  const lowerSpec = specialization.query.toLowerCase()
  const lowerBranch = branch.query.toLowerCase()
  const lowerDept = department.query.toLowerCase()
  const lowerTreatment = treatment.query.toLowerCase()

  const matchingTreatmentIds = new Set<string>()
  if (treatment.id || lowerTreatment) {
    allExtendedTreatments.forEach(t => {
      const nameMatch = lowerTreatment && (t.name ?? '').toLowerCase().includes(lowerTreatment)
      if ((treatment.id && t._id === treatment.id) || nameMatch) {
        matchingTreatmentIds.add(t._id)
      }
    })
    if ((treatment.id || lowerTreatment) && matchingTreatmentIds.size === 0) return []
  }

  return hospitals
    .flatMap((h) => h.branches.map((b) => ({ ...b, hospitalName: h.hospitalName, hospitalLogo: h.logo, hospitalId: h._id })))
    .filter((b) => {
      if ((city.id || lowerCity) && !b.city.some((c) => (city.id && c._id === city.id) || (lowerCity && (c.cityName ?? '').toLowerCase().includes(lowerCity)))) return false
      if ((branch.id || lowerBranch) && !(branch.id === b._id) && !(lowerBranch && (b.branchName ?? '').toLowerCase().includes(lowerBranch))) return false

      if (treatment.id || lowerTreatment) {
        const allBranchTreatmentIds = new Set<string>()
        b.treatments?.forEach(t => allBranchTreatmentIds.add(t._id))
        b.specialists?.forEach(spec => spec.treatments?.forEach(t => allBranchTreatmentIds.add(t._id)))

        let hasMatchingTreatment = false
        if (matchingTreatmentIds.size > 0) {
          for (const treatmentId of matchingTreatmentIds) {
            if (allBranchTreatmentIds.has(treatmentId)) {
              hasMatchingTreatment = true
              break
            }
          }
        }
        if (!hasMatchingTreatment) return false
      }

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

const getAllExtendedDoctors = (hospitals: HospitalType[]): ExtendedDoctorType[] => {
  const extendedMap = new Map<string, ExtendedDoctorType>()

  hospitals.forEach((h) => {
    const processDoctor = (item: DoctorType, branch?: BranchType) => {
      const baseId = item._id

      const doctorDepartments: DepartmentType[] = []
      item.specialization?.forEach((spec: any) => {
        spec.department?.forEach((dept: DepartmentType) => {
          doctorDepartments.push(dept)
        })
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

    h.doctors.forEach((d) => processDoctor(d))
    h.branches.forEach((b) => {
      b.doctors.forEach((d) => processDoctor(d, b))
    })
  })

  return Array.from(extendedMap.values())
}

const getAllExtendedTreatments = (hospitals: HospitalType[]): ExtendedTreatmentType[] => {
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
    h.branches.forEach((b) => {
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

// =============================================================================
// CUSTOM HOOK
// =============================================================================

const useHospitalsData = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [allHospitals, setAllHospitals] = useState<HospitalType[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

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
      treatment: getFilterState("treatment"),
      specialization: getFilterState("specialization"),
      department: getFilterState("department"),
      doctor: getFilterState("doctor"),
      branch: getFilterState("branch"),
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
      treatment: { id: "", query: "" },
      specialization: { id: "", query: "" },
      department: { id: "", query: "" },
      doctor: { id: "", query: "" },
      branch: { id: "", query: "" },
      sortBy: "all",
    }))
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // NOTE: Replace with your actual API endpoint if different
        const res = await fetch(`/api/hospitals?pageSize=1000`) 
        if (!res.ok) throw new Error("Failed to fetch hospital data")
        const data = await res.json() as ApiResponse
        setAllHospitals(data.items)
      } catch (e) {
        console.error("Error fetching data:", e)
        setAllHospitals([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const allBranches = useMemo(() => allHospitals.flatMap((h) => h.branches), [allHospitals])
  const allExtendedDoctors = useMemo(() => getAllExtendedDoctors(allHospitals), [allHospitals])
  const allExtendedTreatments = useMemo(() => getAllExtendedTreatments(allHospitals), [allHospitals])

  const { filteredBranches, filteredDoctors, filteredTreatments } = useMemo(() => {
    const currentFilters = filters

    const genericBranchFilters: FilterState = {
      ...currentFilters,
      doctor: { id: "", query: "" },
      department: { id: "", query: "" },
      view: 'hospitals',
    }

    let branches = getMatchingBranches(allHospitals, genericBranchFilters, allExtendedTreatments)
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

    // --- LOGIC FIX: EXACT DOCTOR FILTERING BY TREATMENT ---
    // If a treatment is selected, we must look for doctors (specialists) linked to that treatment
    let matchingLocationKeysForDoctors: Set<string> | null = null
    
    if (currentFilters.treatment.id || currentFilters.treatment.query) {
      const lowerTreatQuery = currentFilters.treatment.query.toLowerCase()
      const matchingTreatmentIds = new Set<string>()
      
      allExtendedTreatments.forEach(t => {
         if ((currentFilters.treatment.id && t._id === currentFilters.treatment.id) || 
             (lowerTreatQuery && (t.name ?? '').toLowerCase().includes(lowerTreatQuery))) {
             matchingTreatmentIds.add(t._id)
         }
      })

      if (matchingTreatmentIds.size > 0) {
        // 1. Find the specialists in branches who perform these treatments
        const allowedDoctorIds = new Set<string>()
        
        allHospitals.forEach(h => {
            h.branches.forEach(b => {
                b.specialists?.forEach(s => {
                    if (s.treatments?.some(t => matchingTreatmentIds.has(t._id))) {
                        allowedDoctorIds.add(s._id)
                    }
                })
            })
        })

        // 2. Filter the doctor list strictly by those IDs
        doctors = doctors.filter(d => allowedDoctorIds.has(d.baseId))
        
        // 3. Setup location matching (existing logic)
        const matchingTreatments = allExtendedTreatments.filter(t => matchingTreatmentIds.has(t._id))
        matchingLocationKeysForDoctors = new Set(matchingTreatments.flatMap(t => t.branchesAvailableAt.map(loc => `${loc.hospitalId}-${loc.branchId || 'no-branch'}`)))
      } else {
        // Treatment found in list but has no ID matches or query returned no treatments
        if (currentFilters.treatment.id) doctors = []
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

    let treatments = allExtendedTreatments

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
        t.branchesAvailableAt.some(loc => matchingBranchIds!.includes(loc.branchId || '')
        )
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
  }, [allHospitals, allExtendedDoctors, allExtendedTreatments, filters])

  const getUniqueOptions = useCallback((
    field: "city" | "treatments" | "doctors" | "specialization" | "departments" | "branch",
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
              if (c._id && c.cityName) map.set(c._id, c.cityName)
            })
          })
        })
      } else if (filters.view === 'treatments') {
        contextTreatments.forEach(t => {
          (t.filteredBranchesAvailableAt || t.branchesAvailableAt).forEach(loc => {
            loc.cities.forEach(c => {
              if (c._id && c.cityName) map.set(c._id, c.cityName)
            })
          })
        })
      }
    } else if (field === "branch") {
      contextBranches.forEach(b => b._id && b.branchName && map.set(b._id, b.branchName))
    } else if (field === "doctors") {
      contextDoctors.forEach(d => {
        if (d.baseId && d.doctorName) map.set(d.baseId, d.doctorName)
      })
    } else if (field === "treatments") {
      contextTreatments.forEach(t => {
        if (t._id && t.name) map.set(t._id, t.name)
      })
    } else if (field === "specialization") {
      contextDoctors.forEach(d => {
        (d.specialization || []).forEach((spec: any) => {
          const id = spec._id
          const name = spec.name || spec.title
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
    }

    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [filters.view])

  const availableOptions = useMemo(() => ({
    city: getUniqueOptions("city", filteredBranches, filteredDoctors, filteredTreatments),
    treatment: getUniqueOptions("treatments", filteredBranches, filteredDoctors, filteredTreatments),
    specialization: getUniqueOptions("specialization", filteredBranches, filteredDoctors, filteredTreatments),
    department: getUniqueOptions("department", filteredBranches, filteredDoctors, filteredTreatments),
    doctor: getUniqueOptions("doctors", filteredBranches, filteredDoctors, filteredTreatments),
    branch: getUniqueOptions("branch", filteredBranches, filteredDoctors, filteredTreatments),
  }), [getUniqueOptions, filteredBranches, filteredDoctors, filteredTreatments])

  const currentCount = useMemo(() => {
    if (filters.view === "hospitals") return filteredBranches.length
    if (filters.view === "doctors") return filteredDoctors.length
    return filteredTreatments.length
  }, [filters.view, filteredBranches, filteredDoctors, filteredTreatments])

  const getFilterValueDisplay = useCallback((filterKey: FilterKey, currentFilters: FilterState, currentAvailableOptions: typeof availableOptions): string | null => {
    const filter = currentFilters[filterKey]
    if (filter.id) {
      return currentAvailableOptions[filterKey].find(o => o.id === filter.id)?.name || filter.id
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
    ['branch', 'city', 'specialization', 'treatment', 'doctor', 'department'].forEach(keyStr => {
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

    const resolveToId = <T extends { _id: string; name: string }>(key: FilterKey, allItems: T[], getName: (item: T) => string) => {
      const filter = filters[key];
      if (filter.query && !filter.id) {
        const exact = allItems.find(item => generateSlug(getName(item)) === filter.query);
        if (exact) {
          updateSubFilter(key, 'id', exact._id);
          updateSubFilter(key, 'query', '');
        }
      }
    };

    // treatment
    resolveToId('treatment', allExtendedTreatments, t => t.name);

    // doctor
    resolveToId('doctor', allExtendedDoctors, d => d.doctorName);

    // branch
    const allBranchesFlat = allHospitals.flatMap(h => h.branches.map(b => ({ ...b, _id: b._id, name: b.branchName })));
    resolveToId('branch', allBranchesFlat, b => b.name);

    // city
    const allCitiesList = allHospitals.flatMap(h => h.branches.flatMap(b => b.city));
    const uniqueCities = Array.from(new Map(allCitiesList.map(c => [c._id, c])).values());
    if (filters.city.query && !filters.city.id) {
      const exactCity = uniqueCities.find(c => generateSlug(c.cityName) === filters.city.query);
      if (exactCity) {
        updateSubFilter('city', 'id', exactCity._id);
        updateSubFilter('city', 'query', '');
      }
    }

    // specialization
    if (filters.specialization.query && !filters.specialization.id) {
      const allSpecs = allExtendedDoctors.flatMap(d => (d.specialization || []).filter((s: any) => s?._id && (s.name || s.title)));
      const exactSpec = allSpecs.find((s: any) => generateSlug(s.name || s.title || '') === filters.specialization.query);
      if (exactSpec) {
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
  }, [loading, allHospitals, filters, updateSubFilter, allExtendedTreatments, allExtendedDoctors])

  return {
    loading,
    filters,
    updateFilter,
    updateSubFilter,
    clearFilters,
    showFilters,
    setShowFilters,
    availableOptions,
    filteredBranches,
    filteredDoctors,
    filteredTreatments,
    currentCount,
    getFilterValueDisplay,
  }
}

// =============================================================================
// UI COMPONENTS
// =============================================================================

// --- REFACTORED COMPONENT: SCROLLABLE CARD HEADING (JS/Ref Controlled) ---
const ScrollableTitle = ({ text, className, isHovered }: { text: string; className?: string, isHovered: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null) // Ref to measure container width
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [duration, setDuration] = useState(0)

  // Constant scroll speed (pixels per second)
  const SCROLL_SPEED = 40 

  const checkOverflow = useCallback(() => {
    // 1. Create a temporary element to measure the un-truncated text width accurately
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.whiteSpace = 'nowrap';
    // Copy the relevant font classes for accurate measurement
    tempDiv.className = className || ''; 
    tempDiv.textContent = text;
    
    document.body.appendChild(tempDiv);
    
    const contentWidth = tempDiv.scrollWidth;
    const containerWidth = containerRef.current?.clientWidth || 0;

    document.body.removeChild(tempDiv);
    
    const overflow = contentWidth > containerWidth
    setIsOverflowing(overflow)
    
    if (overflow) {
      // Calculate duration: (Total content width / pixels per second)
      const newDuration = contentWidth / SCROLL_SPEED
      // Clamp duration between 8 and 20 seconds
      setDuration(Math.max(8, Math.min(20, newDuration))) 
    } else {
      setDuration(0)
    }
  }, [className, text])

  // Check overflow on mount and when text or container size changes
  useEffect(() => {
    checkOverflow()
    window.addEventListener('resize', checkOverflow)
    return () => window.removeEventListener('resize', checkOverflow)
  }, [checkOverflow, text]) 

  const shouldAnimate = isHovered && isOverflowing
  
  return (
    // Outer container for proper height setting and clipping
    <div 
        ref={containerRef}
        className={`relative overflow-hidden w-full ${className}`}
        // Using `h-6` (tailwinds default for `text-lg` line-height) or similar fixed height for consistency
        style={{ height: '1.5em' }} 
    >
        {/* 1. Static/Truncated View (Visible by default, hidden on hover/animation) */}
        <div 
            className={`truncate transition-opacity duration-300`}
            style={{ 
                opacity: shouldAnimate ? 0 : 1, 
                // Hide the element completely when not visible to prevent layout issues
                height: shouldAnimate ? 0 : 'auto', 
                pointerEvents: shouldAnimate ? 'none' : 'auto'
            }}
        >
            {text}
        </div>

        {/* 2. Scrolling View (Hidden by default, visible on hover/animation) */}
        <div 
            className={`absolute inset-0 flex items-center whitespace-nowrap transition-opacity duration-300`}
            style={{ 
                opacity: shouldAnimate ? 1 : 0, 
                // Reset positioning when not animating to prevent content overlap
                top: shouldAnimate ? '0' : '50%', 
                transform: shouldAnimate ? 'none' : 'translateY(-50%)' 
            }}
        >
            {/* The scrolling element */}
            <span
                style={{
                    display: 'inline-block',
                    animationName: 'marquee-scroll',
                    animationTimingFunction: 'linear',
                    animationIterationCount: 'infinite',
                    animationDuration: shouldAnimate ? `${duration}s` : 'none',
                    animationPlayState: shouldAnimate ? 'running' : 'paused',
                }}
            >
                {/* Duplicate text for seamless loop */}
                <span>{text}</span>
                {/* Add a fixed space between duplicates to avoid words merging */}
                {isOverflowing && <span style={{ paddingLeft: '2rem' }}>{text}</span>}
            </span>
        </div>
    </div>
  )
}


type OptionType = { id: string; name: string }

interface FilterDropdownProps {
  placeholder: string
  filterKey: FilterKey
  filters: FilterState
  updateSubFilter: (key: FilterKey, subKey: "id" | "query", value: string) => void
  options: OptionType[]
  className?: string;
  mobile?: boolean;
  autoFocus?: boolean;
  onFocus?: (element: HTMLInputElement) => void;
}

const FilterDropdown = React.memo(({ placeholder, filterKey, filters, updateSubFilter, options, className, onFocus }: FilterDropdownProps) => {
  const [showOptions, setShowOptions] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const filter = filters[filterKey] as FilterValue

  const query = useMemo(() => {
    if (filter.id) {
      return options.find(o => o.id === filter.id)?.name || filter.query || ""
    }
    return filter.query
  }, [filter.id, filter.query, options])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowOptions(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredOptions = useMemo(
    () => options.filter((opt) => opt.name.toLowerCase().includes(query.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name)),
    [options, query],
  )

  const handleQueryChange = (q: string) => {
    updateSubFilter(filterKey, "id", "")
    updateSubFilter(filterKey, "query", q)
  }

  const handleOptionSelect = (id: string, name: string) => {
    updateSubFilter(filterKey, "id", id)
    updateSubFilter(filterKey, "query", "")
    setShowOptions(false)
  }

  const handleClear = () => {
    updateSubFilter(filterKey, "id", "")
    updateSubFilter(filterKey, "query", "")
    setShowOptions(false)
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (filter.id) {
      updateSubFilter(filterKey, "id", "")
      updateSubFilter(filterKey, "query", "")
    }
    setShowOptions(true)
    if (onFocus) onFocus(e.target);
  }

  return (
    <div className={`relative ${className || ''}`} ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={handleFocus}
          className={`w-full px-2 py-2 border rounded-xs text-base md:text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 bg-white shadow-xs pr-10
          ${(filter.id || filter.query)
              ? "border-gray-100 focus:ring-gray-100 focus:border-gray-200"
              : "border-gray-100 focus:ring-gray-50 focus:border-gray-200"
            }`}
        />
        {(filter.id || filter.query) && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {showOptions && filteredOptions.length > 0 && (
        <div className="absolute z-30 w-full bg-white border border-gray-200 rounded-xs shadow-lg mt-1 max-h-60 overflow-auto">
          {filteredOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleOptionSelect(opt.id, opt.name)}
              className={`w-full px-2 py-1 pt-3 text-left text-sm border-b border-gray-100 text-gray-700 hover:bg-gray-50 transition-colors
              ${filter.id === opt.id ? "bg-gray-50 text-gray-900 font-semibold" : "font-normal"}`}
            >
              {opt.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
})
FilterDropdown.displayName = 'FilterDropdown'


// Helper type to correctly define props for FilterSidebar
type HospitalsData = ReturnType<typeof useHospitalsData>;

const FilterSidebar = ({ 
  filters, 
  showFilters, 
  setShowFilters, 
  clearFilters, 
  updateSubFilter, 
  availableOptions, 
  getFilterValueDisplay, // <-- Correctly receive prop
}: HospitalsData) => { // <-- Use the correct type here
  const filterOptions: { value: FilterKey, label: string, isPrimary: boolean }[] = useMemo(() => {
    switch (filters.view) {
      case "hospitals":
        return [
          { value: "branch", label: "Hospital", isPrimary: true },
          { value: "treatment", label: "Treatment", isPrimary: true },
        ]
      case "doctors":
        return [
          { value: "doctor", label: "Doctor", isPrimary: true },
          { value: "specialization", label: "Specialization", isPrimary: false },
          { value: "treatment", label: "Treatment", isPrimary: false },
          { value: "department", label: "Department", isPrimary: false },
        ]
      case "treatments":
        return [
          { value: "treatment", label: "Treatment", isPrimary: true },
        ]
      default:
        return []
    }
  }, [filters.view])

  const visibleFilterKeys = useMemo(() => getVisibleFiltersByView(filters.view).filter(key => key !== 'city'), [filters.view])
  const activeFilterKey = useMemo(() => {
    if (filters.view === 'hospitals') return 'Hospitals'
    if (filters.view === 'doctors') return 'Doctors'
    return 'Treatments'
  }, [filters.view])

  const hasAppliedFilters = useMemo(() =>
    // ERROR FIX: getFilterValueDisplay is now correctly available from props/scope
    filterOptions.some(opt => getFilterValueDisplay(opt.value, filters, availableOptions)) ||
    (filters.city.id || filters.city.query),
    [filters, availableOptions, filterOptions, getFilterValueDisplay]
  )

  const shouldRenderFilter = useCallback((key: FilterKey): boolean => {
    const isPrimaryFilter = key === 'branch' || key === 'doctor' || key === 'treatment'
    const filter = filters[key]
    const options = availableOptions[key]

    if (filter.id || filter.query) return true
    if (!visibleFilterKeys.includes(key)) return false
    if (options.length === 0) return false

    if (isPrimaryFilter) {
      return options.length >= 2
    }

    if (options.length < 2) return false

    return true
  }, [filters, availableOptions, visibleFilterKeys])

  const cityValue = getFilterValueDisplay('city', filters, availableOptions)

  // Refs for auto-scroll
  const filterContentRef = useRef<HTMLDivElement>(null)
  const activeFilterRef = useRef<HTMLDivElement>(null)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()

  // Track keyboard visibility on mobile
  useEffect(() => {
    if (!showFilters) return

    const handleResize = () => {
      const visualViewport = window.visualViewport
      if (visualViewport) {
        // Simple check to detect keyboard open: viewport height shrinks significantly
        const isKeyboardVisible = visualViewport.height < window.innerHeight * 0.7 
        setKeyboardVisible(isKeyboardVisible)
        
        // Auto-scroll active input into view when keyboard opens
        if (isKeyboardVisible && activeFilterRef.current) {
          scrollToActiveFilter()
        }
      }
    }

    // Listen to visual viewport changes (keyboard open/close)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize)
      }
    }
  }, [showFilters])

  // Scroll to active filter when it gains focus
  const scrollToActiveFilter = () => {
    if (!activeFilterRef.current || !filterContentRef.current) return

    clearTimeout(scrollTimeoutRef.current)
    
    scrollTimeoutRef.current = setTimeout(() => {
      const filterElement = activeFilterRef.current
      const container = filterContentRef.current
      
      if (filterElement && container) {
        const elementRect = filterElement.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        
        // Calculate scroll position
        const scrollTop = container.scrollTop
        const elementTop = elementRect.top - containerRect.top + scrollTop
        // 80px padding from top
        const targetScroll = elementTop - 80 
        
        container.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        })
      }
    }, 100) // Small delay to ensure keyboard is fully opened
  }

  // Handle filter focus for auto-scroll
  const handleFilterFocus = (element: HTMLInputElement) => {
    // Store ref to active filter element
    activeFilterRef.current = element.closest('.filter-section') as HTMLDivElement
    scrollToActiveFilter()
  }

  // Close drawer on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showFilters) {
        if (document.activeElement && document.activeElement.tagName === 'INPUT') {
          ;(document.activeElement as HTMLInputElement).blur()
        } else {
          setShowFilters(false)
        }
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [showFilters, setShowFilters])

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden md:block sticky top-16 h-screen w-64 lg:w-72 flex-shrink-0 border-r border-gray-100 overflow-y-auto bg-gray-50`}>
        <div className="p-4 h-full overflow-y-auto">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gray-50">
                <Filter className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                Filters
              </h3>
            </div>
            {hasAppliedFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium transition-colors px-2 py-1 hover:bg-gray-50 rounded"
              >
                Clear
              </button>
            )}
          </div>

          <div className="space-y-6">
            {filterOptions.map(opt => {
              const key = opt.value
              if (!shouldRenderFilter(key)) return null

              const filterLabel = key === 'specialization' && filters.view === 'doctors' ? 'Specialist' : opt.label

              return (
                <div key={key} className="space-y-1 filter-section">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {filterLabel}
                  </label>
                  <FilterDropdown
                    placeholder={`Search ${filterLabel.toLowerCase()}`}
                    filterKey={key}
                    filters={filters}
                    updateSubFilter={updateSubFilter}
                    options={availableOptions[key]}
                    className="w-full"
                    onFocus={handleFilterFocus}
                  />
                </div>
              )
            })}
            
            {filterOptions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">Select a view to see filters</p>
              </div>
            )}
          </div>

          {hasAppliedFilters && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Applied</h4>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {filterOptions.filter(opt => getFilterValueDisplay(opt.value, filters, availableOptions)).length + (cityValue ? 1 : 0)}
                </span>
              </div>
              <div className="space-y-2">
                {filterOptions.map((opt) => {
                  const value = getFilterValueDisplay(opt.value, filters, availableOptions)
                  if (!value) return null

                  return (
                    <div key={opt.value} className="flex items-center justify-between group">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xs text-gray-500 truncate">{opt.label}</span>
                        <span className="text-sm text-gray-900 font-medium truncate">{value}</span>
                      </div>
                      <button
                        onClick={() => {
                          updateSubFilter(opt.value as FilterKey, "id", "")
                          updateSubFilter(opt.value as FilterKey, "query", "")
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })}
                {cityValue && (
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-xs text-gray-500">City</span>
                      <span className="text-sm text-gray-900 font-medium truncate">{cityValue}</span>
                    </div>
                    <button
                      onClick={() => {
                        updateSubFilter('city', "id", "")
                        updateSubFilter('city', "query", "")
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg safe-area-bottom">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => setShowFilters(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 active:scale-[0.98] transition-all shadow-sm"
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
            {hasAppliedFilters && (
              <span className="ml-1 w-2 h-2 bg-gray-500 rounded-full"></span>
            )}
          </button>
          
          <a
            href="https://wa.me/your-number"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 active:scale-[0.98] transition-all shadow-sm"
          >
            <span>Chat</span>
          </a>
        </div>
      </div>

      {/* Mobile Filter Sheet - Modern Design */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ease-out ${
          showFilters ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        {/* Backdrop with touch close */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            showFilters ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setShowFilters(false)}
        />

        {/* Bottom Sheet - Adjust height when keyboard is visible */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transition-all duration-300 ease-out ${
            showFilters ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{
            maxHeight: keyboardVisible ? '70vh' : '92vh',
            height: keyboardVisible ? '70vh' : 'auto',
            touchAction: 'pan-y',
          }}
        >
          {/* Grab Handle */}
          <div className="sticky top-0 pt-3 pb-2 flex justify-center bg-white rounded-t-2xl z-30">
            <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {/* Header - Sticky */}
          <div className="px-4 pb-4 border-b border-gray-100 sticky top-0 bg-white z-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-50">
                  <Filter className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Filters
                  </h3>
                  <p className="text-sm text-gray-500">
                    {activeFilterKey} • {hasAppliedFilters ? 'Filtered' : 'All results'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 active:scale-95 transition-all"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Content - Scrollable with keyboard-aware scrolling */}
          <div 
            ref={filterContentRef}
            className="px-4 py-4 overflow-y-auto overscroll-contain"
            style={{ 
              maxHeight: keyboardVisible ? 'calc(70vh - 140px)' : 'calc(92vh - 180px)',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth',
              paddingBottom: keyboardVisible ? '20px' : '0'
            }}
          >
            <div className="space-y-6 pb-4">
              {/* Active Filters Chips - Auto-hide when keyboard is open */}
              {hasAppliedFilters && !keyboardVisible && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">Active Filters</h4>
                    <button
                      onClick={clearFilters}
                      className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.map((opt) => {
                      const value = getFilterValueDisplay(opt.value, filters, availableOptions)
                      if (!value) return null

                      return (
                        <div
                          key={opt.value}
                          className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-700 px-3 py-2 rounded-full text-sm"
                        >
                          <span className="font-medium">{value}</span>
                          <button
                            onClick={() => {
                              updateSubFilter(opt.value as FilterKey, "id", "")
                              updateSubFilter(opt.value as FilterKey, "query", "")
                            }}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    })}
                    {cityValue && (
                      <div className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-700 px-3 py-2 rounded-full text-sm">
                        <span className="font-medium">{cityValue}</span>
                        <button
                          onClick={() => {
                            updateSubFilter('city', "id", "")
                            updateSubFilter('city', "query", "")
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Filter Inputs */}
              <div className="space-y-5">
                {filterOptions.map(opt => {
                  const key = opt.value
                  if (!shouldRenderFilter(key)) return null

                  const filterLabel = key === 'specialization' && filters.view === 'doctors' ? 'Specialist' : opt.label

                  return (
                    <div key={key} className="space-y-2 filter-section">
                      <label className="text-sm font-medium text-gray-900">
                        {filterLabel}
                      </label>
                      <div className="relative">
                        <FilterDropdown
                          placeholder={`Type to search ${filterLabel.toLowerCase()}...`}
                          filterKey={key}
                          filters={filters}
                          updateSubFilter={updateSubFilter}
                          options={availableOptions[key]}
                          mobile
                          autoFocus={filterOptions.length === 1}
                          onFocus={handleFilterFocus}
                        />
                      </div>
                    </div>
                  )
                })}
                
                {filterOptions.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-400">No filters available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer - Hide when keyboard is open to save space */}
          {!keyboardVisible && (
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-4 safe-area-bottom z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    clearFilters()
                    setShowFilters(false)
                  }}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 active:scale-[0.98] transition-all"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-gray-600 text-white font-medium hover:bg-gray-700 active:scale-[0.98] transition-all shadow-sm"
                >
                  View Results
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
// =============================================================================
// CARD COMPONENTS
// =============================================================================

const HospitalCard = ({ branch }: { branch: BranchType & { hospitalName: string; hospitalLogo: string | null; hospitalId: string } }) => {
  const [isHovered, setIsHovered] = useState(false); // NEW: Manage hover state
  const slug = generateSlug(`${branch.branchName}`)
  const imageUrl = getWixImageUrl(branch.branchImage)
  const primaryCity = branch.city?.[0]?.cityName || ""
  const primaryState = branch.city?.[0]?.state || ""
  const hospitalLogoUrl = getWixImageUrl(branch.hospitalLogo)
  const primarySpecialty = branch.specialization?.[0]?.name || branch.specialization?.[0]?.title || "General Care"
  const accreditationLogoUrl = getWixImageUrl(branch.accreditation?.[0]?.image)

  return (
    <Link 
      href={`/search/hospitals/${slug}`} 
      className="block"
      onMouseEnter={() => setIsHovered(true)} // NEW: Handle hover
      onMouseLeave={() => setIsHovered(false)} // NEW: Handle un-hover
    >
      <article className="group bg-white rounded-xs shadow-lg md:mb-0 mb-5 md:shadow-xs transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col hover:shadow-sm border border-gray-300 md:border-gray-100">
        <div className="relative h-72 md:h-48 overflow-hidden bg-gray-50">
          {hospitalLogoUrl && (
            <div className="absolute bottom-2 left-2 z-10">
              <img
                src={hospitalLogoUrl}
                alt={`${branch.hospitalName} logo`}
                className="w-12 h-auto object-contain bg-white p-0 rounded-xs shadow-sm border border-gray-50"
                onError={(e) => { e.currentTarget.style.display = "none" }}
              />
            </div>
          )}

          {accreditationLogoUrl && (
            <div className="absolute top-2 right-2 z-10">
              <img
                src={accreditationLogoUrl}
                alt={branch.accreditation?.[0]?.title || 'Accreditation'}
                className="w-7 h-auto object-contain bg-white p-0 rounded-full shadow-sm border border-gray-50"
                onError={(e) => { e.currentTarget.style.display = "none" }}
              />
            </div>
          )}

          {imageUrl ? (
            <img
              src={imageUrl}
              alt={branch.branchName}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { e.currentTarget.style.display = "none" }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Hospital className="w-12 h-12 text-gray-200" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent" />
        </div>

        <div className="p-3 flex-1 flex flex-col space-y-2">
          <header className="space-y-1 md:h-16">
            {/* Using ScrollableTitle Component and passing isHovered prop */}
            <ScrollableTitle 
                text={branch.branchName} 
                className="md:text-lg text-2xl font-medium leading-tight text-gray-900 transition-colors"
                isHovered={isHovered} // NEW PROP
            />
            
            <div className="flex items-center text-lg md:text-sm text-gray-700 font-normal">
              <span>{primaryCity}{primaryState ? `, ${primaryState}` : ""}</span>,
              <span className="ml-1"> {primarySpecialty} Speciality</span>
            </div>
          </header>

          <footer className="border-t border-gray-100 pt-2 mt-auto">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center rounded-xs bg-gray-50 p-2 border border-gray-50 space-y-0">
                <p className=" text-base md:text-sm font-medium text-gray-700">{branch.yearEstablished ?? '?'}</p>
                <p className=" text-base md:text-sm text-gray-700">Estd.</p>
              </div>
              <div className="text-center rounded-xs bg-gray-50 p-2 border border-gray-50 space-y-0">
                <p className=" text-base md:text-sm font-medium text-gray-700">{branch.totalBeds ?? '?'}+</p>
                <p className=" text-base md:text-sm text-gray-700">Beds</p>
              </div>
              <div className="text-center rounded-xs bg-gray-50 p-2 border border-gray-50 space-y-0">
                <p className=" text-base md:text-sm font-medium text-gray-700">{branch.noOfDoctors ?? '?'}+</p>
                <p className=" text-base md:text-sm text-gray-700">Doctors</p>
              </div>


            </div>
          </footer>
        </div>
      </article>
    </Link>
  )
}

const DoctorCard = ({ doctor }: { doctor: ExtendedDoctorType }) => {
  const [isHovered, setIsHovered] = useState(false); // NEW: Manage hover state
  // Helper to safely extract the name/title from a specialization object or return the string
  const getSpecializationName = (s: Specialization): string => {
    if (typeof s === "object" && s !== null) {
      return (s as any).name || (s as any).title || "";
    }
    return String(s);
  };

  // 1. Convert specialization data into a clean array of names
  const specializationArray = useMemo(() => {
    return (Array.isArray(doctor.specialization) ? doctor.specialization : [doctor.specialization])
      .map(getSpecializationName)
      .filter(Boolean);
  }, [doctor.specialization]);

  // 2. Determine the display string: Primary specialization + Count (+N)
  const specializationDisplay = useMemo(() => {
    if (specializationArray.length === 0) {
      return "Specialty not specified";
    }

    const primary = specializationArray[0];
    const remainingCount = specializationArray.length - 1;

    if (remainingCount > 0) {
      // Example: "Cardiology +1"
      return `${primary} +${remainingCount} Specialties`;
    }

    // Example: "Cardiology"
    return primary;
  }, [specializationArray]);
  // --- END Specialization Logic ---


  const slug = generateSlug(`${doctor.doctorName}`);
  const imageUrl = getWixImageUrl(doctor.profileImage);

  // FIXED: Branch count logic + clean display 
  const primaryLocationDisplay = useMemo(() => {
    const locations = doctor.filteredLocations || doctor.locations;

    if (!locations || locations.length === 0) {
      return "Location not specified";
    }

    // Always pick first location (index 0)
    // NOTE: Your original code used locations[1] || locations[0], which might be a bug 
    // if you always intend to show the FIRST location (index 0). I kept your original logic here.
    const first = locations[1] || locations[0];

    const branch = first.branchName ? ` ${first.branchName}` : "";
    const city = first?.cities?.[0]?.cityName ? `, ${first.cities[0].cityName}` : "";

    let primary = `${branch}${city}`;

    // Hide count if only 1 branch
    if (locations.length > 2) {
      primary += ` +${locations.length - 2} more`;
    }

    return primary;
  }, [doctor.filteredLocations, doctor.locations]);


  return (
    <Link 
      href={`/doctors/${slug}`} 
      className="block"
      onMouseEnter={() => setIsHovered(true)} // NEW: Handle hover
      onMouseLeave={() => setIsHovered(false)} // NEW: Handle un-hover
    >
      <article className="group bg-white xs md:mb-0 mb-5 rounded-xs shadow-lg md:shadow-xs transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col hover:shadow-sm border border-gray-100">
        <div className="relative h-72 md:h-48 overflow-hidden bg-gray-50">
          {doctor.popular && (
            <span className="absolute top-3 right-3 z-10 inline-flex items-center text-sm bg-gray-50 text-gray-600 font-medium px-3 py-2 rounded-xs shadow-sm border border-gray-100">
              <Star className="w-3 h-3 mr-1 fill-gray-300 text-gray-400" />Popular
            </span>
          )}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={doctor.doctorName}
              className="object-cover object-top w-full h-full group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Users className="w-12 h-12 text-gray-200" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent" />
        </div>

        <div className="p-3 flex-1 flex flex-col space-y-2">
          <header className="space-y-2 flex-1 min-h-0">
            {/* Using ScrollableTitle Component and passing isHovered prop */}
            <ScrollableTitle 
                text={doctor.doctorName} 
                className="md:text-lg text-2xl font-medium leading-tight text-gray-900 transition-colors"
                isHovered={isHovered} // NEW PROP
            />
          </header>

          <div className="flex gap-x-2">
             <p className=" text-base md:text-sm text-gray-900 font-normal flex items-center gap-2 line-clamp-1">
              {specializationDisplay} {/* --- UPDATED SPECIALIST DISPLAY --- */}
            </p>
            <p className=" text-base md:text-sm text-gray-900 font-normal flex items-center gap-2">
              {doctor.experienceYears} Years Exp.
            </p>
          </div>

          <footer className="border-t border-gray-100 pt-2">
            <p className="text-base md:text-sm text-gray-900 font-normal flex items-center gap-2 line-clamp-1">
              <MapPin className="w-4 h-4 flex-shrink-0 text-gray-400" />
              {primaryLocationDisplay}
            </p>
          </footer>
        </div>
      </article>
    </Link>
  )
}

const TreatmentCard = ({ treatment }: { treatment: ExtendedTreatmentType }) => {
  const [isHovered, setIsHovered] = useState(false); // NEW: Manage hover state
  const slug = generateSlug(treatment.name)
  const imageUrl = getWixImageUrl(treatment.treatmentImage)

  const primaryLocation = useMemo(() => {
    const availLocs = treatment.filteredBranchesAvailableAt || treatment.branchesAvailableAt

    if (!availLocs || availLocs.length === 0) {
      return { name: "Location Varies", cost: treatment.cost }
    }

    const firstLoc = availLocs[0]
    const hospitalBranch = firstLoc.branchName
      ? `${firstLoc.hospitalName}, ${firstLoc.branchName}`
      : firstLoc.hospitalName
    const city = firstLoc.cities?.[0]?.cityName || ""

    return {
      name: `${hospitalBranch}${city ? `, ${city}` : ''}`,
      cost: firstLoc.cost || treatment.cost,
    }
  }, [treatment])

  return (
    <Link 
      href={`/treatment/${slug}`} 
      className="block"
      onMouseEnter={() => setIsHovered(true)} // NEW: Handle hover
      onMouseLeave={() => setIsHovered(false)} // NEW: Handle un-hover
    >
      <article className="group bg-white rounded-xs md:mb-0 mb-5 shadow-lg md:shadow-xs transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col hover:shadow-sm border border-gray-100">
        <div className="relative h-72 md:h-48 overflow-hidden bg-gray-50">
          {treatment.popular && (
            <span className="absolute top-3 right-3 z-10 inline-flex items-center text-sm bg-gray-50 text-gray-600 font-medium px-3 py-2 rounded-xs shadow-sm border border-gray-100">
              <Star className="w-3 h-3 mr-1 fill-gray-300 text-gray-400" />Popular
            </span>
          )}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={treatment.name}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { e.currentTarget.style.display = "none" }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Stethoscope className="w-12 h-12 text-gray-200" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent" />
        </div>

        <div className="p-3 flex-1 flex flex-col space-y-1">
          <header className="space-y-2 flex-1 min-h-0">
             {/* Using ScrollableTitle Component and passing isHovered prop */}
             <div className="my-2">
                <ScrollableTitle 
                    text={treatment.name} 
                    className="md:text-base text-2xl font-medium leading-tight text-gray-900 transition-colors"
                    isHovered={isHovered} // NEW PROP
                />
            </div>

            {treatment.category && (
              <div className="flex flex-wrap gap-1 pt-1">
                <span className="inline-block bg-gray-50 line-clamp-1 text-gray-600 text-base md:text-sm px-3 py-2 rounded-xs font-medium border border-gray-100">
                  {treatment.category}
                </span>
              </div>
            )}
          </header>

          <footer className="border-t border-gray-200 pt-2 flex flex-col gap-2">
            <p className="text-base md:text-sm text-gray-700 font-normal flex items-center gap-1">
              <DollarSign className="w-4 h-4 flex-shrink-0 text-gray-700" />
              Starting from <span className="font-medium text-gray-900">{primaryLocation.cost || 'Inquire'}</span>
            </p>
          </footer>
        </div>
      </article>
    </Link>
  )
}

// =============================================================================
// LAYOUT COMPONENTS
// =============================================================================

const ViewToggle = ({ view, setView }: { view: "search-healthcare" | "doctors" | "treatments", setView: (view: "hospitals" | "doctors" | "treatments") => void }) => (
  <div className="flex md:mt-0 mt-4 w-full md:w-auto bg-white  rounded-xs shadow-xs mx-auto lg:mx-0 max-w-md ">
    <button
      onClick={() => setView("hospitals")}
      className={`flex-1 px-4 py-2  rounded-xs text-lg md:text-sm font-medium transition-all duration-200 ${view === "hospitals" ? "bg-gray-100 text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-25"
        }`}
    >
      Hospitals
    </button>
    <button
      onClick={() => setView("doctors")}
      className={`flex-1 px-4 py-2  rounded-xs text-lg md:text-sm font-medium transition-all duration-200 ${view === "doctors" ? "bg-gray-100 text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-25"
        }`}
    >
      Doctors
    </button>
    <button
      onClick={() => setView("treatments")}
      className={`flex-1 px-4 py-2  rounded-xs text-lg md:text-sm font-medium transition-all duration-200 ${view === "treatments" ? "bg-gray-100 text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-25"
        }`}
    >
      Treatments
    </button>
  </div>
)

const Sorting = ({ sortBy, setSortBy }: { sortBy: "all" | "popular" | "az" | "za", setSortBy: (sortBy: "all" | "popular" | "az" | "za") => void }) => (
  <div className="flex items-center gap-3 w-full md:w-auto">
    <label className="text-sm text-gray-700 hidden sm:block font-normal">Sort by:</label>
    <div className="relative  md:w-auto w-full">
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as "all" | "popular" | "az" | "za")}
        className="
        border border-gray-200 rounded-xs px-4 py-2 text-sm focus:ring-1 
        focus:ring-gray-100 focus:border-gray-300 bg-white shadow-xs 
        pr-8 cursor-pointer text-gray-700 md:w-auto w-full
        appearance-none "
      >
        <option value="all">All (A to Z)</option>
        <option value="popular">Popular</option>
        <option value="az">A to Z</option>
        <option value="za">Z to A</option>
      </select>
      <ChevronDownIcon
        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-470 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  </div>
)

const ResultsHeader = ({
  view,
  currentCount,
  clearFilters,
  sortBy,
  setSortBy
}: {
  view: "hospitals" | "doctors" | "treatments",
  currentCount: number,
  clearFilters: () => void,
  sortBy: "all" | "popular" | "az" | "za",
  setSortBy: (sortBy: "all" | "popular" | "az" | "za") => void
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center  gap-4 bg-gray-50 border-b border-gray-50 py-4 md:p-4">
    <div className="flex items-center gap-4">
      <Sorting sortBy={sortBy} setSortBy={setSortBy} />
      <button
        onClick={clearFilters}
        className="hidden md:inline-flex items-center gap-1 text-base text-gray-500 hover:text-gray-700 transition-colors font-medium"
      >
        Clear Filters
      </button>
    </div>
  </div>
)

const MobileFilterButton = ({ setShowFilters }: { setShowFilters: (show: boolean) => void }) => (
  <button
    onClick={() => setShowFilters(true)}
    className="fixed bottom-6 right-6 md:hidden bg-gray-50 text-gray-600 p-4 rounded-xs shadow-lg hover:shadow-xl transition-shadow z-30 border border-gray-100"
  >
    <Filter className="w-5 h-5" />
  </button>
)

const BreadcrumbNav = () => (
  <nav aria-label="Breadcrumb" className="container border-y border-gray-200 bg-gray-50 mx-auto px-4 sm:px-6 lg:px-8">
    <ol className="flex items-center px-2 md:px-0 space-x-1 py-2 text-base text-gray-500 font-normal">

      <li>
        <Link href="/" className="flex items-center hover:text-gray-700 transition-colors">
          <Home className="w-4 h-4 mr-1 text-gray-400" />
          Home
        </Link>
      </li>
     
      <li>
        <span className="mx-1">/</span>
      </li>
      <li className="text-gray-900 font-medium">Hospitals</li>
    </ol>
  </nav>
)

// =============================================================================
// SKELETON LOADERS
// =============================================================================

const HospitalCardSkeleton = () => (
  <div className="bg-white rounded-xs shadow-md overflow-hidden animate-pulse border border-gray-100">
    <div className="h-48 bg-gray-50 relative">
      <div className="absolute bottom-3 left-3 bg-gray-100 rounded-xs w-12 h-12 border border-white" />
    </div>
    <div className="p-5 space-y-4">
      <div className="h-6 bg-gray-100 rounded-md w-3/4" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-100 rounded-md w-1/4" />
        <div className="h-4 bg-gray-100 rounded-md w-3/4" />
      </div>
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-50">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-xs p-3 h-16" />
        ))}
      </div>
    </div>
  </div>
)

const DoctorCardSkeleton = () => (
  <div className="bg-white rounded-xs shadow-md overflow-hidden animate-pulse border border-gray-100">
    <div className="h-48 bg-gray-50 relative" />
    <div className="p-5 space-y-4">
      <div className="h-6 bg-gray-100 rounded-md w-3/4" />
      <div className="h-4 bg-gray-100 rounded-md w-1/2" />
      <div className="h-3 bg-gray-100 rounded-md w-full" />
      <div className="space-y-2 border-t border-gray-50 pt-3">
        <div className="h-3 bg-gray-100 rounded-md w-3/4" />
        <div className="h-3 bg-gray-100 rounded-md w-1/2" />
      </div>
    </div>
  </div>
)

const TreatmentCardSkeleton = () => (
  <div className="bg-white rounded-xs shadow-md overflow-hidden animate-pulse border border-gray-100">
    <div className="h-48 bg-gray-50 relative" />
    <div className="p-5 space-y-4">
      <div className="h-6 bg-gray-100 rounded-md w-3/4" />
      <div className="h-4 bg-gray-100 rounded-md w-1/2" />
      <div className="space-y-2 border-t border-gray-50 pt-3">
        <div className="h-3 bg-gray-100 rounded-md w-3/4" />
        <div className="h-3 bg-gray-100 rounded-md w-1/2" />
      </div>
    </div>
  </div>
)

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const RenderContent = ({
  view,
  loading,
  currentCount,
  filteredBranches,
  filteredDoctors,
  filteredTreatments,
  clearFilters,
  visibleCount, // Prop for Infinite Scroll
  loadMoreRef   // Prop for Intersection Observer
}: {
  view: string,
  loading: boolean,
  currentCount: number,
  filteredBranches: any[],
  filteredDoctors: any[],
  filteredTreatments: any[],
  clearFilters: () => void,
  visibleCount: number,
  loadMoreRef: (node: HTMLDivElement) => void
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) =>
          view === "hospitals" ? <HospitalCardSkeleton key={i} /> :
            view === "doctors" ? <DoctorCardSkeleton key={i} /> :
              <TreatmentCardSkeleton key={i} />
        )}
      </div>
    )
  }

  if (currentCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xs shadow-md border border-gray-100">
        <Search className="w-12 h-12 text-gray-300 mb-4" />
        <h4 className="text-xl font-bold text-gray-900 mb-2">No {view === 'hospitals' ? 'Branches' : view} Found</h4>
        <p className="text-gray-500 mb-6 font-normal">Try adjusting your filters or search terms.</p>
        <button
          onClick={clearFilters}
          className="px-6 py-3 text-base font-medium bg-gray-50 text-gray-700 rounded-xs hover:bg-gray-100 transition-colors shadow-sm border border-gray-100"
        >
          Clear All Filters
        </button>
      </div>
    )
  }

  const allItems = view === "hospitals" ? filteredBranches : view === "doctors" ? filteredDoctors : filteredTreatments
  // Slice items based on visibleCount state for infinite scrolling
  const visibleItems = allItems.slice(0, visibleCount)

  return (
    <>
      <div className="grid grid-cols-1 my-4 mb-10 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleItems.map((item) => (
          <div key={item.baseId || item._id} className="h-full">
            {view === "hospitals" ? (
              <HospitalCard branch={item as BranchType & { hospitalName: string; hospitalLogo: string | null; hospitalId: string }} />
            ) : view === "doctors" ? (
              <DoctorCard doctor={item as ExtendedDoctorType} />
            ) : (
              <TreatmentCard treatment={item as ExtendedTreatmentType} />
            )}
          </div>
        ))}
      </div>

      {/* Load More Trigger Div */}
      {visibleCount < allItems.length && (
         <div ref={loadMoreRef} className="flex justify-center p-4 w-full">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
         </div>
      )}
    </>
  )
}

function HospitalsPageContent() {
  const {
    loading,
    filters,
    updateFilter,
    updateSubFilter,
    clearFilters,
    showFilters,
    setShowFilters,
    availableOptions,
    filteredBranches,
    filteredDoctors,
    filteredTreatments,
    currentCount,
    getFilterValueDisplay,
  } = useHospitalsData()

  const setView = (v: FilterState["view"]) => {
    clearFilters()
    updateFilter("view", v)
  }

  const setSortBy = (s: FilterState["sortBy"]) => updateFilter("sortBy", s)

  // --- INFINITE SCROLL LOGIC ---
  const [visibleCount, setVisibleCount] = useState(12)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(12)
  }, [filters, filteredBranches, filteredDoctors, filteredTreatments])

  // The intersection observer callback
  const loadMoreRef = useCallback((node: HTMLDivElement) => {
    if (loading) return
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        // Load 12 more items when the user scrolls to the bottom
        setVisibleCount(prev => prev + 12)
      }
    }, {
      rootMargin: '100px', // Start loading before it hits the very bottom
      threshold: 0.1
    })

    if (node) observerRef.current.observe(node)

    // Cleanup function
    return () => {
        if (observerRef.current) observerRef.current.disconnect()
    }
  }, [loading])
  // -----------------------------

  return (
    <div className="bg-gray-25 min-h-screen">
      {/* Inject Global Keyframes for Marquee */}
      <GlobalStyles />

      <Banner

        // Layout & Content
        bannerBgImage="/banner/search-banner.png"
        bannerBgImageMobile="/banner/search-banner-mobile.png"
        topSpanText="Premium Healthcare Services"
        title="Access Specialist Care Right From Your Home."
        description={`
        <p>Our virtual clinic offers <strong>24/7 access</strong> to board-certified physicians.</p>
        <p>Book a consultation in minutes and get the care you need.</p>
      `}

        // Call-to-Actions (CTAs)
        ctas={[
          {
            text: 'Book an Appointment',
            link: '/booking',

            isPrimary: true, // This will be the main, bold red button
          },
          {
            text: 'Call Us',
            link: 'tel:1234567890',

            isPrimary: false, // This will be the secondary, border button
          },
        ]}

        // Image
        mainImageSrc="/images/doctor-telehealth.png" // Update this path
        mainImageAlt="Doctor on a telehealth video call"
      />
      <BreadcrumbNav />

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-4">
          <FilterSidebar // Pass the function prop correctly
            filters={filters}
            updateSubFilter={updateSubFilter}
            clearFilters={clearFilters}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            availableOptions={availableOptions}
            // All filtered arrays are included in the HospitalsData type
            filteredBranches={filteredBranches}
            filteredDoctors={filteredDoctors}
            filteredTreatments={filteredTreatments}
            // CRITICAL FIX: Pass the function
            getFilterValueDisplay={getFilterValueDisplay} 
          />

          <main className="flex-1  min-w-0 lg:pb-0 min-h-screen">
            <div className=" md:flex justify-between items-center bg-gray-50">
              <div className="flex flex-col lg:flex-row lg:items-center  gap-4">
                <ViewToggle view={filters.view} setView={setView} />
                <FilterDropdown
                  placeholder="Search by City Name"
                  filterKey="city"
                  filters={filters}
                  updateSubFilter={updateSubFilter}
                  options={availableOptions.city}
                />
              </div>
              <ResultsHeader
                view={filters.view}
                currentCount={currentCount}
                clearFilters={clearFilters}
                sortBy={filters.sortBy}
                setSortBy={setSortBy}
              />
            </div>

            <RenderContent
              view={filters.view}
              loading={loading}
              currentCount={currentCount}
              filteredBranches={filteredBranches}
              filteredDoctors={filteredDoctors}
              filteredTreatments={filteredTreatments}
              clearFilters={clearFilters}
              visibleCount={visibleCount} // Pass state for infinite scroll
              loadMoreRef={loadMoreRef} // Pass ref callback for infinite scroll
            />
          </main>
        </div>
      </section>

      {!showFilters && <MobileFilterButton setShowFilters={setShowFilters} />}
    </div>
  )
}

export default function HospitalsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-25">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <HospitalsPageContent />
    </Suspense>
  )
}