// File: app/hospitals/branches/[slug]/page.tsx

"use client"

import { useState, useEffect, useCallback } from "react"
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
  Hospital
} from "lucide-react"
import Link from "next/link"
import useEmblaCarousel from "embla-carousel-react"
import classNames from "classnames"
import ContactForm from "@/components/ContactForm"

// Helper function to extract the main hospital image URL from rich content
const getHospitalImage = (richContent: any): string | null => {
  if (typeof richContent === 'string') return richContent
  if (!richContent || !richContent.nodes) return null
  const imageNode = richContent.nodes.find((node: any) => node.type === 'IMAGE')
  if (imageNode?.imageData?.image?.src?.id) {
    const id = imageNode.imageData.image.src.id
    return `https://static.wixstatic.com/media/${id}`
  }
  return null
}

// Helper function to extract branch image URL from rich content
const getBranchImage = (richContent: any): string | null => {
  if (typeof richContent === 'string') return richContent
  if (!richContent || !richContent.nodes) return null
  const imageNode = richContent.nodes.find((node: any) => node.type === 'IMAGE')
  if (imageNode?.imageData?.image?.src?.id) {
    const id = imageNode.imageData.image.src.id
    return `https://static.wixstatic.com/media/${id}`
  }
  return null
}

// Helper function to extract hospital logo URL from rich content
const getHospitalLogo = (richContent: any): string | null => {
  if (!richContent || !richContent.nodes) return null
  const imageNode = richContent.nodes?.[0]
  if (imageNode?.type === 'IMAGE' && imageNode.imageData?.image?.src?.id) {
    const id = imageNode.imageData.image.src.id
    return `https://static.wixstatic.com/media/${id}`
  }
  return null
}

// Helper function to extract doctor image URL from rich content
const getDoctorImage = (richContent: any): string | null => {
  if (typeof richContent === 'string') return richContent
  if (!richContent || !richContent.nodes) return null
  const imageNode = richContent.nodes.find((node: any) => node.type === 'IMAGE')
  if (imageNode?.imageData?.image?.src?.id) {
    const id = imageNode.imageData.image.src.id
    return `https://static.wixstatic.com/media/${id}`
  }
  return null
}

// Helper function to extract treatment image URL from rich content
const getTreatmentImage = (richContent: any): string | null => {
  if (typeof richContent === 'string') return richContent
  if (!richContent || !richContent.nodes) return null
  const imageNode = richContent.nodes.find((node: any) => node.type === 'IMAGE')
  if (imageNode?.imageData?.image?.src?.id) {
    const id = imageNode.imageData.image.src.id
    return `https://static.wixstatic.com/media/${id}`
  }
  return null
}

