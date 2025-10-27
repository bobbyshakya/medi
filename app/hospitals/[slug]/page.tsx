// File: app/hospitals/[slug]/page.tsx

"use client"

import { useState, useEffect, useCallback } from "react"
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
} from "lucide-react"
import Link from "next/link"
import useEmblaCarousel from "embla-carousel-react"
import classNames from "classnames"
import ContactForm from "@/components/ContactForm"

// ==============================
// Helper Functions
// ==============================

const getImageUrl = (richContent: any): string | null => {
  if (!richContent?.nodes) return null
  const imageNode = richContent.nodes.find((node: any) => node.type === 'IMAGE')
  return imageNode?.imageData?.image?.src?.id
    ? `https://static.wixstatic.com/media/${imageNode.imageData.image.src.id}`
    : null
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
  <div className="text-center p-6 bg-gray-50 rounded-xs border border-gray-50 shadow-xs  group">
    <div className="w-14 h-14 bg-gray-50 rounded-xs flex items-center justify-center mx-auto mb-4 group-hover:bg-white transition-colors duration-200">
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
  const aboutText = getTextContent(doctor.about)
  const keyPoints = extractKeyPoints(aboutText, 1)
  const languages = doctor.languagesSpoken ? doctor.languagesSpoken.split(',').map(l => l.trim()).slice(0, 2) : []

  return (
    <Link
      href={`/doctors/${doctorSlug}`}
      className="group flex flex-col h-full bg-white border border-gray-100 rounded-xs shadow-xs overflow-hidden "
    >
      {/* Image Section */}
      <div className="relative h-48 bg-gray-50 overflow-hidden">
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
      <div className="flex flex-col flex-1 bg-gray-50 p-4">
        <h5 className="title-text text-base font-semibold text-gray-900 mb-1 line-clamp-1">{doctor.name}</h5>
        <p className="description-1 text-sm text-gray-700">{doctor.specialization}</p>

        {doctor.designation && (
          <p className="description-2 text-xs text-gray-600 font-medium mt-1">{doctor.designation}</p>
        )}

        {keyPoints.length > 0 && (
          <p className="description-2 text-xs text-gray-600 line-clamp-2 mt-auto pt-3 border-t border-gray-50">
            {keyPoints[0]}
          </p>
        )}
      </div>
    </Link>

  )
}

const TreatmentCard = ({ treatment }: { treatment: any }) => {
  const treatmentImage = getImageUrl(treatment.treatmentImage)
  const treatmentSlug = treatment.slug || generateSlug(treatment.name)
  const processedDescription = treatment.description
    ? removeBannersFromDescription(treatment.description)
    : "Comprehensive medical treatment for optimal recovery."
  const keyPoints = extractKeyPoints(processedDescription, 2)

  return (
    <Link href={`/treatment/${treatmentSlug}`} className="group h-full flex flex-col hover:no-underline bg-white rounded-xs border border-gray-100 shadow-xs overflow-hidden ">
      <div className="relative h-48 overflow-hidden bg-gray-50">
        <ImageWithFallback
          src={treatmentImage}
          alt={treatment.name}
          fallbackIcon={Scissors}
          className="group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4 flex-1 flex bg-gray-50 flex-col">
        <h5 className="title-text font-semibold text-gray-900 text-base mb-2 line-clamp-1">{treatment.name}</h5>
        {treatment.category && <p className="description-1 text-gray-700 text-sm mb-3">{treatment.category}</p>}
        <div className="space-y-2 mb-3 flex-1">
          {keyPoints.slice(0, 1).map((point, idx) => (
            <p key={idx} className="description-2 text-gray-600 text-xs line-clamp-2">{point}</p>
          ))}
        </div>
        <div className="mt-auto space-y-1 text-xs text-gray-500">
          {treatment.duration && <p className="flex items-center gap-1"><Clock className="w-3 h-3" /> {treatment.duration}</p>}
          {treatment.cost && <p className="description-1 text-gray-900 font-semibold">From ${treatment.cost}</p>}
        </div>
      </div>
    </Link>
  )
}

