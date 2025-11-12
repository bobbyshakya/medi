// app/hospitals/page.tsx
// Refactored for modern, contextual, and user-friendly filtering based on the selected view (Branches, Doctors, Treatments).
// Implements 'one primary filter' rule and dynamic input field visibility.
// UPDATED: Strict minimal card data, hospital/qualification removed from DoctorCard, location removed from TreatmentCard, single light gray/white color theme, and improved padding/margin.
// UPDATED: Sticky filter sidebar on desktop (md:sticky md:top-0 md:h-screen), treatment name clamped to 2 lines with uniform card heights via flex layout and line-clamp-2.
// UPDATED: Improved TreatmentCard alignment with flex-1 on header (min-h-0 for overflow handling), line-clamp-2 on name for fixed text height, and footer pushed to bottom without flex-1/mt-auto conflict for uniform card heights and content alignment across all cards.
// MODIFIED: All rounded shapes are set to 'rounded-xs' for consistency as requested.
// MODIFIED: Dynamic filter options logic implemented: Filter options now update in real-time based on the current view/filters, and input fields are hidden if the number of available options is < 2 (or based on primary filter data availability).
// NEW: Added accreditation logo display to the HospitalCard.
// NEW: All data is now sorted A to Z by default when 'Sort by: All' is selected.
// UPDATED: Filter configuration based on user request:
// - Doctors View: Filters are [Doctor, Specialization, Treatment, City]. Removed [Department].
// - Treatments View: Filters are [Treatment, City]. Removed [Department].
// FIX: Doctor duplication across branches/hospitals is fixed. City filter is re-added to Doctors and Treatments views.
"use client"
import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import Banner from "@/components/BannerService"
import { Filter, Loader2, Hospital, Building2, Award, MapPin, Stethoscope, Home, X, DollarSign, Search, Users, Star } from "lucide-react"
// --- 1. Type Definitions & Utility Functions ---
// Utility functions
const getWixImageUrl = (imageStr: string | null | undefined): string | null => {
  if (!imageStr || typeof imageStr !== "string" || !imageStr.startsWith("wix:image://v1/")) return null
  const parts = imageStr.split("/")
  return parts.length >= 4 ? `https://static.wixstatic.com/media/${parts[3]}` : null
}
const generateSlug = (name: string | null | undefined): string => {
  // FIX: Corrected regex syntax from /\s+/g/g, "-" to /\s+/g, "-"
  return (name ?? '').toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-")
}
const isUUID = (str: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)
}
// Data Interfaces (Omitted for brevity, assumed from context)
interface BaseItem { _id: string; name?: string; title?: string; doctorName?: string; popular?: boolean }
interface SpecialtyType extends BaseItem { name: string; title?: string; department?: DepartmentType[] } // Added department here
interface DepartmentType extends BaseItem { name: string }
interface AccreditationType extends BaseItem { title: string; image: string | null }
interface CityType { _id: string; cityName: string; state: string | null; country: string | null }
interface TreatmentType extends BaseItem { name: string; description: string | null; category: string | null; duration: string | null; cost: string | null; treatmentImage?: string | null }
interface DoctorType extends BaseItem { doctorName: string; specialization: SpecialtyType[] | string[] | string | null; qualification: string | null; experienceYears: string | null; designation: string | null; aboutDoctor: string | null; profileImage: string | null }

// FIX: Doctor type simplified to be unique by _id, and locations are aggregated.
interface ExtendedDoctorType extends DoctorType { 
    baseId: string; // The original _id from the CMS
    locations: { hospitalName: string; hospitalId: string; branchName?: string; branchId?: string; cities: CityType[] }[];
    departments: DepartmentType[];
    filteredLocations?: { hospitalName: string; hospitalId: string; branchName?: string; branchId?: string; cities: CityType[] }[];
}

interface TreatmentLocation {
    branchId?: string;
    branchName?: string;
    hospitalName: string;
    hospitalId: string;
    cities: CityType[]; // Add city info for filtering
    departments: DepartmentType[];
    cost: string | null;
}
interface ExtendedTreatmentType extends TreatmentType {
    branchesAvailableAt: TreatmentLocation[];
    departments: DepartmentType[];
    filteredBranchesAvailableAt?: TreatmentLocation[];
}
interface BranchSpecialist { _id: string; name: string; department: DepartmentType[]; treatments: TreatmentType[] }
interface BranchType extends BaseItem { branchName: string; address: string | null; city: CityType[]; totalBeds: string | null; noOfDoctors: string | null; yearEstablished: string | null; branchImage: string | null; description: string | null; doctors: DoctorType[]; treatments: TreatmentType[]; specialists: BranchSpecialist[]; specialization: SpecialtyType[]; accreditation: AccreditationType[] }
interface HospitalType extends BaseItem { hospitalName: string; logo: string | null; yearEstablished: string | null; description: string | null; branches: BranchType[]; doctors: DoctorType[]; treatments: TreatmentType[]; departments?: DepartmentType[] }
interface ApiResponse { items: HospitalType[]; total: number }
type FilterKey = "city" | "treatment" | "specialization" | "department" | "doctor" | "branch"
interface FilterValue { id: string; query: string }
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
// Expert Filter Logic
const getVisibleFiltersByView = (view: FilterState['view']): FilterKey[] => {
    if (view === "hospitals") {
        return ["branch", "treatment", "city"];
    }
    if (view === "doctors") {
        // UPDATED: City filter re-added. Department is still removed.
        return ["doctor", "specialization", "treatment", "city"];
    }
    if (view === "treatments") {
        // UPDATED: City filter re-added.
        return ["treatment", "city"];
    }
    return ["doctor", "city"];
}
const enforceOnePrimaryFilter = (key: FilterKey, prevFilters: FilterState, newFilterValue: FilterValue): FilterState => {
    let newFilters = { ...prevFilters, [key]: newFilterValue };
    const primaryKeys: FilterKey[] = ['doctor', 'treatment', 'branch'];
   
    if (primaryKeys.includes(key) && (newFilterValue.id || newFilterValue.query)) {
        primaryKeys.forEach(primaryKey => {
            if (primaryKey !== key) {
                newFilters = { ...newFilters, [primaryKey]: { id: "", query: "" } };
            }
        });
        
        // Also clear secondary filters specific to other views when a primary one is selected
        if (key === 'doctor' || key === 'treatment' || key === 'branch') {
            if (key !== 'department') newFilters = { ...newFilters, department: { id: "", query: "" } };
            if (key !== 'specialization') newFilters = { ...newFilters, specialization: { id: "", query: "" } };
        }
    }
    return newFilters;
}
// --- 2. Complex Filtering and Data Transformation Logic (Functional Logic Updated) ---
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
  const lowerCity = city.query.toLowerCase(), lowerSpec = specialization.query.toLowerCase()
  const lowerBranch = branch.query.toLowerCase(), lowerDept = department.query.toLowerCase()
  const lowerTreatment = treatment.query.toLowerCase()

  // Pre-filter treatments if a treatment filter is applied
  const matchingTreatmentIds = new Set<string>();
  if (treatment.id || lowerTreatment) {
    allExtendedTreatments.forEach(t => {
      const nameMatch = lowerTreatment && (t.name ?? '').toLowerCase().includes(lowerTreatment)
      if ((treatment.id && t._id === treatment.id) || nameMatch) {
        matchingTreatmentIds.add(t._id);
      }
    });
    if ((treatment.id || lowerTreatment) && matchingTreatmentIds.size === 0) return [];
  }

  return hospitals
    .flatMap((h) => h.branches.map((b) => ({ ...b, hospitalName: h.hospitalName, hospitalLogo: h.logo, hospitalId: h._id })))
    .filter((b) => {
      // NOTE: City filter still applies here to create the initial branch pool for ALL views
      if ((city.id || lowerCity) && !b.city.some((c) => (city.id && c._id === city.id) || (lowerCity && (c.cityName ?? '').toLowerCase().includes(lowerCity)))) return false
      if ((branch.id || lowerBranch) && !(branch.id === b._id) && !(lowerBranch && (b.branchName ?? '').toLowerCase().includes(lowerBranch))) return false
      
      // Treatment Filter Logic for Branches
      if (treatment.id || lowerTreatment) {
          const allBranchTreatmentIds = new Set<string>();
          b.treatments?.forEach(t => allBranchTreatmentIds.add(t._id));
          b.specialists?.forEach(spec => spec.treatments?.forEach(t => allBranchTreatmentIds.add(t._id)));
          
          let hasMatchingTreatment = false;
          if (matchingTreatmentIds.size > 0) {
              for (const treatmentId of matchingTreatmentIds) {
                  if (allBranchTreatmentIds.has(treatmentId)) {
                      hasMatchingTreatment = true;
                      break;
                  }
              }
          }
          if (!hasMatchingTreatment) return false;
      }
      
      // Department Filter Logic (Currently only used in Doctors view, but kept here for robustness)
      const allDepartments = (b.specialists || []).flatMap(spec => spec.department || [])
      if ((department.id || lowerDept) && !allDepartments.some((d) => (department.id && d._id === department.id) || (lowerDept && (d.name ?? '').toLowerCase().includes(lowerDept)))) return false
      
      // Specialization Filter Logic
      if (specialization.id || lowerSpec) {
        const hasSpec = b.specialization?.some((s) => (specialization.id && s._id === specialization.id) || (lowerSpec && ((s.name ?? '').toLowerCase().includes(lowerSpec) || (s.title ?? '').toLowerCase().includes(lowerSpec))))
            || b.doctors?.some(d => matchesSpecialization(d.specialization, specialization.id, lowerSpec))
        if (!hasSpec) return false
      }
      
      return true
    })
}