// Helper function to get short plain text description from rich content
const getShortDescription = (richContent: any, maxLength: number = 100): string => {
  if (typeof richContent === 'string') {
    const text = richContent.replace(/<[^>]*>/g, '').trim();
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
  if (!richContent || !richContent.nodes) return '';
  let text = '';
  for (const node of richContent.nodes) {
    if (node.type === 'PARAGRAPH' && text.length < maxLength) {
      const paraText = node.nodes?.map((n: any) => n.text || '').join(' ').trim();
      text += (text ? ' ' : '') + paraText;
    }
    if (text.length >= maxLength) break;
  }
  return text.trim().length > maxLength ? text.trim().substring(0, maxLength) + '...' : text.trim();
}

// Helper function to render rich text content
const renderRichText = (richContent: any): JSX.Element | null => {
  if (typeof richContent === 'string') {
    // Handle HTML string with dangerouslySetInnerHTML, stripping or mapping classes if needed
    // For simplicity, render as HTML, assuming global styles or inline styles
    return <div className="description-1 leading-relaxed prose space-y-3 prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: richContent }} />
  }
  if (!richContent || !richContent.nodes) return null

  const renderNode = (node: any): JSX.Element | null => {
    switch (node.type) {
      case 'PARAGRAPH':
        return (
          <p key={Math.random()} className="text-gray-600 leading-relaxed mb-2">
            {node.nodes?.map((child: any, idx: number) => renderTextNode(child, idx))}
          </p>
        )
      case 'HEADING1':
        return (
          <h3 key={Math.random()} className="text-xl font-semibold text-gray-800 mb-2">
            {node.nodes?.map((child: any, idx: number) => renderTextNode(child, idx))}
          </h3>
        )
      case 'HEADING2':
        return (
          <h4 key={Math.random()} className="text-lg font-semibold text-gray-800 mb-2">
            {node.nodes?.map((child: any, idx: number) => renderTextNode(child, idx))}
          </h4>
        )
      case 'IMAGE':
        const imgSrc = node.imageData?.image?.src?.id
          ? `https://static.wixstatic.com/media/${node.imageData.image.src.id}`
          : null
        if (imgSrc) {
          return (
            <div key={Math.random()} className="my-4">
              <Image
                src={imgSrc}
                alt="Embedded image"
                width={600}
                height={400}
                className="w-full h-auto rounded-lg"
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
    if (isBold) content = <strong key={idx}>{text}</strong>
    else if (isItalic) content = <em key={idx}>{text}</em>
    else if (isUnderline) content = <u key={idx}>{text}</u>
    else content = <span key={idx}>{text}</span>

    return content
  }

  return (
    <div className="space-y-4">
      {richContent.nodes.map((node: any, idx: number) => renderNode(node))}
    </div>
  )
}

// Helper function to generate a URL-friendly slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// Breadcrumb Component
const Breadcrumb = ({ hospitalName, branchName, hospitalSlug }: { hospitalName: string; branchName: string; hospitalSlug: string }) => (
  <nav className="bg-white border-b border-gray-100 py-4">
    <div className="container mx-auto px-4">
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <Link href="/" className="flex items-center gap-1 hover:text-gray-800 transition-colors">
          <Home className="w-4 h-4" />
          Home
        </Link>
        <span>/</span>
        <Link href="/hospitals" className="hover:text-gray-800 transition-colors">
          Hospitals
        </Link>
        <span>/</span>
        <Link
          href={`/hospitals/${hospitalSlug}`}
          className="hover:text-gray-800 transition-colors"
        >
          {hospitalName}
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">{branchName}</span>
      </div>
    </div>
  </nav>
)

// Similar Hospitals Carousel Component
const SimilarHospitalsCarousel = ({ hospitals, currentHospitalId }: { hospitals: any[], currentHospitalId: string }) => {
  const similarHospitals = hospitals
    .filter(h => h._id !== currentHospitalId)
    .slice(0, 6)

  if (similarHospitals.length === 0) return null

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps'
  })

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  const itemsPerView = 3
  const visibleSlidesClass = `min-w-0 w-80`

  return (
    <section className="bg-white rounded-xs shadow-xs p-4 border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-semibold text-gray-800 flex items-center gap-3">
          Similar Hospitals <span className="text-gray-700 text-base font-normal">({similarHospitals.length})</span>
        </h3>
        {similarHospitals.length > itemsPerView && (
          <div className="flex gap-2">
            <button
              onClick={scrollPrev}
              className="bg-white rounded-xs p-3 shadow-xs border border-gray-100 hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={scrollNext}
              className="bg-white rounded-xs p-3 shadow-xs border border-gray-100 hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6">
          {similarHospitals.map((hospital) => {
            const hospitalImage = getHospitalImage(hospital.image)
            const hospitalSlug = hospital.slug || generateSlug(hospital.name)
            return (
              <div key={hospital._id} className={classNames("flex-shrink-0 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden", visibleSlidesClass)}>
                <HospitalCard hospital={hospital} hospitalImage={hospitalImage} hospitalSlug={hospitalSlug} />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Hospital Card Component
const HospitalCard = ({ hospital, hospitalImage, hospitalSlug }: { hospital: any, hospitalImage: string | null, hospitalSlug: string }) => {
  const accreditations = hospital.accreditation ? hospital.accreditation.split(/[, ]+/).map(a => a.trim()).filter(Boolean) : []
  const firstBranch = hospital.branches && hospital.branches.length > 0 ? hospital.branches[0] : null
  const branchDisplay = firstBranch ? (firstBranch.name || firstBranch.address?.split(',')[0] || 'Branch') : 'N/A'

  return (
    <Link href={`/hospitals/${hospitalSlug}`} className="block h-full">
      <div className="relative w-full h-48 overflow-hidden bg-gray-100">
        {hospitalImage ? (
          <Image
            src={hospitalImage}
            alt={hospital.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Hospital className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-gray-800 text-base line-clamp-1">{hospital.name}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{getShortDescription(hospital.description, 80)}</p>
        {hospital.yearEstablished && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>Est. {hospital.yearEstablished}</span>
          </div>
        )}
       
        {hospital.beds && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Bed className="w-4 h-4" />
            <span>{hospital.beds} Beds</span>
          </div>
        )}
        {hospital.branches && hospital.branches.length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-medium text-gray-700 mb-1">Branches</p>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span>{branchDisplay}</span>
              {hospital.branches.length > 1 && (
                <span className="text-gray-500">+{hospital.branches.length - 1} more</span>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}

// Skeleton Components
const HeroSkeleton = () => (
  <section className="relative w-full h-[70vh]">
    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
    <div className="absolute bottom-0 left-0 w-full z-10 px-6 pb-12 text-white">
      <div className="container mx-auto space-y-4">
        <div className="flex justify-start">
          <div className="w-32 h-16 bg-white/20 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-10 w-3/4 bg-white/20 rounded animate-pulse" />
          <div className="h-6 w-1/2 bg-white/20 rounded animate-pulse" />
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="h-8 w-32 bg-white/20 rounded animate-pulse" />
          <div className="h-8 w-32 bg-white/20 rounded animate-pulse" />
        </div>
      </div>
    </div>
  </section>
)

const OverviewSkeleton = () => (
  <section className="bg-white rounded-xs shadow-xs p-4 border border-gray-100">
    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="text-center p-6 bg-gray-50 rounded-xs border border-gray-100">
          <div className="w-8 h-8 bg-gray-300 rounded-full mx-auto mb-3 animate-pulse" />
          <div className="h-8 bg-gray-300 rounded animate-pulse mx-auto mb-2" />
          <div className="h-4 w-20 bg-gray-300 rounded animate-pulse mx-auto" />
        </div>
      ))}
    </div>
  </section>
)

const AboutSkeleton = () => (
  <section className="bg-white rounded-xs shadow-xs p-4 border border-gray-100">
    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
    <div className="space-y-4">
      <div className="h-6 bg-gray-300 rounded animate-pulse" />
      <div className="h-6 bg-gray-300 rounded animate-pulse w-3/4" />
      <div className="h-6 bg-gray-300 rounded animate-pulse" />
    </div>
  </section>
)

const CarouselSkeleton = ({ type }: { type: 'doctors' | 'treatments' | 'hospitals' }) => {
  const itemsPerView = 3
  const visibleSlidesClass = `min-w-0 w-1/3`

  return (
    <section className="bg-white rounded-xs shadow-xs p-4 border border-gray-100">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-gray-300 rounded animate-pulse" />
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 w-12 bg-gray-200 rounded animate-pulse ml-2" />
        </div>
        <div className="flex gap-2">
          <div className="bg-white rounded-xs p-3 shadow-xs border border-gray-100 animate-pulse" />
          <div className="bg-white rounded-xs p-3 shadow-xs border border-gray-100 animate-pulse" />
        </div>
      </div>
      <div className="overflow-hidden">
        <div className="flex gap-6">
          {Array.from({ length: Math.max(itemsPerView + 1, 6) }).map((_, i) => (
            <div key={i} className={classNames("flex-shrink-0 bg-white rounded-xs p-0 border border-gray-100 shadow-xs animate-pulse", visibleSlidesClass)}>
              <div className="relative w-full h-48 mb-0 rounded-t-xs overflow-hidden bg-gray-100" />
              <div className="p-6 space-y-3">
                <div className="h-6 bg-gray-300 rounded" />
                <div className="h-5 bg-gray-300 rounded w-3/4" />
                <div className="h-4 bg-gray-300 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const FacilitiesSkeleton = () => (
  <section className="bg-white rounded-xs shadow-xs p-4 border border-gray-100">
    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xs border border-gray-100">
          <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse flex-shrink-0" />
          <div className="h-4 w-32 bg-gray-300 rounded animate-pulse" />
        </div>
      ))}
    </div>
  </section>
)

const SidebarSkeleton = () => (
  <aside className="lg:col-span-3 space-y-8">
    <div className="bg-white sticky top-24 rounded-xs shadow-xs p-6 border border-gray-100">
      <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-300 rounded-xs animate-pulse" />
        ))}
      </div>
    </div>
  </aside>
)

// Embla Carousel Component for Doctors and Treatments
const EmblaCarousel = ({
  items,
  title,
  Icon,
  type
}: {
  items: any[],
  title: string,
  Icon: any,
  type: 'doctors' | 'treatments'
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps'
  })

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  const itemsPerView = 3
  const visibleSlidesClass = 'w-1/3'

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-semibold text-gray-800 flex items-center gap-3">
          {title} <span className="text-gray-800 text-base font-normal">({items.length})</span>
        </h3>
        {items.length > itemsPerView && (
          <div className="flex gap-2">
            <button
              onClick={scrollPrev}
              className="bg-white rounded-xs p-3 shadow-xs border border-gray-100 hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={scrollNext}
              className="bg-white rounded-xs p-3 shadow-xs border border-gray-100 hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6">
          {items.map((item, index) => (
            <div key={item._id || index} className={classNames("flex-shrink-0 bg-white rounded-xs p-0 border border-gray-100 shadow-xs hover:shadow-xs", visibleSlidesClass)}>
              {type === 'doctors' ? (
                <DoctorCard item={item} />
              ) : (
                <TreatmentCard item={item} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Doctor Card Component
const DoctorCard = ({ item }: { item: any }) => {
  const doctorImage = getDoctorImage(item.profileImage)
  const doctorSlug = item.slug || generateSlug(item.name)

  return (
    <Link
      href={`/doctors/${doctorSlug}`}
      className="group h-full flex flex-col hover:no-underline"
    >
      <div className="relative flex-1 min-h-48 rounded-t-xs overflow-hidden bg-gray-100">
        {doctorImage ? (
          <Image
            src={doctorImage}
            alt={item.name}
            fill
            className="object-cover w-full "
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Stethoscope className="w-12 h-12 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <h5 className="title-text font-semibold text-gray-900 text-base mb-2 line-clamp-1">
            {item.name}
          </h5>
          <p className="description-1 line-clamp-1">
            {item.specialization}
          </p>
          <p className="description-1 line-clamp-2">
            {item.qualification}
          </p>
          {item.designation && (
            <p className="description-1 line-clamp-2">
              {item.designation}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

// Treatment Card Component (updated to match DoctorCard design)
const TreatmentCard = ({ item }: { item: any }) => {
  const treatmentImage = getTreatmentImage(item.treatmentImage)
  const treatmentSlug = item.slug || generateSlug(item.name)

  return (
    <Link
      href={`/treatment/${treatmentSlug}`}
      className="group h-full flex flex-col hover:no-underline"
    >
      <div className="relative flex-1 min-h-48 rounded-t-xs overflow-hidden bg-gray-100">
        {treatmentImage ? (
          <Image
            src={treatmentImage}
            alt={item.name}
            fill
            className="object-cover w-full "
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Scissors className="w-12 h-12 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <h5 className="font-semibold text-gray-800 text-lg line-clamp-1 group-hover:text-gray-800 transition-colors duration-200">
            {item.name}
          </h5>
          <p className="text-gray-600 font-medium line-clamp-1">
            {item.category || 'Specialized Treatment'}
          </p>
          <p className="text-gray-500 text-sm line-clamp-2">
            {getShortDescription(item.description)}
          </p>
        </div>
        {item.cost && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-blue-600 font-semibold text-sm">Starting from ${item.cost}</p>
          </div>
        )}
      </div>
    </Link>
  )
}

// Main Branch Detail Component
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

        const res = await fetch('/api/hospitals')
        if (!res.ok) throw new Error("Failed to fetch hospitals")
        const data = await res.json()

        if (data.items && data.items.length > 0) {
          let foundBranch = null
          let foundHospital = null

          for (const hospitalItem of data.items) {
            const hospitalSlug = generateSlug(hospitalItem.name)

            if (hospitalItem.branches && hospitalItem.branches.length > 0) {
              for (const branchItem of hospitalItem.branches) {
                const branchNameSlug = generateSlug(branchItem.name)
                const combinedSlug = `${hospitalSlug}-${branchNameSlug}`

                if (combinedSlug === branchSlug) {
                  foundBranch = branchItem
                  foundHospital = hospitalItem
                  break
                }
              }
            }
            if (foundBranch) break
          }

          if (foundBranch && foundHospital) {
            setBranch(foundBranch)
            setHospital(foundHospital)
            setAllHospitals(data.items)
          } else {
            throw new Error("Branch not found")
          }
        } else {
          throw new Error("No hospitals available")
        }
      } catch (err) {
        console.error('Error fetching branch:', err)
        setError(err instanceof Error ? err.message : "Failed to load branch details")
      } finally {
        setLoading(false)
      }
    }

    fetchBranchData()
  }, [params])

  // Loading State with Skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeroSkeleton />
        <Breadcrumb hospitalName="Hospital Name" branchName="Branch Name" hospitalSlug="" />
        <section className="py-12 relative z-10">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-12 gap-8">
              <main className="lg:col-span-9 space-y-8">
                <OverviewSkeleton />
                <AboutSkeleton />
                <CarouselSkeleton type="doctors" />
                <CarouselSkeleton type="treatments" />
                <FacilitiesSkeleton />
                <CarouselSkeleton type="hospitals" />
              </main>
              <SidebarSkeleton />
            </div>
          </div>
        </section>
      </div>
    )
  }

  // Error State
  if (error || !branch || !hospital) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 relative">
        <Breadcrumb hospitalName="Hospital Name" branchName="Branch Name" hospitalSlug="" />
        <div className="text-center space-y-6 max-w-md p-8 bg-white rounded-xs shadow-xs border border-gray-100">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto" />
          <h2 className="text-2xl font-semibold text-gray-800">Branch Not Found</h2>
          <p className="text-gray-600 leading-relaxed">{error || "The requested branch could not be found. Please check the URL or try searching again."}</p>
          <Link
            href="/hospitals"
            className="inline-block w-full bg-gray-800 text-white px-6 py-3 rounded-xs hover:bg-gray-900 transition-all font-semibold shadow-xs hover:shadow-md"
          >
            Go to Hospital Search
          </Link>
        </div>
      </div>
    )
  }

  // Derived Data
  const branchImage = getBranchImage(branch.branchImage)
  const hospitalImage = getHospitalImage(hospital.image)
  const heroImage = branchImage || hospitalImage
  const hospitalLogo = getHospitalLogo(hospital.logo)
  const hospitalSlug = hospital.slug || generateSlug(hospital.name)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <section className="relative w-full h-[70vh]">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={`${hospital.name} ${branch.name} facility`}
            fill
            priority
            className="object-cover object-center"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full z-10 px-6 pb-12 text-white">
          <div className="container mx-auto space-y-4">
           <div className="flex gap-x-4 items-center">
             <div className="flex justify-start">
              {hospitalLogo && (
                <div className="relative w-16 h-16 bg-white rounded-full p-2">
                  <Image
                    src={hospitalLogo}
                    alt={`${hospital.name} logo`}
                    fill
                    className="object-cover w-auto rounded-full h-16"
                  />
                </div>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">
              {branch.name}
            </h1>
           </div>
            <p className="text-lg max-w-2xl leading-relaxed text-gray-200">
              {hospital.name} - {branch.address || "A dedicated healthcare facility providing comprehensive medical services"}
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              {branch.address && (
                <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xs text-sm font-medium border border-white/20">
                  <MapPin className="w-4 h-4" />
                  {branch.address}
                </span>
              )}
              {branch.emergencyContact && (
                <span className="flex items-center gap-2 bg-red-500/20 backdrop-blur-sm px-4 py-2 rounded-xs text-sm font-medium border border-red-500/30">
                  <Clock className="w-4 h-4" />
                  24/7: {branch.emergencyContact}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>
      <Breadcrumb hospitalName={hospital.name} branchName={branch.name} hospitalSlug={hospitalSlug} />
      {/* Main Content */}
      <section className="py-10 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-4">
            <main className="lg:col-span-9 space-y-4">
              {/* Key Statistics */}
              <section className="bg-white rounded-xs shadow-xs p-4 border border-gray-100">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Branch Overview</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {branch.totalBeds && (
                    <StatCard icon={Bed} value={branch.totalBeds} label="Total Beds" />
                  )}
                  {branch.icuBeds && (
                    <StatCard icon={Users} value={branch.icuBeds} label="ICU Beds" />
                  )}
                  {branch.operatingRooms && (
                    <StatCard icon={Scissors} value={branch.operatingRooms} label="Operating Rooms" />
                  )}
                  {branch.yearEstablished && (
                    <StatCard icon={Calendar} value={branch.yearEstablished} label="Established" />
                  )}
                </div>
              </section>

              {/* About Branch Section */}
              {branch.description && (
                <section className="bg-white rounded-xs shadow-xs p-4 border border-gray-100">
                  <h2 className="text-2xl font-semibold  text-gray-800 mb-4">About {branch.name}</h2>
                  {renderRichText(branch.description)}
                </section>
              )}

              {/* Doctors Section */}
              {branch.doctors && branch.doctors.length > 0 && (
                <section className="bg-white rounded-xs shadow-xs p-4 border border-gray-100">
                  <EmblaCarousel
                    items={branch.doctors}
                    title="Our Specialist Doctors"
                    Icon={Stethoscope}
                    type="doctors"
                  />
                </section>
              )}

              {/* Treatments Section */}
              {branch.treatments && branch.treatments.length > 0 && (
                <section className="bg-white rounded-xs shadow-xs p-4 border border-gray-100">
                  <EmblaCarousel
                    items={branch.treatments}
                    title="Available Treatments"
                    Icon={Scissors}
                    type="treatments"
                  />
                </section>
              )}

              {/* Facilities & Services */}
              {branch.facilities && branch.facilities.length > 0 && (
                <section className="bg-white rounded-xs shadow-xs p-4 border border-gray-100">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">Facilities & Services</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {branch.facilities.map((facility: string, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xs border border-gray-100">
                        <div className="w-3 h-3 bg-gray-600 rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700 font-medium">{facility}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Similar Hospitals Section */}
              <SimilarHospitalsCarousel hospitals={allHospitals} currentHospitalId={hospital._id} />
            </main>

            {/* Sidebar */}
            <aside className="lg:col-span-3 space-y-8">
             <ContactForm/>
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}

// Stat Card Component
const StatCard = ({ icon: Icon, value, label }: { icon: any; value: string | number; label: string }) => (
  <div className="text-center p-6 bg-gray-50 rounded-xs border border-gray-100 hover:shadow-xs ">
    <Icon className="w-8 h-8 text-gray-600 mx-auto mb-3" />
    <p className="text-3xl font-semibold text-gray-800">{value}</p>
    <p className="text-gray-500 mt-2 text-sm">{label}</p>
  </div>
) 