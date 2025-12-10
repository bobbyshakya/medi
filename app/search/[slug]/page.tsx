// File: app/hospitals/[slug]/page.tsx

"use client"

import { useState, useEffect, useCallback, useMemo, useRef, use } from "react"
import Image from "next/image"
// Assuming this type exists in the project. If not, you must define it here.
// import type { HospitalWithBranchPreview } from "@/types/hospital"

// Define the type locally if not available from @/types/hospital
type HospitalWithBranchPreview = {
  _id: string;
  hospitalName: string;
  slug?: string;
  hospitalImage?: string | null;
  logo?: string | null;
  yearEstablished?: number;
  description?: string;
  branches?: Array<{
    _id: string;
    branchName: string;
    branchImage?: string | null;
    logo?: string | null;
    isMain?: boolean;
    city?: Array<{ name?: string; cityName?: string }>;
    totalBeds?: number;
    yearEstablished?: number;
    doctors?: any[];
    treatments?: any[];
    accreditation?: any[];
  }>;
  accreditations?: any[];
}
import {
  Hospital,
  Building2,
  Bed,
  Award,
  MapPin,
  CalendarDays,
  Star,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Home,
  Users,
  Heart,
  User,
  Scissors,
  ClipboardList,
  ChevronUp,
  // MODIFIED: Imported CheckCircle for list items
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useEmblaCarousel from "embla-carousel-react"
import classNames from "classnames"
import ContactForm from "@/components/ContactForm" // Assuming this component exists
import { Inter, Playfair_Display } from "next/font/google" // MODIFIED: Imported Playfair_Display
// NOTE: For security in a production environment, you must install and import DOMPurify (e.g., npm install dompurify)
// import DOMPurify from 'dompurify' 

// --- FONT DEFINITIONS ---
// Primary Sans-serif Font (for UI elements, body text outside of rich content)


// ==============================
// 1. INTERFACES
// ==============================

interface AccreditationType {
  _id: string;
  name: string;
  description: string | null;
  image: string | null;
  issuingBody: string | null;
  year: string | null;
  title: string; // Used for the displayed name
}

// Added 'city' property for convenience in components
type HospitalWithBranchPreviewExtended = HospitalWithBranchPreview & {
  accreditations?: AccreditationType[];
  city?: string;
}

// Typing for the API Response structure
interface HospitalApiResponse {
  items: HospitalWithBranchPreview[];
}

// ==============================
// 2. HELPER FUNCTIONS
// ==============================

// Helper to convert Wix image strings (wix:image://v1/...) to full URLs
const getWixImageUrl = (imageStr: string | null | undefined): string | null => {
  if (!imageStr || typeof imageStr !== "string" || !imageStr.startsWith("wix:image://v1/")) return null
  const parts = imageStr.split("/")
  // Wix image URL format: wix:image://v1/{id}/{originalFileName}
  // The media URL is: https://static.wixstatic.com/media/{id}
  return parts.length >= 4 ? `https://static.wixstatic.com/media/${parts[3]}` : null
}

// Universal function to extract image URL from various content structures
const getImageUrl = (content: any): string | null => {
  if (typeof content === 'string') {
    return getWixImageUrl(content)
  }
  if (!content?.nodes) return null
  const imageNode = content.nodes.find((node: any) => node.type === 'IMAGE')
  // This handles the structure: { nodes: [{ type: 'IMAGE', imageData: { image: { src: { id: '...' } } } }] }
  return imageNode?.imageData?.image?.src?.id
    ? `https://static.wixstatic.com/media/${imageNode.imageData.image.src.id}`
    : null
}

// Generates a URL-safe slug from a string (FIXED: handles undefined input)
const generateSlug = (name: string | undefined): string => {
  if (!name || typeof name !== 'string') {
    return 'unnamed-entity-slug' // Return a safe default slug
  }

  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

// Extracts the city from the first branch for display
const getHospitalCity = (hospital: any): string => {
  // Use 'name' from the city array, which seems to be the preferred field
  return hospital.branches?.[0]?.city?.[0]?.name || hospital.branches?.[0]?.city?.[0]?.cityName || ''
}


// ==============================
// 3. CORE COMPONENTS
// ==============================



const ImageWithFallback = ({ src, alt, fallbackIcon: Icon, className = "", fallbackClassName = "" }: { src: string | null; alt: string; fallbackIcon: any; className?: string; fallbackClassName?: string; }) => {

  if (src) {
    return (
      <Image
        // Removed key={src}
        src={src}
        alt={alt}
        fill
        // 1. Changed object-contain to object-cover for banner/background style
        className={`object-contain ${className}`}
        // 2. Updated sizes to reflect a typical full-width banner
        // This tells Next.js the image will likely be 100% of the viewport width.
        sizes="100vw"
        loading="lazy"
      // Removed onError handler as Next.js Image handles errors internally
      />
    )
  }
  return (
    <div className={`w-full h-full flex items-center justify-center bg-gray-100 rounded-xs ${fallbackClassName}`}>
      <Icon className="w-12 h-12 text-gray-400" />
    </div>
  )
}

// NOTE: Ensure you wrap this component in a parent element
// that has a defined width and height (e.g., via Tailwind classes like h-48 w-full)
// because the 'fill' prop makes the Image component take up the size of its parent.

// Dedicated Component for Accreditation Pill
const AccreditationPill = ({ acc, logoOnly = false }: { acc: AccreditationType, logoOnly?: boolean }) => {
  const logoUrl = getWixImageUrl(acc.image);

  if (logoOnly) {
    // Logo-only design for Hero Section (Top Right)
    return (
      <div
        className="w-10 h-10 m-2 bg-white p-1 rounded-full shadow-lg flex items-center justify-center border border-gray-100 transition-transform hover:scale-110 tooltip"
        title={acc.title}
        aria-label={`Accreditation: ${acc.title}`}
      >
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={`${acc.title} Logo`}
            width={28}
            height={28}
            className="w-7 h-7 object-contain rounded-full"
          />
        ) : (
          <Award className="w-5 h-5 text-yellow-500 fill-yellow-500/30" />
        )}
      </div>
    )
  }

  // Original pill design for other uses (like the similar hospital card)
  return (
    <div
      className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-md border border-gray-100"
      title={acc.title}
      aria-label={`Accreditation: ${acc.title}`}
    >
      {logoUrl ? (
        // Using an img tag here to avoid Next/Image in a small, repeated context
        <img
          src={logoUrl}
          alt={`${acc.title} Logo`}
          className="w-5 h-5 object-contain rounded-full"
        />
      ) : (
        <Award className="w-5 h-5 text-yellow-500" />
      )}
    </div>
  )
}

