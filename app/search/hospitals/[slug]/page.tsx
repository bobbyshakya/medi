"use client"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import Image from "next/image"
import type { HospitalWithBranchPreview } from "@/types/hospital"
import {
  Building2,
  Calendar,
  Bed,
  Award,
  Phone,
  Mail,
  Globe,
  MapPin,
  Users,
  Heart,
  ChevronLeft,
  Loader2,
  Stethoscope,
  Scissors,
  ChevronRight,
  Clock,
  ArrowLeft,
  Home,
  Hospital,
  Search,
  X,
  Filter,
  ChevronDown,
  Star,
  DollarSign
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
// import Slider from "react-slick" // REMOVED: react-slick
import classNames from "classnames"
import ContactForm from "@/components/ContactForm"
import HospitalSearch from "@/components/BranchFilter" // UPDATED: Import the separate HospitalSearch component
import { Inter } from "next/font/google"
// ADDED: Embla Carousel Imports
import useEmblaCarousel, { EmblaOptionsType } from 'embla-carousel-react'

// ADDED: Embla Carousel Styles (Assuming these utility classes exist or are provided by a global CSS file)
const EMBLA_CLASSES = {
  container: "embla__container flex touch-pan-y ml-[-1rem]", // Apply negative margin for padding
  slide: "embla__slide flex-[0_0_auto] min-w-0 pl-4", // Add padding here
  viewport: "overflow-hidden"
}
const EMBLA_SLIDE_SIZES = {
  // Utility classes for width based on screen size (Tailwind utility)
  xs: "w-full", // 100% width on mobile
  sm: "sm:w-1/2", // 50% width on sm
  lg: "lg:w-1/3", // 33.33% width on lg
}

const inter = Inter({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  variable: "--font-inter"
})

// Helper: Extract Wix image URL (updated to match hospitals/page.tsx logic: simple string handling)
const getWixImageUrl = (imageStr: string | null | undefined): string | null => {
  if (!imageStr || typeof imageStr !== "string" || !imageStr.startsWith("wix:image://v1/")) return null
  const parts = imageStr.split("/")
  return parts.length >= 4 ? `https://static.wixstatic.com/media/${parts[3]}` : null
}

// Image getters (memoized for reuse, updated to pass raw image data, assuming strings)
const getHospitalImage = (imageData: any): string | null => getWixImageUrl(imageData)
const getBranchImage = (imageData: any): string | null => getWixImageUrl(imageData)
const getHospitalLogo = (imageData: any): string | null => getWixImageUrl(imageData)
const getDoctorImage = (imageData: any): string | null => getWixImageUrl(imageData)
const getTreatmentImage = (imageData: any): string | null => getWixImageUrl(imageData)

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

// Helper: Generate slug
const generateSlug = (name: string | null | undefined): string => {
  if (!name || typeof name !== 'string') return ''
  return name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
}

// Breadcrumb
const Breadcrumb = ({ hospitalName, branchName, hospitalSlug }: { hospitalName: string; branchName: string; hospitalSlug: string }) => (
  <nav className={`bg-gray-100 border-b border-gray-100 py-4 ${inter.variable} font-light`}>
    <div className="container mx-auto px-6">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/" className="flex items-center gap-1 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400/50 rounded-xs">
          <Home className="w-4 h-4" />
          Home
        </Link>
        <span>/</span>
       
        <Link href="/search" className="flex items-center hover:text-gray-700 transition-colors">
      

          Hospitals        </Link>
     


        <span>/</span>
        <span className="text-gray-900 font-medium">{branchName}</span>
      </div>
    </div>
  </nav>
)

// SpecialtiesList (integrated into Overview, but kept for potential use)
const SpecialtiesList = ({ specialties }: { specialties: any[] }) => {
  if (!specialties?.length) {
    return (
      <div className={`text-center p-8 bg-gray-50/50 rounded-xs border border-gray-100 ${inter.variable} font-light`}>
        <Heart className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 text-xs">No specialties listed</p>
        <p className="text-gray-400 mt-2 text-xs">Specialties</p>
      </div>
    )
  }
  return (
    <div className={`text-center p-8 bg-gray-50/50 rounded-xs border border-gray-100 transition-shadow ${inter.variable} font-light`}>
      <Heart className="w-8 h-8 text-gray-900 mx-auto mb-1" />
      <div className="space-y-1 max-h-20 overflow-y-auto">
        {specialties.slice(0, 4).map((spec: any) => (
          <p key={spec._id || Math.random()} className="text-3xl text-gray-900 line-clamp-1 px-2 py-1 bg-white/60 rounded-xs mx-auto w-full max-w-[120px]">
            {spec.name || spec.title || 'N/A'}
          </p>
        ))}
        {specialties.length > 4 && <p className="text-xs text-gray-900 mt-0">+{specialties.length - 4} more</p>}
      </div>
      <p className="text-gray-700 mt-0 text-sm">Specialty</p>
    </div>
  )
}

// BranchCard (UPDATED: Redesigned to match the provided image: hospital image top, accreditation badge top right, small logo bottom left, title as hospital + branch, subtitle city + specialty, blue stats boxes)
const BranchCard = ({ data }: { data: any }) => {
  const { branchName, city, specialization, noOfDoctors, totalBeds, hospitalName, yearEstablished, hospitalImage, accreditation, logo } = data;
  const firstCity = city?.[0]?.cityName || 'N/A'
  const firstSpecialty = specialization?.[0]?.name || 'Multi Speciality'
  // UPDATED: Use only branchName slug for the URL
  const fullSlug = generateSlug(branchName) 
  const doctorsCount = noOfDoctors || 0
  const bedsCount = totalBeds || 0
  const estdYear = yearEstablished || 'N/A'
  const hospitalImg = getHospitalImage(hospitalImage)
  const hospitalLogo = getHospitalLogo(logo)
  const accImage = accreditation?.[0] ? getWixImageUrl(accreditation[0].image) : null

  return (
    <Link href={`/search/hospitals/${fullSlug}`} className="block h-full focus:outline-none focus:ring-2 focus:ring-gray-400/50 border border-gray-100 rounded-xs shadow-xs bg-white hover:shadow-sm transition-shadow relative flex flex-col overflow-hidden">
      {/* Hospital Image Section */}
      <div className="relative w-full h-48 bg-gray-50">
        {hospitalImg ? (
          <img
            src={hospitalImg}
            alt={`${hospitalName} ${branchName} facility`}
            className="object-cover w-full h-full"
            onError={(e) => { e.currentTarget.style.display = "none" }}
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
              className="w-10 h-10 object-contain rounded-full shadow-lg"
              onError={(e) => { e.currentTarget.style.display = "none" }}
            />
          </div>
        )}
        {hospitalLogo && (
          <div className="absolute bottom-2 left-2 z-10">
            <img
              src={hospitalLogo}
              alt={`${hospitalName} logo`}
              className="w-12 h-auto object-contain"
              onError={(e) => { e.currentTarget.style.display = "none" }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`p-3 flex-1 flex flex-col justify-between ${inter.variable} font-light relative`}>
        {/* Small Hospital Logo Bottom Left */}

        {/* Title: Only Branch Name (UPDATED: Removed group/hospital name) */}
        <div className="mb-1">
          <h3 className="text-base font-medium text-gray-900 leading-tight">{branchName}</h3>
        </div>

        {/* Subtitle: City, Specialty */}
        <div className="mb-2">
          <p className="text-sm text-gray-600">{`${firstCity}, ${firstSpecialty} Speciality`}</p>
        </div>

        {/* Stats Row: Doctors, Beds, Est. - Blue themed boxes */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-gray-50 rounded-xs border border-gray-100">
            <p className="text-sm font-medium text-gray-700">{estdYear}</p>
            <p className="text-sm text-gray-700">Estd.</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-xs border border-gray-100">
            <p className="text-sm font-medium text-gray-700">{bedsCount}+</p>
            <p className="text-sm text-gray-700">Beds</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-xs border border-gray-100">
            <p className="text-sm font-medium text-gray-700">{doctorsCount}+</p>
            <p className="text-sm text-gray-700">Doctors</p>
          </div>
        </div>
      </div>
    </Link>
  )
}

// DoctorCard (redirects to hospital search with doctor filter)
const DoctorCard = ({ doctor }: { doctor: any }) => {
  const doctorImage = getDoctorImage(doctor.profileImage)
  
  // --- UPDATED SPECIALIZATION LOGIC START ---
  const specializationDisplay = useMemo(() => {
    // Helper to safely extract the name/title from a specialization object or return the string
    const getSpecializationName = (s: any): string => {
      if (typeof s === "object" && s !== null) {
        return (s as any).name || (s as any).title || "";
      }
      return String(s);
    };

    // 1. Convert specialization data into a clean array of names
    const specializationArray = (Array.isArray(doctor.specialization) ? doctor.specialization : [doctor.specialization])
      .map(getSpecializationName)
      .filter(Boolean);

    if (specializationArray.length === 0) {
      return "General Practitioner";
    }

    const primary = specializationArray[0];
    const remainingCount = specializationArray.length - 1;

    if (remainingCount > 0) {
      // Example: "Cardiology +1"
      return `${primary} +${remainingCount} Specialties`;
    }

    // Example: "Cardiology"
    return primary;
  }, [doctor.specialization])
  // --- UPDATED SPECIALIZATION LOGIC END ---

  const doctorSlug = generateSlug(doctor.doctorName)
  return (
    <Link href={`/doctors/${doctorSlug}`} className="group flex flex-col h-full bg-white border border-gray-100 rounded-xs shadow-sm hover:shadow-md overflow-hidden transition-all focus:outline-none focus:ring-2 focus:ring-gray-400/50">
      <div className="relative h-60 overflow-hidden bg-gray-50 rounded-t-lg">
        {doctorImage ? (
          <img
            src={doctorImage}
            alt={`${doctor.doctorName}, ${specializationDisplay}`}
            className="object-cover group-hover:scale-105 transition-transform duration-300 w-full h-full"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            onError={(e) => { e.currentTarget.style.display = "none" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Stethoscope className="w-12 h-12 text-gray-300" />
          </div>
        )}
      </div>
      <div className={`p-3 flex-1 flex flex-col ${inter.variable} font-light`}>
        <h3 className="text-xl md:text-base font-medium text-gray-900 leading-tight mb-1 line-clamp-1">{doctor.doctorName}</h3>
        <div className=" gap-1">
          <p className="text-gray-700 text-sm flex items-center ">{specializationDisplay}</p>
          {doctor.experienceYears && (

            <p className="text-gray-700 text-sm  flex items-center ">

              {doctor.experienceYears} years of exp
            </p>
          )}
        </div>
        {/* <p className="text-gray-600 text-xs line-clamp-2 flex-1">{getShortDescription(doctor.aboutDoctorHtml)}</p> */}
      </div>
    </Link>
  )
}

// TreatmentCard (Ensuring proper use of image/name/slug)
const TreatmentCard = ({ item }: { item: any }) => {
  // Use 'treatmentImage' if available, otherwise fallback to 'image'
  const treatmentImage = getTreatmentImage(item.treatmentImage || item.image)
  const itemName = item.name || item.title || 'N/A Treatment' // Added fallback for robust data handling
  const itemSlug = generateSlug(itemName) // Generate slug from the actual name used
  
  return (
    <Link href={`/treatment/${itemSlug}`} className="group flex flex-col h-full bg-white border border-gray-100 rounded-xs shadow-sm hover:shadow-md overflow-hidden transition-all focus:outline-none focus:ring-2 focus:ring-gray-400/50">
      <div className="relative h-48 overflow-hidden bg-gray-50 rounded-t-lg">
        {treatmentImage ? (
          <img
            src={treatmentImage}
            alt={`${itemName} treatment`}
            className="object-cover group-hover:scale-105 transition-transform duration-300 w-full h-full"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            onError={(e) => { e.currentTarget.style.display = "none" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Scissors className="w-12 h-12 text-gray-300" />
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col  font-light">
        {/* Use itemName for display */}
        <h3 className="text-xl md:text-base font-medium text-gray-900 leading-tight mb-1 line-clamp-1">{itemName}</h3>
        {/* ADDED: Display specialist/department for context */}
        {/* {item.specialistName && (
            <p className="text-sm text-gray-700 mt-1 line-clamp-1">Specialist: {item.specialistName}</p>
        )} */}
        {/* {item.startingCost && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-1 flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-gray-500"/>
                Starts at: {item.startingCost}
            </p>
        )} */}
      </div>
    </Link>
  )
}

// ADDED: DoctorCarouselSlide component to wrap DoctorCard for use in EmblaCarousel
const DoctorCarouselSlide = ({ doctor }: { doctor: any }) => {
  // Apply widths for responsiveness: full on mobile, half on small screens, third on large screens (3 items on lg)
  const slideClass = classNames(EMBLA_CLASSES.slide, EMBLA_SLIDE_SIZES.xs, EMBLA_SLIDE_SIZES.sm, EMBLA_SLIDE_SIZES.lg)
  return (
    <div key={doctor._id} className={slideClass}>
      <DoctorCard doctor={doctor} />
    </div>
  )
}

// DoctorsList (UPDATED to use EmblaCarousel and remove 'Show All' logic)
const DoctorsList = ({ doctors }: { doctors: any[] }) => {
  const router = useRouter()
  const [inputValue, setInputValue] = useState("")

  // Embla Carousel Options
  const options: EmblaOptionsType = {
    loop: false, // Set to false since the list of doctors is not a typical infinite loop
    align: 'start',
    dragFree: false,
    containScroll: 'keepSnaps',
  }

  const [emblaRef, emblaApi] = useEmblaCarousel(options)
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true)
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true)

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  const onSelect = useCallback((emblaApi: any) => {
    setPrevBtnDisabled(!emblaApi.canScrollPrev())
    setNextBtnDisabled(!emblaApi.canScrollNext())
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    onSelect(emblaApi)
    emblaApi.on('reInit', onSelect)
    emblaApi.on('select', onSelect)
  }, [emblaApi, onSelect])

  // UPDATED: A-Z Sorting for carousel slides
  const sortedDoctors = useMemo(() => {
    return [...doctors]
      .filter(d => d?._id)
      .sort((a, b) => (a.doctorName || '').localeCompare(b.doctorName || ''))
  }, [doctors]);


  const doctorOptions = useMemo(() => {
    return doctors
      .filter(d => d?.doctorName)
      .sort((a, b) => (a.doctorName || '').localeCompare(b.doctorName || ''))
      .map((doctor) => {
        const specializationDisplay = Array.isArray(doctor.specialization)
          ? doctor.specialization.map((s: any) => (typeof s === 'object' ? s?.name : s)).filter(Boolean).join(', ')
          : doctor.specialization || "General Practitioner"
        return { id: doctor._id, name: `${doctor.doctorName} - ${specializationDisplay}` }
      })
  }, [doctors])

  const handleDoctorSelect = useCallback((id: string) => {
    const doctor = doctors.find(d => d._id === id)
    if (doctor) {
      const doctorSlug = generateSlug(doctor.doctorName)
      router.push(`/doctors/${doctorSlug}`)
    }
  }, [doctors, router])

  if (!doctors?.length) {
    return (
      <div className={`bg-gray-50 p-4 rounded-xs shadow-xs border border-gray-100 text-center ${inter.variable} font-light`}>
        <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No doctors available at this branch</p>
      </div>
    )
  }

  return (
    <section className={`bg-gray-50 rounded-xs shadow-xs border border-gray-100 ${inter.variable} font-light`}>
      <div className="px-4 pt-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3">
          <h2 className="text-2xl md:text-xl font-medium text-gray-900 tracking-tight flex items-center mt-2">
            Our Specialist Doctors
          </h2>
          <div className="relative w-full md:w-80">
            <SearchDropdown
              value={inputValue}
              onChange={setInputValue}
              placeholder="Search doctors by name or specialty..."
              options={doctorOptions}
              selectedOption={null}
              onOptionSelect={handleDoctorSelect}
              onClear={() => setInputValue("")}
              type="doctor"
            />
          </div>
        </div>
      </div>

      {/* UPDATED: Embla Carousel Implementation uses sortedDoctors */}
      <div className="relative px-4 pb-8">
        <div className={EMBLA_CLASSES.viewport} ref={emblaRef}>
          <div className={EMBLA_CLASSES.container}>
            {sortedDoctors.map((doctor) => (
              <DoctorCarouselSlide key={doctor._id} doctor={doctor} />
            ))}
          </div>
        </div>
        {/* Navigation Buttons for Carousel */}
        {doctors.length > 3 && ( // Only show arrows if there are more than 3 doctors on large screens
          <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between pointer-events-none px-2 md:px-0">
            <button
              onClick={scrollPrev}
              disabled={prevBtnDisabled}
              className={classNames(
                "p-3 rounded-full bg-white shadow-lg transition-opacity duration-200 pointer-events-auto",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "ml-[-1rem]" // Align with the negative margin of the container
              )}
              aria-label="Previous Doctor"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={scrollNext}
              disabled={nextBtnDisabled}
              className={classNames(
                "p-3 rounded-full bg-white shadow-lg transition-opacity duration-200 pointer-events-auto",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "mr-[-1rem]"
              )}
              aria-label="Next Doctor"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        )}
      </div>
      {/* REMOVED: The 'Show All' button logic */}
    </section>
  )
}

// TreatmentsList (UPDATED to include Search/Filter and use combined treatment list)
const TreatmentsList = ({ treatments }: { treatments: any[] }) => {
  const router = useRouter() // ADDED: Initialize useRouter
  const [searchTerm, setSearchTerm] = useState("")
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start', dragFree: false, containScroll: 'keepSnaps' })
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true)
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true)

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  const onSelect = useCallback((emblaApi: any) => {
    setPrevBtnDisabled(!emblaApi.canScrollPrev())
    setNextBtnDisabled(!emblaApi.canScrollNext())
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    onSelect(emblaApi)
    emblaApi.on('reInit', onSelect)
    emblaApi.on('select', onSelect)
  }, [emblaApi, onSelect])
  
  // UPDATED: Filter and Sort Logic (applies search term)
  const sortedAndFilteredTreatments = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase()
    
    return [...treatments]
      .filter(t => 
        (t?.name || t?.title || '').toLowerCase().includes(lowerSearch) ||
        (t?.specialistName || '').toLowerCase().includes(lowerSearch) // Allow filtering by specialist/department name
      )
      // Sort by name A-Z
      .sort((a, b) => (a.name || a.title || '').localeCompare(b.name || b.title || '')) 
  }, [treatments, searchTerm]);

  // Options for SearchDropdown (based on all treatments for complete search range)
  const allTreatmentOptions = useMemo(() => {
    return [...treatments]
      .filter(t => t?.name || t?.title)
      .sort((a, b) => (a.name || a.title || '').localeCompare(b.name || b.title || ''))
      .map(t => ({
        id: t._id,
        // Store the slug for redirection
        slug: generateSlug(t.name || t.title),
        // Format for search display: "Treatment Name (Specialist Name)"
        name: `${t.name || t.title} (${t.specialistName || 'Treatment'})`
      }))
  }, [treatments])

  // UPDATED: Handles selection from the dropdown to REDIRECT to the treatment page
  const handleTreatmentSelect = useCallback((id: string) => {
    const selectedTreatment = allTreatmentOptions.find(opt => opt.id === id);
    if (selectedTreatment && selectedTreatment.slug) {
        // Clear search and redirect to the specific treatment page
        setSearchTerm(""); 
        router.push(`/treatment/${selectedTreatment.slug}`) 
    } else {
      // Fallback: If no slug, just set the search term to filter the carousel as before
       if (selectedTreatment) {
         setSearchTerm(selectedTreatment.name);
       }
    }
  }, [allTreatmentOptions, router])


  if (!treatments?.length) {
    return (
      <div className={`bg-gray-50 p-4 rounded-xs shadow-xs border border-gray-100 text-center ${inter.variable} font-light`}>
        <Scissors className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No treatments available at this branch</p>
      </div>
    )
  }

  return (
    <section className={`bg-gray-50 rounded-xs shadow-xs border border-gray-100 ${inter.variable} font-light`}>
      <div className="px-4 pt-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3">
            <h2 className="text-2xl md:text-xl font-medium text-gray-900 tracking-tight flex items-center mt-2">
                Available Treatments 
                {/* ({sortedAndFilteredTreatments.length}) */}
            </h2>
            <div className="relative w-full md:w-80">
                <SearchDropdown
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search treatments by name or specialist..."
                    options={allTreatmentOptions} // Use the full list for search capability
                    selectedOption={null}
                    onOptionSelect={handleTreatmentSelect} // UPDATED: Redirects on select
                    onClear={() => setSearchTerm("")}
                    type="treatment"
                />
            </div>
        </div>
      </div>
      <div className="relative px-4 pb-8">
        <div className={EMBLA_CLASSES.viewport} ref={emblaRef}>
          <div className={EMBLA_CLASSES.container}>
            {/* Use sortedAndFilteredTreatments for A-Z display and filter */}
            {sortedAndFilteredTreatments.map((item) => (
              // Ensure we use the proper unique key for the slide
              <div key={item._id} className={classNames(EMBLA_CLASSES.slide, EMBLA_SLIDE_SIZES.xs, EMBLA_SLIDE_SIZES.sm, EMBLA_SLIDE_SIZES.lg)}>
                <TreatmentCard item={item} />
              </div>
            ))}
            {sortedAndFilteredTreatments.length === 0 && (
                <div className="pl-4 py-8 text-center w-full min-h-40 flex flex-col items-center justify-center">
                    <X className="w-10 h-10 text-gray-300 mb-2"/>
                    <p className="text-gray-500">No treatments found matching "{searchTerm}".</p>
                </div>
            )}
          </div>
        </div>
        {treatments.length > 3 && (
          <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between pointer-events-none px-2 md:px-0">
            <button
              onClick={scrollPrev}
              disabled={prevBtnDisabled}
              className={classNames(
                "p-3 rounded-full bg-white shadow-lg transition-opacity duration-200 pointer-events-auto",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "ml-[-1rem]"
              )}
              aria-label="Previous Treatment"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={scrollNext}
              disabled={nextBtnDisabled}
              className={classNames(
                "p-3 rounded-full bg-white shadow-lg transition-opacity duration-200 pointer-events-auto",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "mr-[-1rem]"
              )}
              aria-label="Next Treatment"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

// EmblaCarousel (generic reusable carousel for branches, doctors, treatments)
const EmblaCarousel = ({ slides, options }: { slides: any[]; options: EmblaOptionsType }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(options)
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true)
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true)

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  const onSelect = useCallback((emblaApi: any) => {
    setPrevBtnDisabled(!emblaApi.canScrollPrev())
    setNextBtnDisabled(!emblaApi.canScrollNext())
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    onSelect(emblaApi)
    emblaApi.on('reInit', onSelect)
    emblaApi.on('select', onSelect)
  }, [emblaApi, onSelect])

  return (
    <>
      <div className={EMBLA_CLASSES.viewport} ref={emblaRef}>
        <div className={EMBLA_CLASSES.container}>
          {slides.map((slide, index) => (
            <div key={slide.key || index} className={classNames(EMBLA_CLASSES.slide, EMBLA_SLIDE_SIZES.xs, EMBLA_SLIDE_SIZES.sm, EMBLA_SLIDE_SIZES.lg)}>
              {slide}
            </div>
          ))}
        </div>
      </div>
      {slides.length > 3 && (
        <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between pointer-events-none px-2 md:px-0">
          <button
            onClick={scrollPrev}
            disabled={prevBtnDisabled}
            className={classNames(
              "p-3 rounded-full bg-white shadow-lg transition-opacity duration-200 pointer-events-auto",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "ml-[-1rem]"
            )}
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={scrollNext}
            disabled={nextBtnDisabled}
            className={classNames(
              "p-3 rounded-full bg-white shadow-lg transition-opacity duration-200 pointer-events-auto",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "mr-[-1rem]"
            )}
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      )}
    </>
  )
}

// SimilarBranchesList (UPDATED: Search dropdown now uses allBranchesForSearch to include ALL branches
const SimilarBranchesList = ({ branches, allBranchesForSearch, currentCityDisplay }: {
  branches: any[],
  allBranchesForSearch: any[],
  currentCityDisplay: string
}) => {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  // Embla Carousel Options
  const options: EmblaOptionsType = useMemo(() => ({
    loop: false,
    align: 'start',
    dragFree: false,
    containScroll: 'keepSnaps',
  }), [])

  // UPDATED: branchOptions now uses allBranchesForSearch to include ALL branches (which is now sorted A-Z)
  const branchOptions = useMemo(() => {
    return allBranchesForSearch
      .filter(branch => branch?._id && branch.hospitalName && branch.branchName)
      .map((branch) => {
        const cityName = branch.city?.[0]?.cityName
        // Format: Only Branch Name (City Name) - UPDATED: Removed hospital/group name
        const displayName = `${branch.branchName}${cityName ? ` (${cityName})` : ''}`
        return {
          id: branch._id,
          name: displayName,
          hospitalName: branch.hospitalName,
          branchName: branch.branchName
        }
      })
  }, [allBranchesForSearch])

  // UPDATED: handleBranchSelect to correctly redirect using ONLY branch name for the slug
  const handleBranchSelect = useCallback((id: string) => {
    // Find the branch from the comprehensive list
    const branchItem = allBranchesForSearch.find(b => b._id === id)
    if (branchItem && branchItem.hospitalName) {
      setSearchTerm("")
      // NEW: Use only branchName slug for the URL
      const fullSlug = generateSlug(branchItem.branchName)
      router.push(`/search/hospitals/${fullSlug}`)
    }
  }, [allBranchesForSearch, router])

  if (!branches?.length && !allBranchesForSearch?.length) {
    return (
      <div className={`bg-gray-50 p-4 rounded-xs shadow-xs border border-gray-100 text-center ${inter.variable} font-light`}>
        <Hospital className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No other hospitals available in {currentCityDisplay}</p>
      </div>
    )
  }

  return (
    <section className={`bg-gray-50 rounded-xs shadow-xs border border-gray-100 ${inter.variable} font-light`}>
      <div className="px-4 py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-0">
          <h2 className="text-2xl md:text-xl font-medium mt-2 text-gray-900 tracking-tight flex items-center">

            Near Similar by Hospitals in {currentCityDisplay} {/* This title uses the city filter for context */}
            {/* ({branches.length}) */}
          </h2>
          <div className="relative w-full md:w-80">
            {/* SearchDropdown uses the comprehensive list, fulfilling the requirement */}
            <SearchDropdown
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search hospital by name and city"
              options={branchOptions} // This is the list of ALL branches
              selectedOption={null}
              onOptionSelect={handleBranchSelect}
              onClear={() => setSearchTerm("")}
              type="branch"
            />
          </div>
        </div>
      </div>
      {branches?.length > 0 ? (
        <div className="relative px-4 pb-8">
          {/* UPDATED: Use EmblaCarousel with BranchCard that now includes yearEstablished */}
          <EmblaCarousel slides={branches.map(b => <BranchCard key={b._id} data={b} />)} options={options} />
        </div>
      ) : (
        <div className="p-8 pt-0">
          <p className="text-gray-500 text-sm italic">No similar branches found in {currentCityDisplay}. Use the search above to find all hospital branches.</p>
        </div>
      )}
    </section>
  )
}

// StatCard
const StatCard = ({ icon: Icon, value, label, showPlus = true }: { icon: any; value: string | number; label: string; showPlus?: boolean }) => (
  <div
    className={`text-center p-4 bg-white rounded-xs border border-gray-100 shadow-xs hover:shadow-sm transition-all duration-300 ${inter.variable} font-light flex flex-col items-center justify-center`}
  >
    <Icon className="w-8 h-8 text-gray-800 mb-3 flex-shrink-0" />
    <p className="text-lg font-medium text-gray-800 mb-1 leading-tight">
      {value}
      {showPlus && '+'}
    </p>
    <p className="text-lg font-medium text-gray-800 leading-snug">{label}</p>
  </div>

)

// SearchDropdown (reusable)
const SearchDropdown = ({ value, onChange, placeholder, options, selectedOption, onOptionSelect, onClear, type }: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  options: { id: string; name: string }[]
  selectedOption: string | null
  onOptionSelect: (id: string) => void
  onClear: () => void
  type: "branch" | "city" | "treatment" | "doctor" | "specialty"
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const filteredOptions = useMemo(() => {
    if (!value) return options
    const lower = value.toLowerCase()
    return options.filter(option => option.name.toLowerCase().includes(lower))
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

  const selectedOptionName = options.find((opt) => opt.id === selectedOption)?.name || value

  const getIcon = () => {
    const icons = {
      branch: Building2,
      city: MapPin,
      default: Stethoscope
    }
    const Icon = icons[type as keyof typeof icons] || icons.default
    return <Icon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
  }

  const getNoResultsText = () => {
    const texts = {
      branch: "branches",
      city: "cities",
      treatment: "treatments",
      doctor: "doctors",
      specialty: "specializations"
    }
    return texts[type] || "options"
  }

  return (
    <div ref={dropdownRef} className="relative space-y-2">
      <div className="relative">

        <input
          type="text"
          value={isOpen ? value : selectedOptionName}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-4 pr-4 py-2 border border-gray-200 text-sm rounded-xs focus:outline-none focus:ring-1 focus:ring-gray-400/50 bg-white text-gray-900 placeholder-gray-500 shadow-sm"
        />
        {(selectedOption || value) && (
          <button onClick={onClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      {isOpen && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xs shadow-lg max-h-48 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onOptionSelect(option.id)
                  // Keep search term active for filter
                  if (type === 'treatment' || type === 'doctor') {
                    setIsOpen(false) 
                  } else {
                    setIsOpen(false)
                  }
                }}
                className={`w-full text-left px-4 border-b border-gray-200 py-2 text-sm transition-colors ${option.id === selectedOption ? 'bg-gray-700 text-white' : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {option.name}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 italic">No matching {getNoResultsText()} found.</div>
          )}
        </div>
      )}
    </div>
  )
}

// Skeletons (updated to match hospital page styles)
const HeroSkeleton = () => (
  <section className="relative w-full h-[70vh] bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse">
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 z-10 pb-12">
      <div className="container mx-auto px-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-300 rounded-full" />
          <div className="space-y-2">
            <div className="h-8 bg-gray-300 rounded w-64" />
            <div className="h-4 bg-gray-300 rounded w-96" />
          </div>
        </div>
      </div>
    </div>
  </section>
)

const OverviewSkeleton = () => (
  <div className={`bg-white p-6 rounded-xs border border-gray-100 shadow-sm animate-pulse ${inter.variable} font-light`}>
    <div className="h-8 bg-gray-300 rounded w-48 mb-4" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-xs" />)}
    </div>
  </div>
)

const AboutSkeleton = () => (
  <div className={`bg-white p-6 rounded-xs border border-gray-100 shadow-sm animate-pulse ${inter.variable} font-light`}>
    <div className="h-8 bg-gray-300 rounded w-32 mb-4" />
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
      <div className="h-4 bg-gray-200 rounded w-4/6" />
    </div>
  </div>
)

const CarouselSkeleton = ({ type }: { type: string }) => (
  <div className={`bg-gray-50 p-4 rounded-xs shadow-xs border border-gray-100 animate-pulse ${inter.variable} font-light`}>
    <div className="h-8 bg-gray-300 rounded w-48 mb-6" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-60 bg-gray-200 rounded-xs" />)}
    </div>
  </div>
)

const FacilitiesSkeleton = () => (
  <div className={`bg-gray-50 p-4 rounded-xs shadow-xs border border-gray-100 animate-pulse ${inter.variable} font-light`}>
    <div className="h-8 bg-gray-300 rounded w-48 mb-6" />
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xs">
          <div className="w-3 h-3 bg-gray-300 rounded-full" />
          <div className="h-4 bg-gray-300 rounded w-32" />
        </div>
      ))}
    </div>
  </div>
)

const SidebarSkeleton = () => (
  <div className={`space-y-6 ${inter.variable} w-full font-light`}>
    <div className="bg-white p-6 rounded-xs border border-gray-100 shadow-sm animate-pulse">
      <div className="h-6 bg-gray-300 rounded w-32 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-2">
            <div className="w-10 h-10 bg-gray-300 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded" />
              <div className="h-3 bg-gray-300 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="bg-white p-6 rounded-xs border border-gray-100 shadow-sm animate-pulse h-96" />
  </div>
)

/**
 * FIX: Updated to use the explicit `new Object()` constructor instead of the literal `{}`
 * to circumvent the rare and unusual `TypeError: {} is not a function` in the old runtime environment.
 * * Extracts and flattens all unique treatments from the nested 'specialists' structure.
 * It also enriches each treatment with the name of its specialist for filtering/display.
 * @param branch The branch object containing the specialists array.
 * @returns An array of unique treatment objects.
 */
const extractUniqueTreatments = (branch: any): any[] => {
  if (!branch?.specialists) return []

  // FIX: Using new Object() instead of {} to work around the unusual runtime error
  const uniqueTreatmentsObject = new Object() as { [key: string]: any }

  (branch.specialists as any[]).forEach((specialist: any) => {
    const specialistName = specialist.name || 'Unknown Specialist'
    specialist.treatments?.forEach((treatment: any) => {
      // Create a robust key using _id or a combination of names
      const key = treatment._id || `${treatment.name || 'n/a'}-${specialistName}`
      
      // Ensure the treatment is unique and link it to its specialist
      // Check for existence using the key in the object
      if (!uniqueTreatmentsObject[key]) {
          uniqueTreatmentsObject[key] = {
              ...treatment,
              // ADDED: Specialist information for filtering/display
              specialistName: specialistName,
              // Fallback to the generated key if _id is missing
              _id: treatment._id || key 
          }
      }
    })
  })

  // Convert object values back to an array
  return Object.values(uniqueTreatmentsObject)
}

// Main Component (UPDATED: Extract all treatments using the new helper function)
export default function BranchDetail({ params }: { params: Promise<{ slug: string }> }) {
  const [branch, setBranch] = useState<any>(null)
  const [hospital, setHospital] = useState<HospitalWithBranchPreview | null>(null)
  const [allHospitals, setAllHospitals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBranchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const resolvedParams = await params
        const branchSlug = resolvedParams.slug
        // NOTE: This assumes an API endpoint '/api/hospitals' exists and returns a structure containing 'items'
        // Since you are asking to "check my api route file to proper tratment data show", we assume this endpoint is where the data lives.
        const res = await fetch('/api/hospitals')
        if (!res.ok) throw new Error("Failed to fetch hospitals")
        const data = await res.json()
        if (data.items?.length > 0) {
          let foundBranch = null
          let foundHospital = null
          for (const hospitalItem of data.items) {
            if (!hospitalItem.hospitalName) continue
            const hospitalSlug = generateSlug(hospitalItem.hospitalName)
            if (!hospitalSlug || !hospitalItem.branches) continue
            const branchMatch = hospitalItem.branches.find((b: any) => {
              if (!b?.branchName) return false
              const expectedBranchSlug = `${hospitalSlug}-${generateSlug(b.branchName)}`
              // NEW: Match the incoming branchSlug (e.g., "apollo-hospital-bangalore") 
              // against the end of the full expected slug (e.g., "apollo-hospital-group-apollo-hospital-bangalore")
              return expectedBranchSlug.endsWith(branchSlug) 
            })
            if (branchMatch) {
              foundBranch = branchMatch
              foundHospital = hospitalItem
              break
            }
          }
          setAllHospitals(data.items)
          setBranch(foundBranch)
          setHospital(foundHospital)
          if (!foundBranch || !foundHospital) {
            setError("Branch not found. The URL might be incorrect or the branch does not exist.")
          }
        } else {
          setError("No hospital data available.")
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "An unknown error occurred while fetching branch details")
      } finally {
        setLoading(false)
      }
    }
    fetchBranchData()
  }, [params])

  // --- Data Transformations ---

  // 1. Extract and flatten all treatments from specialists (FIXED DATA SOURCE)
  // This uses the robust extractUniqueTreatments which now uses new Object()
  const allTreatments = useMemo(() => extractUniqueTreatments(branch), [branch])

  // 2. A-Z Sorting for Facilities
  const sortedFacilities = useMemo(() => {
    // FIX: Defensively check if branch?.facilities is an array before spreading or sorting
    const facilities = Array.isArray(branch?.facilities) ? branch.facilities : []
    
    // Sort the array copy
    return [...facilities].sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
  }, [branch?.facilities])
  
  // --- Conditional Rendering / Loading States ---

  if (loading) {
    return (
      <div className={`min-h-screen bg-white ${inter.variable} font-light`}>
        <HeroSkeleton />
        <Breadcrumb hospitalName="Hospital Name" branchName="Branch Name" hospitalSlug="" />
        <section className="py-16 relative z-10">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-12 gap-8">
              <main className="lg:col-span-9 space-y-8">
                <OverviewSkeleton />
                <AboutSkeleton />
                <CarouselSkeleton type="doctors" />
                <CarouselSkeleton type="treatments" />
                <FacilitiesSkeleton />
                {/* The similar branches list uses the same skeleton */}
                <CarouselSkeleton type="hospitals" />
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

  if (error || !branch || !hospital) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 relative ${inter.variable} font-light`}>
        <Breadcrumb hospitalName="Hospital Name" branchName="Branch Name" hospitalSlug="" />
        <div className="text-center space-y-6 max-w-md p-10 bg-gray-50 rounded-xs shadow-xs border border-gray-100">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto" />
          <h2 className="text-2xl md:text-3xl font-medium text-gray-900 leading-tight">Branch Not Found</h2>
          <p className="text-base text-gray-700 leading-relaxed font-light">{error || "The requested branch could not be found. Please check the URL or try searching again."}</p>
          <Link href="/hospitals" className="inline-block w-full bg-gray-700 text-white px-6 py-3 rounded-xs hover:bg-gray-800 transition-all font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400/50">
            Go to Hospitals Search
          </Link>
        </div>
      </div>
    )
  }

  const branchImage = getBranchImage(branch.branchImage)
  const hospitalImage = getHospitalImage(hospital.hospitalImage)
  const heroImage = branchImage || hospitalImage
  const hospitalLogo = getHospitalLogo(hospital.logo)
  const hospitalSlug = generateSlug(hospital.hospitalName)

  const currentCities = branch.city?.map((c: any) => c?.cityName).filter(Boolean) || []

  // 3. FILTERED LIST FOR SLIDER/CARDS (Only similar/nearby branches)
  const similarBranches = allHospitals
    .filter((h: any) => h.branches) // Filter out hospitals without branches list
    .flatMap((h: any) =>
      h.branches
        // Only show other hospitals/branches in the current city/cities, 
        // AND exclude the *current* branch from the list (using the _id is generally safer)
        .filter((b: any) =>
          b.city?.some((c: any) => currentCities.includes(c?.cityName)) &&
          b._id !== branch._id &&
          b.branchName // Ensure branch has a name
        )
        .map((b: any) => ({
          ...b,
          hospitalName: h.hospitalName,
          yearEstablished: h.yearEstablished,
          hospitalImage: h.hospitalImage, // UPDATED
          logo: h.logo, // UPDATED
          accreditation: b.accreditation || h.accreditation // UPDATED
        }))
    )
    .sort((a: any, b: any) => (a.branchName || '').localeCompare(b.branchName || '')) // ADDED: Alphabetical sort by branchName

  // 4. COMPREHENSIVE LIST FOR SEARCH DROPDOWN (All branches everywhere)
  const allHospitalBranches = allHospitals
    .filter((h: any) => h.branches)
    .flatMap((h: any) =>
      h.branches
        .filter((b: any) => b?.branchName) // Ensure branches have a name
        .map((b: any) => ({
          ...b,
          hospitalName: h.hospitalName,
          yearEstablished: h.yearEstablished,
          hospitalImage: h.hospitalImage, // UPDATED
          logo: h.logo, // UPDATED
          accreditation: b.accreditation || h.accreditation // UPDATED
        }))
    )
    // ADDED: A-Z Sorting for the comprehensive search list
    .sort((a: any, b: any) => (a.branchName || '').localeCompare(b.branchName || ''))

  const currentCityDisplay = currentCities.length > 0 ? currentCities.join(', ') : 'Nearby Locations'
  const firstSpecialtyName = branch.specialization?.[0]?.name || 'N/A'

  return (
    <div className={`min-h-screen bg-white ${inter.variable} font-light`}>
      <section className="relative w-full h-[70vh] bg-gray-50">
        {heroImage && (
          <img
            src={heroImage}
            alt={`${branch.branchName} - ${hospital.hospitalName}`}
            className="object-cover w-full h-full"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            onError={(e) => { e.currentTarget.style.display = "none" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        {branch.accreditation?.length > 0 && (
          <div className="absolute top-0 right-0 p-8 z-10">
            <div className="flex items-center gap-1">
              {branch.accreditation.slice(0, 1).map((acc: any) => {
                const accreditationImage = getWixImageUrl(acc.image)
                return accreditationImage ? (
                  <img
                    key={acc._id}
                    src={accreditationImage}
                    alt={`${acc.title} accreditation badge`}
                    width={40}
                    height={40}
                    className="object-contain rounded-full"
                    onError={(e) => { e.currentTarget.style.display = "none" }}
                  />
                ) : null
              })}
            </div>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 z-10 pb-12 text-white">
          <div className="container mx-auto px-6 space-y-3">
            <div className="flex gap-x-4 items-center">
              {hospitalLogo && (
                <div className="relative w-16 h-16 bg-white rounded-full p-2 shadow-lg flex-shrink-0">
                  <img
                    src={hospitalLogo}
                    alt={`${hospital.hospitalName} logo`}
                    className="object-contain rounded-full w-full h-full"
                    onError={(e) => { e.currentTarget.style.display = "none" }}
                  />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl md::text-4xl font-medium text-white mb-1 leading-tight">{branch.branchName}</h1>
                <div className="flex flex-wrap gap-x-2 mt-0 text-lg text-white/80">
                  {branch.specialization?.slice(0, 3).map((spec: any) => <span key={spec._id}>{spec.name} Speciality</span>)}
                  {branch.specialization?.length > 3 && <span className="text-white/60">+{branch.specialization.length - 3} more</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap ml-5 gap-3 mt-2">
              {branch.address && (
                <span className="flex items-center gap-2 text-sm text-white/90">
                  <MapPin className="w-4 h-4" />
                  {branch.address}
                </span>
              )}
              {branch.emergencyContact && (
                <span className="flex items-center gap-2 text-sm text-red-300">
                  <Phone className="w-4 h-4" />
                  Emergency: {branch.emergencyContact}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <Breadcrumb hospitalName={hospital.hospitalName} branchName={branch.branchName} hospitalSlug={hospitalSlug} />

      <section className="py-10 relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-8">
            <main className="lg:col-span-9 space-y-4">
              <div className={`bg-gray-50 p-4 rounded-xs shadow-xs border border-gray-100 ${inter.variable} font-light`}>
                <h2 className="text-2xl md:text-xl font-medium text-gray-900 tracking-tight flex items-center  mb-3">Quick Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={Calendar} value={hospital.yearEstablished || 'N/A'} label="Established" showPlus={false} />
                  <StatCard icon={Heart} value={firstSpecialtyName} label="Specialty" showPlus={false} />
                  <StatCard icon={Bed} value={branch.totalBeds || 'N/A'} label="Beds" showPlus={true} />
                  <StatCard icon={Users} value={branch.noOfDoctors || 'N/A'} label=" Doctors" showPlus={true} />


                </div>
              </div>

              {branch.description && (
                <section className={`bg-gray-50 p-4 rounded-xs shadow-xs border border-gray-100 ${inter.variable} font-light`}>
                  <h2 className="text-2xl md:text-xl font-medium text-gray-900 tracking-tight flex items-center mb-2">About {branch.branchName}</h2>
                  {renderRichText(branch.description)}
                  {/* UPDATED: Added dynamic Link with hospitalSlug */}
                  <div className="mt-1">
                    <Link href={`/search/${hospitalSlug}`} className="border-b border-gray-600 text-gray-700 hover:text-gray-900 transition-colors">
                      Read about the {hospital.hospitalName}
                    </Link>
                  </div>
                </section>
              )}

              {/* UPDATED: Use sortedFacilities array */}
              {sortedFacilities.length > 0 && (
                <section className={`bg-gray-50 p-4 rounded-xs shadow-xs border border-gray-100 ${inter.variable} font-light`}>
                  <h2 className="text-2xl md:text-3xl font-medium text-gray-900 tracking-tight mb-8 flex items-center gap-3">
                    <Building2 className="w-7 h-7" />
                    Key Facilities
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {sortedFacilities.map((fac: any) => (
                      <div key={fac._id || Math.random()} className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xs">
                        <Hospital className="w-5 h-5 text-gray-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700 font-light">{fac.name}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
  {allTreatments.length > 0 && <TreatmentsList treatments={allTreatments} />}
              {branch.doctors?.length > 0 && <DoctorsList doctors={branch.doctors} />}
              {/* NOW USES allTreatments (flattened and extracted) which addresses the original nested structure issue */}
            
              <SimilarBranchesList
                branches={similarBranches} // Filtered for slider display (already sorted A-Z)
                allBranchesForSearch={allHospitalBranches} // Full list for search dropdown (now sorted A-Z)
                currentCityDisplay={currentCities.length > 0 ? currentCities.join(', ') : 'Nearby Locations'}
              />
            </main>

            <aside className="lg:col-span-3 space-y-8">

              <ContactForm />
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}