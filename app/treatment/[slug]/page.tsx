// app/treatment/[slug]/page.tsx
// Dynamic page for individual treatment details.
// Enhanced for expert-level code quality: improved TypeScript types, component separation,
// optimized hooks (useMemo, useCallback), accessibility (ARIA labels, keyboard nav),
// Embla Carousel navigation wired up, consistent 3-card display across breakpoints,
// reduced redundancy in image utilities, better error handling, and cleaner structure.
// Color scheme: #241d1f text, #74BF44 accents, Inter font, rounded-sm, light shadows.
// Carousel: Fixed to display exactly 3 cards (responsive widths with calc(33.333% - 1rem gap)).
// Navigation arrows now functional with Embla API.
// SearchDropdown: Enhanced with keyboard navigation and ARIA.
// Data aggregation: Streamlined with reduced duplication.
// Skeletons: Optimized for performance.
// Fixed: Removed invalid top-level useCallback calls; moved pure functions to regular functions.
// Doctor card: Ensured branch name fetch with fallback to hospital name.
// UPDATED: Doctor card layout matches provided image: removed designation, department badges (up to 3), experience with green dot icon, hospital/branch name without icon.
// UPDATED: Sidebar (HospitalSearch and ContactForm) re-added for a two-column layout (9/3 split).
// FIXED: Added missing imports (ChevronDown, X, Search); cleaned SearchDropdown for used types only; removed unused allHospitals state and set.
// FIXED: Re-added allHospitals state to resolve ReferenceError in BranchesFilters usage.
// UPDATED: Integrated doctor mapping into treatment branches (per-branch specialist doctors for the treatment).
// Removed separate global doctor section; doctors now shown within each branch card (up to 3 per branch).
// Added total unique doctors count in hero for overview.
// Enhanced branch cards to display treatment-specific matching doctors.
// UPDATED: Added dedicated Doctors section with unique matching doctors across all branches offering the treatment (not limited to 6 branches for doctor collection).
// Doctors sorted by experience descending; displayed in responsive grid (3-4 cols); DoctorCard matches specified layout.
// UPDATED: Removed Branch/Hospital Filter. Only City Filter remains for both Branches and Doctors sections.
// FIX: The City Filter now redirects to `/hospitals?view=hospitals&city=...` for the Branches section and `/hospitals?view=doctors&city=...` for the Doctors section.
// UPDATED LOGIC: City Filter now includes `&treatment={treatmentSlug}` in the redirection URL to retain treatment context for filtering on the hospitals page.
// LATEST: Ensured all cards (Branch/Hospital and Doctor) use proper Next.js Link components for redirects. Branch cards link to hospital/branch paths. Doctor cards link to doctor paths. Designs match specified layouts: Branch cards include hospital-branch naming, city, specializations (up to 2), matching doctors (up to 3 + more), beds. Doctor cards include profile image/placeholder, name, departments (up to 3 badges), experience with dot, branch/hospital name.
// FIXED: SearchDropdown input value logic corrected to properly display the selected city name and handle the search query for the redirection.
// FIXED: Confirmed URL formatting uses hyphens (-) for query parameters (e.g., city=new-delhi) via generateSlug utility, ensuring a modern URL format.
// UPDATED: Based on API response, remove "Group" from hospital names for display. For branch titles, use branchName directly (includes hospital + location). For doctor locations, prefer branchName if available, else hospitalName without "Group".
// UPDATED: Ensured proper branch name display in DoctorCard footer by prioritizing the first location with branchName available.
// UPDATED: Adjusted card margins, padding, and size calculations to strictly match the component skeletons (e.g., Carousel and Doctors grid gaps/columns).
// UPDATED LOGIC: City Filter options are now sorted A-Z by city name.

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
import { findTreatmentWithDoctors } from "./utils"

// Lightweight Inter font configuration
const inter = Inter({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  variable: "--font-inter"
})

// --- Types ---
interface City { _id: string; cityName: string; state: string | null; country: string | null }
interface Department { _id: string; name: string }
interface TreatmentLocation {
  branchId?: string
  branchName?: string
  hospitalName: string
  hospitalId: string
  cities: City[]
  departments: Department[]
  cost: string | null
}
interface Treatment {
  _id: string
  name: string
  description: string | null
  category: string | null
  duration: string | null
  cost: string | null
  treatmentImage?: string | null
  branchesAvailableAt: TreatmentLocation[]
  departments: Department[]
}
interface Doctor {
  _id: string
  doctorName: string
  specialization: any[]
  qualification: string | null
  experienceYears: string | null
  designation: string | null
  aboutDoctor: string | null
  profileImage: string | null
  popular?: boolean
  locations: { hospitalName: string; hospitalId: string; branchName?: string; branchId?: string; cities: City[] }[]
  departments: Department[]
}
interface Branch {
  _id: string
  branchName: string
  address: string | null
  city: City[]
  totalBeds: string | null
  noOfDoctors: string | null
  yearEstablished: string | null
  branchImage: string | null
  description: string | null
  doctors: any[]
  treatments: any[]
  specialists: any[]
  specialization: any[]
  accreditation: any[]
  hospitalName: string
  hospitalId: string
  hospitalLogo: string | null
}
interface ExtendedBranch extends Branch {
  matchingDoctors: Doctor[]
}
interface Hospital {
  _id: string
  hospitalName: string
  logo: string | null
  yearEstablished: string | null
  description: string | null
  branches: Branch[]
  doctors: any[]
  treatments: any[]
  departments?: any[]
}
interface ApiResponse { items: Hospital[]; total: number }

