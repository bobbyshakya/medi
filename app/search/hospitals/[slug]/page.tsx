"use client"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import Image from "next/image"
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
  HeartPulse,
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
  DollarSign,
  CheckCircle
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import classNames from "classnames"
import ContactForm from "@/components/ContactForm"
import { Inter } from "next/font/google"
import useEmblaCarousel, { EmblaOptionsType } from 'embla-carousel-react'

const inter = Inter({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  variable: "--font-inter"
})

// Constants
const EMBLA_CLASSES = {
  container: "embla__container flex touch-pan-y ml-[-1rem]",
  slide: "embla__slide flex-[0_0_auto] min-w-0 pl-4",
  viewport: "overflow-hidden"
}

const EMBLA_SLIDE_SIZES = {
  xs: "w-full",
  sm: "sm:w-1/2",
  lg: "lg:w-1/3",
}

// Helpers
const getWixImageUrl = (imageStr: string | null | undefined): string | null => {
  if (!imageStr || typeof imageStr !== "string" || !imageStr.startsWith("wix:image://v1/")) return null
  const parts = imageStr.split("/")
  return parts.length >= 4 ? `https://static.wixstatic.com/media/${parts[3]}` : null
}

const getHospitalImage = (imageData: any): string | null => getWixImageUrl(imageData)
const getBranchImage = (imageData: any): string | null => getWixImageUrl(imageData)
const getHospitalLogo = (imageData: any): string | null => getWixImageUrl(imageData)
const getDoctorImage = (imageData: any): string | null => getWixImageUrl(imageData)
const getTreatmentImage = (imageData: any): string | null => getWixImageUrl(imageData)

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

const generateSlug = (name: string | null | undefined): string => {
  if (!name || typeof name !== 'string') return ''
  return name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
}

/**
 * UPDATED: MarqueeHeading
 * Implements an infinite scroll using a CSS keyframe animation.
 * The scroll only activates when isHovered is true and text overflows.
 */
const MarqueeHeading = ({
  children,
  className = "",
  isHovered = false,
}: {
  children: React.ReactNode
  className?: string
  isHovered?: boolean
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldScroll, setShouldScroll] = useState(false)
  const [scrollWidth, setScrollWidth] = useState(0)

  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth
      const contentWidth = containerRef.current.scrollWidth
      if (contentWidth > containerWidth) {
        setShouldScroll(true)
        setScrollWidth(contentWidth)
      } else {
        setShouldScroll(false)
      }
    }
  }, [children])

  // Calculate duration based on text length to keep speed consistent
  const duration = Math.max(scrollWidth / 30, 5) 

  return (
    <div
      ref={containerRef}
      className={classNames(
        "relative overflow-hidden whitespace-nowrap select-none",
        className
      )}
      style={{
        maskImage: shouldScroll && isHovered ? 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)' : 'none',
        WebkitMaskImage: shouldScroll && isHovered ? 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)' : 'none',
      }}
    >
      <style jsx>{`
        @keyframes marqueeInfinite {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-scroll {
          display: inline-flex;
          animation: marqueeInfinite ${duration}s linear infinite;
        }
      `}</style>

      {/* Ghost element to maintain height and show static text when not hovered */}
      <div className={classNames("transition-opacity duration-300", isHovered && shouldScroll ? "opacity-0" : "opacity-100")}>
        {children}
      </div>

      {/* Actual scrolling layer */}
      {shouldScroll && (
        <div
          className={classNames(
            "absolute top-0 left-0 h-full flex items-center pointer-events-none transition-opacity duration-300",
            isHovered ? "opacity-100 animate-scroll" : "opacity-0"
          )}
        >
          <span className="pr-12">{children}</span>
          <span className="pr-12">{children}</span>
        </div>
      )}
    </div>
  )
}


