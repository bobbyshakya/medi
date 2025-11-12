// app/doctors/[slug]/page.tsx
"use client"
import { useState, useEffect, useMemo, useCallback } from "react"
import type { HospitalType, ExtendedDoctorType, BranchType, CityType, SpecialtyType, TreatmentType } from "@/types/hospital" // Assume types from hospitals/page.tsx
import {
  Users,
  Clock,
  Award,
  Phone,
  Mail,
  Globe,
  MapPin,
  Building2,
  Calendar,
  Bed,
  Heart,
  ChevronLeft,
  Loader2,
  Stethoscope,
  Scissors,
  ChevronRight,
  ArrowLeft,
  Home,
  Hospital,
  Search,
  X,
  Filter,
  Star,
  DollarSign,
  BookOpen,
  Plus
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import classNames from "classnames"
import ContactForm from "@/components/ContactForm"
import { Inter } from "next/font/google"
import useEmblaCarousel from 'embla-carousel-react'

const inter = Inter({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  variable: "--font-inter"
})

// Utility functions
const getWixImageUrl = (imageStr: string | null | undefined): string | null => {
  if (!imageStr || typeof imageStr !== "string" || !imageStr.startsWith("wix:image://v1/")) return null
  const parts = imageStr.split("/")
  return parts.length >= 4 ? `https://static.wixstatic.com/media/${parts[3]}` : null
}

const generateSlug = (name: string | null | undefined): string => {
  if (!name || typeof name !== 'string') return ''
  return name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
}

const getDoctorImage = (imageData: any): string | null => getWixImageUrl(imageData)
const getTreatmentImage = (imageData: any): string | null => getWixImageUrl(imageData)
const getHospitalImage = (imageData: any): string | null => getWixImageUrl(imageData)

// Helper: Short plain text from rich content
const getShortDescription = (richContent: any, maxLength: number = 100): string => {
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

// Helper: Render rich text
const renderRichText = (richContent: any): JSX.Element | null => {
  if (typeof richContent === 'string') {
    return <div className={`text-base text-gray-700 leading-relaxed space-y-3 prose prose-sm max-w-none font-light ${inter.variable}`} dangerouslySetInnerHTML={{ __html: richContent }} />
  }
  if (!richContent?.nodes) return null

  const renderNode = (node: any): JSX.Element | null => {
    switch (node.type) {
      case 'PARAGRAPH':
        return (
          <p key={Math.random()} className={`text-base text-gray-700 leading-relaxed mb-2 font-light ${inter.variable}`}>
            {node.nodes?.map((child: any, idx: number) => renderTextNode(child, idx))}
          </p>
        )
      case 'HEADING1':
        return (
          <h3 key={Math.random()} className={`text-xl md:text-2xl font-medium text-gray-900 mb-2 leading-tight ${inter.variable}`}>
            {node.nodes?.map((child: any, idx: number) => renderTextNode(child, idx))}
          </h3>
        )
      case 'HEADING2':
        return (
          <h4 key={Math.random()} className={`text-xl md:text-xl font-medium text-gray-900 mb-2 leading-tight ${inter.variable}`}>
            {node.nodes?.map((child: any, idx: number) => renderTextNode(child, idx))}
          </h4>
        )
      case 'IMAGE':
        const imgSrc = getWixImageUrl(node.imageData?.image?.src)
        if (imgSrc) {
          return (
            <div key={Math.random()} className="my-4">
              <img 
                src={imgSrc} 
                alt="Embedded image" 
                className="w-full h-auto rounded-xs max-w-full" 
                onError={(e) => { e.currentTarget.style.display = "none" }} 
              />
            </div>
          )
        }
        return null
      default:
        return null
    }
  }

  const renderTextNode = (textNode: any, idx: number): JSX.Element | null => {
    if (textNode.type !== 'TEXT') return null
    const text = textNode.text || ''
    const isBold = textNode.textStyle?.bold || false
    const isItalic = textNode.textStyle?.italic || false
    const isUnderline = textNode.textStyle?.underline || false
    let content = text
    if (isBold) content = <strong key={idx} className="font-medium">{text}</strong>
    else if (isItalic) content = <em key={idx}>{text}</em>
    else if (isUnderline) content = <u key={idx}>{text}</u>
    else content = <span key={idx} className={`font-light ${inter.variable}`}>{text}</span>
    return content
  }

  return (
    <div className={`space-y-4 ${inter.variable} font-light`}>
      {richContent.nodes.map((node: any, idx: number) => renderNode(node))}
    </div>
  )
}

// Helper to deduplicate and merge treatments
const mergeTreatments = (existing: TreatmentType[] | undefined, current: TreatmentType[] | undefined): TreatmentType[] => {
  const allTreatments = [...(existing || []), ...(current || [])]
  const treatmentMap = new Map<string, TreatmentType>()
  allTreatments.forEach(t => {
    if (t._id) {
      treatmentMap.set(t._id, t)
    }
  })
  return Array.from(treatmentMap.values())
}

// Data Fetching Logic (Updated)
const getAllExtendedDoctors = (hospitals: HospitalType[]): ExtendedDoctorType[] => {
  const extendedMap = new Map<string, ExtendedDoctorType>()

  hospitals.forEach((h) => {
    const processDoctor = (item: any, branch?: BranchType) => {
      // Use doctorName as fallback for _id if it's missing (though _id is preferred)
      const baseId = item._id || item.doctorName

      if (!baseId || !item.doctorName) return // Skip if no identifiable info

      const doctorDepartments: any[] = []
      item.specialization?.forEach((spec: any) => {
        spec.department?.forEach((dept: any) => {
          doctorDepartments.push(dept)
        })
      })
      const uniqueDepartments = Array.from(new Map(doctorDepartments.map(dept => [dept._id, dept])).values())

      const location = {
        hospitalName: h.hospitalName,
        hospitalId: h._id,
        branchName: branch?.branchName,
        branchId: branch?._id,
        cities: branch?.city || [],
      }
      
      const treatmentsFromThisLocation = mergeTreatments(
        branch?.treatments,
        h.treatments
      )

      if (extendedMap.has(baseId)) {
        const existingDoctor = extendedMap.get(baseId)!
        
        // 1. Merge locations
        const isLocationDuplicate = existingDoctor.locations.some(
          loc => loc.hospitalId === h._id && (loc.branchId === branch?._id || (!loc.branchId && !branch?._id))
        )
        if (!isLocationDuplicate) {
          existingDoctor.locations.push(location)
        }
        
        // 2. Merge departments
        const allDepts = [...existingDoctor.departments, ...uniqueDepartments]
        existingDoctor.departments = Array.from(new Map(allDepts.map(dept => [dept._id, dept])).values())
        
        // 3. Merge related treatments (Deduplicated)
        existingDoctor.relatedTreatments = mergeTreatments(existingDoctor.relatedTreatments, treatmentsFromThisLocation)
        
      } else {
        extendedMap.set(baseId, {
          ...item,
          baseId,
          locations: [location],
          departments: uniqueDepartments,
          relatedTreatments: treatmentsFromThisLocation,
        } as ExtendedDoctorType)
      }
    }

    h.doctors.forEach((d: any) => processDoctor(d))
    h.branches.forEach((b: any) => {
      b.doctors.forEach((d: any) => processDoctor(d, b))
    })
  })

  return Array.from(extendedMap.values())
}

// Helper to get all unique specialties across hospitals with merged treatments
const getAllSpecialties = (hospitals: HospitalType[]): any[] => {
  const specMap = new Map<string, any>()

  hospitals.forEach((h) => {
    const processSpecs = (specs: any[]) => {
      specs?.forEach((spec: any) => {
        if (spec?._id && spec?.name) {
          if (!specMap.has(spec._id)) {
            specMap.set(spec._id, { ...spec, treatments: spec.treatments || [] })
          } else {
            const existing = specMap.get(spec._id)
            if (spec.treatments && existing.treatments) {
              existing.treatments = mergeTreatments(existing.treatments, spec.treatments)
            }
          }
        }
      })
    }

    h.doctors?.forEach((d: any) => processSpecs(d.specialization || []))
    h.branches?.forEach((b: any) => {
      b.doctors?.forEach((d: any) => processSpecs(d.specialization || []))
    })
  })

  return Array.from(specMap.values()).sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
}

// Searchable Dropdown Component
const SearchableDropdown = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  icon: Icon 
}: { 
  options: string[], 
  value: string, 
  onChange: (value: string) => void, 
  placeholder: string, 
  icon?: any 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState('')

  const filteredOptions = useMemo(() => 
    options.filter(opt => opt.toLowerCase().includes(filter.toLowerCase()))
  , [options, filter])

  // NOTE: Display current value if set, otherwise display the filter text.
  // We check `value` against `options` to ensure it's a valid selection before setting `displayValue`
  const isValidValue = options.includes(value)
  const displayValue = isValidValue ? value : filter

  const handleSelect = useCallback((opt: string) => {
    onChange(opt)
    setFilter('') // Clear local filter on select
    setIsOpen(false)
  }, [onChange])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setFilter(newValue)
    if (isValidValue && value !== newValue) {
      // If a valid option was selected but the user starts typing, clear the selected value
      onChange('') 
    }
  }, [onChange, value, isValidValue])

  const handleBlur = useCallback(() => {
    // Timeout to allow click on dropdown item to register before closing
    setTimeout(() => setIsOpen(false), 200) 
  }, [])

  return (
    <div className="relative">
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />}
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white"
        />
        {value && (
            <button
                onClick={() => handleSelect('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                aria-label="Clear selection"
            >
                <X className="w-4 h-4" />
            </button>
        )}
      </div>
      {isOpen && (
        <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto mt-1">
          {filteredOptions.map((opt) => (
            <li
              key={opt}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700"
              onClick={() => handleSelect(opt)}
            >
              {opt}
            </li>
          ))}
          {filteredOptions.length === 0 && (
            <li className="px-3 py-2 text-gray-500 text-sm">No matching options</li>
          )}
        </ul>
      )}
    </div>
  )
}