/**
 * FIX: Updated to correctly deduplicate doctors by their base _id and aggregate their locations.
 * This ensures the same doctor is listed only once, regardless of how many branches they are linked to.
 */
const getAllExtendedDoctors = (hospitals: HospitalType[]): ExtendedDoctorType[] => {
  const extendedMap = new Map<string, ExtendedDoctorType>() // Key is the base doctor ID (_id)

  hospitals.forEach((h) => {
    // Helper to process a doctor, whether from hospital level or branch level
    const processDoctor = (item: DoctorType, branch?: BranchType) => {
      const baseId = item._id; // Use the original CMS _id as the unique key
      
      // Aggregate department info from specialization
      const doctorDepartments: DepartmentType[] = [];
      item.specialization?.forEach((spec: any) => {
          spec.department?.forEach((dept: DepartmentType) => {
              doctorDepartments.push(dept);
          });
      });
      const uniqueDepartments = Array.from(new Map(doctorDepartments.map(dept => [dept._id, dept])).values());

      // Prepare location data
      const location = {
          hospitalName: h.hospitalName,
          hospitalId: h._id,
          branchName: branch?.branchName,
          branchId: branch?._id,
          cities: branch?.city || [], // Use branch city if available
      };

      if (extendedMap.has(baseId)) {
        // Doctor already exists, just add the new location and merge departments
        const existingDoctor = extendedMap.get(baseId)!;
        
        // Prevent duplicate locations (e.g., if a hospital doctor is also listed under their branch)
        const isLocationDuplicate = existingDoctor.locations.some(
            loc => loc.hospitalId === h._id && (loc.branchId === branch?._id || (!loc.branchId && !branch?._id))
        );

        if (!isLocationDuplicate) {
            existingDoctor.locations.push(location);
        }
        
        // Merge departments
        const allDepts = [...existingDoctor.departments, ...uniqueDepartments];
        existingDoctor.departments = Array.from(new Map(allDepts.map(dept => [dept._id, dept])).values());

      } else {
        // First time seeing this doctor, create the entry
        extendedMap.set(baseId, {
          ...item,
          baseId: baseId,
          locations: [location],
          departments: uniqueDepartments,
        } as ExtendedDoctorType);
      }
    };
    
    // 1. Process doctors listed at the Hospital level (no specific branch link)
    h.doctors.forEach((d) => processDoctor(d));

    // 2. Process doctors listed under each Branch
    h.branches.forEach((b) => {
        b.doctors.forEach((d) => processDoctor(d, b));
    });
  });

  return Array.from(extendedMap.values());
}