// Components
const RichTextDisplay = ({ htmlContent, className = "" }: { htmlContent: string; className?: string }) => {
  const modifiedHtml = useMemo(() => {
    const iconSvgHtml = `<span style="display: inline-flex; align-items: flex-start; margin-right: 3px; flex-shrink: 0; min-width: 1.25rem; height: 1.25rem;">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5" style="color:#74BF44; width: 1rem; margin-top: 5px; height: 1rem;">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>
      </svg></span>`

    const liContentWrapperStart = `<div style="display: flex; align-items: flex-start;">${iconSvgHtml}<span style="flex: 1;">`
    const liContentWrapperEnd = `</span></div>`

    let transformedHtml = htmlContent.replace(
      /(<ul>.*?)(<li([^>]*)>)(.*?)(<\/li>)/gs,
      (match, ulStart, liOpenTag, liAttrs, liContent, liCloseTag) => {
        const trimmedContent = liContent.trim()
        if (trimmedContent.length > 0 && !trimmedContent.includes(iconSvgHtml)) {
          return ulStart + liOpenTag + liContentWrapperStart + trimmedContent + liContentWrapperEnd + liCloseTag
        }
        return match
      }
    )

    transformedHtml = transformedHtml.replace(/<li([^>]*)>(.*?)<\/li>/gs, (match, liAttrs, liContent) => {
      const trimmedContent = liContent.trim()
      if (trimmedContent.length > 0 && !trimmedContent.includes(iconSvgHtml)) {
        return `<li${liAttrs}>${liContentWrapperStart}${trimmedContent}${liContentWrapperEnd}</li>`
      }
      return match
    })

    return transformedHtml
  }, [htmlContent])

  const typographyClasses = `prose max-w-none text-gray-700 leading-relaxed 
    prose-h1:text-3xl prose-h1:font-extrabold prose-h1:mt-8 prose-h1:mb-4 prose-h1:text-gray-900
    prose-h2:text-2xl prose-h2:font-extrabold prose-h2:mt-7 prose-h2:mb-4 prose-h2:text-gray-900
    prose-h3:text-xl prose-h3:font-bold prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-gray-800
    prose-h4:text-lg prose-h4:font-semibold prose-h4:mt-5 prose-h4:mb-2 prose-h4:text-gray-800
    prose-p:font-sans prose-p:mt-3 prose-p:mb-3 prose-p:text-base prose-p:text-gray-700
    prose-li:font-sans prose-li:mt-3 prose-li:mb-3 prose-li:text-base prose-li:text-gray-700
    prose-li:list-none prose-li:ml-0 prose-li:pl-0
    prose-ul:mt-4 prose-ul:mb-4 prose-ul:list-none prose-ul:ml-0 prose-ul:pl-0
    prose-ol:mt-3 prose-ol:mb-3 prose-ol:list-decimal
    prose-a:text-blue-600 prose-a:font-medium prose-a:underline hover:prose-a:text-blue-800
    prose-strong:font-bold prose-strong:text-gray-900`

  return (
    <div
      className={`${typographyClasses} ${className}`}
      dangerouslySetInnerHTML={{ __html: modifiedHtml }}
    />
  )
}

const Breadcrumb = ({ hospitalName, branchName, hospitalSlug }: { hospitalName: string; branchName: string; hospitalSlug: string }) => (
  <nav className={`bg-gray-100 border-b border-gray-100 py-4 ${inter.variable} font-light`}>
    <div className="container mx-auto px-6">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/" className="flex items-center gap-1 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400/50 rounded-xs">
          <Home className="w-4 h-4" /> Home
        </Link>
        <span>/</span>
        <Link href="/search" className="flex items-center hover:text-gray-700 transition-colors">Hospitals</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{branchName}</span>
      </div>
    </div>
  </nav>
)

const StatCard = ({ icon: Icon, value, label, showPlus = true }: { icon: any; value: string | number; label: string; showPlus?: boolean }) => (
  <div className={`text-center p-4 bg-white rounded-xs border border-gray-100 shadow-xs hover:shadow-sm transition-all duration-300 ${inter.variable} font-light flex flex-col items-center justify-center`}>
    <Icon className="w-8 h-8 text-gray-800 mb-3 flex-shrink-0" />
    <p className="text-lg font-medium text-gray-800 mb-1 leading-tight">{value}{showPlus && '+'}</p>
    <p className="text-lg font-medium text-gray-800 leading-snug">{label}</p>
  </div>
)