const BranchCard = ({ branch, hospitalSlug }: { branch: any; hospitalSlug: string }) => {
  const branchImage = getImageUrl(branch.branchImage) || (typeof branch.branchImage === 'string' ? branch.branchImage : null)
  const branchSlug = generateBranchSlug(hospitalSlug, branch.name)
  const branchDesc = getTextContent(branch.description)
  const keyPoints = extractKeyPoints(branchDesc, 2)

  return (
    <Link href={`/hospitals/branches/${branchSlug}`} className="group block bg-white rounded-xs border border-gray-100 shadow-xs overflow-hidden ">
      <div className="relative w-full h-40 overflow-hidden bg-gray-50">
        <ImageWithFallback
          src={branchImage}
          alt={`${branch.name} facility`}
          fallbackIcon={Building2}
          className="group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4 bg-gray-50">
        <h5 className="title-text font-semibold text-gray-900 text-base mb-2 line-clamp-1">{branch.name}</h5>
        {branch.address && <p className="description-1 text-gray-600 text-sm mb-1 line-clamp-2">{branch.address}</p>}
        {keyPoints.length > 0 && (
          <div className="space-y-1 mb-3">
            {keyPoints.slice(0, 1).map((point, idx) => (
              <p key={idx} className="description-1 text-gray-600 text-sm leading-relaxed line-clamp-2">{point}</p>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2 mb-3">
          {branch.totalBeds && (
            <span className="flex items-center gap-1 bg-gray-50 text-gray-600 px-3 py-1 rounded-xs text-xs border border-gray-200">
              <Bed className="w-3 h-3" />
              {branch.totalBeds} Beds
            </span>
          )}
          {branch.icuBeds && (
            <span className="flex items-center gap-1 bg-gray-50 text-gray-600 px-3 py-1 rounded-xs text-xs border border-gray-200">
              <Clock className="w-3 h-3" />
              {branch.icuBeds} ICU
            </span>
          )}
        </div>
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
      className="group flex flex-col h-full bg-white border border-gray-100 rounded-xs shadow-xs overflow-hidden"
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <ImageWithFallback
          src={hospitalImage}
          alt={hospital.name}
          fallbackIcon={Hospital}
          className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
        />

        {/* Accreditation Badge */}
        {hospital.accreditation && (
          <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-md text-gray-800 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
            {hospital.accreditation}
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
          {hospital.yearEstablished && <p className="description-2 flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Est. {hospital.yearEstablished}</p>}
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
  const visibleSlidesClass = 'w-full sm:w-1/2 lg:w-1/3'

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
      <div className="flex justify-between items-center mb-4">
        <h3 className="heading-sm text-xl font-bold text-gray-900 flex items-center gap-3">
         
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
            <div className="bg-white rounded-xs border border-gray-200 p-8 animate-pulse">
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
      <Link href="/hospitals" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 bg-white px-4 py-3 rounded-xs border border-gray-200 hover:shadow-md">
        <ChevronLeft className="w-5 h-5" />
        Back to Search
      </Link>
    </div>
    <div className="text-center space-y-6 max-w-md p-8 bg-white rounded-xs border border-gray-200">
      <div className="w-16 h-16 bg-gray-100 rounded-xs flex items-center justify-center mx-auto">
        <Hospital className="w-8 h-8 text-gray-400" />
      </div>
      <h2 className="title-text text-2xl font-bold text-gray-900">Hospital Not Found</h2>
      <p className="description-1 text-gray-600 leading-relaxed">
        {error || "The requested hospital could not be found. Please check the URL or try searching again."}
      </p>
      <Link
        href="/hospitals"
        className="inline-block w-full bg-gray-900 text-white px-8 py-3 rounded-xs hover:bg-gray-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
      >
        Go to Hospital Search
      </Link>
    </div>
  </div>
)

// ==============================
// Hero Section Component
// ==============================

const HeroSection = ({ hospital, params }: { hospital: HospitalWithBranchPreview & { city?: string }; params: { slug: string } }) => {
  const hospitalImage = getImageUrl(hospital.image)
  const hospitalLogo = getImageUrl(hospital.logo)

  return (
    <section className="relative w-full h-[70vh]">
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
        <Link href="/hospitals" className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors duration-200 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xs border border-white/20 hover:bg-white/20">
          <ChevronLeft className="w-5 h-5" />
          Back to Search
        </Link>
      </div>

      <div className="absolute bottom-0 left-0 w-full z-10 px-6 pb-12 text-white">
        <div className="container mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {hospital.accreditation && (
                  <span className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold border border-white/30">
                    <Award className="w-4 h-4" />
                    {hospital.accreditation}
                  </span>
                )}
                {hospital.emergencyServices && (
                  <span className="flex items-center gap-2 bg-gray-800/30 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold border border-gray-500/30">
                    <Clock className="w-4 h-4" />
                    24/7 Emergency
                  </span>
                )}
              </div>
              <div className="flex items-start gap-4">
                {hospitalLogo && (
                  <div className="relative w-20 h-20 bg-white rounded-2xl p-3 flex-shrink-0">
                    <Image
                      src={hospitalLogo}
                      alt={`${hospital.name} logo`}
                      fill
                      className="object-contain rounded-lg"
                    />
                  </div>
                )}
                <div>
                  <h1 className="title-text text-4xl md:text-5xl font-bold leading-tight mb-2">
                    {hospital.name}
                  </h1>
                  {hospital.city && (
                    <div className="flex items-center gap-2 text-white/90">
                      <MapPin className="w-5 h-5" />
                      <span className="description-1 text-lg">{hospital.city}</span>
                    </div>
                  )}
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

export default function HospitalDetail({ params }: { params: { slug: string } }) {
  const [hospital, setHospital] = useState<HospitalWithBranchPreview | null>(null)
  const [similarHospitals, setSimilarHospitals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllBranches, setShowAllBranches] = useState(false)

  useEffect(() => {
    const fetchHospitalData = async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/hospitals')
        if (!res.ok) throw new Error("Failed to fetch hospitals")

        const data = await res.json()
        if (!data.items?.length) throw new Error("No hospitals available")

        const matchedHospital = data.items.find((h: HospitalWithBranchPreview) =>
          generateSlug(h.name) === params.slug
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
            (h.city === hospitalCity || h.accreditation === matchedHospital.accreditation)
          )
          .slice(0, 6)

        setSimilarHospitals(similar)

      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load hospital details")
      } finally {
        setLoading(false)
      }
    }

    if (params.slug) {
      fetchHospitalData()
    }
  }, [params.slug])

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

  const visibleBranches = showAllBranches
    ? hospital.branches
    : hospital.branches?.slice(0, 3) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection hospital={hospital} params={params} />
      <BreadcrumbNav hospitalName={hospital.name} />

      <section className="py-12 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-8 pb-12">
            <main className="lg:col-span-8 space-y-8">
              {/* Key Statistics */}
              <section className="bg-white rounded-xs border border-gray-200 p-8">
                <h2 className="heading-sm text-2xl font-bold text-gray-900 mb-4">Hospital Overview</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {hospital.branches?.length > 0 && (
                    <StatCard icon={Building2} value={hospital.branches.length} label="Branches" />
                  )}
                  {(hospital.beds || hospital.noOfBeds) && (
                    <StatCard icon={Bed} value={hospital.beds || hospital.noOfBeds} label="Beds" />
                  )}
                  {hospital.yearEstablished && (
                    <StatCard icon={Calendar} value={hospital.yearEstablished} label="Established" />
                  )}
                  {hospital.accreditation && (
                    <StatCard icon={Award} value={hospital.accreditation} label="Accreditation" />
                  )}
                </div>
              </section>

              {/* About Section */}
              {processedDescription && (
                <section className="bg-white rounded-xs border border-gray-200 p-8">
                  <h2 className="heading-sm text-xl font-bold text-gray-900 mb-4">About {hospital.name}</h2>
                  <div
                    className="description-1 text-gray-700 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: processedDescription }}
                  />
                </section>
              )}

              {/* Branches Section */}
              {hospital.branches?.length > 0 && (
                <section className="bg-white rounded-xs border border-gray-200 p-8">
                  <div className="flex items-center gap-3 mb-4">
                   
                    <h2 className="heading-sm text-xl font-bold text-gray-900">Our Branches</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleBranches.map((branch) => (
                      <BranchCard key={branch._id} branch={branch} hospitalSlug={params.slug} />
                    ))}
                  </div>
                  {hospital.branches.length > 3 && !showAllBranches && (
                    <div className="text-center pt-8">
                      <button
                        onClick={() => setShowAllBranches(true)}
                        className="bg-gray-900 text-white px-8 py-3 rounded-xs hover:bg-gray-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                      >
                        View All {hospital.branches.length} Branches
                      </button>
                    </div>
                  )}
                </section>
              )}

              {/* Doctors Section */}
              {uniqueDoctors.length > 0 && (
                <section className="bg-white rounded-xs border border-gray-200 p-8">
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
                <section className="bg-white rounded-xs border border-gray-200 p-8">
                  <EmblaCarousel
                    items={uniqueTreatments}
                    title="Key Treatments"
                    icon={Heart}
                    type="treatments"
                  />
                </section>
              )}


            </main>

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-6">
              <ContactForm />
              <div className="bg-white rounded-xs border border-gray-200 p-6">
                <h3 className="heading-sm text-xl font-bold text-gray-900 mb-6">Contact Info</h3>
                <div className="space-y-4">
                  {hospital.contactNumber && (
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                        <Phone className="w-5 h-5 text-gray-600" />
                      </div>
                      <span className="description-1 text-gray-700 font-medium">{hospital.contactNumber}</span>
                    </div>
                  )}
                  {hospital.email && (
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                        <Mail className="w-5 h-5 text-gray-600" />
                      </div>
                      <span className="description-1 text-gray-700 font-medium">{hospital.email}</span>
                    </div>
                  )}
                  {hospital.website && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <Link href={hospital.website} target="_blank" rel="noopener noreferrer" className="description-1 text-gray-700 hover:text-gray-900 font-medium flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                          <Globe className="w-5 h-5" />
                        </div>
                        Visit Website
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}