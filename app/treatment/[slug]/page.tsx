// File: app/treatments/[slug]/page.tsx

"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import type { HospitalWithBranchPreview } from "@/types/hospital"
import {
  Calendar,
  Award,
  Stethoscope,
  Scissors,
  ChevronLeft,
  ChevronRight,
  Home,
  Hospital,
  MapPin,
  Phone,
  Mail,
  User,
  Clock,
  DollarSign,
  Building2
} from "lucide-react"
import Link from "next/link"
import useEmblaCarousel from "embla-carousel-react"
import classNames from "classnames"
import ContactForm from "@/components/ContactForm"

// Helper functions
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

const renderRichText = (richContent: any): JSX.Element | null => {
  if (typeof richContent === 'string') {
    return <div className="text-gray-700 leading-relaxed prose prose-neutral space-y-3 prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: richContent }} />
  }
  if (!richContent || !richContent.nodes) return null

  const renderNode = (node: any): JSX.Element | null => {
    switch (node.type) {
      case 'PARAGRAPH':
        return (
          <p key={Math.random()} className="text-gray-700 leading-relaxed mb-3">
            {node.nodes?.map((child: any, idx: number) => renderTextNode(child, idx))}
          </p>
        )
      case 'HEADING1':
        return (
          <h3 key={Math.random()} className="text-2xl font-bold text-gray-900 mb-3">
            {node.nodes?.map((child: any, idx: number) => renderTextNode(child, idx))}
          </h3>
        )
      case 'HEADING2':
        return (
          <h4 key={Math.random()} className="text-xl font-semibold text-gray-900 mb-3">
            {node.nodes?.map((child: any, idx: number) => renderTextNode(child, idx))}
          </h4>
        )
      case 'IMAGE':
        const imgSrc = node.imageData?.image?.src?.id
          ? `https://static.wixstatic.com/media/${node.imageData.image.src.id}`
          : null
        if (imgSrc) {
          return (
            <div key={Math.random()} className="my-6">
              <Image
                src={imgSrc}
                alt="Embedded image"
                width={600}
                height={400}
                className="w-full h-auto rounded-xs object-cover"
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

const generateSlug = (name: string): string => {
  return name
    ?.toLowerCase()
    ?.trim()
    ?.replace(/[^\w\s-]/g, '')
    ?.replace(/\s+/g, '-')
    ?.replace(/-+/g, '-') || ''
}

// Breadcrumb Component
const Breadcrumb = ({ treatmentName }: { treatmentName: string }) => (
  <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100 py-4 sticky top-0 z-20">
    <div className="container mx-auto px-6">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/" className="flex items-center gap-2 hover:text-gray-900 transition-colors duration-200">
          <Home className="w-4 h-4" />
          Home
        </Link>
        <span className="text-gray-400">/</span>
        <Link href="/treatments" className="hover:text-gray-900 transition-colors duration-200">
          Treatments
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium truncate max-w-xs">{treatmentName}</span>
      </div>
    </div>
  </nav>
)

// Hospitals Offering Treatment Carousel Component
const HospitalsOfferingTreatmentCarousel = ({ 
  hospitals, 
  treatmentName 
}: { 
  hospitals: any[], 
  treatmentName: string 
}) => {
  if (hospitals.length === 0) return null

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
    dragFree: false
  })

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  const itemsPerView = 3
  const visibleSlidesClass = `min-w-0 w-[31.5%] flex-shrink-0`

  const canScrollPrev = emblaApi ? emblaApi.canScrollPrev() : false
  const canScrollNext = emblaApi ? emblaApi.canScrollNext() : false

  return (
    <section className="bg-white rounded-xs shadow-xs border border-gray-100 p-8 mb-8">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Hospital className="w-6 h-6 text-gray-500" />
          Hospitals Offering {treatmentName}
          <span className="text-gray-500 font-normal">({hospitals.length})</span>
        </h3>
        {(hospitals.length > itemsPerView) && (
          <div className="flex gap-2">
            <button
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className={classNames(
                "bg-white rounded-xs p-3 shadow-xs border border-gray-200 hover:bg-gray-50 transition-all duration-200 hover:shadow-xs disabled:opacity-50 disabled:cursor-not-allowed",
                !canScrollPrev && "opacity-50 cursor-not-allowed"
              )}
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={scrollNext}
              disabled={!canScrollNext}
              className={classNames(
                "bg-white rounded-xs p-3 shadow-xs border border-gray-200 hover:bg-gray-50 transition-all duration-200 hover:shadow-xs disabled:opacity-50 disabled:cursor-not-allowed",
                !canScrollNext && "opacity-50 cursor-not-allowed"
              )}
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>
      <div className="max-w-[63rem] mx-auto">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-6">
            {hospitals.map((hospital) => {
              const hospitalImage = getHospitalImage(hospital.image)
              const hospitalSlug = hospital.slug || generateSlug(hospital.name)
              const branchCount = hospital.branchCount || 0
              const specialistCount = hospital.specialistCount || 0
              
              return (
                <div key={hospital._id} className={classNames("bg-white rounded-xs border border-gray-100 shadow-xs hover:shadow-md transition-all duration-300 ", visibleSlidesClass)}>
                  <Link href={`/hospitals/${hospitalSlug}`} className="block group">
                    <div className="relative w-full h-48 rounded-t-sm overflow-hidden bg-gray-50">
                      {hospitalImage ? (
                        <Image
                          src={hospitalImage}
                          alt={hospital.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <Hospital className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs font-medium">
                        {specialistCount} Doctors
                      </div>
                    </div>
                    <div className="p-6">
                      <h5 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1 group-hover:text-gray-600 transition-colors">
                        {hospital.name}
                      </h5>
                      <p className="text-gray-600 font-medium mb-3 line-clamp-1 text-sm">
                        {hospital.accreditation || 'Leading Healthcare Provider'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Hospital className="w-3 h-3" />
                          <span>{branchCount} branches</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Stethoscope className="w-3 h-3" />
                          <span>{specialistCount} doctors</span>
                        </div>
                      </div>
                      {hospital.contactNumber && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Phone className="w-3 h-3" />
                          <span className="text-gray-600">{hospital.contactNumber}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

// Doctor Card Component
const DoctorCard = ({ doctor }: { doctor: any }) => {
  const doctorImage = getDoctorImage(doctor.profileImage)
  const doctorSlug = doctor.slug || generateSlug(doctor.name)

  // Get unique hospitals and branches for this doctor
  const hospitalBranches = doctor.hospitalBranches || []

  return (
    <Link
      href={`/doctors/${doctorSlug}`}
      className="group h-full flex flex-col hover:no-underline bg-white rounded-xs border border-gray-100 shadow-xs hover:shadow-md transition-all duration-300 "
    >
      <div className="relative w-full h-48 rounded-t-sm overflow-hidden bg-gray-50">
        {doctorImage ? (
          <Image
            src={doctorImage}
            alt={doctor.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Stethoscope className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>
      <div className="flex-1 p-3">
        <div className="space-y-1">
          <h5 className="font-bold text-gray-900 text-lg line-clamp-1 group-hover:text-gray-600 transition-colors duration-200">
            {doctor.name}
          </h5>
          <p className="text-gray-700 font-semibold line-clamp-1 text-sm">
            {doctor.specialization}
          </p>
          <p className="description-1 line-clamp-1">
            {doctor.qualification}
          </p>
          {doctor.designation && (
            <p className="description-1 line-clamp-1">
              {doctor.designation}
            </p>
          )}
          {doctor.experience && (
            <p className="description-1 font-medium">
              {doctor.experience} years experience
            </p>
          )}
          
          {/* Hospital and Branch Information */}
          <div className="pt-4 border-t border-gray-100 mt-4">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
              
                <div className="flex-1">
                  <p className="description">
                    Available at {hospitalBranches.length} location{hospitalBranches.length > 1 ? 's' : ''}
                  </p>
                  <div className="mt-1 space-y-1 flex items-center gap-x-1">
                    {hospitalBranches.slice(0, 1).map((hb: any, index: number) => (
                      <div key={index} className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="description-1 line-clamp-1">
                            {hb.hospitalName} - {hb.branchName}
                          </p>
                        </div>
                      </div>
                    ))}
                    {hospitalBranches.length > 2 && (
                      <p className="text-gray-700 text-xs">
                        +{hospitalBranches.length - 1} more {hospitalBranches.length - 2 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// Embla Carousel Component for Doctors
const SpecialistDoctorsCarousel = ({
  doctors,
  title
}: {
  doctors: any[],
  title: string
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
    dragFree: false
  })

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  const itemsPerView = 3
  const visibleSlidesClass = `min-w-0 w-[31.5%] flex-shrink-0`

  const canScrollPrev = emblaApi ? emblaApi.canScrollPrev() : false
  const canScrollNext = emblaApi ? emblaApi.canScrollNext() : false

  return (
    <section className="bg-white rounded-xs shadow-xs border border-gray-100 p-8 mb-8">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Stethoscope className="w-6 h-6 text-gray-500" />
          {title} <span className="text-gray-500 font-normal">({doctors.length})</span>
        </h3>
        {(doctors.length > itemsPerView) && (
          <div className="flex gap-2">
            <button
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className={classNames(
                "bg-white rounded-xs p-3 shadow-xs border border-gray-200 hover:bg-gray-50 transition-all duration-200 hover:shadow-xs disabled:opacity-50 disabled:cursor-not-allowed",
                !canScrollPrev && "opacity-50 cursor-not-allowed"
              )}
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={scrollNext}
              disabled={!canScrollNext}
              className={classNames(
                "bg-white rounded-xs p-3 shadow-xs border border-gray-200 hover:bg-gray-50 transition-all duration-200 hover:shadow-xs disabled:opacity-50 disabled:cursor-not-allowed",
                !canScrollNext && "opacity-50 cursor-not-allowed"
              )}
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>
      <div className="max-w-[63rem] mx-auto">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-6">
            {doctors.map((doctor, index) => (
              <div key={doctor._id || index} className={classNames("flex-shrink-0", visibleSlidesClass)}>
                <DoctorCard doctor={doctor} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Skeleton Components
const HeroSkeleton = () => (
  <section className="relative w-full h-[70vh]">
    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
    <div className="absolute bottom-0 left-0 w-full z-10 px-6 pb-12 text-white">
      <div className="container mx-auto space-y-4">
        <div className="space-y-2">
          <div className="h-10 w-3/4 bg-white/20 rounded animate-pulse" />
          <div className="h-6 w-1/2 bg-white/20 rounded animate-pulse" />
        </div>
      </div>
    </div>
  </section>
)

const OverviewSkeleton = () => (
  <section className="bg-white rounded-xs shadow-xs p-8 border border-gray-100 mb-8">
    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
    <div className="space-y-4">
      <div className="h-20 w-full bg-gray-100 rounded animate-pulse" />
      <div className="h-12 w-3/4 bg-gray-100 rounded animate-pulse" />
      <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
    </div>
  </section>
)

const SidebarSkeleton = () => (
  <aside className="lg:col-span-3 space-y-8">
    <div className="bg-white sticky top-24 rounded-xs shadow-xs p-6 border border-gray-100">
      <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xs animate-pulse" />
        ))}
      </div>
    </div>
  </aside>
)

// Helper function to get unique doctors and aggregate their hospital branches
const getUniqueDoctorsWithHospitalBranches = (doctors: any[]) => {
  const doctorMap = new Map()

  doctors.forEach(doctor => {
    const doctorId = doctor._id
    
    if (!doctorMap.has(doctorId)) {
      // First time seeing this doctor - create entry with hospitalBranches array
      doctorMap.set(doctorId, {
        ...doctor,
        hospitalBranches: [{
          hospitalName: doctor.hospitalName,
          branchName: doctor.branchName,
          hospitalSlug: doctor.hospitalSlug,
          branchSlug: doctor.branchSlug
        }]
      })
    } else {
      // Doctor already exists - add this hospital/branch to their hospitalBranches array
      const existingDoctor = doctorMap.get(doctorId)
      const newHospitalBranch = {
        hospitalName: doctor.hospitalName,
        branchName: doctor.branchName,
        hospitalSlug: doctor.hospitalSlug,
        branchSlug: doctor.branchSlug
      }
      
      // Check if this hospital/branch combination already exists
      const exists = existingDoctor.hospitalBranches.some((hb: any) => 
        hb.hospitalName === newHospitalBranch.hospitalName && 
        hb.branchName === newHospitalBranch.branchName
      )
      
      if (!exists) {
        existingDoctor.hospitalBranches.push(newHospitalBranch)
      }
    }
  })

  return Array.from(doctorMap.values())
}

// Main Treatment Detail Component
export default function TreatmentDetail({ params }: { params: Promise<{ slug: string }> }) {
  const [treatment, setTreatment] = useState<any>(null)
  const [allHospitals, setAllHospitals] = useState<any[]>([])
  const [specialistDoctors, setSpecialistDoctors] = useState<any[]>([])
  const [treatmentCategory, setTreatmentCategory] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTreatmentData = async () => {
      setLoading(true)
      setError(null)
      try {
        const resolvedParams = await params
        const treatmentSlug = resolvedParams.slug

        console.log('Fetching treatment with slug:', treatmentSlug)

        const res = await fetch('/api/hospitals')
        if (!res.ok) throw new Error("Failed to fetch hospitals")
        const data = await res.json()

        if (data.items && data.items.length > 0) {
          let foundTreatment = null
          let allDoctorsOffering: any[] = []
          const hospitalData = new Map()

          // Search through all hospitals and their branches
          for (const hospitalItem of data.items) {
            if (!hospitalItem.branches || !Array.isArray(hospitalItem.branches)) continue

            for (const branchItem of hospitalItem.branches) {
              // Check if this branch offers the treatment
              if (branchItem.treatments && Array.isArray(branchItem.treatments)) {
                for (const treatmentItem of branchItem.treatments) {
                  const treatmentNameSlug = generateSlug(treatmentItem.name)
                  
                  if (treatmentNameSlug === treatmentSlug) {
                    // Found the treatment
                    if (!foundTreatment) {
                      foundTreatment = treatmentItem
                    }
                    const hospitalId = hospitalItem._id
                    if (!hospitalData.has(hospitalId)) {
                      hospitalData.set(hospitalId, {
                        hospital: hospitalItem,
                        branches: new Set(),
                        doctors: new Set()
                      })
                    }
                    const current = hospitalData.get(hospitalId)!
                    current.branches.add(branchItem._id || branchItem.name)
                  }
                }
              }

              // Find doctors offering this exact treatment
              if (branchItem.doctors && Array.isArray(branchItem.doctors)) {
                for (const doctor of branchItem.doctors) {
                  const hasExactTreatment = doctor.treatments?.some((t: any) => 
                    generateSlug(t.name || '') === treatmentSlug
                  )
                  
                  if (hasExactTreatment) {
                    const hospitalId = hospitalItem._id
                    if (!hospitalData.has(hospitalId)) {
                      hospitalData.set(hospitalId, {
                        hospital: hospitalItem,
                        branches: new Set(),
                        doctors: new Set()
                      })
                    }
                    const current = hospitalData.get(hospitalId)!
                    current.doctors.add(doctor._id)
                    current.branches.add(branchItem._id || branchItem.name)
                    
                    allDoctorsOffering.push({
                      ...doctor,
                      hospitalName: hospitalItem.name,
                      branchName: branchItem.name || '',
                      hospitalSlug: hospitalItem.slug || generateSlug(hospitalItem.name),
                      branchSlug: generateSlug(branchItem.name || '')
                    })
                  }
                }
              }
            }
          }

          // Remove duplicate doctors and aggregate their hospital branches
          const uniqueDoctors = getUniqueDoctorsWithHospitalBranches(allDoctorsOffering)
          
          // Prepare hospitals offering data
          const hospitalsOfferingTreatment = Array.from(hospitalData.values()).map(({ hospital, branches, doctors }) => ({
            ...hospital,
            branchCount: branches.size,
            specialistCount: doctors.size
          }))

          if (foundTreatment || uniqueDoctors.length > 0) {
            if (!foundTreatment) {
              const words = treatmentSlug.split('-')
              const treatmentName = words.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
              foundTreatment = {
                name: treatmentName,
                description: `Specialized ${treatmentName.toLowerCase()} treatment provided by expert doctors across our network of hospitals. Our team of ${uniqueDoctors.length} specialist doctors ensures you receive the highest quality care using the latest medical advancements.`,
                category: treatmentName
              }
            }

            console.log('Found treatment:', foundTreatment.name)
            console.log('Unique doctors offering treatment:', uniqueDoctors.length)
            console.log('Hospitals offering treatment:', hospitalsOfferingTreatment.length)
            
            setTreatment(foundTreatment)
            setSpecialistDoctors(uniqueDoctors)
            setAllHospitals(hospitalsOfferingTreatment)
            setTreatmentCategory(foundTreatment.name)
          } else {
            throw new Error("Treatment not found")
          }
        } else {
          throw new Error("No hospitals available")
        }
      } catch (err) {
        console.error('Error fetching treatment:', err)
        setError(err instanceof Error ? err.message : "Failed to load treatment details")
      } finally {
        setLoading(false)
      }
    }

    fetchTreatmentData()
  }, [params])

  // Loading State with Skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <HeroSkeleton />
        <Breadcrumb treatmentName="Treatment Name" />
        <section className="py-12 relative z-10">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-12 gap-8">
              <main className="lg:col-span-9 space-y-8">
                <OverviewSkeleton />
                <SidebarSkeleton />
              </main>
              <SidebarSkeleton />
            </div>
          </div>
        </section>
      </div>
    )
  }

  // Error State
  if (error || !treatment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 p-6 relative">
        <Breadcrumb treatmentName="Treatment Name" />
        <div className="text-center space-y-6 max-w-md p-8 bg-white rounded-xs shadow-xs border border-gray-100">
          <Scissors className="w-16 h-16 text-gray-300 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">Treatment Not Found</h2>
          <p className="text-gray-600 leading-relaxed">{error || "The requested treatment could not be found. Please check the URL or try searching again."}</p>
          <Link
            href="/treatments"
            className="inline-block w-full bg-gray-100 text-white px-6 py-3 rounded-xs hover:bg-indigo-700 transition-all font-semibold shadow-xs hover:shadow-md"
          >
            Browse All Treatments
          </Link>
        </div>
      </div>
    )
  }

  // Derived Data
  const treatmentImage = treatment?.treatmentImage ? getTreatmentImage(treatment.treatmentImage) : null
  const heroImage = treatmentImage

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Header */}
      <section className="relative w-full h-[70vh]">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={`${treatment.name} treatment`}
            fill
            priority
            className="object-cover object-center"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full z-10 px-6 pb-12 text-white">
          <div className="container mx-auto space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              {treatment.name}
            </h1>
            <p className="text-lg max-w-2xl leading-relaxed text-gray-200">
              {treatment.category || 'Specialized Treatment'} 
              {specialistDoctors.length > 0 && ` - ${specialistDoctors.length} Specialist Doctors Available`}
            </p>
            {treatment.cost && (
              <div className="flex flex-wrap gap-3 mt-4">
                <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xs text-sm font-semibold border border-white/20">
                  <Award className="w-4 h-4" />
                  Starting from ${treatment.cost}
                </span>
                {treatment.duration && (
                  <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xs text-sm font-semibold border border-white/20">
                    <Calendar className="w-4 h-4" />
                    {treatment.duration}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <Breadcrumb treatmentName={treatment.name} />

      {/* Main Content */}
      <section className="py-12 relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-8">
            <main className="lg:col-span-9 space-y-8">
              {/* Treatment Overview */}
              <section className="bg-white rounded-xs shadow-xs p-8 border border-gray-100 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">About This Treatment</h2>
                <div className="">
                  {treatment.description && (
                    <div className="prose prose-neutral prose-lg space-y-3 max-w-none">
                      {renderRichText(treatment.description)}
                    </div>
                  )}
                  <div className="grid md:grid-cols-3 gap-6 mt-8">
                    {treatment.category && (
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xs border border-gray-100">
                        <div className="w-3 h-3 bg-gray-100 rounded-full flex-shrink-0"></div>
                        <div>
                          <p className="font-semibold text-gray-900 text-xs uppercase tracking-wide">Category</p>
                          <p className="text-gray-700 text-sm">{treatment.category}</p>
                        </div>
                      </div>
                    )}
                    {treatment.duration && (
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xs border border-gray-100">
                        <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900 text-xs uppercase tracking-wide">Duration</p>
                          <p className="text-gray-700 text-sm">{treatment.duration}</p>
                        </div>
                      </div>
                    )}
                    {treatment.cost && (
                      <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xs border border-indigo-100">
                        <Award className="w-5 h-5 text-gray-600 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900 text-xs uppercase tracking-wide">Estimated Cost</p>
                          <p className="text-gray-600 font-bold text-sm">${treatment.cost}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Specialist Doctors Section */}
              {specialistDoctors.length > 0 && (
                <SpecialistDoctorsCarousel
                  doctors={specialistDoctors}
                  title={`Doctors Offering ${treatment.name}`}
                />
              )}

              {/* Hospitals Offering Treatment Section */}
              {allHospitals.length > 0 && (
                <HospitalsOfferingTreatmentCarousel 
                  hospitals={allHospitals} 
                  treatmentName={treatment.name}
                />
              )}
            </main>

            {/* Sidebar */}
            <aside className="lg:col-span-3 space-y-8">
              <ContactForm />
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}