const BranchCard = ({ data }: { data: any }) => {
  const [isHovered, setIsHovered] = useState(false)
  const { branchName, city, specialization, noOfDoctors, totalBeds, hospitalName, yearEstablished, branchImage, accreditation, logo } = data
  const firstCity = city?.[0]?.cityName || 'N/A'
  const firstSpeciality = specialization?.[0]?.name || 'Multi Speciality'
  const fullSlug = generateSlug(branchName)
  const hospitalImg = getHospitalImage(branchImage)
  const hospitalLogo = getHospitalLogo(logo)
  const accImage = accreditation?.[0] ? getWixImageUrl(accreditation[0].image) : null

  return (
    <Link 
      href={`/search/hospitals/${fullSlug}`} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group block h-full focus:outline-none focus:ring-2 focus:ring-gray-400/50 border border-gray-200 md:border-gray-100 rounded-xs shadow-lg md:shadow-xs bg-white hover:shadow-sm transition-shadow relative flex flex-col overflow-hidden"
    >
      <div className="relative w-full h-72 md:h-48 bg-gray-50">
        {hospitalImg ? (
          <img src={hospitalImg} alt={`${hospitalName} ${branchName} facility`} className="object-cover w-full h-full" onError={(e) => { e.currentTarget.style.display = "none" }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Hospital className="w-12 h-12 text-gray-300" /></div>
        )}
        {accImage && (
          <div className="absolute top-4 right-4 z-10">
            <img src={accImage} alt="Accreditation badge" className="w-7 h-7 object-contain rounded-full shadow-lg" onError={(e) => { e.currentTarget.style.display = "none" }} />
          </div>
        )}
        {hospitalLogo && (
          <div className="absolute bottom-2 left-2 z-10">
            <img src={hospitalLogo} alt={`${hospitalName} logo`} className="w-12 h-auto object-contain" onError={(e) => { e.currentTarget.style.display = "none" }} />
          </div>
        )}
      </div>
      <div className={`p-3 md:flex-1 flex flex-col justify-between ${inter.variable} font-light`}>
        <div className="mb-1 overflow-hidden">
          <MarqueeHeading isHovered={isHovered}>
            <h3 className="text-2xl md:text-lg font-medium text-gray-900 leading-tight">
              {branchName}
            </h3>
          </MarqueeHeading>
        </div>
        <div className="mb-2">
          <p className="text-lg md:text-sm text-gray-600 line-clamp-1">{`${firstCity}, ${firstSpeciality} Speciality`}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-gray-50 rounded-xs border border-gray-100">
            <p className="md:text-sm text-base font-medium text-gray-700">{yearEstablished || 'N/A'}</p>
            <p className="md:text-sm text-base text-gray-700">Estd.</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-xs border border-gray-100">
            <p className="md:text-sm text-base font-medium text-gray-700">{totalBeds || 0}+</p>
            <p className="md:text-sm text-base text-gray-700">Beds</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-xs border border-gray-100">
            <p className="md:text-sm text-base font-medium text-gray-700">{noOfDoctors || 0}+</p>
            <p className="md:text-sm text-base text-gray-700">Doctors</p>
          </div>
        </div>
      </div>
    </Link>
  )
}

const DoctorCard = ({ doctor }: { doctor: any }) => {
  const [isHovered, setIsHovered] = useState(false)
  const doctorImage = getDoctorImage(doctor.profileImage)
  const specializationDisplay = useMemo(() => {
    const getSpecializationName = (s: any): string => {
      if (typeof s === "object" && s !== null) return s.name || s.title || ""
      return String(s)
    }
    const specializationArray = (Array.isArray(doctor.specialization) ? doctor.specialization : [doctor.specialization])
      .map(getSpecializationName)
      .filter(Boolean)
    if (specializationArray.length === 0) return "General Practitioner"
    const primary = specializationArray[0]
    const remainingCount = specializationArray.length - 1
    return remainingCount > 0 ? `${primary} +${remainingCount} Specialties` : primary
  }, [doctor.specialization])
  const doctorSlug = generateSlug(doctor.doctorName)

  return (
    <Link 
      href={`/doctors/${doctorSlug}`} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex flex-col h-full bg-white border md:border-gray-100 border-gray-200 rounded-xs shadow-lg md:shadow-sm hover:shadow-md overflow-hidden transition-all focus:outline-none focus:ring-2 focus:ring-gray-400/50"
    >
      <div className="relative h-72 md:h-60 overflow-hidden bg-gray-50 rounded-t-lg">
        {doctorImage ? (
          <img src={doctorImage} alt={`${doctor.doctorName}, ${specializationDisplay}`} className="object-cover group-hover:scale-105 transition-transform duration-300 w-full h-full" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} onError={(e) => { e.currentTarget.style.display = "none" }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100"><Stethoscope className="w-12 h-12 text-gray-300" /></div>
        )}
      </div>
      <div className={`p-3 flex-1 flex flex-col ${inter.variable} font-light`}>
        <div className="overflow-hidden mb-1">
          <MarqueeHeading isHovered={isHovered}>
            <h3 className="text-2xl md:text-lg font-medium text-gray-900 leading-tight">
              {doctor.doctorName}
            </h3>
          </MarqueeHeading>
        </div>
        <div className="gap-1">
          <p className="text-gray-700 text-base md:text-sm flex items-center line-clamp-1">{specializationDisplay}</p>
          {doctor.experienceYears && <p className="text-gray-700 text-base md:text-sm flex items-center line-clamp-1">{doctor.experienceYears} years of exp</p>}
        </div>
      </div>
    </Link>
  )
}

const TreatmentCard = ({ item }: { item: any }) => {
  const [isHovered, setIsHovered] = useState(false)
  const treatmentImage = getTreatmentImage(item.treatmentImage || item.image)
  const itemName = item.name || item.title || 'N/A Treatment'
  const itemSlug = generateSlug(itemName)

  return (
    <Link 
      href={`/treatment/${itemSlug}`} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex flex-col h-full bg-white border md:border-gray-100 border-gray-200 rounded-xs shadow-lg md:shadow-sm hover:shadow-md overflow-hidden transition-all focus:outline-none focus:ring-2 focus:ring-gray-400/50"
    >
      <div className="relative h-72 md:h-48 overflow-hidden bg-gray-50 rounded-t-lg">
        {treatmentImage ? (
          <img src={treatmentImage} alt={`${itemName} treatment`} className="object-cover group-hover:scale-105 transition-transform duration-300 w-full h-full" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} onError={(e) => { e.currentTarget.style.display = "none" }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100"><Scissors className="w-12 h-12 text-gray-300" /></div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col font-light">
        <div className="overflow-hidden">
          <MarqueeHeading isHovered={isHovered}>
            <h3 className="text-2xl md:text-lg font-medium text-gray-900 leading-tight">
              {itemName}
            </h3>
          </MarqueeHeading>
        </div>
      </div>
    </Link>
  )
}

const SearchDropdown = ({ value, onChange, placeholder, options, onOptionSelect, onClear, type }: {
  value: string; onChange: (value: string) => void; placeholder: string; options: { id: string; name: string }[]; onOptionSelect: (id: string) => void; onClear: () => void; type: string
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const filteredOptions = useMemo(() => !value ? options : options.filter(option => option.name.toLowerCase().includes(value.toLowerCase())), [value, options])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={dropdownRef} className="relative space-y-2">
      <div className="relative">
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setIsOpen(true)} placeholder={placeholder} className="w-full pl-4 pr-4 py-2 border border-gray-200 text-sm rounded-xs focus:outline-none focus:ring-1 focus:ring-gray-400/50 bg-white text-gray-900 placeholder-gray-500 shadow-sm" />
        {value && <button onClick={onClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"><X className="w-3 h-3" /></button>}
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-40 w-full bg-white border border-gray-200 rounded-xs shadow-lg max-h-48 overflow-y-auto">
          {filteredOptions.map((option) => (
            <button key={option.id} onClick={() => { onOptionSelect(option.id); setIsOpen(false) }} className="w-full text-left px-4 border-b border-gray-200 py-2 text-sm transition-colors text-gray-700 hover:bg-gray-50">
              {option.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const CarouselSection = ({ title, items, type, searchPlaceholder, onSearchSelect, renderItem }: {
  title: string; items: any[]; type: 'doctor' | 'treatment'; searchPlaceholder: string; onSearchSelect: (id: string) => void; renderItem: (item: any) => React.ReactNode
}) => {
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

  const searchOptions = useMemo(() => items.map(item => ({
    id: item._id,
    name: type === 'doctor' ? `${item.doctorName} - ${item.specialization?.[0]?.name || 'General Practitioner'}` : `${item.name || item.title} (${item.specialistName || 'Treatment'})`
  })), [items, type])

  const filteredItems = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase()
    return items.filter(item => 
      (item.doctorName || item.name || item.title || '').toLowerCase().includes(lowerSearch) ||
      (item.specialistName || '').toLowerCase().includes(lowerSearch)
    ).sort((a, b) => (a.doctorName || a.name || a.title || '').localeCompare(b.doctorName || b.name || b.title || ''))
  }, [items, searchTerm])

  if (!items.length) return (
    <div className={`bg-gray-50 md:p-4 p-2 rounded-xs shadow-xs border border-gray-100 text-center ${inter.variable} font-light`}>
      {type === 'doctor' ? <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" /> : <Scissors className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
      <p className="text-gray-500 text-sm">No {type}s available at this branch</p>
    </div>
  )

  return (
    <section className={`bg-gray-50 rounded-xs shadow-xs border border-gray-100 ${inter.variable} font-light`}>
      <div className="md:px-4 px-2 pt-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3">
          <h2 className="text-2xl md:text-xl font-medium text-gray-900 tracking-tight flex items-center mt-2">{title}</h2>
          <div className="relative w-full md:w-80">
            <SearchDropdown value={searchTerm} onChange={setSearchTerm} placeholder={searchPlaceholder} options={searchOptions} onOptionSelect={onSearchSelect} onClear={() => setSearchTerm("")} type={type} />
          </div>
        </div>
      </div>
      <div className="relative px-2 md:px-4 pb-8">
        <div className={EMBLA_CLASSES.viewport} ref={emblaRef}>
          <div className={EMBLA_CLASSES.container}>
            {filteredItems.map((item) => (
              <div key={item._id} className={classNames(EMBLA_CLASSES.slide, EMBLA_SLIDE_SIZES.xs, EMBLA_SLIDE_SIZES.sm, EMBLA_SLIDE_SIZES.lg)}>
                {renderItem(item)}
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className="pl-4 py-8 text-center w-full min-h-40 flex flex-col items-center justify-center">
                <X className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-gray-500">No {type}s found matching "{searchTerm}".</p>
              </div>
            )}
          </div>
        </div>
        {filteredItems.length > 3 && (
          <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between pointer-events-none px-2 md:px-0">
            <button onClick={scrollPrev} disabled={prevBtnDisabled} className={classNames("p-3 rounded-full bg-white shadow-lg transition-opacity duration-200 pointer-events-auto disabled:opacity-40 disabled:cursor-not-allowed ml-[-1rem]")} aria-label={`Previous ${type}`}>
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button onClick={scrollNext} disabled={nextBtnDisabled} className={classNames("p-3 rounded-full bg-white shadow-lg transition-opacity duration-200 pointer-events-auto disabled:opacity-40 disabled:cursor-not-allowed mr-[-1rem]")} aria-label={`Next ${type}`}>
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

const SimilarHospitalsSection = ({ branches, allBranches, cityName }: { branches: any[]; allBranches: any[]; cityName: string }) => {
  const router = useRouter()
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

  const searchOptions = useMemo(() => allBranches.map(branch => ({
    id: branch._id,
    name: `${branch.branchName}${branch.city?.[0]?.cityName ? ` (${branch.city[0].cityName})` : ''}`
  })), [allBranches])

  const handleSelect = useCallback((id: string) => {
    const branch = allBranches.find(b => b._id === id)
    if (branch) {
      setSearchTerm("")
      router.push(`/search/hospitals/${generateSlug(branch.branchName)}`)
    }
  }, [allBranches, router])

  return (
    <section className={`bg-gray-50 rounded-xs shadow-xs border border-gray-100 ${inter.variable} font-light`}>
      <div className="px-2 md:px-4 py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-0">
          <h2 className="text-2xl md:text-xl font-medium mt-2 text-gray-900 tracking-tight flex items-center">
            Similar Hospitals in {cityName}
          </h2>
          <div className="relative w-full md:w-80">
            <SearchDropdown value={searchTerm} onChange={setSearchTerm} placeholder="Search hospital by name and city" options={searchOptions} onOptionSelect={handleSelect} onClear={() => setSearchTerm("")} type="branch" />
          </div>
        </div>
      </div>
      {branches.length > 0 ? (
        <div className="relative px-2 md:px-4 pb-8">
          <div className={EMBLA_CLASSES.viewport} ref={emblaRef}>
            <div className={EMBLA_CLASSES.container}>
              {branches.map(branch => (
                <div key={branch._id} className={classNames(EMBLA_CLASSES.slide, EMBLA_SLIDE_SIZES.xs, EMBLA_SLIDE_SIZES.sm, EMBLA_SLIDE_SIZES.lg)}>
                  <BranchCard data={branch} />
                </div>
              ))}
            </div>
          </div>
          {branches.length > 3 && (
            <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between pointer-events-none px-2 md:px-0">
              <button onClick={scrollPrev} disabled={prevBtnDisabled} className={classNames("p-3 rounded-full bg-white shadow-lg transition-opacity duration-200 pointer-events-auto disabled:opacity-40 disabled:cursor-not-allowed ml-[-1rem]")} aria-label="Previous hospital">
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button onClick={scrollNext} disabled={nextBtnDisabled} className={classNames("p-3 rounded-full bg-white shadow-lg transition-opacity duration-200 pointer-events-auto disabled:opacity-40 disabled:cursor-not-allowed mr-[-1rem]")} aria-label="Next hospital">
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 pt-0">
          <p className="text-gray-500 text-sm italic">No similar hospitals found in {cityName}. Use the search above to find all hospital branches.</p>
        </div>
      )}
    </section>
  )
}

const extractUniqueTreatments = (branch: any): any[] => {
  if (!branch?.specialists) return []
  const uniqueTreatments = {} as { [key: string]: any }
  branch.specialists.forEach((specialist: any) => {
    const specialistName = specialist.name || 'Unknown Specialist'
    specialist.treatments?.forEach((treatment: any) => {
      const key = treatment._id || `${treatment.name || 'n/a'}-${specialistName}`
      if (!uniqueTreatments[key]) {
        uniqueTreatments[key] = { ...treatment, specialistName, _id: treatment._id || key }
      }
    })
  })
  return Object.values(uniqueTreatments)
}

export default function BranchDetail({ params }: { params: Promise<{ slug: string }> }) {
  const [branch, setBranch] = useState<any>(null)
  const [hospital, setHospital] = useState<any>(null)
  const [allHospitals, setAllHospitals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchBranchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const resolvedParams = await params
        const branchSlug = resolvedParams.slug
        const res = await fetch(`/api/hospitals/${branchSlug}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError("Branch not found. The URL might be incorrect or the branch does not exist.")
          } else {
            throw new Error("Failed to fetch hospital data")
          }
          return
        }
        const hospitalData = await res.json()

        // Find the branch within this hospital
        let foundBranch = null
        if (hospitalData.branches?.length > 0) {
          foundBranch = hospitalData.branches.find((b: any) => {
            if (!b?.branchName) return false
            const expectedBranchSlug = generateSlug(b.branchName)
            return expectedBranchSlug === branchSlug || b.branchName.toLowerCase().includes(branchSlug.replace(/-/g, ' '))
          })
        }

        if (!foundBranch && hospitalData.branches?.length === 1) {
          // If only one branch, use it (for standalone hospitals)
          foundBranch = hospitalData.branches[0]
        }

        setHospital(hospitalData)
        setBranch(foundBranch)
        setAllHospitals([hospitalData]) // For similar hospitals logic

        if (!foundBranch) setError("Branch not found within the hospital.")
      } catch (e) {
        setError(e instanceof Error ? e.message : "An unknown error occurred while fetching branch details")
      } finally {
        setLoading(false)
      }
    }
    fetchBranchData()
  }, [params])

  const allTreatments = useMemo(() => branch ? extractUniqueTreatments(branch) : [], [branch])
  const sortedFacilities = useMemo(() => {
    if (!branch?.facilities || !Array.isArray(branch.facilities)) return []
    return [...branch.facilities].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }, [branch?.facilities])
  const currentCity = branch?.city?.[0]?.cityName || null

  // For similar branches, since we only have one hospital now, we'll fetch additional data
  const [similarBranches, setSimilarBranches] = useState<any[]>([])
  const [allHospitalBranches, setAllHospitalBranches] = useState<any[]>([])

  useEffect(() => {
    if (currentCity && branch) {
      // Fetch similar branches from the same city
      fetch(`/api/hospitals?city=${encodeURIComponent(currentCity)}&minimal=true&pageSize=50`)
        .then(res => res.json())
        .then(data => {
          if (data.items) {
            const similar = data.items
              .filter((h: any) => h._id !== hospital?._id) // Exclude current hospital
              .flatMap((h: any) => (h.branches || []).map((b: any) => ({ ...b, hospitalName: h.hospitalName, yearEstablished: h.yearEstablished, logo: h.logo, accreditation: b.accreditation || h.accreditation })))
              .filter((b: any) => b.city?.some((c: any) => c?.cityName === currentCity) && b._id !== branch._id)
              .sort((a: any, b: any) => (a.branchName || '').localeCompare(b.branchName || ''))
            setSimilarBranches(similar.slice(0, 10)) // Limit to 10 for performance
            setSimilarBranches(similar.slice(0, 10)) // Limit to 10 for performance
          }
        })
        .catch(err => console.warn('Failed to fetch similar branches:', err))
    }
  }, [currentCity, branch, hospital?._id])

  useEffect(() => {
    if (currentCity) {
      // Fetch all branches for search dropdown
      fetch(`/api/hospitals?city=${encodeURIComponent(currentCity)}&minimal=true&pageSize=100`)
        .then(res => res.json())
        .then(data => {
          if (data.items) {
            const allBranches = data.items
              .flatMap((h: any) => (h.branches || []).map((b: any) => ({
                ...b,
                hospitalName: h.hospitalName,
                yearEstablished: h.yearEstablished,
                logo: h.logo,
                accreditation: b.accreditation || h.accreditation
              })))
              .filter((b: any) => b?.branchName)
              .sort((a: any, b: any) => (a.branchName || '').localeCompare(b.branchName || ''))
            setAllHospitalBranches(allBranches)
          }
        })
        .catch(err => console.warn('Failed to fetch all branches:', err))
    }
  }, [currentCity])

  const handleDoctorSelect = useCallback((id: string) => {
    const doctor = branch?.doctors?.find((d: any) => d._id === id)
    if (doctor) router.push(`/doctors/${generateSlug(doctor.doctorName)}`)
  }, [branch?.doctors, router])

  const handleTreatmentSelect = useCallback((id: string) => {
    const treatment = allTreatments.find(t => t._id === id)
    if (treatment) router.push(`/treatment/${generateSlug(treatment.name || treatment.title)}`)
  }, [allTreatments, router])

  // ALL HOOKS MUST BE BEFORE EARLY RETURNS
  const accreditationImages = useMemo(() => {
    const images = []
    if (branch?.accreditation?.length > 0) {
      images.push(...branch.accreditation.map((acc: any) => ({
        image: getWixImageUrl(acc.image),
        title: acc.title,
        _id: acc._id
      })).filter(acc => acc.image))
    }
    if (hospital?.accreditation?.length > 0) {
      images.push(...hospital.accreditation.map((acc: any) => ({
        image: getWixImageUrl(acc.image),
        title: acc.title,
        _id: acc._id
      })).filter(acc => acc.image))
    }
    return images
  }, [branch?.accreditation, hospital?.accreditation])

  if (loading) return <LoadingState />
  if (error || !branch || !hospital) return <ErrorState error={error} />

  const branchImage = getBranchImage(branch.branchImage)
  const hospitalImage = getHospitalImage(hospital.hospitalImage)
  const heroImage = branchImage || hospitalImage
  const hospitalLogo = getHospitalLogo(hospital.logo)
  const hospitalSlug = generateSlug(hospital.hospitalName)
  const firstSpecialityName = branch.specialization?.[0]?.name || 'N/A'

  return (
    <div className={`min-h-screen bg-white ${inter.variable} font-light`}>
      <HeroSection 
        heroImage={heroImage} 
        branch={branch} 
        hospital={hospital} 
        hospitalLogo={hospitalLogo}
        accreditationImages={accreditationImages}
      />
      <Breadcrumb hospitalName={hospital.hospitalName} branchName={branch.branchName} hospitalSlug={hospitalSlug} />
      <main className="py-10 w-full relative z-10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="md:grid lg:grid-cols-12 gap-4 md:gap-8">
            <div className="lg:col-span-9 space-y-4">
              <OverviewSection branch={branch} firstSpecialityName={firstSpecialityName} />
              {branch.description && <AboutSection description={branch.description} hospitalName={hospital.hospitalName} hospitalSlug={hospitalSlug} />}
              {sortedFacilities.length > 0 && <FacilitiesSection facilities={sortedFacilities} />}
              {allTreatments.length > 0 && <CarouselSection title="Available Treatments" items={allTreatments} type="treatment" searchPlaceholder="Search treatments by name or specialist..." onSearchSelect={handleTreatmentSelect} renderItem={(item) => <TreatmentCard item={item} />} />}
              {branch.doctors?.length > 0 && <CarouselSection title="Our Specialist Doctors" items={branch.doctors} type="doctor" searchPlaceholder="Search doctors by name or Speciality..." onSearchSelect={handleDoctorSelect} renderItem={(doctor) => <DoctorCard doctor={doctor} />} />}
              <SimilarHospitalsSection branches={similarBranches} allBranches={allHospitalBranches} cityName={currentCity || 'Nearby Locations'} />
            </div>
            <aside className="lg:col-span-3 space-y-8"><ContactForm /></aside>
          </div>
        </div>
      </main>
    </div>
  )
}

const HeroSection = ({ heroImage, branch, hospital, hospitalLogo, accreditationImages }: any) => (
  <section className="relative w-full h-[50vh] md:h-[80vh] bg-gray-50">
    {heroImage && <img src={heroImage} alt={`${branch.branchName} - ${hospital.hospitalName}`} className="object-cover object-center w-full h-full" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} onError={(e) => { e.currentTarget.style.display = "none" }} />}
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
    
    {accreditationImages.length > 0 && (
      <div className="absolute top-0 left-0 right-0 z-10 p-4 md:p-8">
        <div className="flex flex-wrap justify-end gap-3">
          {accreditationImages.map((acc: any) => (
            acc.image && (
              <div 
                key={acc._id} 
                className="relative group"
                title={acc.title || "Accreditation"}
              >
                <img
                  src={acc.image}
                  alt={`${acc.title || ''} accreditation badge`}
                  className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-full bg-white/90 backdrop-blur-sm p-0 shadow-lg transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => { e.currentTarget.style.display = "none" }}
                />
                {acc.title && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    {acc.title}
                  </div>
                )}
              </div>
            )
          ))}
        </div>
      </div>
    )}
    
    <div className="absolute bottom-0 left-0 right-0 z-10 md:pb-12 pb-5 text-white">
      <div className="container mx-auto md:px-6 space-y-3">
        <div className="md:flex md:gap-x-4 items-center">
          {hospitalLogo && (
            <div className="relative w-16 h-auto md:h-16 bg-white md:rounded-full p-2 shadow-lg flex-shrink-0">
              <img src={hospitalLogo} alt={`${hospital.hospitalName} logo`} className="object-contain rounded-full w-full h-full" onError={(e) => { e.currentTarget.style.display = "none" }} />
            </div>
          )}
          <div className="flex-1 mt-3 md:mt-0">
            <h1 className="text-2xl md:text-4xl font-medium text-white mb-1 leading-tight">{branch.branchName}</h1>
            <div className="flex flex-wrap gap-x-2 mt-0 text-lg md:text-white/80">
              {branch.specialization?.slice(0, 3).map((spec: any) => <span key={spec._id}>{spec.name} Speciality</span>)}
              {branch.specialization?.length > 3 && <span className="text-white/60">+{branch.specialization.length - 3} more</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap md:ml-5 gap-3 mt-2">
          {branch.address && (
            <span className="flex items-center gap-2 text-lg md:text-sm md:text-white/90">
              <div className="md:w-4 md:block hidden w-5 h-5 md:h-4"><MapPin className="md:w-4 w-8 h-8 md:h-4" /></div>
              <div className="md:ml-2">{branch.address}</div>
            </span>
          )}
          {branch.emergencyContact && (
            <span className="flex items-center gap-2 text-sm text-red-300">
              <Phone className="w-4 h-4" /> Emergency: {branch.emergencyContact}
            </span>
          )}
        </div>
      </div>
    </div>
  </section>
)

const OverviewSection = ({ branch, firstSpecialityName }: any) => (
  <div className={`bg-gray-50 md:p-4 p-2 rounded-xs shadow-xs border border-gray-100 ${inter.variable} font-light`}>
    <h2 className="text-2xl md:text-xl font-medium text-gray-900 tracking-tight flex items-center mb-3">Quick Overview</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
      <StatCard icon={Calendar} value={branch.yearEstablished || 'N/A'} label="Established" showPlus={false} />
      <StatCard icon={HeartPulse} value={firstSpecialityName} label="Speciality" showPlus={false} />
      <StatCard icon={Bed} value={branch.totalBeds || 'N/A'} label="Beds" showPlus={true} />
      <StatCard icon={Users} value={branch.noOfDoctors || 'N/A'} label="Doctors" showPlus={true} />
    </div>
  </div>
)

const AboutSection = ({ description, hospitalName, hospitalSlug }: any) => (
  <section className={`bg-gray-50 md:p-4 p-2 rounded-xs shadow-xs w-full border border-gray-100 ${inter.variable} font-light`}>
    <RichTextDisplay htmlContent={description.html || description} />
    <div className="mt-1">
      <Link href={`/search/${hospitalSlug}`} className="border-b border-gray-600 text-gray-700 hover:text-gray-900 transition-colors">
        Read about the {hospitalName}
      </Link>
    </div>
  </section>
)

const FacilitiesSection = ({ facilities }: { facilities: any[] }) => (
  <section className={`bg-gray-50 md:p-4 p-2 rounded-xs shadow-xs border border-gray-100 ${inter.variable} font-light`}>
    <h2 className="text-2xl md:text-3xl font-medium text-gray-900 tracking-tight mb-8 flex items-center gap-3">
      <Building2 className="w-7 h-7" /> Key Facilities
    </h2>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {facilities.map((fac: any) => (
        <div key={fac._id || Math.random()} className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xs">
          <Hospital className="w-5 h-5 text-gray-600 flex-shrink-0" />
          <span className="text-sm text-gray-700 font-light">{fac.name}</span>
        </div>
      ))}
    </div>
  </section>
)

const LoadingState = () => (
  <div className={`min-h-screen bg-white ${inter.variable} font-light`}>
    <div className="relative w-full h-[70vh] bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
    </div>
    <Breadcrumb hospitalName="Hospital Name" branchName="Branch Name" hospitalSlug="" />
    <section className="py-16 relative z-10">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-8">
          <main className="lg:col-span-9 space-y-8">
            <div className="bg-white p-6 rounded-xs border border-gray-100 shadow-sm animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-48 mb-4" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-xs" />)}
              </div>
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-50 md:p-4 p-2 rounded-xs shadow-xs border border-gray-100 animate-pulse">
                <div className="h-8 bg-gray-300 rounded w-48 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, j) => <div key={j} className="h-60 bg-gray-200 rounded-xs" />)}
                </div>
              </div>
            ))}
          </main>
          <div className="md:col-span-3"><div className="space-y-6"><div className="bg-white p-6 rounded-xs border border-gray-100 shadow-sm animate-pulse h-96" /></div></div>
        </div>
      </div>
    </section>
  </div>
)

const ErrorState = ({ error }: { error: string | null }) => (
  <div className={`min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 relative ${inter.variable} font-light`}>
    <nav className={`bg-gray-100 border-b border-gray-100 py-4 w-full absolute top-0 ${inter.variable} font-light`}>
      <div className="container mx-auto px-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/" className="flex items-center gap-1 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400/50 rounded-xs">
            <Home className="w-4 h-4" /> Home
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Error</span>
        </div>
      </div>
    </nav>
    <div className="text-center space-y-6 max-w-md p-10 bg-white rounded-xs shadow-xl border border-gray-100">
      <Building2 className="w-16 h-16 text-gray-300 mx-auto" />
      <h2 className="text-2xl md:text-3xl font-medium text-gray-900 leading-tight">Branch Not Found</h2>
      <p className="text-base text-gray-700 leading-relaxed font-light">{error || "The requested branch could not be found. Please check the URL or try searching again."}</p>
      <Link href="/search" className="inline-block w-full bg-gray-700 text-white px-6 py-3 rounded-xs hover:bg-gray-800 transition-all font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400/50">
        Go to Hospitals Search
      </Link>
    </div>
  </div>
)