// Breadcrumb (adapted for doctor)
const Breadcrumb = ({ doctorName }: { doctorName: string }) => (
  <nav className={`bg-white border-b border-gray-100 py-6 ${inter.variable} font-light`}>
    <div className="container mx-auto px-6">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/" className="flex items-center gap-1 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-xs">
          <Home className="w-4 h-4" />
          Home
        </Link>
        <span>/</span>
        <Link href="/doctors" className="hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-xs">
          Doctors
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{doctorName}</span>
      </div>
    </div>
  </nav>
)

// Specialty with Treatments Section (Updated to show all specialties list)
const SpecialtyWithTreatments = ({ 
  specialties, 
  selectedTreatment 
}: { 
  specialties: any[], 
  selectedTreatment: string 
}) => {
  const [specialtySearch, setSpecialtySearch] = useState('')

  const filteredSpecialties = useMemo(() => {
    return specialties.filter(spec => 
      spec.name?.toLowerCase().includes(specialtySearch.toLowerCase())
    )
  }, [specialties, specialtySearch])

  const allSpecialtyNames = useMemo(() => 
    specialties.map(spec => spec.name || '').filter(Boolean).sort(),
  [specialties])

  if (!filteredSpecialties?.length) return null

  const filteredTreatmentsForSpec = (treatments: any[]) => {
    if (!selectedTreatment) return treatments
    return treatments.filter(t => t.name?.toLowerCase().includes(selectedTreatment.toLowerCase()))
  }

  return (
    <section className={`bg-white p-8 rounded-xs shadow-sm border border-gray-50 ${inter.variable} font-light`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl md:text-3xl font-medium text-gray-900 tracking-tight flex items-center gap-3">
          <Heart className="w-7 h-7 text-gray-600" />
          Specialties & Related Treatments
        </h2>
        <SearchableDropdown
          options={allSpecialtyNames}
          value={specialtySearch}
          onChange={setSpecialtySearch}
          placeholder="Search specialties..."
          icon={Search}
        />
      </div>
      {/* All Specialties List */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">All Specialties ({filteredSpecialties.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {filteredSpecialties.map((spec: any) => (
            <Link 
              key={spec._id || spec.name} 
              href={`/specialties/${generateSlug(spec.name)}`} 
              className="block p-3 bg-gray-50 rounded-xs border border-gray-100 hover:bg-gray-100 transition-colors text-center text-sm font-medium text-gray-700"
            >
              {spec.name}
            </Link>
          ))}
        </div>
      </div>
      <div className="space-y-8">
        {filteredSpecialties.map((spec: any) => (
          <div key={spec._id || spec.name} className="border-b border-gray-50 pb-8 last:border-b-0">
            <Link 
              href={`/specialties/${generateSlug(spec.name)}`}
              className="flex items-center gap-3 p-4 bg-gray-50/30 rounded-xs hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 mb-4 block"
            >
              <Stethoscope className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <span className="text-lg text-gray-700 font-medium">{spec.name || 'N/A'}</span>
            </Link>
            {spec.treatments && spec.treatments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTreatmentsForSpec(spec.treatments).map((treatment: any) => (
                  <Link 
                    key={treatment._id} 
                    href={`/treatments/${generateSlug(treatment.name)}`} 
                    className="block p-4 bg-white/80 rounded-xs border border-gray-50 overflow-hidden shadow-sm hover:shadow-md transition-all h-full flex flex-col"
                  >
                    <div className="relative h-32 bg-gray-50 mb-3">
                      {getTreatmentImage(treatment.treatmentImage) ? (
                        <img 
                          src={getTreatmentImage(treatment.treatmentImage)!} 
                          alt={treatment.name} 
                          className="object-cover w-full h-full" 
                          onError={(e) => { e.currentTarget.style.display = "none" }}
                        />
                      ) : (
                        <Scissors className="w-8 h-8 text-gray-200 absolute inset-0 m-auto" />
                      )}
                    </div>
                    <h4 className="text-base font-medium text-gray-900 line-clamp-2 mb-2 leading-tight">{treatment.name}</h4>
                    {treatment.cost && <p className="text-sm text-gray-600 mb-2 font-medium">Starting from <span className="text-base text-gray-800">${treatment.cost}</span></p>}
                    <p className="text-xs text-gray-500 line-clamp-2 flex-1">{getShortDescription(treatment.description, 80)}</p>
                  </Link>
                ))}
                {filteredTreatmentsForSpec(spec.treatments).length === 0 && (
                  <p className="col-span-full text-gray-500 text-sm italic text-center py-4">No treatments match the current filter.</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">No specific treatments listed for this specialty.</p>
            )}
          </div>
        ))}
      </div>
      {filteredSpecialties.length === 0 && (
        <p className="text-center text-gray-500 text-sm py-8">No specialties match the search.</p>
      )}
    </section>
  )
}

