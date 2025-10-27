// File: app/doctors/[slug]/page.tsx

"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import type { HospitalWithBranchPreview } from "@/types/hospital"
import {
  Building2,
  Calendar,
  Award,
  Stethoscope,
  Bed,
  ChevronLeft,
  ChevronRight,
  Home,
  Hospital,
  Users,
  Phone,
  Mail,
  User,
  MapPin
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

// Helper function to extract hospital logo URL from rich content
const getHospitalLogo = (richContent: any): string | null => {
  if (typeof richContent === 'string') return richContent
  if (!richContent || !richContent.nodes) return null
  const imageNode = richContent.nodes.find((node: any) => node.type === 'IMAGE')
  if (imageNode?.imageData?.image?.src?.id) {
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

// Helper function to get short plain text about from rich content
const getShortabout = (richContent: any, maxLength: number = 100): string => {
  if (typeof richContent === 'string') {
    const text = richContent.replace(/<[^>]*>/g, '').trim();
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
  if (!richContent || !richContent.nodes) return '';
  let text = '';
  for (const node of richContent.nodes) {
    if (node.type === 'PARAGRAPH' && text.length < maxLength) {
      const paraText = node.nodes?.map((n: any) => n.textData?.text || n.text || '').join(' ').trim();
      text += (text ? ' ' : '') + paraText;
    }
    if (text.length >= maxLength) break;
  }
  return text.trim().length > maxLength ? text.trim().substring(0, maxLength) + '...' : text.trim();
}

// Helper function to get plain text from rich content
const getPlainText = (richContent: any): string => {
  if (typeof richContent === 'string') {
    return richContent.replace(/<[^>]*>/g, '').trim();
  }
  if (!richContent || !richContent.nodes) return '';
  let text = '';
  const traverse = (nodes: any[]) => {
    for (const node of nodes) {
      if (node.type === 'TEXT') {
        text += (node.textData?.text || node.text || '');
      } else if (node.nodes && node.nodes.length > 0) {
        traverse(node.nodes);
      }
    }
  };
  traverse(richContent.nodes);
  return text.replace(/\s+/g, ' ').trim();
}

// Helper function to render rich text content (updated for textData.text and decorations)
const renderRichText = (richContent: any): JSX.Element | null => {
  if (typeof richContent === 'string') {
    return <div className="text-gray-700 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: richContent }} />
  }
  if (!richContent || !richContent.nodes || richContent.nodes.length === 0) return null

  const renderNode = (node: any, key: string | number): JSX.Element | null => {
    switch (node.type) {
      case 'PARAGRAPH':
        return (
          <p key={key} className="text-gray-700 leading-relaxed mb-3">
            {node.nodes?.map((child: any, idx: number) => renderNode(child, idx))}
          </p>
        )
      case 'HEADING1':
        return (
          <h3 key={key} className="text-xl font-semibold text-gray-900 mb-3">
            {node.nodes?.map((child: any, idx: number) => renderNode(child, idx))}
          </h3>
        )
      case 'HEADING2':
        return (
          <h4 key={key} className="text-lg font-semibold text-gray-900 mb-3">
            {node.nodes?.map((child: any, idx: number) => renderNode(child, idx))}
          </h4>
        )
      case 'HEADING3':
        return (
          <h5 key={key} className="text-base font-semibold text-gray-900 mb-3">
            {node.nodes?.map((child: any, idx: number) => renderNode(child, idx))}
          </h5>
        )
      case 'HEADING4':
        return (
          <h6 key={key} className="text-sm font-semibold text-gray-900 mb-3">
            {node.nodes?.map((child: any, idx: number) => renderNode(child, idx))}
          </h6>
        )
      case 'IMAGE':
        const imgSrc = node.imageData?.image?.src?.id
          ? `https://static.wixstatic.com/media/${node.imageData.image.src.id}`
          : null
        if (imgSrc) {
          return (
            <div key={key} className="my-4">
              <Image
                src={imgSrc}
                alt="Embedded image"
                width={600}
                height={400}
                className="w-full h-auto rounded-md"
              />
            </div>
          )
        }
        return null
      case 'LIST_ITEM':
      case 'LIST_NUMBERED_ITEM':
        return (
          <li key={key} className={`text-gray-700 leading-relaxed mb-1 ${node.type === 'LIST_NUMBERED_ITEM' ? 'list-decimal ml-6' : 'list-disc ml-6'}`}>
            {node.nodes?.map((child: any, idx: number) => renderNode(child, idx))}
          </li>
        )
      case 'LIST':
        const isOrdered = node.listStyle === 'ordered' || node.type?.includes('NUMBERED')
        return (
          <ul key={key} className={isOrdered ? 'list-decimal ml-6 mb-3' : 'list-disc ml-6 mb-3'}>
            {node.nodes?.map((child: any, idx: number) => renderNode(child, idx))}
          </ul>
        )
      case 'TEXT':
        const text = node.textData?.text || node.text || ''
        const decorations = node.textData?.decorations || []
        const isBold = decorations.some((dec: any) => dec?.type === 'bold' || dec === 'bold')
        const isItalic = decorations.some((dec: any) => dec?.type === 'italic' || dec === 'italic')
        const isUnderline = decorations.some((dec: any) => dec?.type === 'underline' || dec === 'underline')
        const isLink = node.link?.url

        let content = text
        if (isLink) {
          content = <a key={key} href={isLink} className="text-gray-600 hover:underline">{text}</a>
        } else if (isBold && isItalic) {
          content = <strong key={key}><em>{text}</em></strong>
        } else if (isBold) {
          content = <strong key={key}>{text}</strong>
        } else if (isItalic) {
          content = <em key={key}>{text}</em>
        } else if (isUnderline) {
          content = <u key={key}>{text}</u>
        } else {
          content = <span key={key}>{text}</span>
        }

        return <>{content}</>
      case 'SPAN':
      case 'INLINE_EMBED':
        return (
          <span key={key} className={node.textStyle ? `font-${node.textStyle.fontSize || 'base'} ${node.textStyle.color ? `text-${node.textStyle.color}` : ''}` : ''}>
            {node.nodes?.map((child: any, idx: number) => renderNode(child, idx))}
          </span>
        )
      default:
        if (node.textData?.text || node.text) {
          return <span key={key}>{node.textData?.text || node.text}</span>
        }
        return node.nodes?.length > 0 ? (
          <span key={key}>{node.nodes.map((child: any, idx: number) => renderNode(child, idx))}</span>
        ) : null
    }
  }

  return (
    <div className="space-y-4">
      {richContent.nodes.map((node: any, idx: number) => renderNode(node, idx))}
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
const Breadcrumb = ({ hospitalName, branchName, doctorName, hospitalSlug }: { hospitalName: string; branchName: string; doctorName: string; hospitalSlug: string }) => (
  <nav className="bg-white border-b border-gray-200 py-4">
    <div className="container mx-auto px-4">
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <Link href="/" className="flex items-center gap-1 hover:text-gray-900 transition-colors">
          <Home className="w-4 h-4" />
          Home
        </Link>
        <span>/</span>
        <Link href="/hospitals" className="hover:text-gray-900 transition-colors">
          Hospitals
        </Link>
        <span>/</span>
        <Link
          href={`/hospitals/${hospitalSlug}`}
          className="hover:text-gray-900 transition-colors"
        >
          {hospitalName}
        </Link>
        <span>/</span>
        <Link
          href={`/hospitals/${hospitalSlug}/branches/${generateSlug(branchName)}`}
          className="hover:text-gray-900 transition-colors"
        >
          {branchName}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{doctorName}</span>
      </div>
    </div>
  </nav>
)

// Hospital Card Component
const HospitalCard = ({ hospital }: { hospital: any }) => {
  const hospitalImage = getHospitalImage(hospital.image)
  const hospitalLogo = getHospitalLogo(hospital.logo)
  const hospitalSlug = hospital.slug || generateSlug(hospital.name)

  const branchesInfo = hospital.branches && hospital.branches.length > 0 ? (
    <p className="description-2 flex items-center gap-1">
      <MapPin className="w-3 h-3" />
      {hospital.branches[0].name}
      {hospital.branches.length > 1 && (
        <span className="ml-1">+{hospital.branches.length - 1} more</span>
      )}
    </p>
  ) : null

  return (
    <Link
      href={`/hospitals/${hospitalSlug}`}
      className="group flex flex-col bg-white rounded-xs shadow-xs border border-gray-100 hover:border-gray-100  overflow-hidden"
    >
      {/* Image Section */}
      <div className="relative h-48 bg-gray-50">
        {hospitalImage ? (
          <Image
            src={hospitalImage}
            alt={hospital.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <Building2 className="w-12 h-12 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-800/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-xs" />
      </div>

      {/* Content Section */}
      <div className="flex flex-col justify-between bg-gray-100 p-5  flex-1">
        <div className="space-y-1">
         <div className="flex gap-x-1 items-center">
           {/* {hospitalLogo && (
            <div className="w-20 h-8 relative">
              <Image
                src={hospitalLogo}
                alt={`${hospital.name} logo`}
                fill
                className="object-contain"
              />
            </div>
          )} */}

          <h5 className="title-text line-clamp-1 group-hover:text-gray-700 transition-colors duration-200">
            {hospital.name}
          </h5>
         </div>

          {hospital.description && (
            <p className="description-1 line-clamp-2">
              {getShortabout(hospital.description)}
            </p>
          )}
        </div>

        {/* Footer Section */}
        <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
          {hospital.yearEstablished && (
            <p className="description-2 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Est. {hospital.yearEstablished}
            </p>
          )}

          {hospital.accreditation && (
            <p className="description-2 flex items-center gap-1">
              <Award className="w-4 h-4" />
              {hospital.accreditation}
            </p>
          )}

          {hospital.beds && (
            <p className="description-2 flex items-center gap-1">
              <Bed className="w-4 h-4" />
              {hospital.beds} Beds
            </p>
          )}

         

          {branchesInfo && (
           <div className="border-t  border-gray-200 space-y-1">
             <h3 className="heading-xs pt-2">
              Branches
            </h3>
            <p className="description-1 font-medium">
               {branchesInfo}
            </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

// Hospitals Carousel Component
const HospitalsCarousel = ({ hospitals }: { hospitals: any[] }) => {
  if (hospitals.length === 0) return null

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps'
  })

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  const itemsPerView = 3
  const visibleSlidesClass = `min-w-0 w-[calc(33.333%-0.666rem)]`

  return (
    <section className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Hospital className="w-5 h-5 text-gray-600" />
          All Hospitals ({hospitals.length})
        </h3>
        {hospitals.length > itemsPerView && (
          <div className="flex gap-2">
            <button
              onClick={scrollPrev}
              className="bg-white rounded-lg p-2 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={scrollNext}
              className="bg-white rounded-lg p-2 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}
      </div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {hospitals.map((hospital) => (
            <div key={hospital._id || hospital.id} className={classNames("flex-shrink-0", visibleSlidesClass)}>
              <HospitalCard hospital={hospital} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const DoctorCard = ({ doctor }: { doctor: any }) => {
  const doctorImage = getDoctorImage(doctor.profileImage)
  const doctorSlug = generateSlug(doctor.name)

  return (
    <Link
      href={`/doctors/${doctorSlug}`}
      className="group flex flex-col bg-white rounded-xs shadow-xs hover:shadow-md border border-gray-100 hover:border-gray-200 transition-all duration-300 overflow-hidden"
    >
      {/* Image Section */}
      <div className="relative h-48 bg-gray-50">
        {doctorImage ? (
          <Image
            src={doctorImage}
            alt={doctor.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <User className="w-12 h-12 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-800/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl" />
      </div>

      {/* Content Section */}
      <div className="flex flex-col bg-gray-100 justify-between p-5  flex-1">
        <div className="space-y-2">
          <h5 className="title-text line-clamp-1 group-hover:text-gray-700 transition-colors duration-200">
            {doctor.name}
          </h5>
          <p className="description-1 line-clamp-1">
            {doctor.specialization}
          </p>
        </div>

        {/* Footer Section */}
        <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
          {doctor.experience && (
            <p className="description-2 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {doctor.experience} Years
            </p>
          )}
          {doctor.designation && (
            <p className="description-2 flex items-center gap-1">
              <Users className="w-4 h-4" />
              {doctor.designation}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

// Similar Doctors Carousel Component
const SimilarDoctorsCarousel = ({ doctors, currentDoctorId }: { doctors: any[]; currentDoctorId: string }) => {
  if (doctors.length === 0) return null

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps'
  })

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  const itemsPerView = 3
  const visibleSlidesClass = `min-w-0 w-[calc(33.333%-0.666rem)]`

  return (
    <section className="bg-white rounded-xs shadow-xs p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="heading-sm font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-600" />
          Similar Doctors ({doctors.length})
        </h3>
        {doctors.length > itemsPerView && (
          <div className="flex gap-2">
            <button
              onClick={scrollPrev}
              className="bg-white rounded-lg p-2 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={scrollNext}
              className="bg-white rounded-lg p-2 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}
      </div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {doctors.map((doctor) => (
            <div key={doctor._id || doctor.id} className={classNames("flex-shrink-0", visibleSlidesClass)}>
              <DoctorCard doctor={doctor} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Hero Skeleton Component
const HeroSkeleton = () => (
  <section className="relative w-full h-[70vh] bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse">
    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-800/40 to-transparent" />
    <div className="absolute md:w-1/2 bottom-0 left-0 w-full z-10 px-6 pb-12">
      <div className="container mx-auto space-y-4">
        <div className="h-12 w-64 bg-gray-300 rounded animate-pulse" />
        <div className="h-6 w-96 bg-gray-300 rounded animate-pulse" />
        <div className="flex flex-wrap gap-3 mt-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-8 w-32 bg-gray-300 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  </section>
)

// Overview Skeleton Component
const OverviewSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 animate-pulse">
    <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
    <div className="space-y-6">
      <div className="h-32 bg-gray-200 rounded" />
      <div className="grid md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-5 h-5 bg-gray-300 rounded-full mt-0.5" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-300 rounded" />
              <div className="h-4 w-48 bg-gray-300 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// Carousel Skeleton Component
const CarouselSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 animate-pulse">
    <div className="flex justify-between items-center mb-6">
      <div className="h-6 w-48 bg-gray-200 rounded" />
      <div className="flex gap-2">
        <div className="w-8 h-8 bg-gray-200 rounded-lg" />
        <div className="w-8 h-8 bg-gray-200 rounded-lg" />
      </div>
    </div>
    <div className="overflow-hidden h-80">
      <div className="flex gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-80 h-full bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  </div>
)

// Sidebar Skeleton Component
const SidebarSkeleton = () => (
  <aside className="lg:col-span-3 space-y-6">
    <div className="bg-white sticky top-24 rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  </aside>
)

// Main Doctor Detail Component
export default function DoctorDetail({ params }: { params: Promise<{ slug: string }> }) {
  const [doctor, setDoctor] = useState<any>(null)
  const [branch, setBranch] = useState<any>(null)
  const [hospital, setHospital] = useState<HospitalWithBranchPreview | null>(null)
  const [allDoctors, setAllDoctors] = useState<any[]>([])
  const [allHospitals, setAllHospitals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAboutExpanded, setIsAboutExpanded] = useState(false)

  useEffect(() => {
    const fetchDoctorData = async () => {
      setLoading(true)
      setError(null)
      try {
        const resolvedParams = await params
        const doctorSlug = resolvedParams.slug

        console.log('Fetching doctor with slug:', doctorSlug)

        const res = await fetch('/api/hospitals')
        if (!res.ok) throw new Error("Failed to fetch hospitals")
        const data = await res.json()

        if (data.items && data.items.length > 0) {
          let foundDoctor = null
          let foundBranch = null
          let foundHospital = null
          let allDoctorsLocal: any[] = []
          const doctorMap = new Map<string, any>()

          // First pass: Find the current doctor and collect all doctors
          for (const hospitalItem of data.items) {
            if (hospitalItem.branches && hospitalItem.branches.length > 0) {
              for (const branchItem of hospitalItem.branches) {
                // Collect doctors from branch
                if (branchItem.doctors && branchItem.doctors.length > 0) {
                  for (const doctorItem of branchItem.doctors) {
                    const doctorNameSlug = generateSlug(doctorItem.name)
                    
                    // Check if this is the doctor we're looking for
                    if (doctorNameSlug === doctorSlug && !foundDoctor) {
                      foundDoctor = doctorItem
                      foundBranch = branchItem
                      foundHospital = hospitalItem
                    }

                    // Add doctor to map with hospital and branches info
                    const key = doctorItem._id
                    let existing = doctorMap.get(key)
                    if (existing) {
                      if (existing.hospitalName === hospitalItem.name) {
                        if (!existing.branches.includes(branchItem.name)) {
                          existing.branches.push(branchItem.name)
                        }
                      }
                      // If different hospital, assume not for now
                    } else {
                      doctorMap.set(key, {
                        ...doctorItem,
                        hospitalName: hospitalItem.name,
                        branches: [branchItem.name],
                        hospitalSlug: hospitalItem.slug || generateSlug(hospitalItem.name)
                      })
                    }
                  }
                }
              }
            }
          }

          allDoctorsLocal = Array.from(doctorMap.values())

          if (foundDoctor && foundHospital && foundBranch) {
            // Find the full doctor with all branches
            const fullDoctor = allDoctorsLocal.find(d => d._id === foundDoctor._id) || {
              ...foundDoctor,
              hospitalName: foundHospital.name,
              branches: [foundBranch.name],
              hospitalSlug: foundHospital.slug || generateSlug(foundHospital.name)
            }
            console.log('Found doctor:', fullDoctor.name)
            console.log('In branch:', foundBranch.name)
            console.log('In hospital:', foundHospital.name)
            console.log('Doctor treatments:', fullDoctor.treatments)
            
            setDoctor(fullDoctor)
            setBranch(foundBranch)
            setHospital(foundHospital)
            setAllDoctors(allDoctorsLocal)
            setAllHospitals(data.items)
          } else {
            throw new Error("Doctor not found")
          }
        } else {
          throw new Error("No hospitals available")
        }
      } catch (err) {
        console.error('Error fetching doctor:', err)
        setError(err instanceof Error ? err.message : "Failed to load doctor details")
      } finally {
        setLoading(false)
      }
    }

    fetchDoctorData()
  }, [params])

  // Get similar doctors based on shared treatments across all hospitals
  const similarDoctorsRaw = (() => {
    if (!doctor || !doctor.treatments || doctor.treatments.length === 0) return []
    const currentTreatmentIds = new Set(doctor.treatments.map((t: any) => t._id))
    return allDoctors.filter(d => 
      d._id !== doctor._id && 
      d.treatments && 
      d.treatments.some((t: any) => currentTreatmentIds.has(t._id))
    )
  })()

  // Group by hospital and take max 2 per hospital
  const groupedByHospital = similarDoctorsRaw.reduce((acc, d) => {
    if (!acc[d.hospitalName]) acc[d.hospitalName] = []
    acc[d.hospitalName].push(d)
    return acc
  }, {} as Record<string, any[]>)

  const similarDoctors = Object.values(groupedByHospital)
    .flatMap(group => group.slice(0, 2))
    .slice(0, 6)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeroSkeleton />
        <Breadcrumb hospitalName="Hospital Name" branchName="Branch Name" doctorName="Doctor Name" hospitalSlug="" />
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-12 gap-6">
              <main className="lg:col-span-9 space-y-6">
                <OverviewSkeleton />
                <CarouselSkeleton />
                <CarouselSkeleton />
              </main>
              <SidebarSkeleton />
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (error || !doctor || !hospital || !branch) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <Breadcrumb hospitalName="Hospital Name" branchName="Branch Name" doctorName="Doctor Name" hospitalSlug="" />
        <div className="text-center space-y-6 max-w-md p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <Stethoscope className="w-16 h-16 text-gray-400 mx-auto" />
          <h2 className="text-2xl font-semibold text-gray-900">Doctor Not Found</h2>
          <p className="text-gray-600 leading-relaxed">{error || "The requested doctor could not be found. Please check the URL or try searching again."}</p>
          <Link
            href="/hospitals"
            className="inline-block w-full bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors font-semibold"
          >
            Go to Hospital Search
          </Link>
        </div>
      </div>
    )
  }

  const doctorImage = getDoctorImage(doctor.profileImage)
  const hospitalImage = getHospitalImage(hospital.image)
  const heroImage = doctorImage || hospitalImage
  const hospitalSlug = hospital.slug || generateSlug(hospital.name)
  const branchSlug = generateSlug(branch.name)

  const hasAboutContent = doctor.about && (
    (typeof doctor.about === 'string' && doctor.about.trim()) ||
    (doctor.about.nodes && doctor.about.nodes.length > 0)
  )

  const plainAbout = hasAboutContent ? getPlainText(doctor.about) : ''
  const isLongAbout = plainAbout.length > 200

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="relative w-full bg-gray-100 h-[70vh]">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={`${doctor.name} profile`}
            fill
            priority
            className="object-contain object-right"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
        )}
        <div className="absolute md:w-1/2 bottom-0 left-0 w-full z-10 px-6 pb-12 text-gray-700">
          <div className="container mx-auto space-y-4">
            <h1 className="title-text text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              {doctor.name}
            </h1>
            <p className="description-1 text-lg max-w-2xl leading-relaxed text-gray-700">
              {doctor.specialization} - {doctor.qualification} at {hospital.name}, {branch.name}
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              {doctor.designation && (
                <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md text-sm font-medium">
                  <Users className="w-4 h-4" />
                  {doctor.designation}
                </span>
              )}
              {doctor.experience && (
                <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md text-sm font-medium">
                  <Calendar className="w-4 h-4" />
                  {doctor.experience} years experience
                </span>
              )}
            </div>
          </div>
        </div>
      </section>
      <Breadcrumb hospitalName={hospital.name} branchName={branch.name} doctorName={doctor.name} hospitalSlug={hospitalSlug} />
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-6">
            <main className="lg:col-span-9 space-y-6">
              <section className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h2 className="heading-sm text-2xl font-semibold text-gray-900 mb-4">Doctor Profile</h2>
                <div className="space-y-6">
                  {hasAboutContent && (
                    <div className="relative">
                      <div className={`prose prose-lg max-w-none ${!isAboutExpanded ? 'line-clamp-4' : ''}`}>
                        {renderRichText(doctor.about)}
                      </div>
                      {isLongAbout && (
                        <button
                          onClick={() => setIsAboutExpanded(!isAboutExpanded)}
                          className="mt-2 text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
                        >
                          {isAboutExpanded ? 'Show Less' : 'Read More'}
                        </button>
                      )}
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    {doctor.qualification && (
                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                        <Award className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="heading-xs font-semibold text-gray-900 text-sm">Qualifications</h4>
                          <p className="description-1  mt-1">{doctor.qualification}</p>
                        </div>
                      </div>
                    )}
                    {doctor.experience && (
                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                        <Calendar className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="heading-xs font-semibold text-gray-900 text-sm">Experience</h4>
                          <p className="description-1  mt-1">{doctor.experience} years</p>
                        </div>
                      </div>
                    )}
                    {doctor.designation && (
                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                        <Users className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="heading-xs font-semibold text-gray-900 text-sm">Designation</h4>
                          <p className="description-1  mt-1">{doctor.designation}</p>
                        </div>
                      </div>
                    )}
                    {doctor.languagesSpoken && (
                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                        <User className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="heading-xs font-semibold text-gray-900 text-sm">Languages Spoken</h4>
                          <p className="description-1  mt-1">{doctor.languagesSpoken}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
              {allHospitals.length > 0 && (
                <HospitalsCarousel hospitals={allHospitals} />
              )}
              {similarDoctors.length > 0 && (
                <SimilarDoctorsCarousel doctors={similarDoctors} currentDoctorId={doctor._id} />
              )}
            </main>
            <aside className="lg:col-span-3 space-y-6">
              <div className="bg-white sticky top-24 rounded-lg shadow-sm p-6 border border-gray-100">
                <h3 className="heading-sm text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Hospital className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="heading-xs font-medium text-gray-900 text-sm">Hospital</h4>
                      <p className="description-1  mt-1">{hospital.name}</p>
                      <p className="description-2 text-gray-500 text-xs mt-1">{branch.name}</p>
                    </div>
                  </div>
                  {branch.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="heading-xs font-medium text-gray-900 text-sm">Address</h4>
                        <p className="description-1  mt-1">{branch.address}</p>
                      </div>
                    </div>
                  )}
                  {branch.contactNumber && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="heading-xs font-medium text-gray-900 text-sm">Phone</h4>
                        <p className="description-1  mt-1">{branch.contactNumber}</p>
                      </div>
                    </div>
                  )}
                  {hospital.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="heading-xs font-medium text-gray-900 text-sm">Email</h4>
                        <p className="description-1  mt-1">{hospital.email}</p>
                      </div>
                    </div>
                  )}
                  {hospital.website && (
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="heading-xs font-medium text-gray-900 text-sm">Website</h4>
                        <a 
                          href={hospital.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="description-1 text-gray-600 hover:text-gray-800 text-sm mt-1 block transition-colors"
                        >
                          Visit Website
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <ContactForm />
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}