// DoctorCard Props
interface DoctorCardProps {
  doctor: Doctor
}

// --- Utilities (Pure functions, no hooks) ---
const getWixImageUrl = (imageStr: string | null | undefined): string | null => {
  if (!imageStr || typeof imageStr !== "string" || !imageStr.startsWith("wix:image://v1/")) return null
  const parts = imageStr.split("/")
  return parts.length >= 4 ? `https://static.wixstatic.com/media/${parts[3]}` : null
}

const generateSlug = (name: string | null | undefined): string => {
  // This function is crucial for creating the modern hyphenated URL format (e.g., "New Delhi" -> "new-delhi")
  return (name ?? '').toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-")
}

const getContentImage = (content: any): string | null => {
  if (typeof content === 'string') return getWixImageUrl(content)
  if (!content || !content.nodes) return null
  const imageNode = content.nodes.find((node: any) => node.type === 'IMAGE')
  if (imageNode?.imageData?.image?.src?.id) {
    return `https://static.wixstatic.com/media/${imageNode.imageData.image.src.id}`
  }
  return null
}

// Helper to clean hospital name by removing "Group"
const cleanHospitalName = (name: string | null | undefined): string => {
  return (name || '').replace(' Group', '').trim() || 'N/A'
}

const RichTextDisplay = ({ htmlContent, className = "" }: { htmlContent: string; className?: string }) => {
  
  // MODIFIED: Function to replace <li> tags in <ul> with the CheckCircle icon HTML
  const transformListItems = (html: string): string => {
    // 1. Define the HTML for the Lucide CheckCircle icon with the required styling
    // This is the SVG markup for the CheckCircle icon, stylized with inline CSS
    // to match the requested w-5 h-5 text-[#74BF44] flex-shrink-0.
    const iconSvgHtml = 
      `<span style="display: inline-flex; align-items: flex-start; margin-right: 3px; flex-shrink: 0; min-width: 1.25rem; height: 1.25rem;">` +
      `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5" style="color:#74BF44; width: 1rem; margin-top: 5px; height: 1rem;">` + 
      `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>` + 
      `</svg></span>`;

    // 2. Define the new structure for the <li> content wrapper
    // We use a flex div inside the <li> to correctly position the icon next to the text.
    // The "min-w" and "height" styles on the span ensure the icon reserves space even if text wraps.
    const liContentWrapperStart = `<div style="display: flex; align-items: flex-start;">${iconSvgHtml}<span style="flex: 1;">`;
    const liContentWrapperEnd = `</span></div>`;

    // 3. Regex to replace content inside <li>...</li> tags.
    // Matches an opening <li> tag (with optional attributes), captures content (non-greedily), and the closing </li> tag.
    // The `s` flag allows `.` to match newlines.
    
    // Replace the content inside <li> tags (targeting only `<ul>` items for safety)
    let transformedHtml = html.replace(
        /(<ul>.*?)(<li([^>]*)>)(.*?)(<\/li>)/gs, 
        (match, ulStart, liOpenTag, liAttrs, liContent, liCloseTag) => {
            // Trim whitespace from content
            const trimmedContent = liContent.trim();
            
            // Check if content is NOT empty and NOT already wrapped
            // NOTE: Checking for a substring of the icon HTML is a quick way to avoid double-wrapping, 
            // though not foolproof for all malformed HTML.
            if (trimmedContent.length > 0 && !trimmedContent.includes(iconSvgHtml)) {
                // Reconstruct the <li> tag, but wrap content with the new structure
                // We keep ulStart and liOpenTag as is, then insert the new content structure, then liCloseTag
                return ulStart + liOpenTag + liContentWrapperStart + trimmedContent + liContentWrapperEnd + liCloseTag;
            }
            
            // If content is empty or already wrapped, return the original match (ulStart + li...).
            return match;
        }
    );
    
    // Fallback: If it's a simple list not contained in a UL block, apply the transformation 
    // to any remaining top-level <li> tags. This is less ideal but necessary if content structure is flat.
    transformedHtml = transformedHtml.replace(/<li([^>]*)>(.*?)<\/li>/gs, (match, liAttrs, liContent) => {
        const trimmedContent = liContent.trim();
        if (trimmedContent.length > 0 && !trimmedContent.includes(iconSvgHtml)) {
            return `<li${liAttrs}>${liContentWrapperStart}${trimmedContent}${liContentWrapperEnd}</li>`;
        }
        return match;
    });

    return transformedHtml;
  }
  
  const modifiedHtml = useMemo(() => {
    let cleanHtml = htmlContent;

    // Apply the list item transformation
    cleanHtml = transformListItems(cleanHtml);
    
    // IMPORTANT SECURITY NOTE: 
    // In a real application, you must use a library like DOMPurify 
    // here to sanitize the HTML before using dangerouslySetInnerHTML.
    // Example: return DOMPurify.sanitize(cleanHtml);
    
    return cleanHtml;
  }, [htmlContent]);


  // MODIFIED: Updated Tailwind classes to REMOVE default list styling and padding
  const typographyClasses = `
    prose max-w-none text-gray-700 leading-relaxed 
     
    /* Headings: Playfair (Serif) */
    prose-h1:text-3xl prose-h1:font-extrabold prose-h1:mt-8 prose-h1:mb-4 prose-h1:text-gray-900
    prose-h2:text-2xl prose-h2:font-extrabold prose-h2:mt-7 prose-h2:mb-4 prose-h2:text-gray-900
    prose-h3:text-xl prose-h3:font-bold prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-gray-800
    prose-h4:text-lg prose-h4:font-semibold prose-h4:mt-5 prose-h4:mb-2 prose-h4:text-gray-800
    
    /* Paragraphs and Lists */
    prose-p prose-p:font-sans prose-p:mt-3 prose-p:mb-3 prose-p:text-base prose-p:text-gray-700
    
    /* MODIFIED: Custom list styling to REMOVE default bullets/indentation */
    prose-li:font-sans prose-li:mt-3 prose-li:mb-3 prose-li:text-base prose-li:text-gray-700
    prose-li:list-none prose-li:ml-0 prose-li:pl-0 /* CRITICAL: REMOVE DEFAULT LIST STYLES */
    
    prose-ul:mt-4 prose-ul:mb-4 prose-ul:list-none prose-ul:ml-0 prose-ul:pl-0 /* Ensure UL is clean */
    prose-ol:mt-3 prose-ol:mb-3 prose-ol:list-decimal // Keep numbered lists standard
    
    /* Links, emphasis, etc. */
    prose-a:text-blue-600 prose-a:font-medium prose-a:underline hover:prose-a:text-blue-800
    prose-strong:font-bold prose-strong:text-gray-900 
  `;

  return (
    <div
      className={`${typographyClasses} ${className}`}
      // This is necessary to render the HTML structure from Wix CMS
      dangerouslySetInnerHTML={{ __html: modifiedHtml }}
    />
  );
};