// Related Hospitals with Branches (Updated to match screenshot style, show all filtered data as cards with Embla Carousel)
const RelatedHospitalsList = ({ 
  hospitals, 
  selectedCity, 
  selectedBranch,
  selectedTreatment // 1. Added selectedTreatment prop
}: { 
  hospitals: HospitalType[],
  selectedCity: string,
  selectedBranch: string,
  selectedTreatment: string // 1. Added selectedTreatment prop type
}) => {
  const [branchSearch, setBranchSearch] = useState('')
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start', slidesToScroll: 1 })

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  // Flatten all branches from related hospitals
  const allBranches = useMemo(() => {
    return hospitals.flatMap(h => 
      h.branches.map((b: BranchType) => ({
        ...b,
        hospitalName: h.hospitalName,
        hospitalId: h._id,
        hospitalImage: h.hospitalImage // Assume hospital has image
      }))
    )
  }, [hospitals])

  const allBranchNames = useMemo(() => 
    allBranches.map(b => b.branchName ? `${b.hospitalName} ${b.branchName}` : b.hospitalName).filter(Boolean).sort(),
  [allBranches])

  // Apply global filters first
  const filteredHospitalsForGlobal = useMemo(() => {
    return hospitals.filter(h => {
      const treatmentLower = selectedTreatment.toLowerCase()
      
      // 2. Added treatment filter logic
      const treatmentMatch = !selectedTreatment || h.treatments?.some((t: TreatmentType) => 
        t.name?.toLowerCase().includes(treatmentLower)
      ) || h.branches.some((b: BranchType) => 
        b.treatments?.some((t: TreatmentType) => t.name?.toLowerCase().includes(treatmentLower))
      )
      
      // 3. Updated existing filters to be branch-specific (if branch is selected)
      const cityMatch = !selectedCity || h.branches.some((b: BranchType) => 
        b.city?.some((c: CityType) => c.cityName?.toLowerCase().includes(selectedCity.toLowerCase()))
      )
      const branchMatch = !selectedBranch || h.branches.some((b: BranchType) => 
        b.branchName?.toLowerCase().includes(selectedBranch.toLowerCase())
      )

      return cityMatch && branchMatch && treatmentMatch // 4. Combined all filters
    })
  }, [hospitals, selectedCity, selectedBranch, selectedTreatment])

  // Flatten filtered branches
  const filteredBranchesForGlobal = useMemo(() => {
    return filteredHospitalsForGlobal.flatMap(h => {
      // 5. Filter branches within the filtered hospitals based on city/branch/treatment
      const branchesToDisplay = h.branches.filter((b: BranchType) => {
        const cityMatch = !selectedCity || b.city?.some((c: CityType) => 
          c.cityName?.toLowerCase().includes(selectedCity.toLowerCase())
        )
        const branchMatch = !selectedBranch || b.branchName?.toLowerCase().includes(selectedBranch.toLowerCase())
        
        const treatmentLower = selectedTreatment.toLowerCase()
        const treatmentMatch = !selectedTreatment || b.treatments?.some((t: TreatmentType) => 
            t.name?.toLowerCase().includes(treatmentLower)
        )
        
        return cityMatch && branchMatch && treatmentMatch
      })

      // If no branches match but the *hospital* matched the treatment filter (and no city/branch filters were set), 
      // we must include the hospital entry if it's the main entry (no branchId on the card)
      // This is complex, so for simplicity and matching the existing structure which relies on branches:
      return branchesToDisplay.map((b: BranchType) => ({
        ...b,
        hospitalName: h.hospitalName,
        hospitalId: h._id,
        hospitalImage: h.hospitalImage
      }))
    })
  }, [filteredHospitalsForGlobal, selectedCity, selectedBranch, selectedTreatment]) // Added selectedTreatment here

  // Apply local branch search
  const filteredBranches = useMemo(() => {
    return filteredBranchesForGlobal.filter(b => 
      (b.branchName || b.hospitalName)?.toLowerCase().includes(branchSearch.toLowerCase())
    )
  }, [filteredBranchesForGlobal, branchSearch])

  if (!filteredBranches?.length) {
    return (
      <div className={`bg-white/80 p-8 rounded-xs shadow-sm border border-gray-50 text-center ${inter.variable} font-light`}>
        <Hospital className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No related branches match the filters</p>
      </div>
    )
  }

  return (
    <section className={`bg-white/80 p-8 rounded-xs shadow-sm border border-gray-50 ${inter.variable} font-light`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl md:text-3xl font-medium text-gray-900 tracking-tight flex items-center gap-3">
          <Building2 className="w-7 h-7 text-gray-600" />
          Other Hospitals in Delhi NCR ({filteredBranches.length})
        </h2>
        <SearchableDropdown
          options={allBranchNames}
          value={branchSearch}
          onChange={setBranchSearch}
          placeholder="Search hospitals by name or city..."
          icon={Search}
        />
      </div>
      <div className="relative">
        <div className="embla overflow-hidden" ref={emblaRef}>
          <div className="embla__container flex">
            {filteredBranches.map((branch, index) => {
              const hospitalImage = getHospitalImage(branch.hospitalImage)
              const displayName = branch.branchName ? `${branch.hospitalName} ${branch.branchName}` : branch.hospitalName
              const location = branch.city?.[0]?.cityName || 'Delhi NCR'
              return (
                <div key={index} className="embla__slide flex-[0_0_100%] md:flex-[0_0_calc(50%-10px)] lg:flex-[0_0_calc(33.333%-13.33px)] pr-5 md:pr-2.5 lg:pr-3.33">
                  <Link
                    href={branch.branchId 
                      ? `/hospitals/branches/${generateSlug(branch.hospitalName)}-${generateSlug(branch.branchName)}` 
                      : `/hospitals/${generateSlug(branch.hospitalName)}`}
                    className="block bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="relative h-48 bg-gray-100">
                      {hospitalImage ? (
                        <img 
                          src={hospitalImage} 
                          alt={displayName} 
                          className="object-cover w-full h-full" 
                          onError={(e) => { e.currentTarget.style.display = "none" }}
                        />
                      ) : (
                        <Plus className="w-12 h-12 text-gray-300 absolute inset-0 m-auto" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900 line-clamp-1 mb-1">{displayName}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {location}
                      </p>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
        <button
          onClick={scrollPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-gray-200 text-gray-600 p-2 rounded-full hover:bg-gray-300 transition-co...(truncated 246 characters)...-gray-300 transition-colors z-10"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  )
}

// FindYourHospital Filter Component (Updated to not redirect, lift state)
const FindYourHospital = ({ 
  cities, 
  branches, 
  treatments,
  activeTab,
  selectedCity, 
  setSelectedCity,
  selectedBranch, 
  setSelectedBranch,
  selectedTreatment, 
  setSelectedTreatment,
  onApplyFilters
}: { 
  cities: string[], 
  branches: string[], 
  treatments: string[],
  activeTab: string,
  selectedCity: string,
  setSelectedCity: (v: string) => void,
  selectedBranch: string,
  setSelectedBranch: (v: string) => void,
  selectedTreatment: string,
  setSelectedTreatment: (v: string) => void,
  onApplyFilters: () => void
}) => {
  const handleClear = useCallback(() => {
    setSelectedCity('')
    setSelectedBranch('')
    setSelectedTreatment('')
  }, [setSelectedCity, setSelectedBranch, setSelectedTreatment])

  return (
    <div className={`bg-white/80 rounded-lg border border-gray-50 p-6 space-y-4 ${inter.variable} font-light`}>
      <h3 className="text-lg font-medium text-gray-900">Find Your Hospital</h3>
      <div className="flex border-b border-gray-100 -mx-6 px-6">
        {['Hospital', 'Doctors', 'Treatments'].map((tab) => (
          <button
            key={tab}
            className={classNames(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab
                ? 'border-gray-600 text-gray-700'
                : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
            )}
            onClick={() => {}}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="space-y-3 pt-4">
        <SearchableDropdown
          options={cities}
          value={selectedCity}
          onChange={setSelectedCity}
          placeholder="Search by city..."
          icon={MapPin}
        />
        <SearchableDropdown
          options={branches}
          value={selectedBranch}
          onChange={setSelectedBranch}
          placeholder="Search by branch name..."
          icon={Building2}
        />
        <SearchableDropdown
          options={treatments}
          value={selectedTreatment}
          onChange={setSelectedTreatment}
          placeholder="Search treatments..."
          icon={Scissors}
        />
        <button
          onClick={onApplyFilters}
          className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          Apply Filters
        </button>
        <button
          onClick={handleClear}
          className="w-full text-gray-500 py-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          Clear All Filters
        </button>
        <p className="text-xs text-gray-400 text-center">
          Filters apply to all sections below
        </p>
      </div>
    </div>
  )
}

// Similar Doctors List (Updated to match screenshot style, show all filtered data as cards with Embla Carousel)
const SimilarDoctorsList = ({ 
  similarDoctors, 
  selectedCity, 
  selectedBranch 
}: { 
  similarDoctors: ExtendedDoctorType[],
  selectedCity: string,
  selectedBranch: string
}) => {
  const [doctorSearch, setDoctorSearch] = useState('')
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start', slidesToScroll: 1 })

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const filteredDoctorsBase = useMemo(() => {
    return similarDoctors.filter(doc => {
      const locationMatch = doc.locations.some(loc => {
        const cityMatch = !selectedCity || loc.cities.some((c: CityType) => c.cityName?.toLowerCase().includes(selectedCity.toLowerCase()))
        const branchMatch = !selectedBranch || (loc.branchName?.toLowerCase().includes(selectedBranch.toLowerCase()) || !loc.branchName)
        return cityMatch && branchMatch
      })
      return locationMatch
    })
  }, [similarDoctors, selectedCity, selectedBranch])

  const allDoctorNames = useMemo(() => 
    filteredDoctorsBase.map(d => d.doctorName || '').filter(Boolean).sort(),
  [filteredDoctorsBase])

  const filteredDoctors = useMemo(() => {
    return filteredDoctorsBase.filter(doc => 
      doc.doctorName?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      doc.specialization?.some((s: any) => s.name?.toLowerCase().includes(doctorSearch.toLowerCase()))
    )
  }, [filteredDoctorsBase, doctorSearch])

  if (!filteredDoctors?.length) return null

  return (
    <section className={`bg-white/80 p-8 rounded-lg shadow-sm border border-gray-50 ${inter.variable} font-light`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl md:text-3xl font-medium text-gray-900 tracking-tight flex items-center gap-3">
          <Users className="w-7 h-7 text-gray-600" />
          Our Specialist Doctors ({filteredDoctors.length})
        </h2>
        <SearchableDropdown
          options={allDoctorNames}
          value={doctorSearch}
          onChange={setDoctorSearch}
          placeholder="Search doctors by name or spec..."
          icon={Search}
        />
      </div>
      <div className="relative">
        <div className="embla overflow-hidden" ref={emblaRef}>
          <div className="embla__container flex">
            {filteredDoctors.map((doc) => {
              const doctorImage = getDoctorImage(doc.profileImage)
              const specialty = doc.specialization?.[0]?.name || 'Specialist'
              return (
                <div key={doc._id || doc.baseId} className="embla__slide flex-[0_0_100%] md:flex-[0_0_calc(50%-10px)] lg:flex-[0_0_calc(33.333%-13.33px)] pr-5 md:pr-2.5 lg:pr-3.33">
                  <Link href={`/doctors/${generateSlug(doc.doctorName)}`} className="block bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow text-center">
                    <div className="relative h-64 bg-gray-100 p-4 flex items-center justify-center">
                      {doctorImage ? (
                        <img 
                          src={doctorImage} 
                          alt={doc.doctorName} 
                          className="object-cover w-32 h-32 rounded-full mx-auto" 
                          onError={(e) => { e.currentTarget.style.display = "none" }}
                        />
                      ) : (
                        <Stethoscope className="w-16 h-16 text-gray-300" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900 line-clamp-1 mb-2">{doc.doctorName}</h3>
                      <p className="text-sm text-gray-600 mb-1">{specialty}</p>
                      {doc.experienceYears && <p className="text-sm text-gray-500">{doc.experienceYears} years of exp</p>}
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
        <button
          onClick={scrollPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-gray-200 text-gray-600 p-2 rounded-full hover:bg-gray-300 transition-colors z-10"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={scrollNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-gray-200 text-gray-600 p-2 rounded-full hover:bg-gray-300 transition-colors z-10"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      {filteredDoctors.length > 0 && (
        <div className="text-center pt-4">
          <Link href="/doctors" className="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center justify-center gap-1 mx-auto">
            Show All {filteredDoctors.length} Doctors <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </section>
  )
}

// Skeletons (kept for completeness)
const HeroSkeleton = () => (
  <section className="relative w-full h-[70vh] bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse">
    <div className="absolute inset-0 bg-gradient-to-t from-gray-800/60 via-gray-700/30 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 z-10 pb-12">
      <div className="container mx-auto px-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full" />
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-64" />
            <div className="h-4 bg-gray-200 rounded w-96" />
          </div>
        </div>
      </div>
    </div>
  </section>
)

const AboutSkeleton = () => (
  <div className={`bg-white/80 p-8 rounded-xs border border-gray-50 shadow-sm animate-pulse ${inter.variable} font-light`}>
    <div className="h-8 bg-gray-200 rounded w-32 mb-4" />
    <div className="space-y-2">
      <div className="h-4 bg-gray-100 rounded" />
      <div className="h-4 bg-gray-100 rounded w-5/6" />
      <div className="h-4 bg-gray-100 rounded w-4/6" />
    </div>
  </div>
)

const CarouselSkeleton = ({ type }: { type: string }) => (
  <div className={`bg-white/80 p-8 rounded-xs border border-gray-50 shadow-sm animate-pulse ${inter.variable} font-light`}>
    <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
    <div className="flex space-x-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex-1">
          <div className="h-40 bg-gray-100 rounded mb-4" />
          <div className="h-4 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  </div>
)

const FacilitiesSkeleton = () => (
  <div className={`bg-white/80 p-8 rounded-xs border border-gray-50 shadow-sm animate-pulse ${inter.variable} font-light`}>
    <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-20 bg-gray-100 rounded-md" />
      ))}
    </div>
  </div>
)

const SidebarSkeleton = () => (
  <div className={`space-y-6 ${inter.variable} w-full font-light`}>
    <div className="bg-white/80 p-6 rounded-xs border border-gray-50 shadow-sm animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-md" />
        ))}
      </div>
    </div>
    <div className="bg-white/80 p-6 rounded-xs border border-gray-50 shadow-sm animate-pulse h-96" />
  </div>
)

// Main Component
export default function DoctorDetail({ params }: { params: Promise<{ slug: string }> }) {
  const [doctor, setDoctor] = useState<ExtendedDoctorType | null>(null)
  const [allHospitals, setAllHospitals] = useState<HospitalType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aboutExpanded, setAboutExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('Hospital')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedTreatment, setSelectedTreatment] = useState('')

  const handleApplyFilters = useCallback(() => {
    // Filters are controlled, so just log or trigger re-render (memo will handle)
    console.log('Filters applied:', { selectedCity, selectedBranch, selectedTreatment })
  }, [selectedCity, selectedBranch, selectedTreatment])

  useEffect(() => {
    const fetchDoctorData = async () => {
      setLoading(true)
      setError(null)
      try {
        const resolvedParams = await params
        const doctorSlug = resolvedParams.slug
        const res = await fetch('/api/hospitals')
        if (!res.ok) throw new Error("Failed to fetch hospitals")
        const data = await res.json()
        
        if (data.items?.length > 0) {
          const extendedDoctors = getAllExtendedDoctors(data.items)
          const foundDoctor = extendedDoctors.find((d: ExtendedDoctorType) => generateSlug(d.doctorName) === doctorSlug)
          setAllHospitals(data.items)
          setDoctor(foundDoctor || null)
          if (!foundDoctor) {
            setError("Doctor not found. The URL might be incorrect or the doctor does not exist.")
          }
        } else {
          setError("No hospital data available.")
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "An unknown error occurred while fetching doctor details")
      } finally {
        setLoading(false)
      }
    }
    fetchDoctorData()
  }, [params])

  const specializationDisplay = useMemo(() => {
    if (!doctor || !doctor.specialization) return []
    if (Array.isArray(doctor.specialization)) {
      return doctor.specialization.map((spec: any) => typeof spec === 'object' ? spec : { _id: spec, name: spec }).filter((s: any) => s.name)
    }
    return [{ _id: doctor.specialization, name: doctor.specialization }]
  }, [doctor?.specialization])

  // All specialties across the system
  const allSpecialties = useMemo(() => getAllSpecialties(allHospitals), [allHospitals])

  // Similar doctors: placeholder logic - doctors with overlapping specializations
  const similarDoctors = useMemo(() => {
    if (!allHospitals.length || !doctor) return []
    const allExtended = getAllExtendedDoctors(allHospitals)
    const doctorSpecialtyNames = specializationDisplay.map(s => s.name)

    return allExtended.filter(d => 
      d.baseId !== doctor.baseId && // Use baseId for comparison
      d.specialization?.some((s: any) => doctorSpecialtyNames.includes(s.name || s.title || s))
    )
  }, [allHospitals, doctor, specializationDisplay])

  // Related hospitals: hospitals with overlapping specialties or treatments
  const relatedHospitals = useMemo(() => {
    if (!allHospitals.length || !doctor) return []
    const doctorSpecialtyNames = specializationDisplay.map(s => s.name.toLowerCase())
    const doctorTreatmentNames = doctor.relatedTreatments?.map(t => t.name.toLowerCase()) || []

    // NOTE: This logic for relatedHospitals is for the initial display *before* general filters are applied.
    // The RelatedHospitalsList component uses the general filters on this set.
    return allHospitals.filter(h => {
      // Check specialties in hospital doctors
      const hasMatchingSpecialty = h.doctors.some((d: any) => 
        d.specialization?.some((s: any) => doctorSpecialtyNames.includes((s.name || s).toLowerCase()))
      ) || h.branches.some((b: any) => 
        b.doctors.some((d: any) => 
          d.specialization?.some((s: any) => doctorSpecialtyNames.includes((s.name || s).toLowerCase()))
        )
      )

      // Check treatments
      const hasMatchingTreatment = h.treatments?.some((t: TreatmentType) => 
        doctorTreatmentNames.includes(t.name.toLowerCase())
      ) || false
      const hasMatchingBranchTreatment = h.branches.some((b: BranchType) => 
        b.treatments?.some((t: TreatmentType) => doctorTreatmentNames.includes(t.name.toLowerCase()))
      ) || false

      return hasMatchingSpecialty || hasMatchingTreatment || hasMatchingBranchTreatment
    })
  }, [allHospitals, doctor, specializationDisplay])

  // Dropdown data for filter
  const uniqueCities = useMemo(() => {
    const cSet = new Set<string>()
    allHospitals.forEach((h) => {
      h.branches.forEach((b) => {
        if (b.city && Array.isArray(b.city)) {
          b.city.forEach((c: CityType) => {
            if (c.cityName) cSet.add(c.cityName)
          })
        }
      })
    })
    return Array.from(cSet).sort()
  }, [allHospitals])

  const uniqueBranches = useMemo(() => {
    const bSet = new Set<string>()
    allHospitals.forEach((h) => {
      h.branches.forEach((b) => {
        if (b.branchName) bSet.add(b.branchName)
      })
    })
    return Array.from(bSet).sort()
  }, [allHospitals])

  const uniqueTreatments = useMemo(() => {
    const tSet = new Set<string>()
    allHospitals.forEach((h) => {
      if (h.treatments) {
        h.treatments.forEach((t: TreatmentType) => {
          if (t.name) tSet.add(t.name)
        })
      }
      h.branches.forEach((b) => {
        if (b.treatments) {
          b.treatments.forEach((t: TreatmentType) => {
            if (t.name) tSet.add(t.name)
          })
        }
      })
    })
    return Array.from(tSet).sort()
  }, [allHospitals])

  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-50/50 ${inter.variable} font-light`}>
        <HeroSkeleton />
        <Breadcrumb doctorName="Doctor Name" />
        <section className="py-16 relative z-10">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-12 gap-8">
              <main className="lg:col-span-9 space-y-8">
                <AboutSkeleton />
                <CarouselSkeleton type="treatments" />
                <FacilitiesSkeleton />
                <CarouselSkeleton type="doctors" />
              </main>
              <div className="md:col-span-3">
                <SidebarSkeleton />
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (error || !doctor) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center bg-gray-50/50 p-6 relative ${inter.variable} font-light`}>
        <Breadcrumb doctorName="Doctor Name" />
        <div className="text-center space-y-6 max-w-md p-10 bg-white/80 rounded-xs shadow-sm border border-gray-50">
          <Users className="w-16 h-16 text-gray-300 mx-auto" />
          <h2 className="text-2xl md:text-3xl font-medium text-gray-900 leading-tight">Doctor Not Found</h2>
          <p className="text-base text-gray-700 leading-relaxed font-light">{error || "The requested doctor could not be found. Please check the URL or try searching again."}</p>
          <Link href="/hospitals" className="inline-block w-full bg-gray-600 text-white px-6 py-3 rounded-xs hover:bg-gray-700 transition-all font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300">
            Go to Hospitals Search
          </Link>
        </div>
      </div>
    )
  }

  const doctorImage = getDoctorImage(doctor.profileImage)
  const shortAbout = getShortDescription(doctor.aboutDoctor, 200)

  return (
    <div className={`min-h-screen bg-gray-50/50 ${inter.variable} font-light`}>
      <section className="relative w-full h-[70vh] bg-gray-100">
        {doctorImage && (
          <img
            src={doctorImage}
            alt={`${doctor.doctorName}`}
            className="object-cover w-full h-full"
            style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
            onError={(e) => { e.currentTarget.style.display = "none" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-800/70 via-gray-700/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 z-10 pb-12 text-white">
          <div className="container mx-auto px-6 space-y-6">
            <div className="flex gap-x-4 items-end">
              <div className="relative w-32 h-32 bg-white rounded-full p-2 shadow-xl flex-shrink-0 border-4 border-white/50">
                {doctorImage ? (
                  <img 
                    src={doctorImage} 
                    alt={`${doctor.doctorName} profile`} 
                    className="object-cover rounded-full w-full h-full" 
                    onError={(e) => { e.currentTarget.style.display = "none" }} 
                  />
                ) : (
                  <Stethoscope className="w-16 h-16 text-gray-400 absolute inset-0 m-auto" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-4xl md:text-5xl font-medium text-white mb-1 leading-tight line-clamp-2">{doctor.doctorName}</h1>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-lg text-white/90">
                  {specializationDisplay.slice(0, 3).map((spec: any) => <span key={spec._id} className="font-medium">{spec.name} Specialist</span>)}
                  {specializationDisplay.length > 3 && <span className="text-white/70">+{specializationDisplay.length - 3} more</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-2 pt-2 border-t border-white/30">
              {doctor.qualification && (
                <span className="flex items-center gap-2 text-sm text-white/90 font-light">
                  <Award className="w-4 h-4 text-white/70" />
                  {doctor.qualification}
                </span>
              )}
              {doctor.experienceYears && (
                <span className="flex items-center gap-2 text-sm text-white/90 font-light">
                  <Clock className="w-4 h-4 text-white/70" />
                  {doctor.experienceYears}+ Years Experience
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <Breadcrumb doctorName={doctor.doctorName} />

      <section className="py-16 relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-8">
            <main className="lg:col-span-9 space-y-10">
              
              {/* About Doctor Section (Updated with Read More) */}
              {doctor.aboutDoctor && (
                <section className={`bg-white/80 p-8 rounded-xs shadow-sm border border-gray-50 ${inter.variable} font-light`}>
                  <h2 className="text-2xl md:text-3xl font-medium text-gray-900 tracking-tight mb-6 flex items-center gap-3">
                    <BookOpen className="w-7 h-7 text-gray-600" />
                    About {doctor.doctorName}
                  </h2>
                  <div className="space-y-4">
                    {!aboutExpanded ? (
                      <p className="text-base text-gray-700 leading-relaxed font-light">{shortAbout}</p>
                    ) : (
                      typeof doctor.aboutDoctor === 'string' ? (
                        <div className="text-base text-gray-700 leading-relaxed font-light">{doctor.aboutDoctor}</div>
                      ) : (
                        renderRichText(doctor.aboutDoctor)
                      )
                    )}
                    <button
                      onClick={() => setAboutExpanded(!aboutExpanded)}
                      className="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center gap-1 transition-colors"
                    >
                      {aboutExpanded ? 'Read Less' : 'Read More'} <ChevronRight className={`w-4 h-4 ${aboutExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                </section>
              )}

              {/* Specialties with Mapped Treatment Cards - Now using all specialties */}
              {allSpecialties.length > 0 && <SpecialtyWithTreatments specialties={allSpecialties} selectedTreatment={selectedTreatment} />}

              {/* Related Hospitals List (Replaced Affiliated Locations) */}
              {relatedHospitals.length > 0 && <RelatedHospitalsList hospitals={relatedHospitals} selectedCity={selectedCity} selectedBranch={selectedBranch} selectedTreatment={selectedTreatment} />}

              {/* Similar Doctors List */}
              {similarDoctors.length > 0 && <SimilarDoctorsList similarDoctors={similarDoctors} selectedCity={selectedCity} selectedBranch={selectedBranch} />}
            </main>

            <aside className="lg:col-span-3 space-y-8">
              <FindYourHospital 
                cities={uniqueCities} 
                branches={uniqueBranches} 
                treatments={uniqueTreatments}
                activeTab={activeTab}
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
                selectedBranch={selectedBranch}
                setSelectedBranch={setSelectedBranch}
                selectedTreatment={selectedTreatment}
                setSelectedTreatment={setSelectedTreatment}
                onApplyFilters={handleApplyFilters}
              />
              <ContactForm />
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}