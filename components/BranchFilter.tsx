// File: components/BranchFilter.tsx
"use client"
import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Building2, MapPin, Stethoscope, Users, X, Search, Award } from "lucide-react"

// --- Type Definitions ---
interface UniversalOption {
  id: string;
  name: string;
  type: "branch" | "city" | "treatment" | "doctor" | "specialty";
  label: string;
}

interface SpecialistData {
  _id: string;
  name: string;
  treatments?: TreatmentData[];
}

interface BranchData {
  _id: string;
  branchName?: string;
  city?: any;
  treatments?: any[];
  specialists?: SpecialistData[]; // Added specialists to BranchData
}

interface DoctorData {
  _id: string;
  doctorName?: string;
  specialization?: any;
}

interface TreatmentData {
  _id?: string;
  name?: string;
}

interface HospitalData {
  hospitalName?: string;
  branches?: BranchData[];
  doctors?: DoctorData[];
  treatments?: TreatmentData[]; // Treatments directly under hospital
  specialists?: SpecialistData[]; // Specialists directly under hospital
}

interface BranchFilterProps {
  allHospitals: HospitalData[];
  initialSearch?: string;
}

// --- Utility Functions ---
const generateSlug = (name: string | null | undefined): string => {
  if (!name || typeof name !== 'string') return ''
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
}

const extractProperName = (item: any): string => {
  if (!item) return 'Unknown'
  
  if (typeof item === 'string') {
    return item
  }
  
  // Adjusted logic to prioritize names based on potential structure
  if (typeof item === 'object') {
    // Check for nested name properties first, common in API objects
    if (item.name) return item.name
    if (item.cityName) return item.cityName
    if (item.branchName) return item.branchName
    if (item.doctorName) return item.doctorName
    if (item.specializationName) return item.specializationName
    if (item.treatmentName) return item.treatmentName // For cases like `item.treatmentName`
  }
  
  return 'Unknown'
}

