// app/treatment/[slug]/page.tsx
// Dynamic page for individual treatment details with proper hospital/doctor mapping

"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import Image from "next/image"
import {
  Calendar,
  Award,
  Stethoscope,
  Scissors,
  Star,
  ChevronLeft,
  ChevronRight,
  Home,
  Hospital,
  MapPin,
  Bed,
  Users,
  ChevronRight as ChevronRightIcon,
  ChevronDown,
  X,
  Search
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useEmblaCarousel from "embla-carousel-react"
import classNames from "classnames"
import { Inter } from "next/font/google"
import ContactForm from "@/components/ContactForm"
import { findTreatmentWithHospitalsAndDoctors } from "./utils"
import type { CityData, DepartmentData, ExtendedTreatmentData, DoctorData } from "@/lib/cms/types"

// Lightweight Inter font configuration
const inter = Inter({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  variable: "--font-inter"
})

// --- Utilities (Pure functions, no hooks) ---
const getWixImageUrl = (imageStr: string | null | undefined): string | null => {
  if (!imageStr || typeof imageStr !== "string") return null
  
  // Handle Wix image URLs
  if (imageStr.startsWith("wix:image://v1/")) {
    const parts = imageStr.split("/")
    return parts.length >= 4 ? `https://static.wixstatic.com/media/${parts[3]}` : null
  }
  
  // Handle direct URLs
  if (imageStr.startsWith("http://") || imageStr.startsWith("https://")) {
    return imageStr
  }
  
  // Handle relative paths
  if (imageStr.startsWith("/")) {
    return imageStr
  }
  
  return null
}

const generateSlug = (name: string | null | undefined): string => {
  return (name ?? '').toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-")
}

const getContentImage = (content: any): string | null => {
  // Handle null/undefined
  if (!content) return null
  
  // Handle direct string URLs
  if (typeof content === 'string') {
    // Try Wix format first
    if (content.startsWith("wix:image://v1/")) {
      const parts = content.split("/")
      return parts.length >= 4 ? `https://static.wixstatic.com/media/${parts[3]}` : null
    }
    // Direct URL
    if (content.startsWith("http://") || content.startsWith("https://")) {
      return content
    }
    return null
  }
  
  // Handle Wix rich text format with nodes
  if (!content.nodes) return null
  const imageNode = content.nodes.find((node: any) => node.type === 'IMAGE')
  if (imageNode?.imageData?.image?.src?.id) {
    return `https://static.wixstatic.com/media/${imageNode.imageData.image.src.id}`
  }
  return null
}

const cleanHospitalName = (name: string | null | undefined): string => {
  return (name || '').replace(' Group', '').trim() || 'N/A'
}

// --- RichTextDisplay Component ---
const RichTextDisplay = ({ htmlContent, className = "" }: { htmlContent: string; className?: string }) => {
  const transformListItems = (html: string): string => {
    const iconSvgHtml = `<span style="display: inline-flex; align-items: flex-start; margin-right: 3px; flex-shrink: 0; min-width: 1.25rem; height: 1.25rem;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5" style="color:#74BF44; width: 1rem; margin-top: 5px; height: 1rem;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg></span>`
    const liContentWrapperStart = `<div style="display: flex; align-items: flex-start;">${iconSvgHtml}<span style="flex: 1;">`
    const liContentWrapperEnd = `</span></div>`

    let transformedHtml = html.replace(
      /(<ul>.*?)(<li([^>]*)>)(.*?)(<\/li>)/gs,
      (match, ulStart, liOpenTag, liAttrs, liContent, liCloseTag) => {
        const trimmedContent = liContent.trim()
        if (trimmedContent.length > 0 && !trimmedContent.includes(iconSvgHtml)) {
          return ulStart + liOpenTag + liContentWrapperStart + trimmedContent + liContentWrapperEnd + liCloseTag
        }
        return match
      }
    )
    return transformedHtml
  }

  const modifiedHtml = useMemo(() => transformListItems(htmlContent), [htmlContent])

  const typographyClasses = `
    prose max-w-none text-gray-700 leading-relaxed 
    prose-h1:text-3xl prose-h1:font-extrabold prose-h1:mt-8 prose-h1:mb-4 prose-h1:text-gray-900
    prose-h2:text-2xl prose-h2:font-extrabold prose-h2:mt-7 prose-h2:mb-4 prose-h2:text-gray-900
    prose-h3:text-xl prose-h3:font-bold prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-gray-800
    prose-p:font-sans prose-p:mt-3 prose-p:mb-3 prose-p:text-base prose-p:text-gray-700
    prose-li:list-none prose-li:ml-0 prose-li:pl-0
    prose-ul:mt-4 prose-ul:mb-4 prose-ul:list-none prose-ul:ml-0 prose-ul:pl-0
    prose-a:text-blue-600 prose-a:font-medium prose-a:underline hover:prose-a:text-blue-800
  `

  return (
    <div className={`${typographyClasses} ${className}`} dangerouslySetInnerHTML={{ __html: modifiedHtml }} />
  )
}

// --- DoctorCard Component ---
interface DoctorCardProps {
  doctor: any
  locations?: { hospitalName: string; hospitalId: string; branchName?: string; branchId?: string; cities: CityData[] }[]
  departments?: DepartmentData[]
}

const DoctorCard = ({ doctor, locations = [], departments = [] }: DoctorCardProps) => {
  const profileImage = doctor.profileImage ? getWixImageUrl(doctor.profileImage) : null
  const doctorSlug = generateSlug(doctor.doctorName)

  const doctorLocations = locations.length > 0 ? locations : (doctor as any).locations || []
  const primaryLocation = doctorLocations.find((loc: any) => loc.branchName) || doctorLocations[0]
  const displayLocation = primaryLocation?.branchName || cleanHospitalName(primaryLocation?.hospitalName) || 'N/A'

  const doctorDepts = departments.length > 0 ? departments : (doctor.departments || (doctor as any).departments || [])
  const firstDepartmentName = doctorDepts[0]?.name
  const remainingDepartmentCount = doctorDepts.length > 1 ? Math.min(doctorDepts.length - 1, 2) : 0

  return (
    <Link href={`/doctors/${doctorSlug}`} className="block">
      <article className="group bg-white rounded-sm shadow-sm transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col hover:shadow-md border border-gray-100">
        <div className="relative h-48 overflow-hidden bg-gray-50">
          {doctor.popular && (
            <span className="absolute top-3 right-3 z-10 inline-flex items-center text-sm bg-gray-50 text-gray-600 font-medium px-3 py-2 rounded-sm shadow-sm border border-gray-100">
              <Star className="w-3 h-3 mr-1 fill-gray-300 text-gray-400" />Popular
            </span>
          )}
          {profileImage ? (
            <img src={profileImage} alt={doctor.doctorName} className="object-cover object-top w-full h-full group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.currentTarget.style.display = "none" }} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center"><Users className="w-12 h-12 text-gray-200" /></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent" />
        </div>

        <div className="p-3 flex-1 flex flex-col space-y-2">
          <header className="space-y-2 flex-1 min-h-0">
            <h2 className="text-lg font-medium leading-tight line-clamp-2 text-gray-900 group-hover:text-gray-800">{doctor.doctorName}</h2>
          </header>

          <div className="space-y-2">
            {firstDepartmentName && (
              <div className="flex flex-wrap gap-1">
                <span className="inline-flex items-center text-sm font-medium text-gray-900">{firstDepartmentName}</span>
                {remainingDepartmentCount > 0 && (
                  <span className="inline-flex items-center text-sm font-medium text-gray-900">+{remainingDepartmentCount} Department</span>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-900 font-normal">{doctor.experienceYears} Years Exp.</p>
            </div>
          </div>

          <footer className="border-t border-gray-100 pt-2 mt-auto">
            <p className="text-sm text-gray-600 font-normal line-clamp-1">{displayLocation}</p>
          </footer>
        </div>
      </article>
    </Link>
  )
}

// --- SearchDropdown Component ---
interface SearchDropdownProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  options: { id: string; name: string }[]
  selectedOption: string
  onOptionSelect: (id: string) => void
  onClear: () => void
  type: "city"
}

const SearchDropdown = ({ value, onChange, placeholder, options, selectedOption, onOptionSelect, onClear, type }: SearchDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOptionName = useMemo(() => options.find(opt => opt.id === selectedOption)?.name || '', [options, selectedOption])
  const displayedValue = selectedOptionName || value

  const filteredOptions = useMemo(() => {
    return options.filter(option => option.name.toLowerCase().includes(value.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name))
  }, [options, value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  useEffect(() => {
    if (isOpen && filteredOptions.length > 0) setHighlightedIndex(0)
    else setHighlightedIndex(-1)
  }, [isOpen, filteredOptions.length])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0)); break
      case 'ArrowUp': e.preventDefault(); setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1)); break
      case 'Enter': e.preventDefault(); if (highlightedIndex >= 0) { onOptionSelect(filteredOptions[highlightedIndex].id); onChange(""); setIsOpen(false) } break
      case 'Escape': setIsOpen(false); setHighlightedIndex(-1); break
    }
  }, [isOpen, highlightedIndex, filteredOptions, onOptionSelect, onChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedOption) onOptionSelect("")
    onChange(e.target.value)
    setIsOpen(true)
  }

  const getIcon = () => <MapPin className="w-4 h-4 text-gray-500" />
  const getPlaceholder = () => type === "city" ? "Filter by City (e.g., New Delhi)" : placeholder

  return (
    <div ref={dropdownRef} className="relative space-y-2 w-full max-w-64">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">{getIcon()}</div>
        <input ref={inputRef} type="text" placeholder={getPlaceholder()} value={displayedValue} onChange={handleInputChange} onFocus={() => setIsOpen(true)} onKeyDown={handleKeyDown}
          className="pl-10 pr-12 py-2.5 border border-gray-200 rounded-sm w-full text-sm bg-white focus:bg-white focus:ring-2 focus:ring-[#74BF44]/50 focus:border-[#74BF44]/50 transition-all placeholder:text-gray-400 font-light"
          aria-label={`Search ${getPlaceholder()}`} role="combobox" aria-expanded={isOpen} aria-haspopup="listbox" />
        {isOpen && (
          <ul role="listbox" className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-sm shadow-lg z-10 max-h-60 overflow-auto">
            {filteredOptions.length > 0 ? filteredOptions.map((option, index) => (
              <li key={option.id}>
                <button onClick={() => { onOptionSelect(option.id); onChange(""); setIsOpen(false) }}
                  className={classNames("w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-gray-700 font-light", { "bg-[#74BF44]/10": index === highlightedIndex })} aria-selected={index === highlightedIndex}>
                  {option.name}
                </button>
              </li>
            )) : <li className="px-3 py-2 text-sm text-gray-500">No results found</li>}
          </ul>
        )}
        {selectedOption && <button onClick={onClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label="Clear selection"><X className="w-4 h-4" /></button>}
        {!selectedOption && !value && <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
      </div>
    </div>
  )
}

// --- CityFilter Component ---
interface CityFilterProps {
  cities: CityData[]
  onSearchChange: (value: string) => void
  onSelectCity: (id: string) => void
  selectedCityId: string
  searchValue: string
}

const CityFilter = ({ cities, onSearchChange, onSelectCity, selectedCityId, searchValue }: CityFilterProps) => {
  const options = useMemo(() => {
    const uniqueCities = Array.from(new Map(cities.map(c => [c._id, c])).values())
    return uniqueCities.map(c => ({ id: c._id, name: c.cityName }))
  }, [cities])

  return (
    <SearchDropdown value={searchValue} onChange={onSearchChange} placeholder="Filter by City" options={options} selectedOption={selectedCityId} onOptionSelect={onSelectCity} onClear={() => { onSelectCity(""); onSearchChange(""); }} type="city" />
  )
}

// --- Breadcrumb Component ---
const Breadcrumb = ({ treatmentName }: { treatmentName: string }) => (
  <nav className="bg-white border-b border-gray-100 px-4 py-3 font-light" aria-label="Breadcrumb">
    <div className="container mx-auto flex items-center space-x-2 text-sm text-gray-600">
      <Link href="/" className="flex items-center hover:text-[#74BF44] transition-colors" aria-label="Home"><Home className="w-4 h-4 mr-1" />Home</Link>
      <ChevronRightIcon className="w-4 h-4" aria-hidden />
      <Link href="/search?view=treatments" className="hover:text-[#74BF44] transition-colors">Treatments</Link>
      <ChevronRightIcon className="w-4 h-4" aria-hidden />
      <span aria-current="page">{treatmentName}</span>
    </div>
  </nav>
)

// --- Generic Carousel Navigation Hook ---
const useCarouselNavigation = (emblaApi?: any) => {
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  return { scrollPrev, scrollNext }
}

// --- Branches Carousel Component ---
interface BranchesCarouselProps {
  hospitals: any[]
  emblaRef: any
  emblaApi?: any
  prevBtnDisabled?: boolean
  nextBtnDisabled?: boolean
}

const BranchesCarousel = ({ hospitals, emblaRef, emblaApi, prevBtnDisabled = false, nextBtnDisabled = false }: BranchesCarouselProps) => {
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  // Collect all branches from all hospitals with proper mapping
  const allBranches = useMemo(() => {
    const branches: any[] = []
    
    hospitals.forEach((hospitalWrapper: any) => {
      const hospital = hospitalWrapper.hospital
      const hospitalBranches = hospitalWrapper.branches || []
      
      hospitalBranches.forEach((branchWrapper: any) => {
        const branch = branchWrapper.branch
        if (!branch || !branch._id) return
        
        // Get treatment-specific data
        const treatmentCost = branchWrapper.treatmentCost || branch.cost || null
        const treatmentDuration = branchWrapper.treatmentDuration || branch.duration || null
        const matchingDoctors = branchWrapper.matchingDoctors || []
        
        // Get hospital info
        const hospitalName = hospital?.hospitalName || 'Unknown Hospital'
        const hospitalLogo = hospital?.logo || null
        
        // Get city info
        const cities = branch.city || []
        const firstCity = cities[0]?.cityName || 'City'
        
        // Get specialty info
        const specs = branch.specialization || branch.specialty || []
        const firstSpecialty = specs[0]?.name || 'Specialty'
        
        // Get branch image
        const branchImage = branch.branchImage || branch.image || branch.treatmentImage || null
        
        branches.push({
          ...branch,
          hospitalName,
          hospitalLogo,
          firstCity,
          firstSpecialty,
          treatmentCost,
          treatmentDuration,
          matchingDoctors,
          displayImage: getContentImage(branchImage)
        })
      })
    })
    
    return branches
  }, [hospitals])

  if (allBranches.length === 0) return null

  return (
    <div className="relative" role="region" aria-label="Branches Carousel">
      <div className="embla__viewport overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex touch-pan-y ml-[-1rem]">
          {allBranches.map((branch) => {
            const slug = generateSlug(branch.branchName)
            const hospitalImg = branch.displayImage || getContentImage(branch.branchImage)
            const hospitalLogoUrl = branch.hospitalLogo ? getWixImageUrl(branch.hospitalLogo) : null
            const displayTitle = branch.branchName
            const firstCity = branch.firstCity || branch.city?.[0]?.cityName || 'City'
            const firstSpecialty = branch.firstSpecialty || branch.specialization?.[0]?.name || 'Specialty'
            const estdYear = branch.yearEstablished || 'N/A'
            const bedsCount = branch.totalBeds || '0'
            const doctorsCount = branch.noOfDoctors || '0'
            
            // Treatment-specific info
            const displayCost = branch.treatmentCost || branch.cost
            const displayDuration = branch.treatmentDuration || branch.duration

            return (
              <div key={branch._id} className="embla__slide flex-[0_0_auto] min-w-0 w-full md:w-[calc(33.333%-0.666rem)] pl-4">
                <Link href={`/search/hospitals/${slug}`} className="block w-full border border-gray-100 rounded-sm shadow-sm bg-white hover:shadow-md transition-shadow relative flex flex-col overflow-hidden h-full">
                  <div className="relative w-full h-48 bg-gray-100">
                    {hospitalImg ? (
                      <Image src={hospitalImg} alt={`${displayTitle} facility`} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Hospital className="w-12 h-12 text-gray-300" /></div>
                    )}
                    {hospitalLogoUrl && (
                      <div className="absolute bottom-2 left-2 z-10">
                        <img src={hospitalLogoUrl} alt={`${displayTitle} logo`} className="w-12 h-auto object-contain" />
                      </div>
                    )}
                    {/* Treatment cost badge */}
                    {displayCost && (
                      <div className="absolute top-2 right-2 z-10 bg-[#74BF44]/90 text-white text-xs font-medium px-2 py-1 rounded-sm">
                        From ${displayCost}
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col space-y-2">
                    <h3 className="text-xl md:text-base font-medium text-[#241d1f] leading-tight line-clamp-2">{displayTitle}</h3>
                    <p className="text-base md:text-sm text-[#241d1f]/80 line-clamp-1">{`${firstCity}, ${firstSpecialty} Speciality`}</p>
                    {matchingDoctors?.length > 0 && (
                      <p className="text-base md:text-sm text-[#74BF44] font-medium">Matching Doctors: {matchingDoctors.length}</p>
                    )}
                    {displayDuration && (
                      <p className="text-sm text-gray-500">Duration: {displayDuration}</p>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-gray-50 rounded-sm border border-gray-100">
                        <p className="text-base md:text-sm font-medium text-[#241d1f]">{estdYear}</p><p className="text-base md:text-sm text-[#241d1f]">Estd.</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-sm border border-gray-100">
                        <p className="text-base md:text-sm font-medium text-[#241d1f]">{bedsCount}+</p><p className="text-base md:text-sm text-[#241d1f]">Beds</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-sm border border-gray-100">
                        <p className="text-base md:text-sm font-medium text-[#241d1f]">{doctorsCount}+</p><p className="text-base md:text-sm text-[#241d1f]">Doctors</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
      <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between pointer-events-none px-2">
        <button onClick={scrollPrev} disabled={prevBtnDisabled} className="pointer-events-auto p-2 rounded-full bg-white shadow-md text-gray-600 hover:text-[#74BF44] transition-all disabled:opacity-40 disabled:cursor-not-allowed ml-[-1rem]" aria-label="Previous slide">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={scrollNext} disabled={nextBtnDisabled} className="pointer-events-auto p-2 rounded-full bg-white shadow-md text-gray-600 hover:text-[#74BF44] transition-all disabled:opacity-40 disabled:cursor-not-allowed mr-[-1rem]" aria-label="Next slide">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

// --- Skeleton Components ---
const HeroSkeleton = () => (
  <section className="relative w-full h-[70vh] bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse">
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
    <div className="absolute bottom-0 left-0 w-full z-10 px-4 pb-12">
      <div className="container mx-auto space-y-4">
        <div className="space-y-2"><div className="h-8 md:h-10 bg-gray-300 rounded w-64 md:w-96" /><div className="h-5 bg-gray-300 rounded w-80" /></div>
        <div className="flex flex-wrap gap-3"><div className="h-8 bg-gray-300 rounded-full w-32 px-4 py-2" /><div className="h-8 bg-gray-300 rounded-full w-40 px-4 py-2" /></div>
      </div>
    </div>
  </section>
)

const OverviewSkeleton = () => (
  <div className="bg-white rounded-sm border border-gray-100 p-4 shadow-sm animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
    <div className="space-y-4"><div className="h-4 bg-gray-200 rounded" /><div className="h-4 bg-gray-200 rounded w-3/4" /><div className="h-4 bg-gray-200 rounded w-5/6" /></div>
    <div className="grid md:grid-cols-3 gap-6 mt-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-sm border border-gray-100">
          <div className="w-3 h-3 bg-gray-200 rounded-full" />
          <div className="space-y-2 flex-1"><div className="h-3 bg-gray-200 rounded w-16" /><div className="h-4 bg-gray-200 rounded" /></div>
        </div>
      ))}
    </div>
  </div>
)

const CarouselSkeleton = () => (
  <div className="bg-white rounded-sm border border-gray-100 p-4 mb-6 shadow-sm animate-pulse">
    <div className="flex justify-between items-center mb-4"><div className="h-8 bg-gray-200 rounded w-64" /><div className="flex gap-2">{Array.from({ length: 2 }).map((_, i) => (<div key={i} className="w-10 h-10 bg-gray-200 rounded-sm" />))}</div></div>
    <div className="overflow-hidden"><div className="flex gap-4">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="min-w-0 w-full md:w-[calc(33.333%-0.666rem)] flex-shrink-0 bg-white rounded-sm border border-gray-100 p-3 space-y-2 shadow-sm"><div className="h-40 bg-gray-200 rounded-t-sm mb-2" /><div className="space-y-2"><div className="h-5 bg-gray-200 rounded w-3/4" /><div className="h-4 bg-gray-200 rounded" /></div></div>))}</div></div>
  </div>
)

const DoctorsSkeleton = () => (
  <div className="bg-white rounded-sm border border-gray-100 p-4 shadow-sm animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
    <div className="grid md:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-3"><div className="h-48 bg-gray-200 rounded-sm" /><div className="h-5 bg-gray-200 rounded w-3/4" /><div className="flex flex-wrap gap-1">{Array.from({ length: 2 }).map((__, j) => (<div key={j} className="h-4 bg-gray-200 rounded-full w-16" />))}</div><div className="h-4 bg-gray-200 rounded w-32" /></div>
      ))}
    </div>
  </div>
)

// --- Main Component ---
interface TreatmentPageProps {
  params: Promise<{ slug: string }>
}

export default function TreatmentPage({ params }: TreatmentPageProps) {
  const router = useRouter()
  const [treatmentData, setTreatmentData] = useState<{
    treatment: ExtendedTreatmentData | null
    hospitals: any[]
    allDoctors: any[]
    totalHospitals: number
    totalDoctors: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // City Filter States
  const [citySearchValue, setCitySearchValue] = useState<string>('')
  const [selectedCityId, setSelectedCityId] = useState<string>('')

  // Embla Carousel - Fix: Reinitialize when filtered hospitals change
  const [branchesEmblaRef, branchesEmblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    dragFree: false,
    containScroll: 'keepSnaps'
  })

  // Carousel state management
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true)
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true)

  // Update carousel buttons state
  const onCarouselSelect = useCallback((emblaApi: any) => {
    setPrevBtnDisabled(!emblaApi.canScrollPrev())
    setNextBtnDisabled(!emblaApi.canScrollNext())
  }, [])

  const treatment = treatmentData?.treatment

  // Collect all unique cities
  const allCities = useMemo(() => {
    const cityMap = new Map<string, CityData>()
    if (treatmentData?.hospitals) {
      treatmentData.hospitals.forEach((hospital: any) => {
        hospital.branches?.forEach((branch: any) => {
          branch.city?.forEach((city: CityData) => {
            if (city._id && !cityMap.has(city._id)) cityMap.set(city._id, city)
          })
        })
      })
    }
    return Array.from(cityMap.values())
  }, [treatmentData?.hospitals])

  // City Redirect Handler
  const handleCityRedirect = useCallback((id: string, view: 'hospitals' | 'doctors') => {
    const selectedCity = allCities.find(c => c._id === id)
    if (!treatment) return

    const treatmentSlug = generateSlug(treatment.name)
    setSelectedCityId(id)
    setCitySearchValue("")

    const baseUrl = `/search?view=${view}&treatment=${treatmentSlug}`
    let redirectUrl = baseUrl

    if (selectedCity) {
      const citySlug = generateSlug(selectedCity.cityName)
      redirectUrl = `${baseUrl}&city=${citySlug}`
    }

    router.push(redirectUrl)
  }, [allCities, router, treatment])

  // Filter hospitals by city
  const filteredHospitals = useMemo(() => {
    if (!treatmentData?.hospitals) return []
    let filtered = treatmentData.hospitals

    if (selectedCityId) {
      filtered = filtered.filter((hospital: any) =>
        hospital.branches?.some((branch: any) => branch.city?.some((city: CityData) => city._id === selectedCityId))
      )
    }

    const citySearchTerm = citySearchValue.trim().toLowerCase()
    if (!selectedCityId && citySearchTerm) {
      filtered = filtered.filter((hospital: any) =>
        hospital.branches?.some((branch: any) => branch.city?.some((c: CityData) => c.cityName.toLowerCase().includes(citySearchTerm)))
      )
    }

    return filtered
  }, [treatmentData?.hospitals, selectedCityId, citySearchValue])

  // Reinitialize carousel when filtered data changes
  useEffect(() => {
    if (branchesEmblaApi) {
      onCarouselSelect(branchesEmblaApi)
      branchesEmblaApi.reInit()
      branchesEmblaApi.on('reInit', onCarouselSelect)
      branchesEmblaApi.on('select', onCarouselSelect)
    }
  }, [filteredHospitals, branchesEmblaApi, onCarouselSelect])

  // Filter doctors by city
  const filteredDoctors = useMemo(() => {
    if (!treatmentData?.allDoctors) return []
    let filtered = treatmentData.allDoctors

    if (selectedCityId) {
      filtered = filtered.filter((doc: any) =>
        doc.hospitals?.some((loc: any) => loc.cities?.some((city: CityData) => city._id === selectedCityId))
      )
    }

    const citySearchTerm = citySearchValue.trim().toLowerCase()
    if (!selectedCityId && citySearchTerm) {
      filtered = filtered.filter((doc: any) =>
        doc.hospitals?.some((loc: any) => loc.cities?.some((c: CityData) => c.cityName.toLowerCase().includes(citySearchTerm)))
      )
    }

    return filtered.sort((a: any, b: any) => {
      const expA = parseInt(a.doctor.experienceYears || '0', 10)
      const expB = parseInt(b.doctor.experienceYears || '0', 10)
      return expB - expA
    })
  }, [treatmentData?.allDoctors, selectedCityId, citySearchValue])

  // Fetch data
  useEffect(() => {
    let isMounted = true
    const fetchTreatmentData = async () => {
      setLoading(true)
      setError(null)
      try {
        const resolvedParams = await params
        const result = await findTreatmentWithHospitalsAndDoctors(resolvedParams.slug)
        if (!result) throw new Error("Treatment not found")
        if (isMounted) {
          setTreatmentData({
            treatment: result.treatment,
            hospitals: result.hospitals,
            allDoctors: result.allDoctors,
            totalHospitals: result.totalHospitals,
            totalDoctors: result.totalDoctors
          })
        }
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to load treatment details")
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchTreatmentData()
    return () => { isMounted = false }
  }, [params])

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-light">
        <HeroSkeleton />
        <Breadcrumb treatmentName="Loading..." />
        <section className="py-12 relative z-10">
          <div className="container mx-auto px-4">
            <main className="space-y-8">
              <OverviewSkeleton />
              <CarouselSkeleton />
              <DoctorsSkeleton />
            </main>
          </div>
        </section>
      </div>
    )
  }

  // Error State
  if (error || !treatment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <Breadcrumb treatmentName="Not Found" />
        <div className="text-center space-y-6 max-w-md p-8 bg-white rounded-sm border border-gray-100 shadow-sm">
          <Scissors className="w-16 h-16 text-gray-400 mx-auto" />
          <h2 className="text-2xl font-light text-gray-900">Treatment Not Found</h2>
          <p className="text-gray-600 leading-relaxed">{error || "The requested treatment could not be found."}</p>
          <Link href="/search?view=treatments" className="inline-block w-full bg-[#74BF44] text-white px-6 py-3 rounded-sm hover:bg-[#74BF44]/90 transition-all">Browse All Treatments</Link>
        </div>
      </div>
    )
  }

  const treatmentImage = treatment.treatmentImage ? getContentImage(treatment.treatmentImage) : null
  const totalDoctors = treatmentData?.totalDoctors || 0
  const totalHospitals = treatmentData?.totalHospitals || 0

  return (
    <div className="min-h-screen bg-gray-50 font-light">
      {/* Hero Section */}
      <section className="relative w-full h-[50vh] md:h-[70vh]">
        {treatmentImage ? (
          <Image src={treatmentImage} alt={`${treatment.name} treatment`} fill priority className="object-cover object-top" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full z-10 md:px-4 pb-12 text-white">
          <div className="container mx-auto space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight">{treatment.name}</h1>
            <p className="text-lg max-w-2xl leading-relaxed text-white/90">
              {treatment.category || 'Specialized Treatment'}
              {totalDoctors > 0 && ` - ${filteredDoctors.length} Specialist Doctors Available`}
            </p>
            <div className="mt-6 max-w-md">
              <div className="relative">
                <input type="text" placeholder="Search treatments by name or specialist..." className="w-full pl-4 pr-12 py-3 bg-white/90 backdrop-blur-sm border border-white/20 rounded-sm text-sm text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-[#74BF44]/50 focus:border-[#74BF44]/50 transition-all"
                  onKeyDown={(e) => { if (e.key === 'Enter') { const query = (e.target as HTMLInputElement).value.trim(); if (query) router.push(`/search?view=treatments&treatment=${encodeURIComponent(query)}`) } }} />
                <button onClick={(e) => { const input = e.currentTarget.previousElementSibling as HTMLInputElement; const query = input.value.trim(); if (query) router.push(`/search?view=treatments&treatment=${encodeURIComponent(query)}`) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-[#74BF44]">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Breadcrumb treatmentName={treatment.name} />

      <section className="md:py-12 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-12 gap-8">
            <main className="space-y-6 col-span-12 lg:col-span-9">
              
              {/* Treatment Overview */}
              <section className="bg-white rounded-sm border border-gray-100 p-4 md:p-6 shadow-sm">
                {treatment.description && <RichTextDisplay htmlContent={treatment.description} />}
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  {treatment.category && (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-sm border border-gray-100">
                      <div className="w-3 h-3 bg-[#74BF44] rounded-full" />
                      <div><p className="text-xs uppercase tracking-wide text-gray-500">Category</p><p className="text-sm text-gray-700">{treatment.category}</p></div>
                    </div>
                  )}
                  {treatment.duration && (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-sm border border-gray-100">
                      <Calendar className="w-5 h-5 text-gray-500" /><div><p className="text-xs uppercase tracking-wide text-gray-500">Duration</p><p className="text-sm text-gray-700">{treatment.duration}</p></div>
                    </div>
                  )}
                  {treatment.cost && (
                    <div className="flex items-center gap-3 p-4 bg-[#74BF44]/10 rounded-sm border border-[#74BF44]/20">
                      <Award className="w-5 h-5 text-[#74BF44]" /><div><p className="text-xs uppercase tracking-wide text-gray-500">Estimated Cost</p><p className="text-sm text-gray-700">${treatment.cost}</p></div>
                    </div>
                  )}
                </div>
              </section>

              {/* Hospitals Section */}
              {filteredHospitals.length > 0 && (
                <section className="bg-white rounded-sm border border-gray-100 p-4 md:p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h3 className="text-xl font-medium text-gray-900">{totalHospitals} Hospital{totalHospitals !== 1 ? 's' : ''} Offering {treatment.name}</h3>
                    <CityFilter cities={allCities} onSearchChange={setCitySearchValue} onSelectCity={(id) => handleCityRedirect(id, 'hospitals')} selectedCityId={selectedCityId} searchValue={citySearchValue} />
                  </div>
                  <BranchesCarousel hospitals={filteredHospitals} emblaRef={branchesEmblaRef} emblaApi={branchesEmblaApi} prevBtnDisabled={prevBtnDisabled} nextBtnDisabled={nextBtnDisabled} />
                </section>
              )}

              {/* Doctors Section */}
              {filteredDoctors.length > 0 && (
                <section className="bg-white rounded-sm border border-gray-100 p-4 md:p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h3 className="text-xl font-medium text-gray-900">{totalDoctors} Specialist Doctor{totalDoctors !== 1 ? 's' : ''} for {treatment.name}</h3>
                    <CityFilter cities={allCities} onSearchChange={setCitySearchValue} onSelectCity={(id) => handleCityRedirect(id, 'doctors')} selectedCityId={selectedCityId} searchValue={citySearchValue} />
                  </div>
                  <div className="grid md:grid-cols-3 gap-6">
                    {filteredDoctors.map((docData: any) => (
                      <DoctorCard key={docData.doctor._id} doctor={docData.doctor} locations={docData.hospitals} departments={docData.departments} />
                    ))}
                  </div>
                </section>
              )}
            </main>

            {/* Sidebar */}
            <aside className="col-span-12 lg:col-span-3">
              <ContactForm />
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}
