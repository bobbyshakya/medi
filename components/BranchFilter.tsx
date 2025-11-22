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

interface HospitalData {
  hospitalName?: string;
  branches?: BranchData[];
  doctors?: DoctorData[];
  treatments?: TreatmentData[];
}

interface BranchData {
  _id: string;
  branchName?: string;
  city?: any;
  treatments?: any[];
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
  
  if (typeof item === 'object') {
    return item.name || item.specializationName || item.treatmentName || item.doctorName || item.cityName || item.branchName || 'Unknown'
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
    
    const lower = value.toLowerCase()
    return options
      .filter(option => 
        option.name.toLowerCase().includes(lower) || 
        option.label.toLowerCase().includes(lower)
      )
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
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 text-sm"
          autoComplete="off" 
        />
        {value && (
          <button 
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
      })
      specs.forEach((name, id) => {
        options.push({ id, name, type: 'specialty', label: 'Specialty' })
      })

      // Add treatments
      const treatments = new Map<string, string>()
      allHospitals.forEach(hospital => {
        hospital.treatments?.forEach((treatment: TreatmentData) => {
          if (treatment.name) {
            const id = treatment._id || generateSlug(treatment.name)
            treatments.set(id, treatment.name)
          }
        })
        hospital.branches?.forEach((branch: BranchData) => {
          branch.treatments?.forEach((treatment: any) => {
            const name = extractProperName(treatment)
            const id = treatment?._id || generateSlug(name)
            if (name !== 'Unknown') treatments.set(id, name)
          })
        })
      })
      treatments.forEach((name, id) => {
        options.push({ id, name, type: 'treatment', label: 'Treatment' })
      })

      // Add cities
      const cities = new Map<string, string>()
      allHospitals.forEach(hospital => {
        hospital.branches?.forEach((branch: BranchData) => {
          if (branch.city) {
            const cityList = Array.isArray(branch.city) ? branch.city : [branch.city]
            cityList.forEach((city: any) => {
              const name = extractProperName(city)
              const id = city?._id || generateSlug(name)
              if (name !== 'Unknown') cities.set(id, name)
            })
          }
        })
      })
      cities.forEach((name, id) => {
        options.push({ id, name, type: 'city', label: 'City' })
      })

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

    setQuery(option.name)
    const slug = generateSlug(option.name)

    switch (type) {
      case 'doctor':
        router.push(`/doctors/${slug}`)
        break
      case 'specialty':
      case 'treatment':
        router.push(`/hospitals/?view=doctors&specialization=${encodeURIComponent(slug)}`)
        break
      case 'city':
        router.push(`/hospitals/?city=${encodeURIComponent(option.name)}`)
        break
      case 'branch':
        router.push(`/hospitals/?branch=${encodeURIComponent(slug)}`)
        break
    }
  }, [availableOptions, router])

  const clearSearch = () => {
    setQuery("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedQuery = query.trim()
    
    if (!trimmedQuery) return

    const matchingOption = availableOptions.find(option => 
      option.name.toLowerCase() === trimmedQuery.toLowerCase()
    )

    if (matchingOption) {
      handleOptionSelect(matchingOption.id, matchingOption.type)
      return
    }

    // Fallback search
    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`)
  }

  return (
    <div className="w-80">
      <form onSubmit={handleSubmit} className="flex justify-center">
        <SearchDropdown
          value={query}
          onChange={setQuery}
          placeholder="Search doctors, specialties, treatments, cities..."
          options={availableOptions}
          onOptionSelect={handleOptionSelect}
          onClear={clearSearch}
        />
      </form>
    </div>
  )
}

export default BranchFilter