// File: app/hospitals/[slug]/page.tsx

"use client"

import { useState, useEffect, useCallback, useMemo, useRef, use } from "react"
import Image from "next/image"
import type { HospitalWithBranchPreview } from "@/types/hospital"
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
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useEmblaCarousel from "embla-carousel-react"
import classNames from "classnames"
import ContactForm from "@/components/ContactForm" // Assuming this component exists
import { Inter } from "next/font/google"

// ADDED: Inter font definition
const inter = Inter({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter"
})


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

type HospitalWithBranchPreviewExtended = HospitalWithBranchPreview & {
  accreditations?: AccreditationType[];
  city?: string;
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

// Cleans rich text description from banners and HTML tags
const removeBannersFromDescription = (html: string): string => {
  // Remove image tags, convert <br> to newlines, remove all remaining HTML tags, remove excessive newlines
  return html.replace(/<img[^>]*>/g, '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n')
}

// Extracts the city from the first branch for display
const getHospitalCity = (hospital: any): string => {
  return hospital.branches?.[0]?.city?.[0]?.name || ''
}


// ==============================
// 3. CORE COMPONENTS
// ==============================

// Fallback Image Component
const ImageWithFallback = ({ src, alt, fallbackIcon: Icon, className = "", fallbackClassName = "" }: { src: string | null; alt: string; fallbackIcon: any; className?: string; fallbackClassName?: string; }) => {
  // Use a unique key for Image to force re-render when src changes, preventing stale images/fallbacks
  if (src) {
    return (
      <Image
        key={src}
        src={src}
        alt={alt}
        fill
        className={`object-cover ${className}`}
        sizes="(max-width: 768px) 100vw, 33vw"
        loading="lazy"
        onError={(e: any) => {
          // Fallback on error if it's a standard img tag
          if (e.currentTarget.src !== '') e.currentTarget.style.display = 'none';
        }}
      />
    )
  }
  return (
    <div className={`w-full h-full flex items-center justify-center bg-gray-100 rounded-xs ${fallbackClassName}`}>
      <Icon className="w-12 h-12 text-gray-400" />
    </div>
  )
}

// Dedicated Component for Accreditation Pill
const AccreditationPill = ({ acc, logoOnly = false }: { acc: AccreditationType, logoOnly?: boolean }) => {
  const logoUrl = getWixImageUrl(acc.image);

  if (logoOnly) {
    // Logo-only design for Hero Section (Top Right)
    return (
      <div
        className="w-10 h-10 bg-white p-1 rounded-full shadow-lg flex items-center justify-center border border-gray-100 transition-transform hover:scale-110 tooltip"
        title={acc.title}
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
      className=""
      title={acc.title}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={`${acc.title} Logo`}
          width={16}
          height={16}
          className="w-7 h-7 object-contain rounded-full flex-shrink-0"
        />
      ) : (
        <Award className="w-6 h-6 text-yellow-500 flex-shrink-0" />
      )}
    </div>
  )
}