// Hero Section Component (Modernized)
const HeroSection = ({ hospital, accreditations }: { hospital: HospitalWithBranchPreviewExtended, accreditations: AccreditationType[] }) => {
  const hospitalImage = getImageUrl(hospital.hospitalImage)
  const hospitalLogo = getImageUrl(hospital.logo)

  return (
    <section className="relative w-full h-[55vh] md:h-[80vh] overflow-hidden">
      <div className="absolute inset-0">
        <ImageWithFallback
          src={hospitalImage}
          alt={`Exterior of ${hospital.hospitalName}`}
          fallbackIcon={Hospital}
          className="object-cover"
          fallbackClassName="bg-gray-800"
        />
      </div>

      {/* Dark Overlay for contrast on text */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent" />

      {/* Top Controls/Badges */}
      <div className="absolute top-4 left-6 right-6 z-10 flex justify-end items-start container mx-auto">
        {/* Accreditation Badges */}
        {accreditations.length > 0 && (
          <div className="md:flex flex-col items-end gap-2 p-3">
            <div className="md:flex flex-wrap justify-end gap-2">
              {/* Using logoOnly=true and displaying up to 5 unique accreditations */}
              {accreditations.slice(0, 5).map((acc: AccreditationType) => (
                <AccreditationPill key={acc._id} acc={acc} logoOnly={true} />
              ))}
            </div>
          </div>
        )}
      </div>


      {/* Hospital Info Box (Bottom) */}
      <div className="absolute bottom-10 left-0 right-0 p-6 md:p-10 container mx-auto z-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 flex-grow">
          {hospitalLogo ? (
            <div className="w-24 h-auto bg-white p-2 rounded-lg shadow-xl flex items-center justify-center flex-shrink-0 border-4 border-white">
              <Image
                src={hospitalLogo}
                alt={`${hospital.hospitalName} Logo`}
                width={160}
                height={70}
                className="object-contain w-full h-auto max-h-[70px]"
              />
            </div>
          ) : (
            <div className="w-24 h-24 bg-white/90 p-3 rounded-lg shadow-xl flex items-center justify-center flex-shrink-0 border-4 border-white">
              <Hospital className="w-12 h-12 text-gray-700" />
            </div>
          )}
          <div className="pt-1">
            {/* MODIFIED: Changed font size/weight to better match original code/modern aesthetic */}
            <h1 className={`text-3xl md:text-5xl font-semibold text-white leading-tight drop-shadow-2xl  `}>
              {hospital.hospitalName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-1">
              {/* {hospital.city && (
                <div className={`flex items-center gap-2 text-xl font-medium text-gray-200 drop-shadow-lg`}>
                  <MapPin className="w-5 h-5 text-red-400" />
                  <span>{hospital.city}</span>
                </div>
              )} */}
              {hospital.yearEstablished && (
                <div className={`flex items-center gap-2 text-lg text-gray-300`}>
                  <CalendarDays className="w-5 h-5 text-gray-400" />
                  <span>Estd. {hospital.yearEstablished}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Simple Stat Box for Branch Card
const StatBox = ({ value, label, showPlus = true }: { value: string | number, label: string, showPlus?: boolean }) => (
  <div className='text-center flex flex-col items-center justify-center px-1 py-1.5 bg-gray-50 rounded-lg border border-gray-100'>
    <p className="text-sm font-medium text-gray-800 leading-tight">
      {value}
      {value !== 'N/A' && showPlus && '+'}
    </p>
    <p className="text-xs font-light text-gray-600 mt-0.5 flex items-center gap-1">
      {label}
    </p>
  </div>
)

// Branch Card Component
const BranchCard = ({ branch, hospitalSlug }: { branch: any, hospitalSlug: string }) => {
  const branchImage = getImageUrl(branch.branchImage || branch.logo)
  const hospitalLogo = getImageUrl(branch.logo)
  const accImage = branch.accreditation?.[0]?.image ? getWixImageUrl(branch.accreditation[0].image) : null

  const branchSlug = generateSlug(branch.branchName)
  const branchNameDisplay = branch.isMain ? `${branch.branchName || 'Unnamed Branch'} (Main)` : (branch.branchName || 'Unnamed Branch')
  const linkHref = `/search/hospitals/${branchSlug}`

  const specialties = useMemo(() => {
    const specSet = new Set<string>()
    branch.doctors?.forEach((d: any) => {
      d.specialization?.forEach((s: any) => {
        const specName = typeof s === 'object' ? s?.name : s
        if (specName) specSet.add(specName)
      })
    })
    return Array.from(specSet)
  }, [branch.doctors])

  const firstCityName = branch.city?.[0]?.name || branch.city?.[0]?.cityName || 'N/A'
  const specialtyCount = specialties.length
  const bedsCount = branch.totalBeds || 'N/A'
  const estdYear = branch.yearEstablished || 'N/A'

  return (
    <Link
      href={linkHref}
      aria-label={`View details for ${branchNameDisplay} in ${firstCityName}`}
      className={`block h-full border border-gray-100 rounded-xl shadow-md bg-white hover:shadow-lg transition-all duration-300 relative flex flex-col overflow-hidden group transform hover:-translate-y-0.5`}
    >
      <div className="relative w-full h-48 bg-gray-100">
        <ImageWithFallback
          src={branchImage}
          alt={`${branchNameDisplay} facility`}
          fallbackIcon={Building2}
        className="w-full h-full object-cover object-center transition-transform duration-500"
          fallbackClassName="bg-gray-100"
        />

        {accImage && (
          <div className="absolute top-3 right-3 z-10 p-1 bg-white rounded-full shadow-lg">
            <img
              src={accImage}
              alt="Accreditation badge"
              className="w-8 h-8 object-contain rounded-full"
            />
          </div>
        )}
      </div>

      <div className={`p-4 flex-1 flex flex-col justify-between font-light`}>
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 leading-snug group-hover:text-gray-700 transition-colors">{branchNameDisplay}</h3>
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
            {firstCityName}
          </p>
        </div>

        {/* Updated StatBox to use subtle gray/white theme */}
        <div className="grid grid-cols-3 gap-3">
          <StatBox value={estdYear} label="Estd." showPlus={false} />
          <StatBox value={bedsCount} label="Beds" />
          <StatBox value={specialtyCount === 0 ? 'N/A' : specialtyCount} label="Specialities" />
        </div>
      </div>
    </Link>
  )
}


// Embla Carousel Controls
const CarouselControls = ({ onPrev, onNext, show }: { onPrev: () => void; onNext: () => void; show: boolean }) => {
  const controlClass = "p-2 border border-gray-200 rounded-full bg-white text-gray-600 hover:bg-gray-600 hover:text-white transition-colors shadow-md hidden md:block z-10 disabled:opacity-50"
  if (!show) return null
  return (
    <div className="flex gap-3">
      <button onClick={onPrev} className={controlClass} aria-label="Previous slide">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button onClick={onNext} className={controlClass} aria-label="Next slide">
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}

// Doctor Card Component
const DoctorCard = ({ doctor }: { doctor: any }) => {
  const doctorImage = getImageUrl(doctor.profileImage)
  const doctorSlug = generateSlug(doctor.doctorName || 'doctor')
  const specializationNames = Array.isArray(doctor.specialization) ? doctor.specialization.map((s: any) => s.name).join(', ') || 'Specialist' : 'Specialist'
  const expText = doctor.experienceYears ? `${doctor.experienceYears} yrs Exp.` : 'Experience N/A'


  return (
    <Link href={`/doctors/${doctorSlug}`}
      className={`group flex flex-col h-full bg-white border border-gray-100 rounded-xl shadow-md overflow-hidden transform hover:shadow-lg transition-all duration-300 hover:border-gray-300 font-light`}
    >
      <div className="relative h-60 overflow-hidden bg-gray-50">
        <ImageWithFallback src={doctorImage} alt={`Dr. ${doctor.doctorName}`} fallbackIcon={User} className="object-cover w-full h-full group-hover:scale-[1.05] transition-transform duration-500" fallbackClassName="bg-gray-50" />
      </div>
      <div className={`flex flex-col flex-1 p-4 font-light`}>
        <h5 className="text-lg font-semibold text-gray-900 leading-snug group-hover:text-gray-700 transition-colors">
          {doctor.doctorName}
        </h5>
        <p className="text-sm font-medium text-gray-700 line-clamp-1">{specializationNames}</p>
        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{expText}</p>
      </div>
    </Link>
  )
}

// Treatment Card Component
const TreatmentCard = ({ treatment }: { treatment: any }) => {
  const treatmentImage = getImageUrl(treatment.treatmentImage)
  const treatmentSlug = generateSlug(treatment.name || 'treatment')

  return (
    <Link href={`/treatments/${treatmentSlug}`}
      className={`group flex flex-col h-full bg-white border border-gray-100 rounded-xl shadow-md overflow-hidden transform hover:shadow-lg transition-all duration-300 hover:border-gray-300 font-light`}
    >
      <div className="relative h-40 overflow-hidden bg-gray-50">
        <ImageWithFallback src={treatmentImage} alt={treatment.name} fallbackIcon={Scissors} className="object-cover w-full h-full group-hover:scale-[1.05] transition-transform duration-500" fallbackClassName="bg-gray-50" />
      </div>
      <div className={`flex flex-col flex-1 p-4 font-light`}>
        {/* MODIFIED: Changed font to serif for the treatment title to align with the main content style */}
        <h5 className={`text-xl font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-gray-700 transition-colors  font-serif`}>
          {treatment.name}
        </h5>
        <div className="flex items-center gap-3 text-sm text-gray-600 mt-2">
          {treatment.cost && (
            <div className="flex items-center gap-1 text-base font-bold text-gray-700 bg-gray-100/70 px-2.5 py-0.5 rounded-full border border-gray-200">
              <span>{treatment.cost}</span>
            </div>
          )}
          {treatment.duration && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{treatment.duration}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

// Similar Hospital Card Component
const SimilarHospitalCard = ({ hospital }: { hospital: HospitalWithBranchPreviewExtended }) => {
  const hospitalImage = getImageUrl(hospital.hospitalImage) || getImageUrl(hospital.logo)
  // Ensure the slug is clean, removing any leading slashes if they exist from the data
  const hospitalSlug = hospital.slug ? hospital.slug.replace(/^\/+/, '') : generateSlug(hospital.hospitalName)
  const hospitalCity = hospital.city || getHospitalCity(hospital) // Use the calculated city if available
  const branchCount = hospital.branches?.length || 0

  return (
    <Link href={`/search/${hospitalSlug}`}
      className={`group flex flex-col h-full bg-white border border-gray-100 rounded-xl shadow-md overflow-hidden transform hover:shadow-lg transition-all duration-300 hover:border-gray-100 font-light`}
    >
      <div className="relative h-40 overflow-hidden bg-gray-100">
        <ImageWithFallback src={hospitalImage} alt={hospital.hospitalName} fallbackIcon={Hospital} className="object-cover w-full h-full group-hover:scale-[1.05] transition-transform duration-500" />
        {/* Accreditation Badges */}
        {hospital.accreditations && hospital.accreditations.length > 0 && (
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {/* Using the standard pill here - showing only the top one */}
            {hospital.accreditations.slice(0, 1).map((acc: AccreditationType) => (
              <AccreditationPill key={acc._id} acc={acc} logoOnly={false} />
            ))}
          </div>
        )}
      </div>
      <div className={`flex flex-col flex-1 p-4 font-light`}>
        <h5 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-700 transition-colors">
          {hospital.hospitalName}
        </h5>
        <div className="flex flex-wrap items-center text-sm text-gray-600 gap-x-4 gap-y-1">
          {hospitalCity && (
            <span className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-4 h-4 text-red-500" />
              <span className="truncate">{hospitalCity}</span>
            </span>
          )}
          {branchCount > 0 && (
            <span className="flex items-center gap-1.5 font-medium">
              <Building2 className="w-4 h-4 text-gray-500" />
              <span>{branchCount} {branchCount === 1 ? 'Branch' : 'Branches'}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// Embla Carousel Wrapper Component
const EmblaCarousel = ({ items, title, icon: Icon, type }: { items: any[], title: string, icon: any, type: 'doctors' | 'treatments' | 'hospitals' }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
    // Responsive breakpoints for better mobile viewing
    breakpoints: {
      '(min-width: 640px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 3 },
    },
  })

  // State to manage button visibility/disability based on slide position
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const onSelect = useCallback((emblaApi: any) => {
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    onSelect(emblaApi)
    emblaApi.on('reInit', onSelect)
    emblaApi.on('select', onSelect)
  }, [emblaApi, onSelect])


  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  const visibleSlidesClass = 'flex-shrink-0 w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]'

  const renderCard = (item: any) => {
    switch (type) {
      case 'doctors': return <DoctorCard doctor={item} />
      case 'treatments': return <TreatmentCard treatment={item} />
      case 'hospitals': return <SimilarHospitalCard hospital={item} />
      default: return null
    }
  }

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-6">
        <h3 className={`text-2xl font-semibold text-gray-900 flex items-center gap-3`}>
          <Icon className="w-6 h-6 text-gray-600" />
          {title}
        </h3>
        <CarouselControls onPrev={scrollPrev} onNext={scrollNext} show={items.length > 3} />
      </div>
      <div className="overflow-hidden -mx-2" ref={emblaRef}>
        <div className="flex gap-6">
          {items.map((item, index) => (
            <div key={item._id || index} className={visibleSlidesClass}>
              {renderCard(item)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Breadcrumb Component
const Breadcrumb = ({ hospitalName, hospitalSlug }: { hospitalName: string, hospitalSlug: string }) => (
  <div className={`container mx-auto px-4 bg-white sm:px-6  lg:px-8 font-light border-b border-gray-100 shadow-sm`}>
    <nav className="flex md:py-3.5 py-2" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-2">
        <li className="flex items-center">
          <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-600 transition-colors flex items-center gap-1">
            <Home className="w-4 h-4 text-gray-400" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </li>
        <li className="flex items-center">
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <Link href="/search" className="ml-2 text-sm font-medium text-gray-500 hover:text-gray-600 transition-colors">
            Hospitals
          </Link>
        </li>
        <li className="flex items-center">
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="ml-2 text-sm font-semibold text-gray-800 truncate max-w-[200px] md:max-w-xs block" aria-current="page">
            {hospitalName}
          </span>
        </li>
      </ol>
    </nav>
  </div>
);

// RichTextDisplay Component (Styling refined for Serif Font)
const RichTextDisplay = ({ htmlContent, className = "" }: { htmlContent: string; className?: string }) => {
  
  // MODIFIED: Function to replace <li> tags in <ul> with the CheckCircle icon HTML
  const transformListItems = (html: string): string => {
    // 1. Define the HTML for the Lucide CheckCircle icon with the required styling
    // This is the SVG markup for the CheckCircle icon, stylized with inline CSS
    // to match the requested w-5 h-5 text-[#74BF44] flex-shrink-0.
    const iconSvgHtml = 
      `<span style="display: inline-flex; align-items: flex-center; margin-top: 4px !important; margin-right: 0.75rem; flex-shrink: 0; min-width: 1.25rem; height: 1.25rem;">` +
      `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5" style="color:#74BF44; width: 1.25rem; height: 1.25rem;">` + 
      `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>` + 
      `</svg></span>`;

    // 2. Define the new structure for the <li> content wrapper
    // We use a flex div inside the <li> to correctly position the icon next to the text.
    // The "min-w" and "height" styles on the span ensure the icon reserves space even if text wraps.
    const liContentWrapperStart = `<div style="display: flex; align-items: flex-center;">${iconSvgHtml}<span style="flex: 1;">`;
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


// Hospital Detail Skeleton (Updated)
const HospitalDetailSkeleton = () => (
  <div className={`min-h-screen bg-gray-50`}>
    {/* Hero Skeleton (Keep dark for contrast) */}
    <div className="relative w-full h-[55vh] md:h-[65vh] bg-gray-300 animate-pulse" />

    {/* Breadcrumb Skeleton */}
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 bg-white border-b border-gray-100 shadow-sm">
      <div className="h-4 w-64 bg-gray-200 rounded-lg animate-pulse" />
    </div>

    <section className="py-10 md:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">

          {/* Main Content Skeleton */}
          <main className="lg:col-span-9 space-y-10 md:space-y-8">

            {/* Description Skeleton (Keep elevated container) */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-8 shadow-md animate-pulse">
              <div className="h-7 w-64 bg-gray-200 rounded-lg mb-6" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-4 w-11/12 bg-gray-100 rounded" />
                <div className="h-4 w-10/12 bg-gray-100 rounded" />
                <div className="h-4 w-5/6 bg-gray-100 rounded" />
              </div>
            </div>

            {/* Sections Skeleton */}
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-6 pt-4 bg-white rounded-xl border border-gray-100 p-4 md:p-8 shadow-md">
                <div className="h-8 w-72 bg-gray-200 rounded mb-4" />
                <div className="flex gap-6 overflow-hidden">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex-shrink-0 w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]">
                      <div className="bg-white border border-gray-100 rounded-xl shadow-xs overflow-hidden h-72 animate-pulse">
                        <div className="h-40 bg-gray-200" />
                        <div className="p-4 space-y-2">
                          <div className="h-5 w-4/5 bg-gray-100 rounded" />
                          <div className="h-4 w-1/2 bg-gray-100 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </main>

          {/* Sidebar Skeleton */}
          <aside className="lg:col-span-3 space-y-10 mt-10 lg:mt-0 animate-pulse">
            {/* ContactForm Skeleton */}
            <div className="h-96 bg-white rounded-xl border border-gray-100 shadow-xl" />
          </aside>
        </div>
      </div>
    </section>
  </div>
)

// Error State Component
const ErrorState = ({ error }: { error: string | null }) => (
  <div className={`min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 relative`}>
    <div className="absolute top-6 left-6">
      <Link href="/search" className={`flex items-center gap-2 text-gray-800 hover:text-gray-900 transition-colors duration-200 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-full border border-gray-200 shadow-lg font-semibold`} >
        <ChevronLeft className="w-5 h-5" /> Back to Search
      </Link>
    </div>
    <div className="text-center space-y-6 max-w-lg p-12 bg-white rounded-xl border border-gray-200 shadow-2xl">
      <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
        <Hospital className="w-10 h-10" />
      </div>
      <h2 className={`text-3xl font-extrabold text-gray-900`}>Hospital Not Found</h2>
      <p className={`text-lg text-gray-600 leading-relaxed font-light`}>
        {error || "The requested hospital could not be found. Please verify the URL or try searching again from the main list."}
      </p>
      <Link href="/search" className={`inline-block w-full bg-gray-700 text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition-all duration-200 shadow-lg mt-4`} >
        Go to Hospital Search
      </Link>
    </div>
  </div>
)

// Branches Section Component
const BranchesSection = ({ hospital, selectedCity, allCityOptions, visibleBranches, filteredBranches, setShowAllBranches, showAllBranches, setSelectedCity, hospitalSlug }: { hospital: HospitalWithBranchPreviewExtended, selectedCity: string, allCityOptions: string[], visibleBranches: any[], filteredBranches: any[], setShowAllBranches: (val: boolean) => void, showAllBranches: boolean, setSelectedCity: (city: string) => void, hospitalSlug: string }) => {
  if (!hospital.branches || hospital.branches.length === 0) return null

  return (
    <section className="space-y-4 bg-white rounded-xl border border-gray-100 p-4 md:p-8 shadow-md">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className={`text-2xl font-semibold text-gray-900 flex items-center gap-3`}>
          <Building2 className="w-6 h-6 text-gray-600" />
          Our Branches ({filteredBranches.length})
        </h2>

        {/* City Filter */}
        {allCityOptions.length > 1 && (
          <div className="w-full sm:w-auto relative">
            <label htmlFor="city-filter" className="sr-only">Filter by City</label>
            <select
              id="city-filter"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className={`w-full sm:w-48 p-3 border border-gray-300 rounded-full shadow-sm text-sm font-semibold bg-white focus:ring-gray-500 focus:border-gray-500 transition-colors appearance-none pr-8`}
            >
              <option value="">All Cities</option>
              {allCityOptions.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {visibleBranches.map(branch => (
          <BranchCard key={branch._id} branch={branch} hospitalSlug={hospitalSlug} />
        ))}
      </div>

      {filteredBranches.length > 3 && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setShowAllBranches(!showAllBranches)}
            className={`text-gray-700 font-medium text-md hover:text-gray-800 transition-colors flex items-center gap-2 px-6 py-2 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 shadow-sm`}
            aria-expanded={showAllBranches}
            aria-controls="hospital-branches"
          >
            {showAllBranches ? (
              <>
                <ChevronUp className="w-5 h-5" />
                Show Less Branches
              </>
            ) : (
              <>
                <ChevronDown className="w-5 h-5" />
                Show All {filteredBranches.length} Branches
              </>
            )}
          </button>
        </div>
      )}
    </section>
  )
}


// ==============================
// 4. MAIN PAGE COMPONENT
// ==============================

export default function HospitalDetail({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const [hospital, setHospital] = useState<HospitalWithBranchPreviewExtended | null>(null)
  const [similarHospitals, setSimilarHospitals] = useState<HospitalWithBranchPreviewExtended[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllBranches, setShowAllBranches] = useState(false)
  const [selectedCity, setSelectedCity] = useState('')

  const hospitalSlugFromParams = resolvedParams.slug;


  useEffect(() => {
    const fetchHospitalData = async () => {
      setLoading(true)
      setError(null)
      try {
        // --- 1. Fetch specific hospital using slug ---
        const specificRes = await fetch(`/api/hospitals?q=${hospitalSlugFromParams}&pageSize=1`)

        if (!specificRes.ok) throw new Error("Failed to fetch hospital details")
        const specificData: HospitalApiResponse = await specificRes.json()

        if (!specificData.items?.length) throw new Error("Hospital not found")
        const matchedHospital = specificData.items[0]

        // --- 2. Fetch a broader list for similar components ---
        const allRes = await fetch('/api/hospitals?pageSize=50')
        if (!allRes.ok) throw new Error("Failed to fetch all hospitals")
        const allData: HospitalApiResponse = await allRes.json()
        const hospitalsForSearch = allData.items || []

        // --- 3. Process Data ---
        const hospitalCity = getHospitalCity(matchedHospital)
        // Attach city property directly for easier use in HeroSection/SimilarHospitals
        const hospitalWithCity: HospitalWithBranchPreviewExtended = { ...matchedHospital, city: hospitalCity }
        setHospital(hospitalWithCity)

        const hospitalsWithCity: HospitalWithBranchPreviewExtended[] = hospitalsForSearch.map((h: HospitalWithBranchPreview) => ({ ...h, city: getHospitalCity(h) }))

        // Find similar hospitals (same city or same accreditation)
        const similar = hospitalsWithCity
          .filter((h) => h._id !== matchedHospital._id && (
            h.city === hospitalCity ||
            h.accreditations?.some((acc: AccreditationType) => hospitalWithCity.accreditations?.some((mAcc: AccreditationType) => mAcc.title === acc.title))
          ))
          .slice(0, 6)
        setSimilarHospitals(similar)

      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load hospital details")
      } finally {
        setLoading(false)
      }
    }
    fetchHospitalData()
  }, [hospitalSlugFromParams])


  const allCityOptions = useMemo(() => {
    if (!hospital?.branches) return []
    const cities = new Set<string>()

    hospital.branches.forEach((branch) => {
      // Use the 'name' field first, then 'cityName' as a fallback
      const city = branch.city?.[0]?.name || branch.city?.[0]?.cityName
      if (city) cities.add(city)
    })
    return Array.from(cities)
  }, [hospital])


  const filteredBranches = useMemo(() => {
    if (!hospital?.branches) return []
    return hospital.branches.filter(branch => {
      const branchCity = branch.city?.[0]?.name || branch.city?.[0]?.cityName || ''
      const matchesCity = !selectedCity || branchCity === selectedCity
      return matchesCity
    }) as any[] // Ensure compatible type for use in components
  }, [hospital, selectedCity])


  const visibleBranches = showAllBranches ? filteredBranches : filteredBranches.slice(0, 3)


  // Data processing for rich text display
  const rawDescription = hospital?.description || null; // <--- This holds the raw HTML from Wix

  const allDoctors = hospital?.branches?.flatMap(branch => (branch.doctors || []).map((doctor: any) => ({
    ...doctor,
    branch: branch.branchName
  }))) || []
  const allTreatments = hospital?.branches?.flatMap(branch => (branch.treatments || []).map((treatment: any) => ({
    ...treatment,
    branch: branch.branchName
  }))) || []

  // Ensure unique items for carousels
  const uniqueDoctors = allDoctors.filter((doctor, index, self) =>
    index === self.findIndex((d: any) => d._id === doctor._id)
  ).slice(0, 9)
  const uniqueTreatments = allTreatments.filter((treatment, index, self) =>
    index === self.findIndex((t: any) => t._id === treatment._id)
  ).slice(0, 9)

  // FILTER UNIQUE ACCREDITATIONS BEFORE PASSING TO HERO SECTION
  const uniqueAccreditations = useMemo(() => {
    if (!hospital?.accreditations) return []
    const titlesSeen = new Set<string>();
    const unique: AccreditationType[] = [];

    hospital.accreditations.forEach(acc => {
      if (!titlesSeen.has(acc.title)) {
        titlesSeen.add(acc.title);
        unique.push(acc);
      }
    });
    return unique;
  }, [hospital]);


  if (loading) return <HospitalDetailSkeleton />
  if (error || !hospital) return <ErrorState error={error || "Hospital not found"} />


  return (
    <div className={`min-h-screen bg-gray-50 `}>
      <HeroSection hospital={hospital} accreditations={uniqueAccreditations} />

      <Breadcrumb
        hospitalName={hospital.hospitalName}
        hospitalSlug={hospitalSlugFromParams}
      />

      <section className="pt-8 pb-10 md:pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">

            {/* Main Content Area */}
            <main className="lg:col-span-9 space-y-10 md:space-y-8">

              {/* Description Section */}
              {rawDescription && (
                <section className="bg-white rounded-xl border border-gray-100 p-4 md:p-8 shadow-md">
                  {/* MODIFIED: Changed heading to use serif font for visual consistency */}
             
                  <RichTextDisplay
                    htmlContent={rawDescription}
                    className="mt-0"
                  />
                </section>
              )}

              {/* Branches Section */}
              {hospital.branches && hospital.branches.length > 0 && (
                <BranchesSection
                  hospital={hospital}
                  selectedCity={selectedCity}
                  allCityOptions={allCityOptions}
                  visibleBranches={visibleBranches}
                  filteredBranches={filteredBranches}
                  setShowAllBranches={setShowAllBranches}
                  showAllBranches={showAllBranches}
                  setSelectedCity={setSelectedCity}
                  hospitalSlug={hospitalSlugFromParams}
                />
              )}


              {/* Doctors Section */}
              {uniqueDoctors.length > 0 && (
                <section className="bg-white rounded-xl border border-gray-100 p-4 md:p-8 shadow-md">
                  <EmblaCarousel
                    items={uniqueDoctors}
                    title="Featured Specialist Doctors"
                    icon={Users}
                    type="doctors"
                  />
                </section>
              )}

              {/* Treatments Section */}
              {uniqueTreatments.length > 0 && (
                <section className="bg-white rounded-xl border border-gray-100 p-4 md:p-8 shadow-md">
                  <EmblaCarousel
                    items={uniqueTreatments}
                    title="Popular Treatments & Procedures"
                    icon={Heart}
                    type="treatments"
                  />
                </section>
              )}

              {/* Similar Hospitals Section */}
              {similarHospitals.length > 0 && (
                <section className="bg-white rounded-xl border border-gray-100 p-4 md:p-8 shadow-md">
                  <EmblaCarousel
                    items={similarHospitals}
                    title="Similar Hospitals Nearby"
                    icon={Hospital}
                    type="hospitals"
                  />
                </section>
              )}

            </main>

            {/* Sidebar */}
            <aside className="lg:col-span-3 space-y-10 mt-10 lg:mt-0">
              {/* Contact Form Container (Elevated Container) */}
              <div >
                <ContactForm />
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}