// FIX: Treatment duplication logic (Functionally unchanged, but City added to TreatmentLocation)
const getAllExtendedTreatments = (hospitals: HospitalType[]): ExtendedTreatmentType[] => {
  const extended = new Map<string, ExtendedTreatmentType>()
  hospitals.forEach((h) => {
    const processTreatment = (item: TreatmentType, branch?: BranchType, departments: DepartmentType[] = []) => {
      const baseId = item._id;
      if (!extended.has(baseId)) {
        extended.set(baseId, {
          ...item,
          cost: item.cost ?? 'Price Varies',
          branchesAvailableAt: [],
          departments: [],
        } as ExtendedTreatmentType);
      }
      const existingTreatment = extended.get(baseId)!;
      const location: TreatmentLocation = {
        branchId: branch?._id,
        branchName: branch?.branchName,
        hospitalName: h.hospitalName,
        hospitalId: h._id,
        cities: branch?.city || [], // ADDED City Info
        departments: Array.from(new Map(departments.map(dept => [dept._id, dept])).values()),
        cost: item.cost,
      }
     
      const isLocationDuplicate = existingTreatment.branchesAvailableAt.some(
        loc => loc.hospitalId === h._id && (loc.branchId === branch?._id || (!loc.branchId && !branch?._id))
      );
     
      if (!isLocationDuplicate) {
        existingTreatment.branchesAvailableAt.push(location);
       
        const allDepts = [...existingTreatment.departments, ...departments];
        existingTreatment.departments = Array.from(new Map(allDepts.map(dept => [dept._id, dept])).values());
      }
    };
    // Hospital level treatments
    h.treatments?.forEach((item) => processTreatment(item));
    // Branch level treatments
    h.branches.forEach((b) => {
      const branchTreatments = [...(b.treatments || []), ...(b.specialists || []).flatMap(s => s.treatments || [])];
      branchTreatments.forEach((item) => {
        const treatmentDepartments: DepartmentType[] = []
        b.specialists?.forEach(spec => {
          const hasThisTreatment = spec.treatments?.some(t => t._id === item._id)
          if (hasThisTreatment && spec.department) treatmentDepartments.push(...spec.department)
        })
        processTreatment(item, b, treatmentDepartments);
      });
    });
  });
  return Array.from(extended.values())
}
// --- 3. Custom Hook for State & Logic (Updated Filtering) ---
const useHospitalsData = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [allHospitals, setAllHospitals] = useState<HospitalType[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>(() => {
    const getParam = (key: string) => searchParams.get(key)
    const initialView = (getParam("view") as "doctors" | "treatments" | "hospitals" | null) || "hospitals"
    const getFilterState = (key: string) => {
      const value = getParam(key)
      return value ? { id: isUUID(value) ? value : "", query: isUUID(value) ? "" : value } : { id: "", query: "" }
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
  }, [setFilters])
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
  
  // New filtering for content to base dynamic options on
  const { filteredBranches, filteredDoctors, filteredTreatments } = useMemo(() => {
    const currentFilters = filters;
    
    // --- 1. Filter Branches (Hospitals View Context) ---
    const genericBranchFilters: FilterState = {
        ...currentFilters,
        // Only consider city, branch, specialization, and treatment filters for the branch pool
        doctor: { id: "", query: "" },
        department: { id: "", query: "" },
        view: 'hospitals',
    };
    let branches = getMatchingBranches(allHospitals, genericBranchFilters, allExtendedTreatments);
    
    const filteredBranchesIds = new Set(branches.map(b => b._id))
    const filteredHospitalIds = new Set(branches.map(b => b.hospitalId))
    
    // Branch filter for treatments
    let matchingBranchIds: string[] | null = null;
    if (currentFilters.branch.id || currentFilters.branch.query) {
      matchingBranchIds = branches.map(b => b._id).filter(Boolean);
    }

    // --- 2. Filter Doctors ---
    let doctors = allExtendedDoctors;
    
    // APPLY CITY FILTER LOGIC (MAPPING DOCTORS TO CITY VIA LOCATION DATA)
    if (currentFilters.city.id || currentFilters.city.query) {
        const lowerCityQuery = currentFilters.city.query.toLowerCase();
        doctors = doctors.filter(d => 
            d.locations.some(loc => 
                loc.cities.some(c => 
                    (currentFilters.city.id && c._id === currentFilters.city.id) || 
                    (lowerCityQuery && (c.cityName ?? '').toLowerCase().includes(lowerCityQuery))
                )
            )
        );
    }

    // Apply Doctor Name Filter
    if (currentFilters.doctor.id) {
        // FIX: Use baseId for unique doctor selection
        doctors = doctors.filter(d => d.baseId === currentFilters.doctor.id);
    } else if (currentFilters.doctor.query) {
        const lowerQuery = currentFilters.doctor.query.toLowerCase();
        doctors = doctors.filter(d => (d.doctorName ?? '').toLowerCase().includes(lowerQuery));
    }
   
    // Apply Specialization Filter
    if (currentFilters.specialization.id) {
        const specId = currentFilters.specialization.id;
        doctors = doctors.filter(d => matchesSpecialization(d.specialization, specId, ""));
    } else if (currentFilters.specialization.query) {
        const lowerQuery = currentFilters.specialization.query.toLowerCase();
        doctors = doctors.filter(d => matchesSpecialization(d.specialization, "", lowerQuery));
    }

    // UPDATED: Apply Treatment Filter with location and department matching
    let matchingLocationKeysForDoctors: Set<string> | null = null;
    let matchingSpecialtyNamesForDoctors = new Set<string>();
    if (currentFilters.treatment.id || currentFilters.treatment.query) {
      const lowerTreatQuery = currentFilters.treatment.query.toLowerCase();
      const matchingTreatments = allExtendedTreatments.filter(t => 
          (currentFilters.treatment.id && t._id === currentFilters.treatment.id) || 
          (lowerTreatQuery && (t.name ?? '').toLowerCase().includes(lowerTreatQuery))
      );
      
      matchingTreatments.forEach(t => {
          t.departments.forEach(d => matchingSpecialtyNamesForDoctors.add(d.name.toLowerCase()));
      });

      if (matchingTreatments.length > 0) {
          matchingLocationKeysForDoctors = new Set(matchingTreatments.flatMap(t => t.branchesAvailableAt.map(loc => `${loc.hospitalId}-${loc.branchId || 'no-branch'}`)));
      }

      if (matchingSpecialtyNamesForDoctors.size > 0) {
          const deptMatch = (d: ExtendedDoctorType) => (d.specialization || []).some((spec: any) => 
              (spec.department || []).some((dept: any) => matchingSpecialtyNamesForDoctors.has(dept.name.toLowerCase()))
          );
          if (matchingLocationKeysForDoctors && matchingLocationKeysForDoctors.size > 0) {
              doctors = doctors.filter(d => 
                  d.locations.some(loc => matchingLocationKeysForDoctors.has(`${loc.hospitalId}-${loc.branchId || 'no-branch'}`)) && deptMatch(d)
              );
          } else {
              doctors = doctors.filter(deptMatch);
          }
      } else if (currentFilters.treatment.id) {
          doctors = [];
      }
    }

    // Process doctors with filtered locations
    const processedDoctors = doctors.map((d: ExtendedDoctorType) => {
      const locFilter = (loc: any) => {
        let match = true;
        if (currentFilters.city.id || currentFilters.city.query) {
          const lower = currentFilters.city.query.toLowerCase();
          match = match && loc.cities.some((c: CityType) => 
            (currentFilters.city.id && c._id === currentFilters.city.id) || 
            (lower && (c.cityName ?? '').toLowerCase().includes(lower))
          );
        }
        if (matchingLocationKeysForDoctors) {
          match = match && matchingLocationKeysForDoctors.has(`${loc.hospitalId}-${loc.branchId || 'no-branch'}`);
        }
        return match;
      };
      return { 
        ...d, 
        filteredLocations: d.locations.filter(locFilter) 
      };
    });

    // --- 3. Filter Treatments ---
    let treatments = allExtendedTreatments;
    
    // Apply City Filter (NEW/UPDATED for Treatments View)
    if (currentFilters.city.id || currentFilters.city.query) {
        const lowerCityQuery = currentFilters.city.query.toLowerCase();
        treatments = treatments.filter(t => 
            t.branchesAvailableAt.some(loc => 
                loc.cities.some(c => 
                    (currentFilters.city.id && c._id === currentFilters.city.id) || 
                    (lowerCityQuery && (c.cityName ?? '').toLowerCase().includes(lowerCityQuery))
                )
            )
        );
    }

    // Apply Treatment Name Filter
    if (currentFilters.treatment.id) {
        treatments = treatments.filter(t => t._id === currentFilters.treatment.id);
    } else if (currentFilters.treatment.query) {
        const lowerQuery = currentFilters.treatment.query.toLowerCase();
        treatments = treatments.filter(t => (t.name ?? '').toLowerCase().includes(lowerQuery));
    }

    // UPDATED: Apply Doctor/Specialization Filter for Treatments (in doctors view) with location and department matching
    let matchingDoctorLocationKeys: Set<string> | null = null;
    let matchingDeptsFromDoctors: Set<string> | null = null;
    if (currentFilters.view === 'doctors' && ((currentFilters.doctor.id || currentFilters.doctor.query) || (currentFilters.specialization.id || currentFilters.specialization.query))) {
        matchingDeptsFromDoctors = new Set(processedDoctors.flatMap((d: ExtendedDoctorType) => d.departments.map((dept: DepartmentType) => dept.name.toLowerCase())));
        if (processedDoctors.length > 0) {
            matchingDoctorLocationKeys = new Set(processedDoctors.flatMap((d: ExtendedDoctorType) => d.locations.map(loc => `${loc.hospitalId}-${loc.branchId || 'no-branch'}`)));
        }
    }
    if (matchingDoctorLocationKeys && matchingDeptsFromDoctors) {
        treatments = treatments.filter(t => 
            t.branchesAvailableAt.some(loc => 
                matchingDoctorLocationKeys.has(`${loc.hospitalId}-${loc.branchId || 'no-branch'}`) &&
                loc.departments.some((dept: DepartmentType) => matchingDeptsFromDoctors!.has(dept.name.toLowerCase()))
            )
        );
    } else if (matchingDoctorLocationKeys) {
        treatments = treatments.filter(t => t.branchesAvailableAt.some(loc => matchingDoctorLocationKeys.has(`${loc.hospitalId}-${loc.branchId || 'no-branch'}`)));
    } else if (matchingDeptsFromDoctors) {
        treatments = treatments.filter(t => t.departments.some(dept => matchingDeptsFromDoctors.has(dept.name.toLowerCase())));
    }

    // Apply Branch Filter for Treatments
    if (matchingBranchIds) {
        treatments = treatments.filter(t => 
            t.branchesAvailableAt.some(loc => matchingBranchIds!.includes(loc.branchId || ''))
        );
    }

    // Process treatments with filtered branches available
    const processedTreatments = treatments.map((t: ExtendedTreatmentType) => {
      const locFilter = (loc: TreatmentLocation) => {
        let match = true;
        if (currentFilters.city.id || currentFilters.city.query) {
          const lower = currentFilters.city.query.toLowerCase();
          match = match && loc.cities.some((c: CityType) => 
            (currentFilters.city.id && c._id === currentFilters.city.id) || 
            (lower && (c.cityName ?? '').toLowerCase().includes(lower))
          );
        }
        if (matchingBranchIds) {
          match = match && matchingBranchIds.includes(loc.branchId || '');
        }
        if (matchingDoctorLocationKeys) {
          match = match && matchingDoctorLocationKeys.has(`${loc.hospitalId}-${loc.branchId || 'no-branch'}`);
        }
        return match;
      };
      return { 
        ...t, 
        filteredBranchesAvailableAt: t.branchesAvailableAt.filter(locFilter) 
      };
    });

    let filteredDoctorsFinal = processedDoctors;
    let filteredTreatmentsFinal = processedTreatments;
    
    // --- 4. Apply Sorting (A to Z by default, or by filter selection) ---
    if (currentFilters.sortBy === "popular") {
        branches = branches.filter((b) => b.popular);
        filteredDoctorsFinal = filteredDoctorsFinal.filter((d) => d.popular);
        filteredTreatmentsFinal = filteredTreatmentsFinal.filter((t) => t.popular);
    }
    
    // MODIFIED: Apply A to Z sorting by default (sortBy === "all") or explicitly (sortBy === "az")
    if (currentFilters.sortBy === "az" || currentFilters.sortBy === "all") {
        branches.sort((a, b) => (a.branchName ?? '').localeCompare(b.branchName ?? ''));
        filteredDoctorsFinal.sort((a, b) => (a.doctorName ?? '').localeCompare(b.doctorName ?? ''));
        filteredTreatmentsFinal.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    }
    
    if (currentFilters.sortBy === "za") {
        branches.sort((a, b) => (b.branchName ?? '').localeCompare(a.branchName ?? ''));
        filteredDoctorsFinal.sort((a, b) => (b.doctorName ?? '').localeCompare(a.doctorName ?? ''));
        filteredTreatmentsFinal.sort((a, b) => (b.name ?? '').localeCompare(a.name ?? ''));
    }
    
    return { filteredBranches: branches, filteredDoctors: filteredDoctorsFinal, filteredTreatments: filteredTreatmentsFinal }
  }, [allHospitals, allExtendedDoctors, allExtendedTreatments, filters])
  
  // UPDATED: getUniqueOptions now depends on the filtered data and sorts options ascending
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
            });
        } else if (filters.view === 'doctors') {
            // CITY OPTIONS ARE DYNAMICALLY MAPPED FROM FILTERED DOCTORS' LOCATIONS
            contextDoctors.forEach(d => {
                (d.filteredLocations || d.locations).forEach(loc => {
                    loc.cities.forEach(c => {
                        if (c._id && c.cityName) map.set(c._id, c.cityName)
                    })
                })
            });
        } else if (filters.view === 'treatments') {
            contextTreatments.forEach(t => {
                (t.filteredBranchesAvailableAt || t.branchesAvailableAt).forEach(loc => {
                    loc.cities.forEach(c => {
                        if (c._id && c.cityName) map.set(c._id, c.cityName)
                    })
                })
            });
        }
    } else if (field === "branch") {
      // Use the filtered branches
      contextBranches.forEach(b => b._id && b.branchName && map.set(b._id, b.branchName))
    } else if (field === "doctors") {
      // Use the filtered doctors (using baseId for deduplication)
      contextDoctors.forEach(d => {
        if (d.baseId && d.doctorName) map.set(d.baseId, d.doctorName);
      })
    } else if (field === "treatments") {
       // Use the filtered treatments
       contextTreatments.forEach(t => {
        if (t._id && t.name) map.set(t._id, t.name);
      })
    } else if (field === "specialization") {
        // Specializations are associated with doctors
        contextDoctors.forEach(d => {
            (d.specialization || []).forEach((spec: any) => {
                const id = spec._id
                const name = spec.name || spec.title
                if (id && name) map.set(id, name)
            })
        })
    } else if (field === "department") {
        // Departments are associated with doctors (in the doctors view) or hospital/branch (for treatments view)
        contextDoctors.forEach(d => {
            d.departments?.forEach(item => {
                const id = item._id
                const name = item.name || item.title
                if (id && name) map.set(id, name)
            })
        })
    }
    
    // FIX: Ensure options are sorted ascending (A to Z)
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [filters.view, filters.doctor]) // Dependency added to reflect contextDoctors/Treatments/Branches changes
  
  // UPDATED: availableOptions now depends on the filtered data
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
  useEffect(() => {
    const params: string[] = []
    if (filters.view !== "hospitals") params.push(`view=${filters.view}`)
    const addIfSet = (key: string, filter: FilterValue) => {
      if (filter.id) params.push(`${key}=${encodeURIComponent(filter.id)}`)
      else if (filter.query) params.push(`${key}=${encodeURIComponent(filter.query)}`)
    }
    const activeKeys: FilterKey[] = getVisibleFiltersByView(filters.view);
    ['branch', 'city', 'specialization', 'treatment', 'doctor', 'department'].forEach(key => {
        if (activeKeys.includes(key as FilterKey) || filters[key as FilterKey].id || filters[key as FilterKey].query) {
             addIfSet(key, filters[key as FilterKey])
        }
    })
    const newQueryString = params.length > 0 ? "?" + params.join("&") : ""
    const targetUrlPath = `/hospitals${newQueryString}`
    if (window.location.pathname + window.location.search !== targetUrlPath) {
      window.history.replaceState(null, '', targetUrlPath)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])
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
  }
}
// --- 4. Presentation Components (Themed for Light Gray/White, Minimal Data) ---
type OptionType = { id: string; name: string }
interface FilterDropdownProps {
  placeholder: string
  filterKey: FilterKey
  filters: FilterState
  updateSubFilter: (key: FilterKey, subKey: "id" | "query", value: string) => void
  options: OptionType[]
}
const FilterDropdown = React.memo(({ placeholder, filterKey, filters, updateSubFilter, options }: FilterDropdownProps) => {
  const [showOptions, setShowOptions] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const filter = filters[filterKey] as FilterValue
  const query = useMemo(() => {
    if (filter.id) {
        return options.find(o => o.id === filter.id)?.name || filter.query || "";
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
  // FIX: Ensure options displayed in the dropdown are sorted A-Z
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
  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => { setShowOptions(true) }}
          // MODIFIED: rounded-lg changed to rounded-xs
          className={`w-full px-4 py-2 border rounded-xs text-sm font-light text-gray-800 focus:outline-none focus:ring-2 bg-white shadow-sm pr-10
          ${(filter.id || filter.query)
            ? "border-gray-400 focus:ring-gray-200 focus:border-gray-500"
            : "border-gray-200 focus:ring-gray-100 focus:border-gray-400"
          }`}
        />
        {(filter.id || filter.query) && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {showOptions && filteredOptions.length > 0 && (
        // MODIFIED: rounded-lg changed to rounded-xs
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xs shadow-lg mt-1 max-h-60 overflow-auto">
          {filteredOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleOptionSelect(opt.id, opt.name)}
              className={`w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors
              ${filter.id === opt.id ? "bg-gray-100 text-gray-800 font-semibold" : "font-light"}`}
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
const getFilterValueDisplay = (filterKey: FilterKey, filters: FilterState, availableOptions: ReturnType<typeof useHospitalsData>['availableOptions']): string | null => {
    const filter = filters[filterKey] as FilterValue;
    if (filter.id) {
        const options = availableOptions[filterKey];
        // FIX: Ensure key 'treatment' maps to availableOptions.treatment
        const optionKey = filterKey === 'treatment' ? 'treatment' : filterKey === 'department' ? 'department' : filterKey;
        return options.find(o => o.id === filter.id)?.name || filter.id;
    }
    if (filter.query) {
        return filter.query;
    }
    return null;
};
const FilterSidebar = ({ filters, showFilters, setShowFilters, clearFilters, updateSubFilter, availableOptions, filteredBranches, filteredDoctors, filteredTreatments }: ReturnType<typeof useHospitalsData>) => {
   
  const filterOptions: { value: FilterKey, label: string, isPrimary: boolean }[] = useMemo(() => [
    { value: "doctor", label: "Doctor", isPrimary: true },
    { value: "treatment", label: "Treatment", isPrimary: true }, // Treatment is Primary
    { value: "specialization", label: "Specialization", isPrimary: false }, // Renamed from Specialist to Specialization
    { value: "department", label: "Department", isPrimary: false }, // Department is Secondary
    { value: "city", label: "City", isPrimary: false }, // City is Secondary
    { value: "branch", label: "Hospital", isPrimary: true }, // Branch is Primary
  ], [])
  const visibleFilterKeys = useMemo(() => getVisibleFiltersByView(filters.view), [filters.view]);
  const activeFilterKey = useMemo(() => {
    if (filters.view === 'hospitals') return 'Hospitals'
    if (filters.view === 'doctors') return 'Doctor'
    return 'Treatment'
  }, [filters.view]);
  const appliedFilterKeys = useMemo(() => filterOptions.filter(opt => getFilterValueDisplay(opt.value, filters, availableOptions)), [filters, availableOptions, filterOptions]);
  
  // Logic for conditionally rendering filters (Auto Disable Logic)
  const shouldRenderFilter = useCallback((key: FilterKey): boolean => {
      const isPrimaryFilter = key === 'branch' || key === 'doctor' || key === 'treatment';
      const isCityFilter = key === 'city';
      const filter = filters[key];
      const options = availableOptions[key];
      
      // 1. If a filter is active, always show it.
      if (filter.id || filter.query) return true;
      
      // 2. Hide if not in the visible list for the current view
      if (!visibleFilterKeys.includes(key)) return false;
      
      // 3. Hide if no options available.
      if (options.length === 0) return false;
      
      // 4. Primary filters: Show if at least two options exist (length >= 2). This implements the auto-disable.
      if (isPrimaryFilter) {
          return options.length >= 2;
      }
      
      // 5. Secondary filters (Specialization, City): Hide if less than 2 options (to avoid trivial filtering)
      if (options.length < 2) return false;
      
      // 6. Special check for City filter in different views
      if (isCityFilter) {
          // If a primary filter is selected, but the resulting branches/doctors/treatments only have 1 city, hide the City filter.
          const primaryActive = filters.branch.id || filters.doctor.id || filters.treatment.id || filters.branch.query || filters.doctor.query || filters.treatment.query;
          if (primaryActive && options.length < 2) return false;
      }
      
      return true;
      
  }, [filters, availableOptions, visibleFilterKeys])

  return (
    <div
      className={`fixed inset-0 z-40 md:sticky md:top-0 md:h-screen md:w-64 lg:w-72 md:flex-shrink-0 md:pt-0 transform ${showFilters ? "translate-x-0 bg-white backdrop-blur-sm" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300 ease-in-out border-r border-gray-200 overflow-y-auto`}
    >
      {/* Updated sidebar bg and text for light theme */}
      <div className="p-4 md:p-6 h-full overflow-y-auto bg-white md:bg-white">
        <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" /> Search by {activeFilterKey}
          </h3>
       
        </div>
       
        <div className="space-y-4">
       
           
            {filterOptions.map(opt => {
                const key = opt.value;
                if (!shouldRenderFilter(key)) return null;
                
                const filterLabel = key === 'specialization' && filters.view === 'doctors' ? 'Specialist' : opt.label;

                return (
                    <div key={key}>
                        <FilterDropdown
                            placeholder={`Search by ${filterLabel}`}
                            filterKey={key}
                            filters={filters}
                            updateSubFilter={updateSubFilter}
                            options={availableOptions[key]}
                        />
                    </div>
                   
                );
            })}
             {visibleFilterKeys.length === 0 && (
                 <p className="text-sm text-gray-600 py-4 font-light">Select a view (Branches/Doctors/Treatments) to see relevant filters.</p>
             )}
               <button onClick={clearFilters} className="text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors">Clear all</button>
          {showFilters && (<button onClick={() => setShowFilters(false)} className="md:hidden text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>)}
        </div>
       
        {/* Active Filters Display */}
        <div className="mt-8 border-t border-gray-200 pt-4">
            <label className="block text-sm font-semibold text-gray-800 mb-3">Currently Applied Filters</label>
            <div className="flex flex-wrap gap-2">
                {filterOptions.map((opt) => {
                    const value = getFilterValueDisplay(opt.value, filters, availableOptions);
                    if (!value) return null;
                   
                    return (
                        // MODIFIED: rounded-full changed to rounded-xs
                        <div key={opt.value} className="flex items-center bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-xs shadow-sm border border-gray-200 font-light">
                            <span className="font-medium mr-1 truncate max-w-[60px]">{opt.label}:</span>
                            <span className="truncate max-w-[80px]">{value}</span>
                            <button
                                onClick={() => updateSubFilter(opt.value, "id", "") || updateSubFilter(opt.value, "query", "")}
                                className="ml-2 text-gray-500 hover:text-gray-800"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    );
                })}
                {appliedFilterKeys.length === 0 && (
                    <p className="text-sm text-gray-600 font-light">No filters applied yet.</p>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}
// Card Components (Themed for Light Gray/White, Minimal Data)
const HospitalCard = ({ branch }: { branch: BranchType & { hospitalName: string; hospitalLogo: string | null; hospitalId: string } }) => {
  const slug = generateSlug(`${branch.hospitalName} ${branch.branchName}`)
  const imageUrl = getWixImageUrl(branch.branchImage)
  const primaryCity = branch.city?.[0]?.cityName || ""
  const primaryState = branch.city?.[0]?.state || ""
  const hospitalLogoUrl = getWixImageUrl(branch.hospitalLogo)
  const primarySpecialty = branch.specialization?.[0]?.name || branch.specialization?.[0]?.title || "General Care"
 
  // NEW: Get the accreditation logo URL
  const accreditationLogoUrl = getWixImageUrl(branch.accreditation?.[0]?.image);

  // NOTE: Departments list removed for minimal data/simplicity as requested.
  return (
    <Link href={`/hospitals/branches/${slug}`} className="block">
      {/* UPDATED: Unified card styling for border and shadow */}
      <article className="group bg-white rounded-xs shadow-xs transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col hover:shadow-xs border border-gray-200">
        <div className="relative h-48 overflow-hidden bg-gray-100">
          
          {/* Hospital Logo (Top Left) */}
          {hospitalLogoUrl && (
            <div className="absolute bottom-2 left-2 z-10">
                <img src={hospitalLogoUrl} alt={`${branch.hospitalName} logo`} className="w-12 h-auto object-contain bg-white p-0 rounded-xs shadow-xs border border-gray-100" onError={(e) => { e.currentTarget.style.display = "none" }} />
            </div>
          )}

          {/* NEW: Accreditation Logo (Top Right) */}
          {accreditationLogoUrl && (
              <div className="absolute top-2 right-2 z-10">
                  <img
                      src={accreditationLogoUrl}
                      alt={branch.accreditation?.[0]?.title || 'Accreditation'}
                      className="w-7 h-auto object-contain bg-white p-0 rounded-full shadow-xs border border-gray-200"
                      onError={(e) => { e.currentTarget.style.display = "none" }}
                  />
              </div>
          )}

          {imageUrl ? (<img src={imageUrl} alt={branch.branchName} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.currentTarget.style.display = "none" }}/>) : (<div className="absolute inset-0 flex items-center justify-center"><Hospital className="w-12 h-12 text-gray-300" /></div>)}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
        </div>
        <div className="p-5 flex-1 flex flex-col space-y-3"> {/* Adjusted spacing for cleanliness */}
          <header className="space-y-1">
            <h2 className="text-base font-medium leading-tight line-clamp-2 text-gray-800 group-hover:text-gray-700 transition-colors">{branch.branchName}</h2>
            <div className="flex items-center text-sm text-gray-600 font-light">
              
                <span>{primaryCity}{primaryState ? `, ${primaryState}` : ""}</span>, <span className="ml-1"> {primarySpecialty} Speciality</span>
            </div>
          </header>
      
         
          <footer className="border-t border-gray-100 pt-3 mt-auto">
            <div className="grid grid-cols-3 gap-3">
              {/* MODIFIED: rounded-lg changed to rounded-xs */}
              <div className="text-center rounded-xs bg-gray-50 p-2 border border-gray-100 space-y-1">
                <p className="text-sm font-medium text-gray-800">{branch.noOfDoctors ?? '?'}+</p>
                <p className="text-sm text-gray-800 ">Doctors</p>
              </div>
              {/* MODIFIED: rounded-sm changed to rounded-xs */}
              <div className="text-center rounded-xs bg-gray-50 p-2 border border-gray-100 space-y-1">
                <p className="text-sm font-medium text-gray-800">{branch.totalBeds ?? '?'}+</p>
                <p className="text-sm text-gray-800 ">Beds</p>
              </div>
              {/* MODIFIED: rounded-sm changed to rounded-xs */}
              <div className="text-center rounded-xs bg-gray-50 p-2 border border-gray-100 space-y-1">
                <p className="text-sm font-medium text-gray-800">{branch.yearEstablished ?? '?'}</p>
                <p className="text-sm text-gray-800 ">Estd.</p>
              </div>
            </div>
          </footer>
        </div>
      </article>
    </Link>
  )
}
const DoctorCard = ({ doctor }: { doctor: ExtendedDoctorType }) => {
  const specialization = (Array.isArray(doctor.specialization)
    ? doctor.specialization.map((s) => (typeof s === 'object' && s !== null ? (s as any).name || (s as any).title || '' : s)).filter(Boolean).join(", ")
    : [doctor.specialization].filter(Boolean).join(", "))
  
  // FIX: Use the baseId for the link generation to ensure uniqueness
  const slug = generateSlug(`${doctor.doctorName}-${doctor.baseId}`) 
  const imageUrl = getWixImageUrl(doctor.profileImage)
  
  // UPDATED: Use filteredLocations for primary location to match filters, and display hospital/branch/city
  const primaryLocation = useMemo(() => {
    const availLocs = doctor.filteredLocations || doctor.locations;
    if (availLocs.length === 0) {
      return "Location Varies";
    }
    const firstLoc = availLocs[0];
    const hospitalBranch = firstLoc.branchName 
      ? `${firstLoc.hospitalName}, ${firstLoc.branchName}` 
      : firstLoc.hospitalName;
    const city = firstLoc.cities[0]?.cityName || "";
    return `${hospitalBranch}${city ? `, ${city}` : ''}`;
  }, [doctor.filteredLocations, doctor.locations]);

  return (
    <Link href={`/doctors/${slug}`} className="block">
      {/* UPDATED: Unified card styling for border and shadow */}
      <article className="group bg-white rounded-xs shadow-xs transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col hover:shadow-xs border border-gray-200">
        <div className="relative h-48 overflow-hidden bg-gray-100">
          {/* MODIFIED: rounded-full changed to rounded-xs in tag */}
          {doctor.popular && (<span className="absolute top-3 right-3 z-10 inline-flex items-center text-xs bg-gray-100 text-gray-700 font-medium px-3 py-1 rounded-xs shadow-sm border border-gray-300"><Star className="w-3 h-3 mr-1 fill-gray-500 text-gray-500" />Popular</span>)}
          {imageUrl ? (<img src={imageUrl} alt={doctor.doctorName} className="object-cover object-top w-full h-full group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.currentTarget.style.display = "none" }}/>) : (<div className="absolute inset-0 flex items-center justify-center"><Users className="w-12 h-12 text-gray-300" /></div>)}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
        </div>
        <div className="p-5 flex-1 flex flex-col space-y-3"> {/* Adjusted spacing for cleanliness */}
          <header className="space-y-1 flex-1 min-h-0"> {/* flex-1 with min-h-0 to fill space and handle overflow for uniform height */}
            <h2 className="text-base font-medium leading-tight line-clamp-2 text-gray-800 group-hover:text-gray-700 transition-colors">{doctor.doctorName}</h2>
            <p className="text-sm text-gray-600 font-light flex items-center gap-2 line-clamp-1">{specialization}</p>
          </header>
          {/* MINIMAL DATA UPDATE: REMOVED Hospital/Branch Name and Qualification */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600 font-light flex items-center gap-2">{doctor.experienceYears} Years Exp.</p>
          </div>
          <footer className="border-t border-gray-100 pt-3">
             <p className="text-sm text-gray-600 font-light flex items-center gap-2 line-clamp-1">
                <MapPin className="w-4 h-4 flex-shrink-0 text-gray-500" />
                {primaryLocation}
             </p>
          </footer>
        </div>
      </article>
    </Link>
  )
}
const TreatmentCard = ({ treatment }: { treatment: ExtendedTreatmentType }) => {
  const slug = generateSlug(treatment.name)
  const imageUrl = getWixImageUrl(treatment.treatmentImage)
 
const primaryLocation = useMemo(() => {
  const availLocs = treatment.filteredBranchesAvailableAt || treatment.branchesAvailableAt;

  if (!availLocs || availLocs.length === 0) {
    return { name: "Location Varies", cost: treatment.cost, city: "Location Varies" };
  }

  const firstLoc = availLocs[0];
  const locationName = firstLoc.branchName || "Location Varies";

  return {
    name: locationName,
    cost: firstLoc.cost || treatment.cost,
    city: firstLoc.cities?.[0]?.cityName || "Location Varies"
  };
}, [treatment]);

 
  return (
    <Link href={`/treatment/${slug}`} className="block">
      {/* UPDATED: Unified card styling for border and shadow */}
      <article className="group bg-white rounded-xs shadow-xs transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col hover:shadow-xs border border-gray-200">
        <div className="relative h-48 overflow-hidden bg-gray-100">
          {/* MODIFIED: rounded-full changed to rounded-xs in tag */}
          {treatment.popular && (<span className="absolute top-3 right-3 z-10 inline-flex items-center text-xs bg-gray-100 text-gray-700 font-medium px-3 py-1 rounded-xs shadow-sm border border-gray-300"><Star className="w-3 h-3 mr-1 fill-gray-500 text-gray-500" />Popular</span>)}
          {imageUrl ? (<img src={imageUrl} alt={treatment.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.currentTarget.style.display = "none" }}/>) : (<div className="absolute inset-0 flex items-center justify-center"><Stethoscope className="w-12 h-12 text-gray-300" /></div>)}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
        </div>
        <div className="p-5 flex-1 flex flex-col space-y-3"> {/* Adjusted spacing for cleanliness */}
          <header className="space-y-1 flex-1 min-h-0"> {/* flex-1 with min-h-0 to fill space and handle overflow for uniform height */}
            <h2 className="text-base font-medium leading-tight line-clamp-2 min-h-12 text-gray-800 group-hover:text-gray-700 transition-colors"> {/* line-clamp-2 fixes text height to 2 lines */}
              {treatment.name}
            </h2>
           
            {/* Changed category pill to gray theme */}
            {treatment.category && (
                <div className="flex flex-wrap gap-1 pt-1">
                    {/* MODIFIED: rounded-full changed to rounded-xs */}
                    <span className="inline-block bg-gray-100 line-clamp-1 text-gray-700 text-xs px-2 py-1 rounded-xs font-medium border border-gray-200">
                        {treatment.category}
                    </span>
                </div>
            )}
          </header>
         
          <footer className="border-t border-gray-100 pt-3 flex flex-col gap-2"> {/* No flex-1/mt-auto; pushed to bottom by header's flex-1 */}
            {/* NEW: City Display */}
           
            {/* Changed cost icon and text color to gray theme */}
            <p className="text-sm text-gray-600 font-light flex items-center gap-1"><DollarSign className="w-4 h-4 flex-shrink-0 text-gray-700" />Starting from <span className="font-bold text-gray-800">{primaryLocation.cost || 'Inquire'}</span></p>
          </footer>
         
          {/* Removed departments data for minimal view */}
        </div>
      </article>
    </Link>
  )
}
const RenderContent = ({ view, loading, currentCount, filteredBranches, filteredDoctors, filteredTreatments, clearFilters }: { view: string, loading: boolean, currentCount: number, filteredBranches: any[], filteredDoctors: any[], filteredTreatments: any[], clearFilters: () => void }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => view === "hospitals" ? (<HospitalCardSkeleton key={i} />) : view === "doctors" ? (<DoctorCardSkeleton key={i} />) : (<TreatmentCardSkeleton key={i} />))}
      </div>
    )
  }
  if (currentCount === 0) {
    return (
      // MODIFIED: rounded-xl changed to rounded-xs
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xs shadow-lg border border-gray-200">
        <Search className="w-12 h-12 text-gray-400 mb-4" />
        <h4 className="text-xl font-bold text-gray-800 mb-1">No {view === 'hospitals' ? 'Branches' : view} Found</h4>
        <p className="text-gray-600 mb-6 font-light">Try adjusting your filters or search terms.</p>
        {/* MODIFIED: rounded-lg changed to rounded-xs */}
        <button onClick={clearFilters} className="px-5 py-2 text-sm font-medium bg-gray-700 text-white rounded-xs hover:bg-gray-800 transition-colors shadow-md">Clear All Filters</button>
      </div>
    )
  }
  const items = view === "hospitals" ? filteredBranches : view === "doctors" ? filteredDoctors : filteredTreatments
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <div key={item.baseId || item._id} className="h-full">
          {view === "hospitals" ? (<HospitalCard branch={item as BranchType & { hospitalName: string; hospitalLogo: string | null; hospitalId: string }} />)
          : view === "doctors" ? (<DoctorCard doctor={item as ExtendedDoctorType} />)
          : (<TreatmentCard treatment={item as ExtendedTreatmentType} />)}
        </div>
      ))}
    </div>
  )
}
interface ViewToggleProps {
  view: "hospitals" | "doctors" | "treatments"
  setView: (view: "hospitals" | "doctors" | "treatments") => void
}
const ViewToggle = ({ view, setView }: ViewToggleProps) => (
  // MODIFIED: rounded-lg changed to rounded-xs
  <div className="flex bg-white rounded-xs shadow-sm p-1 mb-1 mx-auto lg:mx-0 max-w-md border border-gray-200">
    <button
      onClick={() => setView("hospitals")}
      // MODIFIED: rounded-lg changed to rounded-xs
      className={`flex-1 px-4 py-2 rounded-xs text-sm font-medium transition-all duration-200 ${
        // Updated active color to clean gray-700
        view === "hospitals" ? "bg-gray-700 text-white shadow-md" : "text-gray-700 hover:text-gray-800 hover:bg-gray-50"
      }`}
    >
      Hospitals
    </button>
    <button
      onClick={() => setView("doctors")}
      // MODIFIED: rounded-lg changed to rounded-xs
      className={`flex-1 px-4 py-2 rounded-xs text-sm font-medium transition-all duration-200 ${
        view === "doctors" ? "bg-gray-700 text-white shadow-md" : "text-gray-700 hover:text-gray-800 hover:bg-gray-50"
      }`}
    >
      Doctors
    </button>
    <button
      onClick={() => setView("treatments")}
      // MODIFIED: rounded-lg changed to rounded-xs
      className={`flex-1 px-4 py-2 rounded-xs text-sm font-medium transition-all duration-200 ${
        view === "treatments" ? "bg-gray-700 text-white shadow-md" : "text-gray-700 hover:text-gray-800 hover:bg-gray-50"
      }`}
    >
      Treatments
    </button>
  </div>
)
interface SortingProps {
  sortBy: "all" | "popular" | "az" | "za"
  setSortBy: (sortBy: "all" | "popular" | "az" | "za") => void
}
const Sorting = ({ sortBy, setSortBy }: SortingProps) => (
  <div className="flex items-center gap-2">
    <label className="text-sm text-gray-600 hidden sm:block font-light">Sort by:</label>
    <select
      value={sortBy}
      onChange={(e) => setSortBy(e.target.value as "all" | "popular" | "az" | "za")}
      // MODIFIED: rounded-lg changed to rounded-xs
      className="border border-gray-300 rounded-xs px-3 py-2 text-sm focus:ring-1 focus:ring-gray-300 focus:border-gray-400 bg-white shadow-sm appearance-none pr-8 cursor-pointer text-gray-700"
    >
      <option value="all">All (A to Z)</option>
      <option value="popular">Popular</option>
      <option value="az">A to Z</option>
      <option value="za">Z to A</option>
    </select>
  </div>
)
interface ResultsHeaderProps {
  view: "hospitals" | "doctors" | "treatments"
  currentCount: number
  clearFilters: () => void
  sortBy: "all" | "popular" | "az" | "za"
  setSortBy: (sortBy: "all" | "popular" | "az" | "za") => void
}
const ResultsHeader = ({ view, currentCount, clearFilters, sortBy, setSortBy }: ResultsHeaderProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-4 bg-white border-b border-gray-200 p-2">
    <div className="text-sm text-gray-600 font-light">
      Showing <span className="font-bold text-gray-800">{currentCount}</span> {view === 'hospitals' ? 'Branches' : view} found
    </div>
    <div className="flex items-center gap-4">
      <Sorting sortBy={sortBy} setSortBy={setSortBy} />
      <button
        onClick={clearFilters}
        className="hidden md:inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors font-medium"
      >
        Clear Filters
      </button>
    </div>
  </div>
)
interface MobileFilterButtonProps {
  setShowFilters: (show: boolean) => void
}
const MobileFilterButton = ({ setShowFilters }: MobileFilterButtonProps) => (
  <button
    // Updated mobile button to clean gray
    // MODIFIED: rounded-full changed to rounded-xs
    onClick={() => setShowFilters(true)}
    className="fixed bottom-6 right-6 md:hidden bg-gray-700 text-white p-4 rounded-xs shadow-xl hover:shadow-2xl transition-shadow z-30"
  >
    <Filter className="w-5 h-5" />
  </button>
)
const BreadcrumbNav = () => (
    <nav aria-label="Breadcrumb" className="container border-t border-gray-100 bg-white mx-auto px-4 sm:px-6 lg:px-8">
      <ol className="flex items-center px-2 md:px-0 space-x-1 py-3 text-sm text-gray-600 font-light">
        <li>
          <Link href="/" className="flex items-center hover:text-gray-800 transition-colors">
            <Home className="w-4 h-4 mr-1 text-gray-500" />
            Home
          </Link>
        </li>
        <li>
          <span className="mx-1">/</span>
        </li>
        <li className="text-gray-800 font-medium">Hospitals</li>
      </ol>
    </nav>
  )
  const HospitalCardSkeleton = () => (
    // MODIFIED: rounded-xl changed to rounded-xs
    <div className="bg-white rounded-xs shadow-lg overflow-hidden animate-pulse border border-gray-200">
      <div className="h-48 bg-gray-100 relative">
        {/* MODIFIED: rounded-full changed to rounded-xs */}
        <div className="absolute bottom-3 left-3 bg-gray-200 rounded-xs w-12 h-12 border border-white" />
      </div>
      <div className="p-5 space-y-4">
        <div className="h-6 bg-gray-200 rounded-md w-3/4" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded-md w-1/4" />
          <div className="h-4 bg-gray-200 rounded-md w-3/4" />
        </div>
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
          {Array.from({ length: 3 }).map((_, i) => (
            // MODIFIED: rounded-lg changed to rounded-xs
            <div key={i} className="bg-gray-100 rounded-xs p-2 h-16" />
          ))}
        </div>
      </div>
    </div>
  )
  const DoctorCardSkeleton = () => (
    // MODIFIED: rounded-xl changed to rounded-xs
    <div className="bg-white rounded-xs shadow-lg overflow-hidden animate-pulse border border-gray-200">
      <div className="h-48 bg-gray-100 relative" />
      <div className="p-5 space-y-4">
        <div className="h-6 bg-gray-200 rounded-md w-3/4" />
        <div className="h-4 bg-gray-200 rounded-md w-1/2" />
        <div className="h-3 bg-gray-200 rounded-md w-full" />
        <div className="space-y-2 border-t border-gray-100 pt-3">
          <div className="h-3 bg-gray-200 rounded-md w-3/4" />
          <div className="h-3 bg-gray-200 rounded-md w-1/2" />
        </div>
      </div>
    </div>
  )
  const TreatmentCardSkeleton = () => (
    // MODIFIED: rounded-xl changed to rounded-xs
    <div className="bg-white rounded-xs shadow-lg overflow-hidden animate-pulse border border-gray-200">
      <div className="h-48 bg-gray-100 relative" />
      <div className="p-5 space-y-4">
        <div className="h-6 bg-gray-200 rounded-md w-3/4" />
        <div className="h-4 bg-gray-200 rounded-md w-1/2" />
        <div className="space-y-2 border-t border-gray-100 pt-3">
          <div className="h-3 bg-gray-200 rounded-md w-3/4" />
          <div className="h-3 bg-gray-200 rounded-md w-1/2" />
        </div>
      </div>
    </div>
  )
// --- 5. Main Component using the Hook ---
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
  } = useHospitalsData()
  const setView = (v: FilterState["view"]) => {
    clearFilters();
    updateFilter("view", v);
  }
  const setSortBy = (s: FilterState["sortBy"]) => updateFilter("sortBy", s)
  return (
    // Base page background
    <div className="bg-gray-50 min-h-screen">
      <Banner title="Find Branches, Doctors, and Treatments" />
      <BreadcrumbNav />
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8">
          <FilterSidebar
            loading={loading}
            filters={filters}
            updateFilter={updateFilter}
            updateSubFilter={updateSubFilter}
            clearFilters={clearFilters}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            availableOptions={availableOptions}
            filteredBranches={filteredBranches}
            filteredDoctors={filteredDoctors}
            filteredTreatments={filteredTreatments}
            currentCount={currentCount}
          />
          <main className="flex-1 py-5 min-w-0  lg:pb-0 min-h-screen">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
              <ViewToggle view={filters.view} setView={setView} />
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="w-8 h-8 animate-spin text-gray-700" />
        </div>
      }
    >
      <HospitalsPageContent />
    </Suspense>
  )
}