// Hero Section Component (Modernized)
const HeroSection = ({ hospital, accreditations }: { hospital: HospitalWithBranchPreviewExtended, accreditations: AccreditationType[] }) => {
  const hospitalImage = getImageUrl(hospital.hospitalImage)
  const hospitalLogo = getImageUrl(hospital.logo)

  return (
    <section className="relative w-full h-[55vh] md:h-[65vh] overflow-hidden">
      <div className="absolute inset-0">
        <ImageWithFallback
          src={hospitalImage}
          alt={hospital.hospitalName}
          fallbackIcon={Hospital}
          className="object-cover"
          fallbackClassName="bg-gray-800"
        />
      </div>

      {/* Dark Overlay for contrast on text */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/60 to-transparent" />

      {/* Top Controls/Badges */}
      <div className="absolute top-4 left-6 right-6 z-10 flex justify-end items-start container mx-auto">
        {/* Back Button - Commented out but left for context */}
        {/* <Link href="/hospitals" className={`flex items-center gap-2 text-white hover:text-gray-200 transition-colors duration-200 bg-gray-800/70 backdrop-blur-sm px-4 py-3 rounded-full border border-gray-700 shadow-xl hover:shadow-2xl ${inter.variable} font-semibold`}>
          <ChevronLeft className="w-5 h-5" />
          <span className="font-semibold hidden sm:inline">Back to Search</span>
        </Link> */}

        {/* Accreditation Badges */}
        {accreditations.length > 0 && (
          <div className="flex flex-col items-end gap-2 p-3 =">
          
            <div className="flex flex-wrap justify-end gap-2">
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
            <div className="w-24 h-auto bg-white p-2 rounded-xs shadow-xs flex items-center justify-center flex-shrink-0 border-1 border-white">
              <Image src={hospitalLogo} alt={`${hospital.hospitalName} Logo`} width={160} height={70} className="object-cover" />
            </div>
          ) : (
            <div className="w-24 h-24 bg-white/90 p-3 rounded-xs shadow-xs flex items-center justify-center flex-shrink-0 border-4 border-white">
              <Hospital className="w-12 h-12 text-white" />
            </div>
          )}
          <div className="pt-1">
            <h1 className={`text-2xl md:text-3xl font-extrabold text-white leading-tight drop-shadow-2xl ${inter.variable}`}>
              {hospital.hospitalName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-1">
              {hospital.city && (
                <div className={`flex items-center gap-2 text-xl font-medium text-gray-200 drop-shadow-lg ${inter.variable}`}>
                  <MapPin className="w-5 h-5 text-red-400" />
                  <span>{hospital.city}</span>
                </div>
              )}
              {hospital.yearEstablished && (
                <div className={`flex items-center gap-2 text-lg text-gray-300 ${inter.variable}`}>
                  <CalendarDays className="w-5 h-5 text-gray-400" />
                  <span>Est. {hospital.yearEstablished}</span>
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
const StatBox = ({ value, label, icon: Icon, showPlus = true }: { value: string | number, label: string, icon: any, showPlus?: boolean }) => (
  // Subtle gray box, similar to BranchCard in the provided file
  <div className='text-center flex flex-col items-center justify-center px-1 py-1.5 bg-gray-50 rounded-xs border border-gray-100'>
    <p className="text-sm font-medium text-gray-800 leading-tight">
      {value}
      {value !== 'N/A' && showPlus && '+'}
    </p>
    <p className="text-sm font-medium  text-gray-800 mt-0.5 flex items-center gap-1">
    
      {label}
    </p>
  </div>
)

// Branch Card Component (MODIFIED to accept hospitalSlug for correct link building)
const BranchCard = ({ branch, hospitalSlug }: { branch: any, hospitalSlug: string }) => {
  const branchImage = getImageUrl(branch.branchImage || branch.logo)
  const hospitalLogo = getImageUrl(branch.logo)
  const accImage = branch.accreditation?.[0]?.image ? getWixImageUrl(branch.accreditation[0].image) : null

  // FIXED: Using the passed hospitalSlug for link construction
  const branchSlug = generateSlug(branch.branchName)
  const branchNameDisplay = branch.isMain ? `${branch.branchName || 'Unnamed Branch'} (Main Branch)` : (branch.branchName || 'Unnamed Branch')
  const linkHref = `/search/hospitals/${branchSlug}` // FIXED: Correct link structure

  const specialties = useMemo(() => {
    const specSet = new Set<string>()
    branch.doctors?.forEach((d: any) => {
      d.specialization?.forEach((s: any) => {
        // Handle both string and object specializations
        const specName = typeof s === 'object' ? s?.name : s
        if (specName) specSet.add(specName)
      })
    })
    return Array.from(specSet)
  }, [branch.doctors])

 const firstCityName = branch.city?.[0]?.cityName || 'N/A'
 // REFINEMENT: Use actual count for stats, display first specialty name or count
  const specialtyCount = specialties.length
  const doctorsCount = branch.noOfDoctors || branch.doctors?.length || 'N/A'
  const bedsCount = branch.totalBeds || 'N/A'
  const estdYear = branch.yearEstablished || 'N/A'

  return (
    <Link
      href={linkHref}
      // Updated: Rounded corners slightly reduced, shadow moderated, subtle hover
      className={`block h-full border border-gray-100 rounded-xs shadow-xs bg-white hover:shadow-xs transition-all duration-300 relative flex flex-col overflow-hidden group transform hover:-translate-y-0.5`}
    >
      <div className="relative w-full h-48 bg-gray-100">
        <ImageWithFallback
          src={branchImage}
          alt={`${branchNameDisplay} facility`}
          fallbackIcon={Building2}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          fallbackClassName="bg-gray-100" // Changed background color
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

        {hospitalLogo && (
          <div className="absolute bottom-3 left-3 z-10 bg-white p-1.5 rounded-lg shadow-xl">
            <Image
              src={hospitalLogo}
              alt={`${branch.hospitalName} logo`}
              width={40}
              height={40}
              className="w-10 h-10 object-contain"
            />
          </div>
        )}
      </div>

      <div className={`p-3 flex-1 flex flex-col justify-between ${inter.variable} font-light`}>
        <div className="mb-3">
          <h3 className="text-base font-medium text-gray-900 leading-snug group-hover:text-gray-600 transition-colors">{branchNameDisplay}</h3>
          <p className="text-sm text-gray-700 mt-1 flex items-center gap-1">
           
            {firstCityName}
          </p>
        </div>

       
        {/* Updated StatBox to use subtle gray/white theme */}
        <div className="grid grid-cols-3 gap-2">
          <StatBox value={estdYear} label="Estd." showPlus={false} />
          <StatBox value={bedsCount} label="Beds" />
          {/* REFINEMENT: Displaying specialty count instead of doctor count (as doctors are often duplicated across branches) */}
          <StatBox value={specialtyCount === 0 ? 'N/A' : specialtyCount} label="Specs" /> 
        </div>
      </div>
    </Link>
  )
}


// Embla Carousel Components
const CarouselControls = ({ onPrev, onNext, show }: { onPrev: () => void; onNext: () => void; show: boolean }) => {
  // Use a more subtle control styling
  const controlClass = "p-1 border border-gray-200 rounded-full bg-white text-gray-600 hover:bg-gray-600 hover:text-white transition-colors shadow-md hidden md:block z-10"
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

const DoctorCard = ({ doctor }: { doctor: any }) => {
  const doctorImage = getImageUrl(doctor.profileImage)
  const doctorSlug = generateSlug(doctor.doctorName || 'doctor')
  const specializationNames = Array.isArray(doctor.specialization) ? doctor.specialization.map((s: any) => s.name).join(', ') || 'Specialist' : 'Specialist'

  return (
    <Link href={`/doctors/${doctorSlug}`}
      // Updated: Rounded corners and shadow moderated, background color changed
      className={`group flex flex-col h-full bg-white border border-gray-100 rounded-xs shadow-xs overflow-hidden transform hover:shadow-sm transition-all duration-300 hover:border-gray-300 ${inter.variable} font-light`}
    >
      <div className="relative h-60 overflow-hidden bg-gray-50"> {/* Changed background color */}
        <ImageWithFallback src={doctorImage} alt={doctor.doctorName} fallbackIcon={User} className="object-cover w-full h-full group-hover:scale-[1.05] transition-transform duration-500" fallbackClassName="bg-gray-50" />
      
      </div>
      <div className={`flex flex-col flex-1 p-4 ${inter.variable} font-light`}>
        <h5 className="text-base font-medium text-gray-900 leading-snug group-hover:text-gray-900 transition-colors">
          {doctor.doctorName}
        </h5>
        <p className="text-sm font-medium text-gray-700 line-clamp-1">{specializationNames}</p>
    <p className="text-sm font-medium text-gray-700 mt-1 line-clamp-1">{doctor.experienceYears} yrs Exp.</p>
      </div>
    </Link>
  )
}

const TreatmentCard = ({ treatment }: { treatment: any }) => {
  const treatmentImage = getImageUrl(treatment.treatmentImage)
  const treatmentSlug = generateSlug(treatment.name || 'treatment')

  return (
    <Link href={`/treatments/${treatmentSlug}`}
      // Updated: Rounded corners and shadow moderated, background color changed
      className={`group flex flex-col h-full bg-white border border-gray-100 rounded-xl shadow-md overflow-hidden transform hover:shadow-lg transition-all duration-300 hover:border-gray-300 ${inter.variable} font-light`}
    >
      <div className="relative h-40 overflow-hidden bg-gray-50"> {/* Changed background color */}
        <ImageWithFallback src={treatmentImage} alt={treatment.name} fallbackIcon={Scissors} className="object-cover w-full h-full group-hover:scale-[1.05] transition-transform duration-500" fallbackClassName="bg-gray-50" />
      </div>
      <div className={`flex flex-col flex-1 p-4 ${inter.variable} font-light`}>
        <h5 className="text-xl font-extrabold text-gray-900 mb-1 line-clamp-2 group-hover:text-gray-600 transition-colors">
          {treatment.name}
        </h5>
        <div className="flex items-center gap-3 text-sm text-gray-600 mt-2">
          {treatment.cost && (
            // Updated: Accent color to gray/white theme
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

const SimilarHospitalCard = ({ hospital }: { hospital: any }) => {
  const hospitalImage = getImageUrl(hospital.hospitalImage) || getImageUrl(hospital.logo)
  const hospitalSlug = hospital.slug ? hospital.slug.replace(/^\/+/, '') : generateSlug(hospital.hospitalName)
  const hospitalCity = getHospitalCity(hospital)
  const branchCount = hospital.branches?.length || 0

  return (
    <Link href={`/search/${hospitalSlug}`}
      // Updated: Rounded corners and shadow moderated
      className={`group flex flex-col h-full bg-white border border-gray-100 rounded-xs shadow-xs overflow-hidden transform hover:shadow-xs transition-all duration-300 hover:border-gray-100 ${inter.variable} font-light`}
    >
      <div className="relative h-40 overflow-hidden bg-gray-100">
        <ImageWithFallback src={hospitalImage} alt={hospital.hospitalName} fallbackIcon={Hospital} className="object-cover w-full h-full group-hover:scale-[1.05] transition-transform duration-500" />
        {/* Accreditation Badges */}
        {hospital.accreditations && hospital.accreditations.length > 0 && (
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {/* Using the standard pill here */}
            {hospital.accreditations.slice(0, 1).map((acc: AccreditationType) => (
              <AccreditationPill key={acc._id} acc={acc} />
            ))}
          </div>
        )}
      </div>
      <div className={`flex flex-col flex-1 p-3 ${inter.variable} font-light`}>
        <h5 className="text-base font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-600 transition-colors">
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
      <div className="flex justify-between items-center mb-4">
        <h3 className="title-heading">
      
          {title}
        </h3>
        {/* Only show controls if more items than can fit in a single view on the largest breakpoint */}
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

// NEW: Breadcrumb Component
const Breadcrumb = ({ hospitalName, hospitalSlug }: { hospitalName: string, hospitalSlug: string }) => (
  <div className={`container mx-auto px-4 bg-white sm:px-6 lg:px-8   font-light`}>
    <nav className="flex md:py-4" aria-label="Breadcrumb">
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
            Hospitals          </Link>
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


// Hospital Detail Skeleton (Updated to match new aesthetic)
const HospitalDetailSkeleton = () => (
  // Updated main background to bg-gray-50
  <div className={`min-h-screen bg-gray-50 ${inter.variable}`}>
    {/* Hero Skeleton (Keep dark for contrast) */}
    <div className="relative w-full h-[55vh] md:h-[65vh] bg-gray-300 animate-pulse">
      {/* Top Left Back Button Area */}
      <div className="absolute top-6 left-6 z-10 h-10 w-32 bg-gray-100/70 rounded-full" />

      {/* Top Right Accreditation Area Skeleton */}
      <div className="absolute top-6 right-6 z-10 p-3 bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50">
        <div className="flex gap-2">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="w-10 h-10 bg-gray-200 rounded-full hidden sm:block" />
          <div className="w-10 h-10 bg-gray-200 rounded-full hidden lg:block" />
        </div>
      </div>

      {/* Info Box Area (Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 container mx-auto z-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="w-24 h-24 bg-white/90 rounded-2xl shadow-xl flex-shrink-0" />
          <div className="pt-2">
            <div className="h-10 w-80 bg-gray-100/70 rounded-xl mb-3" />
            <div className="flex gap-6">
              <div className="h-6 w-32 bg-gray-100/70 rounded-lg" />
              <div className="h-6 w-24 bg-gray-100/70 rounded-lg hidden sm:block" />
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Breadcrumb Skeleton */}
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="h-4 w-64 bg-gray-200 rounded-lg animate-pulse" />
    </div>

    <section className="py-10 md:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-12">

          {/* Main Content Skeleton */}
          <main className="lg:col-span-8 space-y-10 md:space-y-8">

            {/* Description Skeleton (Keep elevated container) */}
            <div className="bg-white rounded-xs border border-gray-100 p-8 md:p-5 shadow-xs animate-pulse">
              <div className="h-7 w-64 bg-gray-200 rounded-lg mb-6" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-4 w-11/12 bg-gray-100 rounded" />
                <div className="h-4 w-10/12 bg-gray-100 rounded" />
                <div className="h-4 w-5/6 bg-gray-100 rounded" />
              </div>
            </div>

            {/* Branches Section Skeleton */}
            <div className="space-y-6">
              <div className="h-8 w-60 bg-gray-200 rounded mb-6" />
              <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-xl shadow-md overflow-hidden h-[24rem] animate-pulse"> {/* Updated rounded and shadow */}
                    <div className="h-48 bg-gray-200" />
                    <div className="p-5 space-y-4">
                      <div className="h-6 w-4/5 bg-gray-100 rounded" />
                      <div className="h-4 w-1/3 bg-gray-100 rounded" />
                      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100"> {/* Updated grid */}
                        <div className="h-10 bg-gray-100 rounded-lg" />
                        <div className="h-10 bg-gray-100 rounded-lg" />
                        <div className="h-10 bg-gray-100 rounded-lg" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Carousel Section Skeleton */}
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-6 pt-4 bg-white rounded-xs border border-gray-100 p-8 md:p-5 shadow-xs">
                <div className="h-8 w-72 bg-gray-200 rounded mb-4" />
                <div className="flex gap-6 overflow-hidden">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex-shrink-0 w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]">
                      <div className="bg-white border border-gray-100 rounded-xl shadow-md overflow-hidden h-72 animate-pulse"> {/* Updated rounded and shadow */}
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
          <aside className="lg:col-span-4 space-y-10 mt-10 lg:mt-0 animate-pulse">
            {/* ContactForm Skeleton (Updated to rounded-3xl) */}
            <div className="h-96 bg-white rounded-3xl border border-gray-100 shadow-xl" />
          </aside>
        </div>
      </div>
    </section>
  </div>
)

// Error State Component (Modernized)
const ErrorState = ({ error }: { error: string | null }) => (
  // Updated main background to bg-gray-50
  <div className={`min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 relative ${inter.variable}`}>
    <div className="absolute top-6 left-6">
      <Link href="/search" className={`flex items-center gap-2 text-gray-800 hover:text-gray-900 transition-colors duration-200 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-full border border-gray-200 shadow-lg ${inter.variable} font-semibold`} >
        <ChevronLeft className="w-5 h-5" /> Back to Search
      </Link>
    </div>
    <div className="text-center space-y-6 max-w-lg p-12 bg-white rounded-3xl border border-gray-200 shadow-2xl">
      <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
        <Hospital className="w-10 h-10" />
      </div>
      <h2 className={`text-3xl font-extrabold text-gray-900 ${inter.variable}`}>Hospital Not Found</h2>
      <p className={`text-lg text-gray-600 leading-relaxed ${inter.variable} font-light`}>
        {error || "The requested hospital could not be found. Please verify the URL or try searching again from the main list."}
      </p>
      <Link href="/search" className={`inline-block w-full bg-gray-600 text-white px-8 py-3 rounded-full font-bold hover:bg-gray-700 transition-all duration-200 shadow-lg mt-4 ${inter.variable}`} >
        Go to Hospital Search
      </Link>
    </div>
  </div>
)

// Branches Section Component (MODIFIED to accept hospitalSlug)
const BranchesSection = ({ hospital, selectedCity, allCityOptions, visibleBranches, filteredBranches, setShowAllBranches, showAllBranches, setSelectedCity, hospitalSlug }: { hospital: HospitalWithBranchPreviewExtended, selectedCity: string, allCityOptions: string[], visibleBranches: any[], filteredBranches: any[], setShowAllBranches: (val: boolean) => void, showAllBranches: boolean, setSelectedCity: (city: string) => void, hospitalSlug: string }) => {
  if (!hospital.branches || hospital.branches.length === 0) return null

  return (
    // Updated container styling
    <section className="space-y-4 bg-white rounded-xs border border-gray-100 p-8 md:p-5 shadow-xs">
      <div className="flex flex-wrap justify-between items-center">
        <h2 className="title-heading ">
       
          Our Branches 
        </h2>

        {/* City Filter */}
        {allCityOptions.length > 1 && (
          <div className="w-full sm:w-auto relative">
            <label htmlFor="city-filter" className="sr-only">Filter by City</label>
            <select
              id="city-filter"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className={`w-full sm:w-48 p-3 border border-gray-300 rounded-full shadow-sm text-sm font-semibold bg-white focus:ring-gray-500 focus:border-gray-500 transition-colors appearance-none pr-8 ${inter.variable}`}
            >
              <option value="">All Cities</option>
              {allCityOptions.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            {/* Added a custom chevron for the select box */}
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleBranches.map(branch => (
          <BranchCard key={branch._id} branch={branch} hospitalSlug={hospitalSlug} />
        ))}
      </div>

      {filteredBranches.length > 3 && ( // Show button if more than 3 total branches exist for filtering/mobile grid logic
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setShowAllBranches(!showAllBranches)}
            className={`text-gray-600 font-medium text-md hover:text-gray-700 transition-colors flex items-center gap-2 px-6 py-2 rounded-xs border-1 border-gray-100 bg-gray-50 hover:bg-gray-100 shadow-xs`}
          >
            {showAllBranches ? (
              <>
                <ChevronUp className="w-5 h-5" />
                Show Less Branches
              </>
            ) : (
              <>
                <ChevronDown className="w-5 h-5" />
                Show All Branches
                {/* {filteredBranches.length}  */}
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
  const [similarHospitals, setSimilarHospitals] = useState<any[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllBranches, setShowAllBranches] = useState(false)
  const [selectedCity, setSelectedCity] = useState('')

  // The slug from the URL is the definitive hospital slug for link construction
  const hospitalSlugFromParams = resolvedParams.slug;


  useEffect(() => {
    const fetchHospitalData = async () => {
      setLoading(true)
      setError(null)
      try {
        // Fetch specific hospital using slug in 'q' parameter
        const specificRes = await fetch(`/api/hospitals?q=${resolvedParams.slug}&pageSize=1`)

        if (!specificRes.ok) throw new Error("Failed to fetch hospital details")
        const specificData = await specificRes.json()

        if (!specificData.items?.length) throw new Error("Hospital not found")
        const matchedHospital = specificData.items[0]

        // Fetch a broader list for similar components
        const allRes = await fetch('/api/hospitals?pageSize=50')
        if (!allRes.ok) throw new Error("Failed to fetch all hospitals")
        const allData = await allRes.json()
        const hospitalsForSearch = allData.items || []

        // Process data
        const hospitalsWithCity = hospitalsForSearch.map((h: any) => ({ ...h, city: getHospitalCity(h) }))

        const hospitalCity = getHospitalCity(matchedHospital)
        const hospitalWithCity = { ...matchedHospital, city: hospitalCity }
        setHospital(hospitalWithCity)

        // Find similar hospitals (same city or same accreditation)
        const similar = hospitalsWithCity
          .filter((h: any) => h._id !== matchedHospital._id && (
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
  }, [resolvedParams.slug])


  const allCityOptions = useMemo(() => {
    if (!hospital?.branches) return []
    const cities = new Set<string>()
    interface City { name?: string | undefined | null }
    interface BranchWithCity { city?: City[] | null | undefined }

    const branches = hospital.branches as BranchWithCity[]
    branches.forEach((branch: BranchWithCity) => {
      const city = (branch.city || [])[0]?.name
      if (city) cities.add(city)
    })
    return Array.from(cities)
  }, [hospital])


  const filteredBranches = useMemo(() => {
    if (!hospital?.branches) return []
    return hospital.branches.filter(branch => {
      const branchCity = (branch.city || [])[0]?.name || ''
      const matchesCity = !selectedCity || branchCity === selectedCity
      return matchesCity
    })
  }, [hospital, selectedCity])


  const visibleBranches = showAllBranches ? filteredBranches : filteredBranches.slice(0, 3)


  // Data processing for carousels
  const processedDescription = hospital?.description ? removeBannersFromDescription(hospital.description) : null
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
    // Updated main background color to soft gray and added font class
    <div className={`min-h-screen bg-gray-50 ${inter.variable}`}>
      <HeroSection hospital={hospital} accreditations={uniqueAccreditations} />

      {/* ADDED: Breadcrumb Navigation */}
      <Breadcrumb
        hospitalName={hospital.hospitalName}
        hospitalSlug={hospitalSlugFromParams}
      />
      {/* ---------------------------------------------------- */}

      <section className="pt-8 pb-10 md:pb-16">
        {/* Main content container */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-6">

            {/* Main Content Area */}
            <main className="lg:col-span-9 space-y-10 md:space-y-6">

              {/* Description Section (Elevated Container) */}
              {processedDescription && (
                <section className="bg-white rounded-xs border border-gray-100 p-8 md:p-5 shadow-xs">
                  <h2 className="title-heading mb-4">
                 
                    About {hospital.hospitalName} Group
                  </h2>
                  <p className="description">
                    {processedDescription}
                  </p>
                </section>
              )}

              {/* Branches Section (Elevated Container) */}
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
                  hospitalSlug={hospitalSlugFromParams} // Passed for BranchCard link construction
                />
              )}


              {/* Doctors Section (Elevated Container) */}
              {uniqueDoctors.length > 0 && (
                <section className="bg-white rounded-xs border border-gray-100 p-8 md:p-5 shadow-xs">
                  <EmblaCarousel
                    items={uniqueDoctors}
                    title="Featured Specialist Doctors"
                    icon={Users}
                    type="doctors"
                  />
                </section>
              )}

              {/* Treatments Section (Elevated Container) */}
              {uniqueTreatments.length > 0 && (
                <section className="bg-white rounded-xs border border-gray-100 p-8 md:p-5 shadow-xs">
                  <EmblaCarousel
                    items={uniqueTreatments}
                    title="Popular Treatments & Procedures"
                    icon={Heart}
                    type="treatments"
                  />
                </section>
              )}

              {/* Similar Hospitals Section (Elevated Container) */}
              {similarHospitals.length > 0 && (
                <section className="bg-white rounded-xs border border-gray-100 p-8 md:p-5 shadow-xs">
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
              <div className="bg-white rounded-xs  shadow-xs">
                {/* ContactForm content is assumed to be styled internally */}
                <ContactForm />
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}