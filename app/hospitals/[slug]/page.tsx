// File: app/hospitals/[slug]/page.tsx

"use client"

import { useState, useEffect, useCallback, useMemo, useRef, use } from "react"
import Image from "next/image"
import type { HospitalWithBranchPreview } from "@/types/hospital"
import {
  Hospital,
  Building2,
  Calendar,
  Bed,
  Award,
  Phone,
  Mail,
  Globe,
  MapPin,
  CalendarDays,
  Network,
  Star,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Scissors,
  Clock,
  Home,
  Users,
  Heart,
  Search,
  ChevronDown,
  X,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useEmblaCarousel from "embla-carousel-react"
import classNames from "classnames"
import ContactForm from "@/components/ContactForm"

// ==============================
// Interfaces
// ==============================

interface AccreditationType {
  _id: string;
  name: string;
  description: string | null;
  image: string | null;
  issuingBody: string | null;
  year: string | null;
}

type HospitalWithBranchPreviewExtended = HospitalWithBranchPreview & {
  accreditation?: AccreditationType[];
  city?: string;
}

// ==============================
// Helper Functions
// ==============================

const getWixImageUrl = (imageStr: string | null | undefined): string | null => {
  if (!imageStr || typeof imageStr !== "string" || !imageStr.startsWith("wix:image://v1/")) return null
  const parts = imageStr.split("/")
  return parts.length >= 4 ? `https://static.wixstatic.com/media/${parts[3]}` : null
}

const getImageUrl = (content: any): string | null => {
  if (typeof content === 'string') {
    return getWixImageUrl(content);
  }
  if (!content?.nodes) return null;
  const imageNode = content.nodes.find((node: any) => node.type === 'IMAGE');
  return imageNode?.imageData?.image?.src?.id
    ? `https://static.wixstatic.com/media/${imageNode.imageData.image.src.id}`
    : null;
}

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const generateBranchSlug = (hospitalSlug: string, branchName: string): string => {
  return `${hospitalSlug}-${generateSlug(branchName)}`
}

const removeBannersFromDescription = (html: string): string => {
  return html.replace(/<img[^>]*>/g, '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n')
}

const getTextContent = (content: any): string => {
  if (typeof content === 'string') return removeBannersFromDescription(content)
  if (!content?.nodes) return ''
  return content.nodes.map((node: any) =>
    node.type === 'PARAGRAPH' && node.nodes?.[0]?.textData?.text
      ? node.nodes[0].textData.text
      : ''
  ).filter(Boolean).join(' ')
}

const extractKeyPoints = (text: string, maxPoints: number = 2): string[] => {
  const sentences = text.split(/[.!?]\s+/).filter(s => s.trim().length > 10)
  return sentences.slice(0, maxPoints).map(s => s.trim().substring(0, 80) + (s.length > 80 ? '...' : ''))
}

const getHospitalCity = (hospital: any): string => {
  return hospital.branches?.[0]?.city?.[0]?.name || ''
}

// ==============================
// Filter Components
// ==============================

const FilterDropdown = <T extends string>({
  options,
  selectedValue,
  onChange,
  placeholder,
  className = ""
}: {
  options: T[]
  selectedValue: T | ''
  onChange: (value: T) => void
  placeholder: string
  className?: string
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options
    return options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [options, searchTerm])

  const displayValue = selectedValue || searchTerm

  const handleSelect = (option: T) => {
    onChange(option)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = () => {
    onChange('' as T)
    setSearchTerm('')
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={dropdownRef} className={classNames("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={displayValue}
          onChange={(e) => {
            const newVal = e.target.value
            setSearchTerm(newVal)
            if (selectedValue) onChange('' as T)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-12 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-sm transition-all placeholder:text-gray-400"
        />
        {displayValue && (
          <button
            onClick={handleClear}
            className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Clear filter"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
          aria-label="Toggle dropdown"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (searchTerm || filteredOptions.length > 0) && (
        <>
          <div
            className="fixed inset-0 z-10 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 z-20 bg-white border border-gray-200 rounded-md shadow-sm max-h-60 overflow-y-auto mt-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleSelect(option)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0 flex items-center gap-3 min-h-[44px]"
                >
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate text-sm text-gray-700">{option}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-4 text-sm text-gray-500 text-center">
                No cities match your search. Try a different term.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ==============================
// Search Dropdown Component (from branches page)
// ==============================

interface SearchDropdownProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  options: { id: string; name: string }[]
  selectedOption: string
  onOptionSelect: (id: string) => void
  onClear: () => void
  type: "branch" | "city" | "treatment" | "specialty"
}

const SearchDropdown = ({
  value,
  onChange,
  placeholder,
  options,
  selectedOption,
  onOptionSelect,
  onClear,
  type,
}: SearchDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const filteredOptions = useMemo(() => 
    options.filter(option =>
      option.name.toLowerCase().includes(value.toLowerCase())
    ), [options, value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectedOptionName = options.find(opt => opt.id === selectedOption)?.name

  const getIcon = () => {
    switch (type) {
      case "branch":
        return <Building2 className="w-4 h-4 text-gray-500" />
      case "city":
        return <MapPin className="w-4 h-4 text-gray-500" />
      case "treatment":
        return <Stethoscope className="w-4 h-4 text-gray-500" />
      case "specialty":
        return <Heart className="w-4 h-4 text-gray-500" />
      default:
        return <Search className="w-4 h-4 text-gray-500" />
    }
  }

  const getPlaceholder = () => {
    switch (type) {
      case "branch":
        return "e.g., Apollo Delhi Branch..."
      case "city":
        return "e.g., Mumbai, Delhi..."
      case "treatment":
        return "e.g., MRI Scan, Chemotherapy..."
      case "specialty":
        return "e.g., Cardiology, Neurology..."
      default:
        return placeholder
    }
  }

  const getLabel = () => {
    switch (type) {
      case "branch":
        return "Filter by Branch"
      case "city":
        return "Filter by City"
      case "treatment":
        return "Filter by Treatment"
      case "specialty":
        return "Filter by Specialty"
      default:
        return ""
    }
  }

  const getNoResultsText = () => {
    switch (type) {
      case "branch":
        return "branches"
      case "city":
        return "cities"
      case "treatment":
        return "treatments"
      case "specialty":
        return "specialties"
      default:
        return ""
    }
  }

  return (
    <div ref={dropdownRef} className="relative space-y-2">
      <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
        {getIcon()}
        <span className="">{getLabel()}</span>
      </label>

      <div className="relative">
       
        <input
          type="text"
          placeholder={getPlaceholder()}
          value={selectedOptionName || value}
          onChange={(e) => {
            onChange(e.target.value)
            if (selectedOption) onOptionSelect("")
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-3 pr-3 py-3 border border-gray-200 rounded-md w-full text-sm bg-white focus:bg-white focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all placeholder:text-gray-400 shadow-sm"
        />

        {(value || selectedOption) && (
          <button
            onClick={() => {
              onChange("")
              onOptionSelect("")
              onClear()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Clear filter"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
          aria-label="Toggle dropdown"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (value || filteredOptions.length > 0) && (
        <>
          <div
            className="fixed inset-0 z-10 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 z-20 bg-white border border-gray-200 rounded-md shadow-sm max-h-60 overflow-y-auto mt-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onOptionSelect(option.id)
                    onChange("")
                    setIsOpen(false)
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0 flex items-center gap-3 min-h-[44px]"
                >
                  {getIcon()}
                  <div className="font-medium text-gray-900">{option.name}</div>
                </button>
              ))
            ) : (
              <div className="px-4 py-4 text-sm text-gray-500 text-center">
                No {getNoResultsText()} match your search. Try a different term.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ==============================
// Hospital Search Component (from branches page)
// ==============================

const HospitalSearch = ({
  allHospitals
}: {
  allHospitals: any[]
}) => {
  const router = useRouter()

  // Build filter options from allHospitals
  const branchOptions = useMemo(() => {
    const branchMap: Record<string, string> = {}
    allHospitals.forEach((hospital: any) => {
      hospital.branches?.forEach((branch: any) => {
        if (branch?._id && branch?.name) {
          branchMap[branch._id] = branch.name
        }
      })
    })
    return Object.entries(branchMap).map(([id, name]) => ({ id, name }))
  }, [allHospitals])

  const cityOptions = useMemo(() => {
    const cityMap: Record<string, string> = {}
    allHospitals.forEach((hospital: any) => {
      hospital.branches?.forEach((branch: any) => {
        branch.city?.forEach((city: any) => {
          if (city?._id && city?.name) cityMap[city._id] = city.name
        })
      })
    })
    return Object.entries(cityMap).map(([id, name]) => ({ id, name }))
  }, [allHospitals])

  const treatmentOptions = useMemo(() => {
    const treatmentMap: Record<string, string> = {}
    allHospitals.forEach((hospital: any) => {
      hospital.treatments?.forEach((t: any) => {
        if (t?._id && t?.name) treatmentMap[t._id] = t.name
      })
      hospital.branches?.forEach((branch: any) =>
        branch.treatments?.forEach((t: any) => {
          if (t?._id && t?.name) treatmentMap[t._id] = t.name
        })
      )
    })
    return Object.entries(treatmentMap).map(([id, name]) => ({ id, name }))
  }, [allHospitals])

  const specializationOptions = useMemo(() => {
    const specializationSet = new Set<string>()
    allHospitals.forEach((hospital: any) => {
      hospital.branches?.forEach((branch: any) => {
        branch.treatments?.forEach((t: any) => {
          if (t?.category) specializationSet.add(t.category)
        })
        branch.doctors?.forEach((d: any) => {
          if (d.specialization) specializationSet.add(d.specialization)
        })
        branch.specialties?.forEach((s: any) => {
          if (s.name) specializationSet.add(s.name)
        })
      })
      hospital.treatments?.forEach((t: any) => {
        if (t?.category) specializationSet.add(t.category)
      })
      hospital.doctors?.forEach((d: any) => {
        if (d.specialization) specializationSet.add(d.specialization)
      })
    })
    return Array.from(specializationSet).map(name => ({ id: name, name }))
  }, [allHospitals])

  // States for filters
  const [branchQuery, setBranchQuery] = useState("")
  const [cityQuery, setCityQuery] = useState("")
  const [treatmentQuery, setTreatmentQuery] = useState("")
  const [specializationQuery, setSpecializationQuery] = useState("")
  const [selectedBranchId, setSelectedBranchId] = useState("")
  const [selectedCityId, setSelectedCityId] = useState("")
  const [selectedTreatmentId, setSelectedTreatmentId] = useState("")
  const [selectedSpecialization, setSelectedSpecialization] = useState("")

  const clearFilters = () => {
    setBranchQuery("")
    setCityQuery("")
    setTreatmentQuery("")
    setSpecializationQuery("")
    setSelectedBranchId("")
    setSelectedCityId("")
    setSelectedTreatmentId("")
    setSelectedSpecialization("")
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    let url = '/hospitals?'
    let params: string[] = []

    if (selectedBranchId || branchQuery) {
      params.push(`branch=${encodeURIComponent(selectedBranchId || branchQuery)}`)
    }
    if (selectedCityId || cityQuery) {
      params.push(`city=${encodeURIComponent(selectedCityId || cityQuery)}`)
    }
    if (selectedTreatmentId || treatmentQuery) {
      params.push(`treatment=${encodeURIComponent(selectedTreatmentId || treatmentQuery)}`)
    }
    if (selectedSpecialization || specializationQuery) {
      params.push(`specialty=${encodeURIComponent(selectedSpecialization || specializationQuery)}`)
    }

    if (params.length > 0) {
      router.push(url + params.join('&'))
    } else {
      router.push('/hospitals')
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <h3 className="heading-sm text-lg font-bold text-gray-900 flex items-center gap-2">
        <Building2 className="w-5 h-5 text-gray-600" />
        Search Hospitals
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <SearchDropdown
          value={cityQuery}
          onChange={setCityQuery}
          placeholder="Search cities..."
          options={cityOptions}
          selectedOption={selectedCityId}
          onOptionSelect={setSelectedCityId}
          onClear={() => {
            setCityQuery("")
            setSelectedCityId("")
          }}
          type="city"
        />
        <SearchDropdown
          value={treatmentQuery}
          onChange={setTreatmentQuery}
          placeholder="Search treatments..."
          options={treatmentOptions}
          selectedOption={selectedTreatmentId}
          onOptionSelect={setSelectedTreatmentId}
          onClear={() => {
            setTreatmentQuery("")
            setSelectedTreatmentId("")
          }}
          type="treatment"
        />
        <SearchDropdown
          value={specializationQuery}
          onChange={setSpecializationQuery}
          placeholder="Search specialties..."
          options={specializationOptions}
          selectedOption={selectedSpecialization}
          onOptionSelect={setSelectedSpecialization}
          onClear={() => {
            setSpecializationQuery("")
            setSelectedSpecialization("")
          }}
          type="specialty"
        />
        <button
          type="submit"
          className="w-full bg-[#74BF44] text-white py-2 rounded-lg hover:bg-[#74BF44]/80 transition-colors font-medium shadow-sm hover:shadow-md"
        >
          Search
        </button>
        <button
          type="button"
          onClick={clearFilters}
          className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium shadow-sm hover:shadow-md"
        >
          Clear Filters
        </button>
      </form>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Redirects to hospital list with filtered results
      </p>
    </div>
  )
}

// ==============================
// Reusable Components
// ==============================

const BreadcrumbNav = ({ hospitalName }: { hospitalName: string }) => (
  <nav aria-label="Breadcrumb" className="bg-white border-b border-gray-100">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <ol className="flex items-center space-x-2 text-sm py-4 text-gray-500">
        <li>
          <Link href="/" className="flex items-center hover:text-gray-700 transition-colors duration-200">
            <Home className="w-4 h-4 mr-2" />
            Home
          </Link>
        </li>
        <li><span className="text-gray-300">/</span></li>
        <li>
          <Link href="/hospitals" className="hover:text-gray-700 transition-colors duration-200">
            Hospitals
          </Link>
        </li>
        <li><span className="text-gray-300">/</span></li>
        <li className="text-gray-900 font-medium truncate">{hospitalName}</li>
      </ol>
    </div>
  </nav>
)

const StatCard = ({ icon: Icon, value, label }: { icon: any; value: string | number; label: string }) => (
  <div className="text-center p-6 bg-white md:bg-gray-50 rounded-lg border border-gray-50 shadow-sm  group">
    <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center mx-auto mb-2 md:mb-4 group-hover:bg-white transition-colors duration-200">
      <Icon className="w-6 h-6 text-gray-600 group-hover:text-gray-700" />
    </div>
    <p className="title-text text-2xl font-bold text-gray-900 mb-1">{value}</p>
    <p className="description-2 text-gray-500 text-sm font-medium uppercase tracking-wide">{label}</p>
  </div>
)

const ImageWithFallback = ({
  src,
  alt,
  fallbackIcon: Icon,
  className = "",
  fallbackClassName = ""
}: {
  src: string | null;
  alt: string;
  fallbackIcon: any;
  className?: string;
  fallbackClassName?: string;
}) => {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover ${className}`}
      />
    )
  }

  return (
    <div className={`w-full h-full flex items-center justify-center bg-gray-50 rounded-lg ${fallbackClassName}`}>
      <Icon className="w-12 h-12 text-gray-300" />
    </div>
  )
}

// ==============================
// Modern Card Components
// ==============================

const DoctorCard = ({ doctor }: { doctor: any }) => {
  const doctorImage = getImageUrl(doctor.profileImage)
  const doctorSlug = doctor.slug || generateSlug(doctor.name)

  return (
    <Link
      href={`/doctors/${doctorSlug}`}
      className="group flex flex-col h-full bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden "
    >
      {/* Image Section */}
      <div className="relative h-60 md:bg-gray-50 overflow-hidden">
        <ImageWithFallback
          src={doctorImage}
          alt={doctor.name}
          fallbackIcon={Stethoscope}
          className="object-cover w-full h-full "
        />
        {doctor.experience && (
          <div className="inline-flex absolute top-2 right-2 items-center gap-1 text-xs text-gray-600 bg-white px-1 py-0.5 rounded-full mt-2 w-fit">
            <Star className="w-3 h-3 text-gray-500" />
            <span>{doctor.experience} yrs </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Info Section */}
      <div className="flex flex-col flex-1 bg-white md:bg-gray-50 p-4">
        <h5 className="title-text text-base font-semibold text-gray-900 mb-1 line-clamp-1">{doctor.name}</h5>
      </div>
    </Link>

  )
}

const TreatmentCard = ({ treatment }: { treatment: any }) => {
  const treatmentImage = getImageUrl(treatment.treatmentImage)
  const treatmentSlug = treatment.slug || generateSlug(treatment.name)

  return (
    <Link href={`/treatment/${treatmentSlug}`} className="group h-full flex flex-col hover:no-underline bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden ">
      <div className="relative h-60 md:h-48 overflow-hidden bg-gray-50">
        <ImageWithFallback
          src={treatmentImage}
          alt={treatment.name}
          fallbackIcon={Scissors}
          className="group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4 flex-1 flex bg-white md:bg-gray-50 flex-col">
        <h5 className="title-text font-semibold text-gray-900 text-base mb-2 line-clamp-1">{treatment.name}</h5>
      </div>
    </Link>
  )
}

const BranchCard = ({ branch, hospitalSlug }: { branch: any; hospitalSlug: string }) => {
  const branchImage = getImageUrl(branch.branchImage)
  const branchSlug = generateBranchSlug(hospitalSlug, branch.name)
  const branchCity = (branch.city || [])[0]?.name || (branch.city || '')

  return (
    <Link href={`/hospitals/branches/${branchSlug}`} className="group block bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden ">
      <div className="relative w-full h-60 md:h-40 overflow-hidden bg-gray-50">
        <ImageWithFallback
          src={branchImage}
          alt={`${branch.name} facility`}
          fallbackIcon={Building2}
          className="group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4 bg-white md:bg-gray-50">
        <h5 className="title-text font-semibold text-gray-900 text-base mb-2 line-clamp-1">{branch.name}</h5>
        {branchCity && (
          <p className="description-1 text-gray-600 text-sm leading-relaxed line-clamp-2">
            {branchCity}
          </p>
        )}
      </div>
    </Link>
  )
}

const SimilarHospitalCard = ({ hospital }: { hospital: any }) => {
  const hospitalImage = getImageUrl(hospital.image) || getImageUrl(hospital.logo)
  const hospitalSlug = hospital.slug ? hospital.slug.replace(/^\/+/, '') : generateSlug(hospital.name)
  const hospitalCity = getHospitalCity(hospital)

  return (
    <Link
      href={`/hospitals/${hospitalSlug}`}
      className="group flex flex-col h-full md:bg-white md:border border-gray-100 md:rounded-lg md:shadow-sm overflow-hidden"
    >
      {/* Image Section */}
      <div className="relative h-60 md:h-60 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <ImageWithFallback
          src={hospitalImage}
          alt={hospital.name}
          fallbackIcon={Hospital}
          className="object-cover w-full h- full transition-transform duration-700 group-hover:scale-105"
        />

        {/* Accreditation Badges */}
        {hospital.accreditation && hospital.accreditation.length > 0 && (
          <div className="absolute top-3 right-3 flex flex-col gap-1">
            {hospital.accreditation.slice(0, 2).map((acc: AccreditationType) => (
              <div key={acc._id} className="bg-white/80 backdrop-blur-md text-gray-800 text-xs font-medium px-2 py-1 rounded-full shadow-sm border border-gray-100 flex items-center gap-1">
                {acc.image ? (
                  <img
                    src={getWixImageUrl(acc.image)}
                    alt={acc.name}
                    className="w-3 h-3 rounded object-contain"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                ) : (
                  <Award className="w-3 h-3" />
                )}
                <span>{acc.name}</span>
              </div>
            ))}
            {hospital.accreditation.length > 2 && (
              <div className="bg-white/80 backdrop-blur-md text-gray-600 text-xs px-2 py-1 rounded-full shadow-sm border border-gray-100">
                +{hospital.accreditation.length - 2} more
              </div>
            )}
          </div>
        )}

        {/* Soft Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 p-4 bg-gray-50">
        {/* Hospital Name */}
        <h3 className="title-text text-lg font-semibold text-gray-900 mb-1 line-clamp-1 tracking-tight group-hover:text-gray-800 transition-colors">
          {hospital.name}
        </h3>

        {/* City */}
        {hospitalCity && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100">
              <MapPin className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <p className="description-1 text-sm text-gray-600 font-medium">{hospitalCity}</p>
          </div>
        )}

        {/* Stats */}
        <div className="space-y-2 text-xs text-gray-500 mt-auto pt-3 border-t border-gray-100">
          {(hospital.beds || hospital.noOfBeds) && <p className="description-2 flex items-center gap-1"><Bed className="w-3 h-3" /> {hospital.beds || hospital.noOfBeds} Beds</p>}
          {hospital.branches?.length > 0 && <p className="description-2 flex items-center gap-1"><Network className="w-3 h-3" /> {hospital.branches.length} Branches</p>}
          {hospital.yearEstablished && <p className="description-2 flex items-center gap-1"><CalendarDays className="w-3 h-3" />  {hospital.yearEstablished}</p>}
        </div>
      </div>
    </Link>
  )
}

// ==============================
// Carousel Components
// ==============================

const CarouselControls = ({ onPrev, onNext, show }: { onPrev: () => void; onNext: () => void; show: boolean }) => {
  if (!show) return null

  return (
    <div className="flex gap-2">
      <button
        onClick={onPrev}
        className="bg-white rounded-full p-3 shadow-sm border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-4 h-4 text-gray-600" />
      </button>
      <button
        onClick={onNext}
        className="bg-white rounded-full p-3 shadow-sm border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
        aria-label="Next slide"
      >
        <ChevronRight className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  )
}

const EmblaCarousel = ({
  items,
  title,
  icon: Icon,
  type
}: {
  items: any[],
  title: string,
  icon: any,
  type: 'doctors' | 'treatments' | 'hospitals'
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
  })

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  const itemsPerView = 3
  const visibleSlidesClass = 'w-full sm:w-1/2 lg:w-[calc(33.333%-0.666rem)]'

  const renderCard = (item: any) => {
    switch (type) {
      case 'doctors':
        return <DoctorCard doctor={item} />
      case 'treatments':
        return <TreatmentCard treatment={item} />
      case 'hospitals':
        return <SimilarHospitalCard hospital={item} />
      default:
        return null
    }
  }

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-2 md:mb-4">
        <h3 className="heading-sm text-xl font-bold text-gray-900 flex items-center gap-3">
          <Icon className="w-5 h-5 text-gray-600" />
          {title}
        </h3>
        <CarouselControls onPrev={scrollPrev} onNext={scrollNext} show={items.length > itemsPerView} />
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-5">
          {items.map((item, index) => (
            <div key={item._id || index} className={classNames(
              "flex-shrink-0",
              visibleSlidesClass
            )}>
              {renderCard(item)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ==============================
// Skeleton Components
// ==============================

const HospitalDetailSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Hero Skeleton */}
    <section className="relative w-full h-[70vh] bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-800/40 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full z-10 px-6 pb-12">
        <div className="container mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-gray-300 rounded-full w-16 h-16" />
                <div className="space-y-2">
                  <div className="h-8 bg-gray-300 rounded w-64" />
                  <div className="h-6 bg-gray-300 rounded w-96" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Main Content Skeleton */}
    <section className="py-12 relative z-10">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-12 gap-8 pb-12">
          <main className="lg:col-span-8 space-y-8">
            {/* Overview Skeleton */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-8 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto" />
                    <div className="h-6 bg-gray-200 rounded-lg mx-auto w-20" />
                    <div className="h-4 bg-gray-200 rounded mx-auto w-16" />
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </section>
  </div>
)

// ==============================
// Error State Component
// ==============================

const ErrorState = ({ error }: { error: string }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 relative">
    <div className="absolute top-6 left-6">
      <Link href="/hospitals" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 bg-white px-4 py-3 rounded-lg border border-gray-200 hover:shadow-md">
        <ChevronLeft className="w-5 h-5" />
        Back to Search
      </Link>
    </div>
    <div className="text-center space-y-6 max-w-md p-8 bg-white rounded-lg border border-gray-200">
      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
        <Hospital className="w-8 h-8 text-gray-400" />
      </div>
      <h2 className="title-text text-2xl font-bold text-gray-900">Hospital Not Found</h2>
      <p className="description-1 text-gray-600 leading-relaxed">
        {error || "The requested hospital could not be found. Please check the URL or try searching again."}
      </p>
      <Link
        href="/hospitals"
        className="inline-block w-full bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
      >
        Go to Hospital Search
      </Link>
    </div>
  </div>
)

// ==============================
// Hero Section Component
// ==============================

const HeroSection = ({ hospital, params }: { hospital: HospitalWithBranchPreviewExtended; params: { slug: string } }) => {
  const hospitalImage = getImageUrl(hospital.image)
  const hospitalLogo = getImageUrl(hospital.logo)

  return (
    <section className="relative w-full h-[50vh] md:h-[70vh]">
      {hospitalImage ? (
        <Image
          src={hospitalImage}
          alt={`${hospital.name} facility`}
          fill
          priority
          className="object-cover object-center"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-800/40 to-transparent" />

      <div className="absolute top-6 left-6 z-10">
        <Link href="/hospitals" className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors duration-200 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/20 hover:bg-white/20">
          <ChevronLeft className="w-5 h-5" />
          Back to Search
        </Link>
      </div>

      <div className="absolute bottom-0 left-0 w-full z-10 px-2 md:px-6 pb-12 text-white">
        <div className="container mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-0">
              <div className="flex flex-wrap gap-2">
                {hospital.accreditation && hospital.accreditation.length > 0 && hospital.accreditation.slice(0, 3).map((acc: AccreditationType) => (
                  <span key={acc._id} className="flex items-center gap-x-3 p-1 ">
                    {acc.image ? (
                      <img
                        src={getWixImageUrl(acc.image)}
                        alt={acc.name}
                        className="w-10 h-10 rounded-full object-contain"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    ) : (
                      <Award className="w-4 h-4" />
                    )}
                    <div className="text-sm font-medium">{acc.name}</div>
                  </span>
                ))}
                {hospital.emergencyServices && (
                  <span className="flex items-center gap-2 bg-gray-800/30 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold border border-gray-500/30">
                    <Clock className="w-4 h-4" />
                    24/7 Emergency
                  </span>
                )}
              </div>
              <div className="flex items-start gap-4">
                {hospitalLogo && (
                  <div className="relative w-20 h-20 bg-white rounded-full p-3 flex-shrink-0">
                    <Image
                      src={hospitalLogo}
                      alt={`${hospital.name} logo`}
                      fill
                      className="object-contain rounded-full"
                    />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl md:text-4xl text-white font-bold leading-tight mb-2">
                    {hospital.name}
                  </h1>
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ==============================
// Main Component
// ==============================

export default function HospitalDetail({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [hospital, setHospital] = useState<HospitalWithBranchPreviewExtended | null>(null)
  const [similarHospitals, setSimilarHospitals] = useState<any[]>([])
  const [allHospitals, setAllHospitals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllBranches, setShowAllBranches] = useState(false)

  // Branch filters
  const [selectedCity, setSelectedCity] = useState('')

  useEffect(() => {
    const fetchHospitalData = async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/hospitals')
        if (!res.ok) throw new Error("Failed to fetch hospitals")

        const data = await res.json()
        if (!data.items?.length) throw new Error("No hospitals available")

        setAllHospitals(data.items)

        const matchedHospital = data.items.find((h: HospitalWithBranchPreviewExtended) =>
          generateSlug(h.name) === resolvedParams.slug
        )

        if (!matchedHospital) throw new Error("Hospital not found")

        const hospitalCity = getHospitalCity(matchedHospital)
        const hospitalWithCity = { ...matchedHospital, city: hospitalCity }
        setHospital(hospitalWithCity)

        // Compute city for all hospitals
        const hospitalsWithCity = data.items.map((h: any) => ({
          ...h,
          city: getHospitalCity(h)
        }))

        // Find similar hospitals (same city or same accreditation)
        const similar = hospitalsWithCity
          .filter((h: any) =>
            h._id !== matchedHospital._id &&
            (h.city === hospitalCity || h.accreditation?.some((acc: AccreditationType) => 
              matchedHospital.accreditation?.some((mAcc: AccreditationType) => mAcc.name === acc.name)
            ))
          )
          .slice(0, 6)

        setSimilarHospitals(similar)

      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load hospital details")
      } finally {
        setLoading(false)
      }
    }

    if (resolvedParams.slug) {
      fetchHospitalData()
    }
  }, [resolvedParams.slug])

  const computedStats = useMemo(() => {
    if (!hospital) return { totalBeds: 0, totalDoctors: 0, totalBranches: 0, yearEstablished: 'N/A' };

    const totalBeds = hospital.branches?.reduce((sum, b) => sum + (parseInt(b.totalBeds || b.beds || '0') || 0), 0) || 0;
    const totalDoctors = hospital.branches?.reduce((sum, b) => {
      const num = parseInt((b.noOfDoctors || '0').replace(/[^\d]/g, ''));
      return sum + (isNaN(num) ? 0 : num);
    }, 0) || 0;
    const totalBranches = hospital.branches?.length || 0;
    const yearEstablished = hospital.yearEstablished || 'N/A';

    return { totalBeds, totalDoctors, totalBranches, yearEstablished };
  }, [hospital]);

  const uniqueCities = useMemo(() => {
    if (!hospital) return []
    const cities = hospital.branches?.flatMap(branch => 
      (branch.city || []).map(city => city.name || city)
    ).filter(Boolean)
    return [...new Set(cities)] as string[]
  }, [hospital])

  // Filter branches
  const filteredBranches = useMemo(() => {
    if (!hospital) return []
    return (hospital.branches || []).filter(branch => {
      const branchCity = (branch.city || [])[0]?.name || (branch.city || '')
      const matchesCity = !selectedCity || branchCity === selectedCity
      return matchesCity
    })
  }, [hospital, selectedCity])

  const visibleBranches = showAllBranches
    ? filteredBranches
    : filteredBranches.slice(0, 3)

  if (loading) return <HospitalDetailSkeleton />
  if (error || !hospital) return <ErrorState error={error || "Hospital not found"} />

  // Data processing
  const processedDescription = hospital.description ? removeBannersFromDescription(hospital.description) : null

  const allDoctors = hospital.branches?.flatMap(branch =>
    (branch.doctors || []).map(doctor => ({ ...doctor, branch: branch.name }))
  ) || []

  const allTreatments = hospital.branches?.flatMap(branch =>
    (branch.treatments || []).map(treatment => ({ ...treatment, branch: branch.name }))
  ) || []

  const uniqueDoctors = allDoctors.filter((doctor, index, self) =>
    index === self.findIndex(d => d._id === doctor._id)
  ).slice(0, 6)

  const uniqueTreatments = allTreatments.filter((treatment, index, self) =>
    index === self.findIndex(t => t._id === treatment._id)
  ).slice(0, 6)

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection hospital={hospital} params={resolvedParams} />
      <BreadcrumbNav hospitalName={hospital.name} />

      <section className="py-12 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-8 pb-12">
            <main className="lg:col-span-8 p-2 space-y-8">
              {/* Key Statistics */}
              <section className="md:bg-white md:rounded-lg md:border border-gray-200  md:p-8">
                <h2 className="heading-sm text-2xl font-bold text-gray-900 mb-4">Hospital Overview</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                  <StatCard icon={Building2} value={computedStats.totalBranches} label="Branches" />
                  <StatCard icon={Bed} value={computedStats.totalBeds} label="Total Beds" />
                  <StatCard icon={Users} value={computedStats.totalDoctors} label="Doctors" />
                  <StatCard icon={Calendar} value={` ${computedStats.yearEstablished}`} label="Established" />
                </div>
              </section>

              {/* About Section */}
              {processedDescription && (
                <section className="md:bg-white md:rounded-lg md:border border-gray-200  md:p-8">
                  <h2 className="heading-sm text-xl font-bold text-gray-900 mb-2 md:mb-4">About {hospital.name}</h2>
                  <div
                    className="description-1 text-gray-700 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: processedDescription }}
                  />
                </section>
              )}

              {/* Branches Section */}
              {hospital.branches?.length > 0 && (
                <section className="md:bg-white rounded-lg md:border border-gray-200  md:p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-4">
                    <h2 className="heading-sm text-xl font-bold text-gray-900">Nearby Branches</h2>
                    <div className="flex items-center gap-4 w-full lg:w-auto">
                      <FilterDropdown
                        options={uniqueCities}
                        selectedValue={selectedCity}
                        onChange={setSelectedCity}
                        placeholder="All Cities"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleBranches.length > 0 ? (
                      visibleBranches.map((branch) => (
                        <BranchCard key={branch._id} branch={branch} hospitalSlug={resolvedParams.slug} />
                      ))
                    ) : (
                      <p className="col-span-full text-center text-gray-500 py-8">No branches found matching the filters.</p>
                    )}
                  </div>
                  {filteredBranches.length > 3 && !showAllBranches && (
                    <div className="text-center pt-8">
                      <button
                        onClick={() => setShowAllBranches(true)}
                        className="bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                      >
                        View All {filteredBranches.length} Branches
                      </button>
                    </div>
                  )}
                </section>
              )}

              {/* Doctors Section */}
              {uniqueDoctors.length > 0 && (
                <section className="md:bg-white md:rounded-lg md:border border-gray-200 md:p-8">
                  <EmblaCarousel
                    items={uniqueDoctors}
                    title="Specialist Doctors"
                    icon={Users}
                    type="doctors"
                  />
                </section>
              )}

              {/* Treatments Section */}
              {uniqueTreatments.length > 0 && (
                <section className="md:bg-white md:rounded-lg md:border border-gray-200 md:p-8">
                  <EmblaCarousel
                    items={uniqueTreatments}
                    title="Key Treatments"
                    icon={Heart}
                    type="treatments"
                  />
                </section>
              )}

              {/* Similar Hospitals Section */}
              {similarHospitals.length > 0 && (
                <section className="md:bg-white md:rounded-lg md:border border-gray-200 md:p-8">
                  <EmblaCarousel
                    items={similarHospitals}
                    title="Similar Hospitals"
                    icon={Hospital}
                    type="hospitals"
                  />
                </section>
              )}

            </main>

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-6">
              <HospitalSearch allHospitals={allHospitals} />
              <ContactForm />
            
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}