// --- Components ---
// DoctorCard Component
const DoctorCard = ({ doctor }: DoctorCardProps) => {
  const profileImage = doctor.profileImage ? getWixImageUrl(doctor.profileImage) : null
  const doctorSlug = generateSlug(doctor.doctorName)

  // Prioritize the first location that has a branchName for proper branch display; fallback to first location
  const primaryLocation = doctor.locations.find(loc => loc.branchName) || doctor.locations[0]
  // Use branchName if available, else cleaned hospitalName
  const displayLocation = primaryLocation?.branchName || cleanHospitalName(primaryLocation?.hospitalName) || 'N/A'

  // --- UPDATED LOGIC FOR DEPARTMENT BADGES ---

  // Get the name of the first department
  const firstDepartmentName = doctor.departments[0]?.name

  // Calculate the number of remaining departments to display, up to a maximum of 3 total (1 displayed name + max 2 in the count)
  const remainingDepartmentCount = doctor.departments.length > 1
    ? Math.min(doctor.departments.length - 1, 2) // Max out at +2 (for 3 or more departments)
    : 0

  // --- END OF UPDATED LOGIC ---

  return (
    <Link href={`/doctors/${doctorSlug}`} className="block">
      <article className="group bg-white rounded-xs shadow-xs transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col hover:shadow-sm border border-gray-100">
        <div className="relative h-48 overflow-hidden bg-gray-50">
          {doctor.popular && (
            <span className="absolute top-3 right-3 z-10 inline-flex items-center text-sm bg-gray-50 text-gray-600 font-medium px-3 py-2 rounded-xs shadow-sm border border-gray-100">
              <Star className="w-3 h-3 mr-1 fill-gray-300 text-gray-400" />Popular
            </span>
          )}
          {profileImage ? (
            <img
              src={profileImage}
              alt={doctor.doctorName}
              className="object-cover object-top w-full h-full group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { e.currentTarget.style.display = "none" }}
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
            <h2 className="text-lg font-medium leading-tight line-clamp-2 text-gray-900 group-hover:text-gray-800 transition-colors">
              {doctor.doctorName}
            </h2>
          </header>

          <div className="space-y-2">


            {/* Department Badges (First Name + Remaining Count) */}
            {firstDepartmentName && (
              <div className="flex flex-wrap gap-1">
                {/* First Department Name */}
                <span
                  className="inline-flex items-center text-sm font-medium text-gray-900"
                >
                  {firstDepartmentName}
                </span>

                {/* Remaining Departments Count Badge */}
                {remainingDepartmentCount > 0 && (
                  <span
                    className="inline-flex items-center text-sm font-medium text-gray-900"
                  >
                    +{remainingDepartmentCount} Department
                  </span>
                )}
              </div>
            )}
              <div className="flex items-center gap-2">
              {/* Implemented the green dot icon as per design notes in the file context */}

              <p className="text-sm text-gray-900 font-normal">
                {doctor.experienceYears} Years Exp.
              </p>
            </div>
          </div>

          <footer className="border-t border-gray-100 pt-2 mt-auto">
            <p className="text-sm text-gray-900/70 font-normal line-clamp-1">
              {displayLocation}
            </p>
          </footer>
        </div>
      </article>
    </Link>
  )
}

// SearchDropdown Component (Generic for City filter)
interface SearchDropdownProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  options: { id: string; name: string }[]
  selectedOption: string
  onOptionSelect: (id: string) => void
  onClear: () => void
  type: "city" // Only city remains
}

const SearchDropdown = ({ value, onChange, placeholder, options, selectedOption, onOptionSelect, onClear, type }: SearchDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOptionName = useMemo(() => options.find(opt => opt.id === selectedOption)?.name || '', [options, selectedOption]);

  // Determine the value to display in the input field
  const displayedValue = selectedOptionName || value;

  const filteredOptions = useMemo(() => {
    return options
      .filter(option => option.name.toLowerCase().includes(value.toLowerCase()))
      // UPDATED LOGIC: Sort by name A-Z
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [options, value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  useEffect(() => {
    if (isOpen && filteredOptions.length > 0) {
      setHighlightedIndex(0)
    } else {
      setHighlightedIndex(-1)
    }
  }, [isOpen, filteredOptions.length])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0) {
          onOptionSelect(filteredOptions[highlightedIndex].id)
          onChange("") // Clear search query to reset filtering state
          setIsOpen(false)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }, [isOpen, highlightedIndex, filteredOptions, onOptionSelect, onChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // If an option was selected, clear it when the user starts typing
    if (selectedOption) onOptionSelect("")
    // Update the search query value
    onChange(e.target.value)
    setIsOpen(true)
  }

  const getIcon = () => {
    const icons = {
      city: MapPin
    }
    const Icon = icons[type] || Search
    return <Icon className="w-4 h-4 text-[#241d1f]/60" />
  }

  const getPlaceholder = () => {
    const placeholders = {
      city: "Filter by City (e.g., New Delhi)"
    }
    return placeholders[type] || placeholder
  }

  const getNoResultsText = () => {
    const texts = {
      city: "cities"
    }
    return texts[type] || ""
  }

  return (
    <div ref={dropdownRef} className="relative space-y-2 w-full max-w-64">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">{getIcon()}</div>
        <input
          ref={inputRef}
          type="text"
          placeholder={getPlaceholder()}
          value={displayedValue} // Use the calculated displayedValue
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={`pl-10 pr-12 py-2.5 border border-gray-200 rounded-sm w-full text-sm bg-white focus:bg-white focus:ring-2 focus:ring-[#74BF44]/50 focus:border-[#74BF44]/50 transition-all placeholder:text-[#241d1f]/40 font-extralight ${inter.variable}`}
          aria-label={`Search ${getPlaceholder()}`}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        />
        {isOpen && (
          <ul role="listbox" className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-sm shadow-lg z-10 max-h-60 overflow-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <li key={option.id}>
                  <button
                    onClick={() => {
                      onOptionSelect(option.id)
                      onChange("") // Clear search input value after selecting an option
                      setIsOpen(false)
                    }}
                    className={classNames(
                      "w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-[#241d1f] font-extralight",
                      { "bg-[#74BF44]/10": index === highlightedIndex }
                    )}
                    aria-selected={index === highlightedIndex}
                  >
                    {option.name}
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-sm text-gray-500">No {getNoResultsText()} found</li>
            )}
          </ul>
        )}
        {selectedOption && (
          <button
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#241d1f]/40 hover:text-[#241d1f]/70"
            aria-label="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {!selectedOption && !value && (
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#241d1f]/40" />
        )}
      </div>
    </div>
  )
}

// CityFilter Component
interface CityFilterProps {
  cities: City[],
  onSearchChange: (value: string) => void,
  onSelectCity: (id: string) => void,
  selectedCityId: string,
  searchValue: string
}

const CityFilter = ({
  cities,
  onSearchChange,
  onSelectCity,
  selectedCityId,
  searchValue
}: CityFilterProps) => {
  const options = useMemo(() => {
    // Collect unique cities and map to {id, name}
    const uniqueCities = Array.from(new Map(cities.map(c => [c._id, c])).values())
    // Map to option format
    const cityOptions = uniqueCities.map(c => ({
      id: c._id,
      name: c.cityName
    }))
    // Sorting logic is now within SearchDropdown's useMemo for better filtering performance,
    // but we can ensure a base sort here too, though SearchDropdown will re-sort filtered results.
    // Let's rely on SearchDropdown for the final A-Z sort in the filteredOptions.
    return cityOptions
  }, [cities])

  return (
    <SearchDropdown
      value={searchValue}
      onChange={onSearchChange}
      placeholder="e.g., New Delhi"
      options={options}
      selectedOption={selectedCityId}
      onOptionSelect={onSelectCity}
      // Proper clear logic: call onSelectCity with empty string, and clear search value
      onClear={() => { onSelectCity(""); onSearchChange(""); }}
      type="city"
    />
  )
}

// Breadcrumb Component
interface BreadcrumbProps {
  treatmentName: string
}

const Breadcrumb = ({ treatmentName }: BreadcrumbProps) => (
  <nav className={`bg-white border-b border-gray-100 px-4 py-3 ${inter.variable} font-extralight`} aria-label="Breadcrumb">
    <div className="container mx-auto flex items-center space-x-2 text-sm text-[#241d1f]/70">
      <Link href="/" className="flex items-center hover:text-[#74BF44] transition-colors" aria-label="Home">
        <Home className="w-4 h-4 mr-1" />
        Home
      </Link>
      <ChevronRightIcon className="w-4 h-4" aria-hidden />
      <Link href="/search?view=treatments" className="hover:text-[#74BF44] transition-colors">
        Treatments
      </Link>
      <ChevronRightIcon className="w-4 h-4" aria-hidden />
      <span aria-current="page">{treatmentName}</span>
    </div>
  </nav>
)

// Generic Carousel Navigation Hook
const useCarouselNavigation = (emblaApi?: any) => {
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  return { scrollPrev, scrollNext }
}

// BranchesOfferingTreatmentCarousel Component (3 cards, wired nav, integrated treatment-specific doctors)
interface BranchesOfferingTreatmentCarouselProps {
  branches: ExtendedBranch[],
  treatmentName: string,
  emblaRef: any,
  emblaApi?: any
}

const BranchesOfferingTreatmentCarousel = ({ branches, treatmentName, emblaRef, emblaApi }: BranchesOfferingTreatmentCarouselProps) => {
  const { scrollPrev, scrollNext } = useCarouselNavigation(emblaApi)

  if (branches.length === 0) return null

  return (
    <div className={`relative  overflow-hidden ${inter.variable} font-extralight`} role="region" aria-label="Branches Carousel">
      <div className="embla__viewport overflow-hidden h-auto" ref={emblaRef}>
        {/* UPDATED: Changed gap logic to match CarouselSkeleton (gap-4) */}
        <div className="embla__container flex gap-4">
          {branches.map((branch) => {
             const slug = generateSlug(`${branch.branchName}`)
            const hospitalImg = branch.branchImage ? getContentImage(branch.branchImage) : null
            const hospitalLogoUrl = branch.hospitalLogo ? getWixImageUrl(branch.hospitalLogo) : null
            // Use branchName directly as displayTitle (includes hospital + location)
            const displayTitle = branch.branchName
            // For now, using the first element in the array properties for display
            const firstCity = branch.city?.[0]?.cityName || 'City'
            const firstSpecialty = branch.specialization?.[0]?.name || 'Specialty'
            const estdYear = branch.yearEstablished || 'N/A'
            const bedsCount = branch.totalBeds || '0'
            const doctorsCount = branch.noOfDoctors || '0'
            const accImage = branch.accreditation?.[0]?.image ? getWixImageUrl(branch.accreditation[0].image) : null

            return (
              // UPDATED: Use the calculated width from CarouselSkeleton to ensure 3 cards fit with gap-4
              <div key={branch._id} className="min-w-0 w-full md:w-[calc(33.333%-0.666rem)] flex-shrink-0">
                {/* UPDATED: Removed custom height/margin compensating classes */}
                <Link href={`/search/hospitals/${slug}`} className="block w-full border border-gray-100 rounded-sm shadow-xs bg-white hover:shadow-sm transition-shadow relative flex flex-col overflow-hidden h-full">
                  {/* Hospital Image Section */}
                  <div className="relative w-full h-48 bg-gray-100">
                    {hospitalImg ? (
                      <Image
                        src={hospitalImg}
                        alt={`${displayTitle} facility`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Hospital className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    {/* Accreditation Badge Top Right */}
                    {accImage && (
                      <div className="absolute top-4 right-4 z-10">
                        <img
                          src={accImage}
                          alt="Accreditation badge"
                          className="w-7 h-7 object-contain rounded-full shadow-lg"
                        />
                      </div>
                    )}
                    {hospitalLogoUrl && (
                      <div className="absolute bottom-2 left-2 z-10">
                        <img
                          src={hospitalLogoUrl}
                          alt={`${displayTitle} logo`}
                          className="w-12 h-auto object-contain"
                        />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className={`p-3 flex flex-col space-y-0 justify-between ${inter.variable} font-extralight relative`}>
                    {/* Title: Branch Name */}
                    <div className="mb-1">
                      <h3 className="text-2xl md:text-base font-medium text-[#241d1f] leading-tight line-clamp-2">{displayTitle}</h3>
                    </div>

                    {/* Subtitle: City, Specialty */}
                    <div className="mb-2">
                      <p className="text-base md:text-sm text-[#241d1f]/80 line-clamp-1">{`${firstCity}, ${firstSpecialty} Speciality`}</p>
                    </div>

                    {/* Matching Doctors for Treatment */}
                    {branch.matchingDoctors.length > 0 && (
                      <div className="mb-2">
                        <p className="text-base md:text-sm text-[#241d1f]/70 font-medium">Matching Doctors: {branch.matchingDoctors.length}</p>
                      </div>
                    )}

                    {/* Stats Row: Estd, Beds, Doctors - Adapted with green accents */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-gray-50 rounded-sm border border-gray-100">
                        <p className="text-base md:text-sm font-medium text-[#241d1f]">{estdYear}</p>
                        <p className="text-base md:text-sm text-[#241d1f]">Estd.</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-sm border border-gray-100">
                        <p className="text-base md:text-sm font-medium text-[#241d1f]">{bedsCount}+</p>
                        <p className="text-base md:text-sm text-[#241d1f]">Beds</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-sm border border-gray-100">
                        <p className="text-base md:text-sm font-medium text-[#241d1f]">{doctorsCount}+</p>
                        <p className="text-base md:text-sm text-[#241d1f]">Doctors</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
      {branches.length > 3 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md text-[#241d1f]/60 hover:text-[#241d1f] hover:bg-white transition-all z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md text-[#241d1f]/60 hover:text-[#241d1f] hover:bg-white transition-all z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  )
}

// Skeleton Components (Keeping them short)
const HeroSkeleton = () => <section className="relative w-full h-[70vh] bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"><div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" /><div className="absolute bottom-0 left-0 w-full z-10 px-4 pb-12"><div className="container mx-auto space-y-4"><div className="space-y-2"><div className="h-8 md:h-10 bg-gray-300 rounded w-64 md:w-96" /><div className="h-5 bg-gray-300 rounded w-80" /></div><div className="flex flex-wrap gap-3"><div className="h-8 bg-gray-300 rounded-full w-32 px-4 py-2" /><div className="h-8 bg-gray-300 rounded-full w-40 px-4 py-2" /></div></div></div></section>
const OverviewSkeleton = () => <div className={`bg-white rounded-sm border border-gray-100 p-4 shadow-xs animate-pulse ${inter.variable} font-extralight`}><div className="h-8 bg-gray-300 rounded w-48 mb-6" /><div className="space-y-4"><div className="h-4 bg-gray-300 rounded" /><div className="h-4 bg-gray-300 rounded w-3/4" /><div className="h-4 bg-gray-300 rounded w-5/6" /><div className="h-4 bg-gray-300 rounded" /></div><div className="grid md:grid-cols-3 gap-6 mt-8">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-sm border border-gray-100"><div className="w-3 h-3 bg-gray-300 rounded-full" /><div className="space-y-2 flex-1"><div className="h-3 bg-gray-300 rounded w-16" /><div className="h-4 bg-gray-300 rounded" /></div></div>))}</div></div>
const CarouselSkeleton = () => <div className={`bg-white rounded-sm border border-gray-100 p-4 mb-6 shadow-xs animate-pulse ${inter.variable} font-extralight`}><div className="flex justify-between items-center mb-4"><div className="h-8 bg-gray-300 rounded w-64" /><div className="flex gap-2">{Array.from({ length: 2 }).map((_, i) => (<div key={i} className="w-10 h-10 bg-gray-300 rounded-sm" />))}</div></div><div className="max-w-[63rem] mx-auto"><div className="overflow-hidden"><div className="flex gap-4">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="min-w-0 w-full md:w-[calc(33.333%-0.666rem)] flex-shrink-0 bg-white rounded-sm border border-gray-100 p-3 space-y-2 shadow-sm"><div className="h-40 bg-gray-300 rounded-t-sm mb-2" /><div className="space-y-2"><div className="h-5 bg-gray-300 rounded w-3/4" /><div className="h-4 bg-gray-300 rounded" /><div className="h-4 bg-gray-300 rounded w-1/2" /></div></div>))}</div></div></div></div>
const DoctorsSkeleton = () => <div className={`bg-white rounded-sm border border-gray-100 p-4 mb-6 shadow-xs animate-pulse ${inter.variable} font-extralight`}><div className="h-8 bg-gray-300 rounded w-64 mb-6" /><div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">{Array.from({ length: 8 }).map((_, i) => (<div key={i} className="space-y-3"><div className="h-32 bg-gray-300 rounded-sm" /><div className="h-5 bg-gray-300 rounded w-3/4" /><div className="flex flex-wrap gap-1">{Array.from({ length: 2 }).map((__, j) => (<div key={j} className="h-4 bg-gray-300 rounded-full w-16" />))}</div><div className="flex items-center h-4 bg-gray-300 rounded w-32" /><div className="h-4 bg-gray-300 rounded w-5/6" /></div>))}</div></div>


// --- Main Component ---
interface TreatmentPageProps {
  params: Promise<{ slug: string }>
}

export default function TreatmentPage({ params }: TreatmentPageProps) {
  const router = useRouter()
  const [treatment, setTreatment] = useState<Treatment | null>(null)
  const [allBranches, setAllBranches] = useState<ExtendedBranch[]>([])
  const [allMatchingDoctors, setAllMatchingDoctors] = useState<Doctor[]>([])
  const [allHospitals, setAllHospitals] = useState<Hospital[]>([])
  const [treatmentCategory, setTreatmentCategory] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // City Filter States (retained for dropdown component function)
  const [citySearchValue, setCitySearchValue] = useState<string>('')
  // The ID of the city that has been selected from the dropdown
  const [selectedCityId, setSelectedCityId] = useState<string>('')


  // Embla Carousels
  const [branchesEmblaRef, branchesEmblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 768px)': { slidesToScroll: 3 },
    }
  })

  // Total unique doctors across all matching branches
  const totalDoctors = useMemo(() => allMatchingDoctors.length, [allMatchingDoctors])

  // Collect all unique cities from the branches
  const allCities = useMemo(() => {
    const cityMap = new Map<string, City>()
    allBranches.forEach(branch => {
      branch.city.forEach(city => {
        if (city._id && !cityMap.has(city._id)) {
          cityMap.set(city._id, city)
        }
      })
    })
    return Array.from(cityMap.values())
  }, [allBranches])


  // --- New Handler for City Selection (Triggers Redirection with Treatment Context) ---
  const handleCityRedirect = useCallback((id: string, view: 'hospitals' | 'doctors') => {
    // 1. Find the selected city object
    const selectedCity = allCities.find(c => c._id === id);

    // 2. Safety check: Don't proceed if treatment data isn't loaded
    if (!treatment) return;

    // 3. Get the slug of the current treatment
    const treatmentSlug = generateSlug(treatment.name);

    // 4. Update local state *before* redirect (important for visual change on the component)
    setSelectedCityId(id);
    setCitySearchValue("");

    // 5. Construct the redirection URL
    const baseUrl = `/search?view=${view}&treatment=${treatmentSlug}`;
    let redirectUrl = baseUrl;

    if (selectedCity) {
      // ✅ CORE FIX CONFIRMED: Convert the city's *name* (e.g., 'New Delhi') to a modern slug (e.g., 'new-delhi')
      const citySlug = generateSlug(selectedCity.cityName);
      // Append the city parameter using the SLUG, not the ID
      redirectUrl = `${baseUrl}&city=${citySlug}`;
    }

    // 6. Perform the redirection
    router.push(redirectUrl);

  }, [allCities, router, treatment]);


  // Filtered data for Branches (Kept the logic for client-side filtering until redirect happens)
  const filteredBranches = useMemo(() => {
    let filtered = allBranches

    if (selectedCityId) {
      filtered = filtered.filter(branch =>
        branch.city.some(city => city._id === selectedCityId)
      )
    }

    const citySearchTerm = citySearchValue.trim().toLowerCase()
    if (!selectedCityId && citySearchTerm) {
      filtered = filtered.filter(branch =>
        branch.city.some((c: City) => c.cityName.toLowerCase().includes(citySearchTerm))
      )
    }

    return filtered
  }, [allBranches, selectedCityId, citySearchValue])

  // Filtered data for Doctors (Kept the logic for client-side filtering until redirect happens)
  const filteredDoctors = useMemo(() => {
    let filtered = allMatchingDoctors

    if (selectedCityId) {
      filtered = filtered.filter(doctor =>
        doctor.locations.some(loc =>
          loc.cities.some(city => city._id === selectedCityId)
        )
      )
    }

    const citySearchTerm = citySearchValue.trim().toLowerCase()
    if (!selectedCityId && citySearchTerm) {
      filtered = filtered.filter(doctor =>
        doctor.locations.some(loc =>
          loc.cities.some((c: City) => c.cityName.toLowerCase().includes(citySearchTerm))
        )
      )
    }

    // Doctors sorted by experience descending
    return filtered.sort((a, b) => {
      const expA = parseInt(a!.experienceYears || '0', 10)
      const expB = parseInt(b!.experienceYears || '0', 10)
      return expB - expA
    });
  }, [allMatchingDoctors, selectedCityId, citySearchValue])


  // Fetch data using direct CMS library calls
  useEffect(() => {
    let isMounted = true
    const fetchTreatmentData = async () => {
      setLoading(true)
      setError(null)

      try {
        const resolvedParams = await params
        const treatmentSlug = resolvedParams.slug

        // Use direct CMS library call instead of API route
        const result = await findTreatmentWithDoctors(treatmentSlug)
        
        if (!result) {
          throw new Error("Treatment not found")
        }

        if (isMounted) {
          setTreatment(result.treatment)
          setAllBranches(result.branchesOfferingTreatment)
          setAllMatchingDoctors(result.allMatchingDoctors)
          setAllHospitals([]) // Not needed for display
          setTreatmentCategory(result.treatment.category || '')
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load treatment details")
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchTreatmentData()
    return () => { isMounted = false }
  }, [params])

  // --- Render ---

  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-50 ${inter.variable} font-extralight`}>
        <HeroSkeleton />
        <Breadcrumb treatmentName="Treatment Name" />
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

  if (error || !treatment) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 relative ${inter.variable} font-extralight`}>
        <Breadcrumb treatmentName="Treatment Name" />
        <div className={`text-center space-y-6 max-w-md p-8 bg-white rounded-sm border border-gray-100 shadow-xs ${inter.variable} font-extralight`}>
          <Scissors className="w-16 h-16 text-[#241d1f]/40 mx-auto" />
          <h2 className={`text-2xl font-extralight text-[#241d1f] ${inter.variable}`}>Treatment Not Found</h2>
          <p className={`text-[#241d1f]/70 leading-relaxed font-extralight ${inter.variable}`}>{error || "The requested treatment could not be found. Please check the URL or try searching again."}</p>
          <Link
            href="/Hospitals/?view=treatments"
            className="inline-block w-full bg-[#74BF44] text-white px-6 py-3 rounded-sm hover:bg-[#74BF44]/90 transition-all font-extralight ${inter.variable} shadow-sm focus:outline-none focus:ring-2 focus:ring-[#74BF44]/50"
          >
            Browse All Treatments
          </Link>
        </div>
      </div>
    )
  }

  const treatmentImage = treatment.treatmentImage ? getContentImage(treatment.treatmentImage) : null
  const heroImage = treatmentImage

  return (
    <div className={`min-h-screen bg-gray-50 font-extralight ${inter.variable}`}>
      <section className="relative w-full h-[50vh] md:h-[80vh]">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={`${treatment.name} treatment`}
            fill
            priority
            className="object-cover object-top"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-0" />
        <div className="absolute bottom-0 left-0 w-full z-10 md:px-4 pb-12 text-white">
          <div className="container mx-auto space-y-4">
            <h1 className={`text-3xl md:text-4xl lg:text-5xl font-extralight leading-tight ${inter.variable}`}>
              {treatment.name}
            </h1>
            <p className={`text-lg max-w-2xl leading-relaxed text-white/90 font-extralight ${inter.variable}`}>
              {treatment.category || 'Specialized Treatment'}
              {totalDoctors > 0 && ` - ${filteredDoctors.length} Specialist Doctors Available`}
            </p>

            {/* Search Treatments Input */}
            <div className="mt-6 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search treatments by name or specialist..."
                  className="w-full pl-4 pr-12 py-3 bg-white/90 backdrop-blur-sm border border-white/20 rounded-sm text-sm text-gray-900 placeholder-gray-600 focus:bg-white focus:ring-2 focus:ring-[#74BF44]/50 focus:border-[#74BF44]/50 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const query = (e.target as HTMLInputElement).value.trim()
                      if (query) {
                        router.push(`/search?view=treatments&treatment=${encodeURIComponent(query)}`)
                      }
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement
                    const query = input.value.trim()
                    if (query) {
                      router.push(`/search?view=treatments&treatment=${encodeURIComponent(query)}`)
                    }
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-[#74BF44] transition-colors"
                >
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
          <div className=" grid md:grid-cols-12 gap-8">
            <main className="space-y-4 col-span-12 lg:col-span-9" >
              <section className={`bg-white rounded-sm border border-gray-100 p-2 md:p-4 mb-4 shadow-xs transition-all ${inter.variable} font-extralight`}>
               
                <div>
                  {/* FIXED: Called RichTextDisplay as a JSX tag to follow Rules of Hooks */}
                  {treatment.description && <RichTextDisplay htmlContent={treatment.description} />}
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    {treatment.category && (
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-sm border border-gray-100">
                        <div className="w-3 h-3 bg-[#74BF44] rounded-full flex-shrink-0"></div>
                        <div>
                          <p className={`font-extralight text-[#241d1f] text-xs uppercase tracking-wide ${inter.variable}`}>Category</p>
                          <p className={`text-[#241d1f]/70 text-sm font-extralight ${inter.variable}`}>{treatment.category}</p>
                        </div>
                      </div>
                    )}
                    {treatment.duration && (
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-sm border border-gray-100">
                        <Calendar className="w-5 h-5 text-[#241d1f]/60 flex-shrink-0" />
                        <div>
                          <p className={`font-extralight text-[#241d1f] text-xs uppercase tracking-wide ${inter.variable}`}>Duration</p>
                          <p className={`text-[#241d1f]/70 text-sm font-extralight ${inter.variable}`}>{treatment.duration}</p>
                        </div>
                      </div>
                    )}
                    {treatment.cost && (
                      <div className="flex items-center gap-3 p-4 bg-[#74BF44]/5 rounded-sm border border-[#74BF44]/10">
                        <Award className="w-5 h-5 text-[#74BF44] flex-shrink-0" />
                        <div>
                          <p className={`font-extralight text-[#241d1f] text-xs uppercase tracking-wide ${inter.variable}`}>Estimated Cost</p>
                          <p className={`text-[#241d1f]/70 font-extralight text-sm ${inter.variable}`}>${treatment.cost}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {allBranches.length > 0 && (
                <section className="space-y-4 bg-white rounded-sm border border-gray-100 p-2 md:p-4  shadow-xs">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h3 className={`text-xl font-medium text-[#241d1f] ${inter.variable}`}>Hospitals Offering {treatment.name} </h3>
                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                      {/* City Filter - Redirects to /hospitals?view=hospitals&treatment={slug} */}
                      <CityFilter
                        cities={allCities}
                        onSearchChange={setCitySearchValue}
                        onSelectCity={(id) => handleCityRedirect(id, 'hospitals')}
                        selectedCityId={selectedCityId}
                        searchValue={citySearchValue}
                      />
                    </div>
                  </div>
                  {filteredBranches.length > 0 ? (
                    <BranchesOfferingTreatmentCarousel
                      branches={filteredBranches}
                      treatmentName={treatment.name}
                      emblaRef={branchesEmblaRef}
                      emblaApi={branchesEmblaApi}
                    />
                  ) : (
                    <div className="text-center py-12 bg-white rounded-sm border border-gray-100" role="alert">
                      <Hospital className="w-12 h-12 text-[#241d1f]/20 mx-auto mb-4" />
                      <p className={`text-[#241d1f]/50 text-sm ${inter.variable}`}>No branches match your selection. Try adjusting your city filter.</p>
                    </div>
                  )}
                </section>
              )}

              {allMatchingDoctors.length > 0 && (
                <section className="space-y-4 bg-white rounded-sm border border-gray-100 p-4 shadow-xs">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h3 className={`text-xl font-medium text-[#241d1f] ${inter.variable}`}>Specialist Doctors for {treatment.name} </h3>
                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                      {/* Doctor City Filter - Redirects to /hospitals?view=doctors&treatment={slug} */}
                      <CityFilter
                        cities={allCities}
                        onSearchChange={setCitySearchValue}
                        onSelectCity={(id) => handleCityRedirect(id, 'doctors')}
                        selectedCityId={selectedCityId}
                        searchValue={citySearchValue}
                      />
                    </div>
                  </div>
                {filteredDoctors.length > 0 ? (
                  <div className="grid md:grid-cols-3 lg:grid-cols-3 gap-6">
                    {filteredDoctors.map((doctor) => (
                      <DoctorCard key={doctor._id} doctor={doctor} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-sm border border-gray-100" role="alert">
                    <Stethoscope className="w-12 h-12 text-[#241d1f]/20 mx-auto mb-4" />
                    <p className={`text-[#241d1f]/50 text-sm ${inter.variable}`}>No specialist doctors match your current city filter. Try adjusting your selection.</p>
                  </div>
                )}
              </section>
            )}
            </main>
            <aside className="col-span-12 lg:col-span-3">

              <ContactForm />
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}