// --- SearchDropdown Component ---
const SearchDropdown = ({ 
  value, 
  onChange, 
  placeholder, 
  options, 
  onOptionSelect, 
  onClear 
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  options: UniversalOption[]
  onOptionSelect: (id: string, type: UniversalOption['type']) => void
  onClear: () => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const filteredOptions = useMemo(() => {
    if (!value) return options.slice(0, 6)
    
    const lower = value.toLowerCase().trim()
    if (!lower) return options.slice(0, 6) // Handle case where trimming makes it empty
    
    // **NEW CHANGE: Update search logic to match the start of any word in the name**
    return options
      .filter(option => {
        const optionNameLower = option.name.toLowerCase()
        const words = optionNameLower.split(/\s+/) // Split by spaces

        // Check if the query matches the start of any word in the name
        const matchesWordStart = words.some(word => word.startsWith(lower))

        // Also keep the simple check for label (e.g., 'Doctor')
        return matchesWordStart || option.label.toLowerCase().startsWith(lower)
      })
      .slice(0, 8)
  }, [value, options])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getIcon = (type: UniversalOption['type']) => {
    const icons = {
      branch: Building2,
      city: MapPin,
      treatment: Stethoscope,
      doctor: Users,
      specialty: Award,
    }
    const Icon = icons[type]
    return <Icon className="w-4 h-4 text-gray-500 mr-3" />
  }

  return (
    <div ref={dropdownRef} className="relative w-full max-w-md mx-auto">
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search by Hospital, Doctor, treatment"
          className="w-full pl-7 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 text-sm"
          autoComplete="off" 
        />
        {value && (
          <button 
            type="button"
            onClick={onClear}
            className="absolute right-3 bg-white top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.map((option) => (
            <button
              key={`${option.type}-${option.id}`}
              type="button"
              onClick={() => {
                onOptionSelect(option.id, option.type)
                setIsOpen(false)
              }}
              className="w-full text-left px-4 py-3 text-sm flex items-center hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              {getIcon(option.type)}
              <div className="flex-1">
                <div className="font-medium text-gray-900">{option.name}</div>
                <div className="text-xs text-gray-500 mt-1">{option.label}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Main Component ---
const BranchFilter = ({ allHospitals, initialSearch = "" }: BranchFilterProps) => {
  const router = useRouter()
  const [query, setQuery] = useState(initialSearch)

  const availableOptions = useMemo(() => {
    const options: UniversalOption[] = []
    const addedIds = new Set<string>()

    try {
      // Add doctors
      allHospitals.forEach(hospital => {
        hospital.doctors?.forEach((doctor: DoctorData) => {
          if (doctor?._id && doctor.doctorName) {
            const doctorName = extractProperName(doctor.doctorName)
            if (doctorName !== 'Unknown' && !addedIds.has(`doctor-${doctor._id}`)) {
              options.push({
                id: doctor._id,
                name: doctorName,
                type: 'doctor',
                label: 'Doctor'
              })
              addedIds.add(`doctor-${doctor._id}`)
            }
          }
        })
      })

      // Add specializations
      const specs = new Map<string, string>()
      allHospitals.forEach(hospital => {
        // From hospital.doctors
        hospital.doctors?.forEach((doctor: DoctorData) => {
          if (doctor?.specialization) {
            const specList = Array.isArray(doctor.specialization) ? doctor.specialization : [doctor.specialization]
            specList.forEach((spec: any) => {
              const id = spec?._id || generateSlug(typeof spec === 'string' ? spec : spec.name)
              const name = extractProperName(spec)
              if (id && name !== 'Unknown') specs.set(id, name)
            })
          }
        })
        // From hospital.branches.specialists (assuming specialists also have a specialization name)
        hospital.branches?.forEach((branch: BranchData) => {
            branch.specialists?.forEach((specialist: SpecialistData) => {
                const id = specialist?._id || generateSlug(specialist.name)
                const name = extractProperName(specialist)
                if (id && name !== 'Unknown') specs.set(id, name)
            })
        })
      })
      specs.forEach((name, id) => {
        options.push({ id, name, type: 'specialty', label: 'Specialty' })
      })

      // Add treatments
      const treatments = new Map<string, string>()
      allHospitals.forEach(hospital => {
        // Treatments directly under hospital
        hospital.treatments?.forEach((treatment: TreatmentData) => {
          if (treatment.name) {
            const id = treatment._id || generateSlug(treatment.name)
            treatments.set(id, treatment.name)
          }
        })
        // Treatments under hospital.branches (from the original structure)
        hospital.branches?.forEach((branch: BranchData) => {
          branch.treatments?.forEach((treatment: any) => {
            const name = extractProperName(treatment)
            const id = treatment?._id || generateSlug(name)
            if (name !== 'Unknown') treatments.set(id, name)
          })
          
          // Treatments nested under hospital.branches.specialists
          branch.specialists?.forEach((specialist: SpecialistData) => {
              specialist.treatments?.forEach((treatment: TreatmentData) => {
                  const name = extractProperName(treatment)
                  const id = treatment?._id || generateSlug(name)
                  if (name !== 'Unknown') treatments.set(id, name)
              })
          })
        })
      })
      treatments.forEach((name, id) => {
        options.push({ id, name, type: 'treatment', label: 'Treatment' })
      })

      // **City search filter logic remains REMOVED**
      
      // Add branches
      allHospitals.forEach(hospital => {
        hospital.branches?.forEach((branch: BranchData) => {
          if (branch._id && branch.branchName) {
            const name = extractProperName(branch.branchName)
            if (name !== 'Unknown' && !addedIds.has(`branch-${branch._id}`)) {
              options.push({
                id: branch._id,
                name: name,
                type: 'branch',
                label: 'Branch'
              })
              addedIds.add(`branch-${branch._id}`)
            }
          }
        })
      })

    } catch (error) {
      console.error('Error processing data:', error)
    }

    return options.sort((a, b) => a.name.localeCompare(b.name))
  }, [allHospitals])

  const handleOptionSelect = useCallback((id: string, type: UniversalOption['type']) => {
    const option = availableOptions.find(o => o.id === id && o.type === type)
    if (!option) return

    // Keep query temporarily for URL generation, but clear it after navigation
    const slug = generateSlug(option.name)
    let url: string = ''

    switch (type) {
      case 'doctor':
        url = `/doctors/${slug}`
        break
      case 'specialty':
        url = `/search/?view=doctors&specialization=${encodeURIComponent(slug)}`
        break
      case 'treatment':
        url = `/search/?view=doctors&treatment=${encodeURIComponent(slug)}`
        break
      case 'city':
        // This case will not be hit if city options are removed, but kept for type completeness.
        url = `/search/?city=${encodeURIComponent(option.name)}`
        break
      case 'branch':
        // Find the branch and hospital names from allHospitals data
        let branchName = option.name
        let hospitalName = ''
        for (const hospital of allHospitals) {
          const foundBranch = hospital.branches?.find(b => b._id === id)
          if (foundBranch) {
            branchName = foundBranch.branchName || option.name
            hospitalName = hospital.hospitalName || ''
            break
          }
        }
        url = `/search/hospitals/${generateSlug(branchName)}`
        break
    }
    
    // 1. Navigate to the new URL
    router.push(url)
    
    // 2. Clear the input field for a fresh search when user returns/stays
    setQuery("")

  }, [availableOptions, router, allHospitals])

  const clearSearch = () => {
    setQuery("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedQuery = query.trim()
    
    if (!trimmedQuery) return

    // Enhanced logic: Find a match using slugs for better tolerance to casing and spacing
    const querySlug = generateSlug(trimmedQuery)
    const matchingOption = availableOptions.find(option => 
      generateSlug(option.name) === querySlug
    )

    if (matchingOption) {
      handleOptionSelect(matchingOption.id, matchingOption.type)
      return
    }

    // Fallback search
    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`)
    setQuery("") // Clear query after general fallback search
  }

  return (
    <div className="w-1/2">
      <form onSubmit={handleSubmit} className="flex justify-center">
        <SearchDropdown
          value={query}
          onChange={setQuery}
          placeholder="Search by Hospital, Doctor, treatment"
          options={availableOptions}
          onOptionSelect={handleOptionSelect}
          onClear={clearSearch}
        />
      </form>
    </div>
  )
}

export default BranchFilter