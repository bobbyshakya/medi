// File: app/hospitals/branches/[slug]/page.tsx
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
import Slider from "react-slick"
import classNames from "classnames"
import ContactForm from "@/components/ContactForm"
import { Inter } from "next/font/google"

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
  <nav className={`bg-white border-b border-gray-100 py-6 ${inter.variable} font-light`}>
    <div className="container mx-auto px-6">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/" className="flex items-center gap-1 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400/50 rounded-xs">
          <Home className="w-4 h-4" />
          Home
        </Link>
        <span>/</span>
        <Link href="/hospitals" className="hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400/50 rounded-xs">
          Hospitals
        </Link>
        <span>/</span>
        <Link href={`/hospitals/${hospitalSlug}`} className="hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400/50 rounded-xs">
          {hospitalName}
        </Link>
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

// BranchCard (redirects to hospital search with filter)
const BranchCard = ({ branch, branchImage, hospitalName }: { branch: any; branchImage: string | null; hospitalName: string }) => {
  const firstCity = branch.city?.[0]?.cityName || 'N/A'
  const fullSlug = `${generateSlug(hospitalName)}-${generateSlug(branch.branchName)}`
  return (
    <Link href={`/hospitals/branches/${fullSlug}`} className="block h-full focus:outline-none focus:ring-2 focus:ring-gray-400/50 border border-gray-100 rounded-xs shadow-sm hover:shadow-md transition-shadow">
      <div className="relative w-full h-48 overflow-hidden bg-gray-50 rounded-t-lg">
        {branchImage ? (
          <img 
            src={branchImage} 
            alt={`${branch.branchName} branch facility`} 
            className="object-cover w-full h-full" 
            style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}} 
            onError={(e) => { e.currentTarget.style.display = "none" }} 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Hospital className="w-12 h-12 text-gray-300" />
          </div>
        )}
      </div>
      <div className={`p-6 space-y-2 border-t border-gray-100 ${inter.variable} font-light`}>
        <h3 className="text-xl md:text-xl font-medium text-gray-900 leading-tight line-clamp-1">{branch.branchName}</h3>
        <div className="flex items-center gap-1 text-base text-gray-800">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span>{firstCity}</span>
        </div>
      </div>
    </Link>
  )
}

// DoctorCard (redirects to hospital search with doctor filter)
const DoctorCard = ({ doctor }: { doctor: any }) => {
  const doctorImage = getDoctorImage(doctor.profileImage)
  const specializationDisplay = useMemo(() => {
    if (!doctor.specialization) return "General Practitioner"
    if (Array.isArray(doctor.specialization)) {
      const names = doctor.specialization
        .map((spec: any) => typeof spec === 'object' ? spec?.name : spec)
        .filter(Boolean)
      return names.join(', ') || "General Practitioner"
    }
    return doctor.specialization as string
  }, [doctor.specialization])
  const doctorSlug = generateSlug(doctor.doctorName)
  return (
    <Link href={`/doctors/${doctorSlug}`} className="group flex flex-col h-full bg-white border border-gray-100 rounded-xs shadow-sm hover:shadow-md overflow-hidden transition-all focus:outline-none focus:ring-2 focus:ring-gray-400/50">
      <div className="relative h-60 overflow-hidden bg-gray-50 rounded-t-lg">
        {doctorImage ? (
          <img 
            src={doctorImage} 
            alt={`${doctor.doctorName}, ${specializationDisplay}`} 
            className="object-cover group-hover:scale-105 transition-transform duration-300 w-full h-full" 
            style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}} 
            onError={(e) => { e.currentTarget.style.display = "none" }} 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Stethoscope className="w-12 h-12 text-gray-300" />
          </div>
        )}
      </div>
      <div className={`p-6 flex-1 flex flex-col ${inter.variable} font-light`}>
        <h3 className="text-xl md:text-xl font-medium text-gray-900 leading-tight mb-1 line-clamp-1">{doctor.doctorName}</h3>
      <div className="flex gap-1">
          <p className="text-gray-800 text-base flex items-center ">{specializationDisplay},</p>
        {doctor.experienceYears && (
          
          <p className="text-gray-800 text-base  flex items-center ">
        
            {doctor.experienceYears} years of exp
          </p>
        )}
      </div>
        {/* <p className="text-gray-600 text-xs line-clamp-2 flex-1">{getShortDescription(doctor.aboutDoctorHtml)}</p> */}
      </div>
    </Link>
  )
}

// TreatmentCard
const TreatmentCard = ({ item }: { item: any }) => {
  const treatmentImage = getTreatmentImage(item.treatmentImage || item.image)
  const itemSlug = generateSlug(item.name)
  return (
    <Link href={`/treatment/${itemSlug}`} className="group flex flex-col h-full bg-white border border-gray-100 rounded-xs shadow-sm hover:shadow-md overflow-hidden transition-all focus:outline-none focus:ring-2 focus:ring-gray-400/50">
      <div className="relative h-48 overflow-hidden bg-gray-50 rounded-t-lg">
        {treatmentImage ? (
          <img 
            src={treatmentImage} 
            alt={`${item.name} treatment`} 
            className="object-cover group-hover:scale-105 transition-transform duration-300 w-full h-full" 
            style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}} 
            onError={(e) => { e.currentTarget.style.display = "none" }} 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Scissors className="w-12 h-12 text-gray-300" />
          </div>
        )}
      </div>
      <div className={`p-6 flex-1 flex flex-col ${inter.variable} font-light`}>
        <h3 className="text-xl md:text-xl font-medium text-gray-900 leading-tight line-clamp-1">{item.name}</h3>
      </div>
    </Link>
  )
}

// DoctorsList
const DoctorsList = ({ doctors }: { doctors: any[] }) => {
  const router = useRouter()
  const [showAll, setShowAll] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const initialDisplayCount = 3
  const doctorsToDisplay = showAll ? doctors : doctors.slice(0, initialDisplayCount)
  const hasMore = doctors.length > initialDisplayCount

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
      <div className={`bg-white p-8 rounded-xs shadow-sm border border-gray-100 text-center ${inter.variable} font-light`}>
        <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No doctors available at this branch</p>
      </div>
    )
  }

  return (
    <section className={`bg-white rounded-xs shadow-sm border border-gray-100 ${inter.variable} font-light`}>
      <div className="px-8 pt-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-6">
          <h2 className="text-2xl md:text-2xl font-medium text-gray-900 tracking-tight flex items-center gap-3">
            Our Specialist Doctors 
            {/* ({doctors.length}) */}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-8 pb-8">
        {doctorsToDisplay.filter(doctor => doctor?._id).map((doctor) => <DoctorCard key={doctor._id} doctor={doctor} />)}
      </div>
      {hasMore && (
        <div className="p-8 pt-0 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 bg-gray-50/50 text-gray-700 px-6 py-3 rounded-xs hover:bg-gray-100 transition-all font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400/50"
          >
            {showAll ? (
              <>
                <ChevronLeft className="w-5 h-5" />
                Show Less
              </>
            ) : (
              <>
                Show All {doctors.length} Doctors
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      )}
    </section>
  )
}

// DoctorSearchCard
const DoctorSearchCard = ({ doctor, onClick }: { doctor: any; onClick: () => void }) => {
  const doctorImage = getDoctorImage(doctor.profileImage)
  const specializationDisplay = useMemo(() => {
    if (!doctor.specialization) return "General Practitioner"
    if (Array.isArray(doctor.specialization)) {
      const names = doctor.specialization.map((spec: any) => typeof spec === 'object' ? spec?.name : spec).filter(Boolean)
      return names.join(', ') || "General Practitioner"
    }
    return doctor.specialization as string
  }, [doctor.specialization])
  const doctorSlug = generateSlug(doctor.doctorName)
  return (
    <Link
      href={`/doctors/${doctorSlug}`}
      onClick={onClick}
      className="flex items-center gap-4 p-6 hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-b-0"
    >
      <div className="relative w-16 h-16 flex-shrink-0">
        {doctorImage ? (
          <img 
            src={doctorImage} 
            alt={doctor.doctorName} 
            className="object-cover rounded-full w-full h-full" 
            style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}} 
            onError={(e) => { e.currentTarget.style.display = "none" }} 
          />
        ) : (
          <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
            <Stethoscope className="w-8 h-8 text-gray-300" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{doctor.doctorName}</h4>
        <p className="text-sm text-gray-600 truncate">{specializationDisplay}</p>
        {doctor.experienceYears && <p className="text-xs text-gray-700 mt-1">{doctor.experienceYears} years experience</p>}
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
    </Link>
  )
}

// TreatmentsList
const TreatmentsList = ({ treatments }: { treatments: any[] }) => {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  const treatmentOptions = useMemo(() => {
    return treatments.filter(treatment => treatment?._id && treatment.name).map((treatment) => ({
      id: treatment._id,
      name: treatment.name
    }))
  }, [treatments])

  const handleTreatmentSelect = useCallback((id: string) => {
    const treatment = treatments.find(t => t._id === id)
    if (treatment) {
      setSearchTerm("")
      const treatmentSlug = generateSlug(treatment.name)
      router.push(`/treatment/${treatmentSlug}`)
    }
  }, [treatments, router])

  if (!treatments?.length) {
    return (
      <div className={`bg-white p-8 rounded-xs shadow-sm border border-gray-100 text-center ${inter.variable} font-light`}>
        <Scissors className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No treatments available at this branch</p>
      </div>
    )
  }

  return (
    <section className={`bg-white rounded-xs shadow-sm border border-gray-100 ${inter.variable} font-light`}>
      <div className="p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <h2 className="text-2xl md:text-3xl font-medium text-gray-900 tracking-tight flex items-center gap-3">
            <Scissors className="w-7 h-7" />
            Available Treatments ({treatments.length})
          </h2>
          <div className="relative w-full md:w-80">
            <SearchDropdown
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search treatments by name..."
              options={treatmentOptions}
              selectedOption={null}
              onOptionSelect={handleTreatmentSelect}
              onClear={() => setSearchTerm("")}
              type="treatment"
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-8 pb-8">
        {treatments.filter(treatment => treatment?._id).map((treatment) => <TreatmentCard key={treatment._id} item={treatment} />)}
      </div>
    </section>
  )
}

// TreatmentSearchCard
const TreatmentSearchCard = ({ treatment, onClick }: { treatment: any; onClick: () => void }) => {
  const treatmentImage = getTreatmentImage(treatment.treatmentImage || treatment.image)
  const treatmentSlug = generateSlug(treatment.name)
  return (
    <Link
      href={`/treatment/${treatmentSlug}`}
      onClick={onClick}
      className="flex items-center gap-4 p-6 hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-b-0"
    >
      <div className="relative w-16 h-16 flex-shrink-0">
        {treatmentImage ? (
          <img 
            src={treatmentImage} 
            alt={treatment.name} 
            className="object-cover rounded-full w-full h-full" 
            style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}} 
            onError={(e) => { e.currentTarget.style.display = "none" }} 
          />
        ) : (
          <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
            <Scissors className="w-8 h-8 text-gray-300" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{treatment.name}</h4>
        <p className="text-sm text-gray-600 truncate">{getShortDescription(treatment.description, 50)}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
    </Link>
  )
}

// BranchSearchCard (redirects to hospital search with filter)
const BranchSearchCard = ({ branch, onClick, hospitalName }: { branch: any; onClick: () => void; hospitalName: string | null }) => {
  const branchImage = getBranchImage(branch.branchImage)
  const city = branch.city?.[0]?.cityName || 'N/A'
  const fullSlug = hospitalName ? `${generateSlug(hospitalName)}-${generateSlug(branch.branchName)}` : generateSlug(branch.branchName)
  return (
    <Link
      href={`/hospitals/branches/${fullSlug}`}
      onClick={onClick}
      className="flex items-center gap-4 p-6 hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-b-0"
    >
      <div className="relative w-16 h-16 flex-shrink-0">
        {branchImage ? (
          <img 
            src={branchImage} 
            alt={branch.branchName} 
            className="object-cover rounded-full w-full h-full" 
            style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}} 
            onError={(e) => { e.currentTarget.style.display = "none" }} 
          />
        ) : (
          <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
            <Hospital className="w-8 h-8 text-gray-300" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{branch.branchName}</h4>
        <p className="text-sm text-gray-600 truncate">{city}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
    </Link>
  )
}

// SimilarBranchesList (Slick Carousel)
const SimilarBranchesList = ({ branches, currentCityDisplay }: { branches: any[]; currentCityDisplay: string }) => {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const settings = {
    dots: false,
    infinite: branches.length > 3,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: true,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2, slidesToScroll: 1, infinite: branches.length > 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1, slidesToScroll: 1, infinite: branches.length > 1 } }
    ]
  }

  const branchOptions = useMemo(() => {
    return branches
      .filter(branch => branch?._id && branch.branchName)
      .map((branch) => ({
        id: branch._id,
        name: `${branch.branchName}${branch.city?.[0]?.cityName ? ` - ${branch.city[0].cityName}` : ''}`
      }))
  }, [branches])

  const handleBranchSelect = useCallback((id: string) => {
    const branchItem = branches.find(b => b._id === id)
    if (branchItem) {
      setSearchTerm("")
      const fullSlug = `${generateSlug(branchItem.hospitalName)}-${generateSlug(branchItem.branchName)}`
      router.push(`/hospitals/branches/${fullSlug}`)
    }
  }, [branches, router])

  if (!branches?.length) {
    return (
      <div className={`bg-white p-8 rounded-xs shadow-sm border border-gray-100 text-center ${inter.variable} font-light`}>
        <Hospital className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No other hospitals available in {currentCityDisplay}</p>
      </div>
    )
  }

  return (
    <section className={`bg-white rounded-xs shadow-sm border border-gray-100 ${inter.variable} font-light`}>
      <div className="px-8 py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-0">
          <h2 className="text-2xl md:text-2xl font-medium text-gray-900 tracking-tight flex items-center gap-3">
            <Hospital className="w-7 h-7" />
            Other Hospitals in {currentCityDisplay}
             {/* ({branches.length}) */}
          </h2>
          <div className="relative w-full md:w-80">
            <SearchDropdown
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search hospitals by name or city..."
              options={branchOptions}
              selectedOption={null}
              onOptionSelect={handleBranchSelect}
              onClear={() => setSearchTerm("")}
              type="branch"
            />
          </div>
        </div>
      </div>
      <div className="px-8 pb-8">
        <Slider {...settings}>
          {branches
            .filter(branchItem => branchItem?._id && branchItem.hospitalName)
            .map((branchItem) => {
              const branchImage = getBranchImage(branchItem.branchImage)
              return (
                <div key={branchItem._id} className="px-2">
                  <BranchCard branch={branchItem} branchImage={branchImage} hospitalName={branchItem.hospitalName} />
                </div>
              )
            })}
        </Slider>
      </div>
    </section>
  )
}

// StatCard
const StatCard = ({ icon: Icon, value, label, showPlus = true }: { icon: any; value: string | number; label: string; showPlus?: boolean }) => (
 <div
  className={`text-center p-8 bg-white/50 rounded-xs border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 ${inter.variable} font-light flex flex-col items-center justify-center`}
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
        {getIcon()}
        <input
          type="text"
          value={isOpen ? value : selectedOptionName}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xs focus:outline-none focus:ring-2 focus:ring-gray-400/50 bg-white text-gray-900 placeholder-gray-500 shadow-sm"
        />
        {(selectedOption || value) && (
          <button onClick={onClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1">
            <X className="w-4 h-4" />
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
                  setIsOpen(false)
                }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                  option.id === selectedOption ? 'bg-gray-700 text-white' : 'text-gray-700 hover:bg-gray-50'
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

// HospitalSearchTabs
const HospitalSearchTabs = ({ view, setView }: { view: 'hospital' | 'doctors' | 'treatments'; setView: (view: 'hospital' | 'doctors' | 'treatments') => void }) => (
  <div className="flex bg-gray-100/50 rounded-xs p-1 mb-6 shadow-sm">
    {['hospital', 'doctors', 'treatments'].map((tab) => (
      <button
        key={tab}
        onClick={() => setView(tab as any)}
        className={`flex-1 py-2.5 rounded-xs text-sm font-medium transition-colors ${
          view === tab ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        {tab.charAt(0).toUpperCase() + tab.slice(1)}
      </button>
    ))}
  </div>
)

// HospitalSearch
const HospitalSearch = ({ allHospitals }: { allHospitals: any[] }) => {
  const router = useRouter()
  const [view, setView] = useState<'hospital' | 'doctors' | 'treatments'>('hospital')
  const [branchQuery, setBranchQuery] = useState("")
  const [cityQuery, setCityQuery] = useState("")
  const [treatmentQuery, setTreatmentQuery] = useState("")
  const [doctorQuery, setDoctorQuery] = useState("")
  const [specializationQuery, setSpecializationQuery] = useState("")
  const [selectedBranchId, setSelectedBranchId] = useState("")
  const [selectedCityId, setSelectedCityId] = useState("")
  const [selectedTreatmentId, setSelectedTreatmentId] = useState("")
  const [selectedDoctorId, setSelectedDoctorId] = useState("")
  const [selectedSpecializationId, setSelectedSpecializationId] = useState("")

  const getFilteredBranches = useMemo(() => {
    let filteredHospitals = allHospitals.filter(h => h?.branches)
    let branches = filteredHospitals.flatMap((h: any) =>
      h.branches.filter((b: any) => b?.branchName).map((b: any) => ({ b, h }))
    )
    if (selectedCityId) {
      branches = branches.filter(({ b }) => b.city?.some((c: any) => c?._id === selectedCityId))
    }
    if (selectedBranchId) {
      branches = branches.filter(({ b }) => b._id === selectedBranchId)
    }
    return branches
  }, [allHospitals, selectedCityId, selectedBranchId])

  const availableBranchOptions = useMemo(() => {
    const branchMap = new Map<string, string>()
    getFilteredBranches.forEach(({ b }) => {
      if (b?._id && b.branchName) branchMap.set(b._id, b.branchName)
    })
    return Array.from(branchMap.entries()).map(([id, name]) => ({ id, name }))
  }, [getFilteredBranches])

  const availableCityOptions = useMemo(() => {
    const branches = allHospitals.flatMap((h: any) => h.branches || []).filter(b => b?.city)
    let cities = branches.flatMap((b: any) => b.city.map((c: any) => ({ c })))
    if (selectedBranchId) {
      const selectedBranch = getFilteredBranches.find(({ b }) => b._id === selectedBranchId)?.b
      cities = selectedBranch?.city ? selectedBranch.city.map((c: any) => ({ c })) : []
    }
    const cityMap = new Map<string, string>()
    cities.forEach(({ c }) => {
      if (c?._id && c.cityName) cityMap.set(c._id, c.cityName)
    })
    return Array.from(cityMap.entries()).map(([id, name]) => ({ id, name }))
  }, [getFilteredBranches, allHospitals, selectedBranchId])

  const availableTreatmentOptions = useMemo(() => {
    let treatments = getFilteredBranches.flatMap(({ h, b }) => [...(h.treatments || []), ...(b.treatments || [])]).filter(t => t?.name)
    if (getFilteredBranches.length === 0) {
      treatments = allHospitals.flatMap((h: any) => [...(h.treatments || []), ...(h.branches || []).flatMap((b: any) => b.treatments || [])]).filter(t => t?.name)
    }
    const treatMap = new Map<string, string>()
    treatments.forEach((t: any) => {
      if (t?._id && t.name) treatMap.set(t._id, t.name)
    })
    return Array.from(treatMap.entries()).map(([id, name]) => ({ id, name }))
  }, [getFilteredBranches, allHospitals])

  const availableDoctorOptions = useMemo(() => {
    let doctors = getFilteredBranches.flatMap(({ h, b }) => [...(h.doctors || []), ...(b.doctors || [])]).filter(d => d?.doctorName)
    if (getFilteredBranches.length === 0) {
      doctors = allHospitals.flatMap((h: any) => [...(h.doctors || []), ...(h.branches || []).flatMap((b: any) => b.doctors || [])]).filter(d => d?.doctorName)
    }
    const docMap = new Map<string, string>()
    doctors.forEach((d: any) => {
      if (d?._id && d.doctorName) docMap.set(d._id, d.doctorName)
    })
    return Array.from(docMap.entries()).map(([id, name]) => ({ id, name }))
  }, [getFilteredBranches, allHospitals])

  const availableSpecializationOptions = useMemo(() => {
    let doctors = getFilteredBranches.flatMap(({ h, b }) => [...(h.doctors || []), ...(b.doctors || [])]).filter(d => d?.doctorName)
    if (getFilteredBranches.length === 0) {
      doctors = allHospitals.flatMap((h: any) => [...(h.doctors || []), ...(h.branches || []).flatMap((b: any) => b.doctors || [])]).filter(d => d?.doctorName)
    }
    const specMap = new Map<string, string>()
    doctors.forEach((d: any) => {
      const specs = d?.specialization
      if (Array.isArray(specs)) {
        specs.forEach((spec: any) => {
          const id = spec?._id || (typeof spec === 'string' ? spec : '')
          const name = spec?.name || (typeof spec === 'string' ? spec : '')
          if (id && name) specMap.set(id, name)
        })
      } else if (specs && typeof specs === 'string') {
        specMap.set(specs, specs)
      }
    })
    return Array.from(specMap.entries()).map(([id, name]) => ({ id, name }))
  }, [getFilteredBranches, allHospitals])

  const handleSelect = useCallback((id: string, setterQuery: (name: string) => void, setterSelected: (id: string) => void, options: any[], type: string) => {
    const option = options.find(o => o.id === id)
    if (option) {
      setterSelected(id)
      setterQuery(option.name)
      if (type === 'city' && selectedBranchId && !getFilteredBranches.find(({ b }) => b._id === selectedBranchId)) {
        setSelectedBranchId("")
        setBranchQuery("")
      }
    }
  }, [getFilteredBranches, selectedBranchId])

  const handleBranchSelect = useCallback((id: string) => {
    const selected = getFilteredBranches.find(({ b }) => b._id === id)
    if (selected) {
      const fullSlug = `${generateSlug(selected.h.hospitalName)}-${generateSlug(selected.b.branchName)}`
      router.push(`/hospitals/branches/${fullSlug}`)
    }
  }, [getFilteredBranches, router])

  const handleCitySelect = useCallback((id: string) => handleSelect(id, setCityQuery, setSelectedCityId, availableCityOptions, 'city'), [handleSelect, availableCityOptions])

  const handleTreatmentSelect = useCallback((id: string) => {
    const option = availableTreatmentOptions.find(o => o.id === id)
    if (option) {
      const treatmentSlug = generateSlug(option.name)
      router.push(`/treatment/${treatmentSlug}`)
    }
  }, [availableTreatmentOptions, router])

  const handleDoctorSelect = useCallback((id: string) => {
    const option = availableDoctorOptions.find(o => o.id === id)
    if (option) {
      const doctorSlug = generateSlug(option.name)
      router.push(`/doctors/${doctorSlug}`)
    }
  }, [availableDoctorOptions, router])

  const handleSpecializationSelect = useCallback((id: string) => handleSelect(id, setSpecializationQuery, setSelectedSpecializationId, availableSpecializationOptions, 'specialty'), [handleSelect, availableSpecializationOptions])

  // Clear invalid selections (consolidated)
  useEffect(() => {
    const selectors = [
      { selected: selectedBranchId, options: availableBranchOptions, setters: [setSelectedBranchId, setBranchQuery] },
      { selected: selectedCityId, options: availableCityOptions, setters: [setSelectedCityId, setCityQuery] },
      { selected: selectedTreatmentId, options: availableTreatmentOptions, setters: [setSelectedTreatmentId, setTreatmentQuery] },
      { selected: selectedDoctorId, options: availableDoctorOptions, setters: [setSelectedDoctorId, setDoctorQuery] },
      { selected: selectedSpecializationId, options: availableSpecializationOptions, setters: [setSelectedSpecializationId, setSpecializationQuery] }
    ]
    selectors.forEach(({ selected, options, setters }) => {
      if (selected && !options.find(o => o.id === selected)) {
        setters.forEach(setter => setter(""))
      }
    })
  }, [availableBranchOptions, availableCityOptions, availableTreatmentOptions, availableDoctorOptions, availableSpecializationOptions, selectedBranchId, selectedCityId, selectedTreatmentId, selectedDoctorId, selectedSpecializationId])

  const clearFilters = () => {
    setBranchQuery(""); setCityQuery(""); setTreatmentQuery(""); setDoctorQuery(""); setSpecializationQuery("")
    setSelectedBranchId(""); setSelectedCityId(""); setSelectedTreatmentId(""); setSelectedDoctorId(""); setSelectedSpecializationId("")
    setView('hospital')
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    let url = '/hospitals?'
    let params: string[] = []
    if (view !== 'hospital') params.push(`view=${view}`)
    if (branchQuery) params.push(`branch=${encodeURIComponent(branchQuery)}`)
    if (cityQuery) params.push(`city=${encodeURIComponent(cityQuery)}`)
    if (treatmentQuery) params.push(`treatment=${encodeURIComponent(treatmentQuery)}`)
    if (view === 'doctors') {
      if (doctorQuery) params.push(`doctor=${encodeURIComponent(doctorQuery)}`)
      if (specializationQuery) params.push(`specialization=${encodeURIComponent(specializationQuery)}`)
    }
    router.push(params.length > 0 ? url + params.join('&') : '/hospitals')
  }

  return (
    <div className={`bg-white p-6 rounded-xs shadow-sm border border-gray-100 ${inter.variable} font-light`}>
      <h3 className="text-xl md:text-2xl font-medium text-gray-900 tracking-tight mb-6">Find Your Hospital</h3>
      <HospitalSearchTabs view={view} setView={setView} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <SearchDropdown
          value={cityQuery}
          onChange={setCityQuery}
          placeholder="Search by city..."
          options={availableCityOptions}
          selectedOption={selectedCityId}
          onOptionSelect={handleCitySelect}
          onClear={() => { setCityQuery(""); setSelectedCityId(""); }}
          type="city"
        />
        <SearchDropdown
          value={branchQuery}
          onChange={setBranchQuery}
          placeholder="Search by branch name..."
          options={availableBranchOptions}
          selectedOption={selectedBranchId}
          onOptionSelect={handleBranchSelect}
          onClear={() => { setBranchQuery(""); setSelectedBranchId(""); }}
          type="branch"
        />
        {view !== 'doctors' && (
          <SearchDropdown
            value={treatmentQuery}
            onChange={setTreatmentQuery}
            placeholder="Search treatments..."
            options={availableTreatmentOptions}
            selectedOption={selectedTreatmentId}
            onOptionSelect={handleTreatmentSelect}
            onClear={() => { setTreatmentQuery(""); setSelectedTreatmentId(""); }}
            type="treatment"
          />
        )}
        {view === 'doctors' && (
          <>
            <SearchDropdown
              value={doctorQuery}
              onChange={setDoctorQuery}
              placeholder="Search doctors by name..."
              options={availableDoctorOptions}
              selectedOption={selectedDoctorId}
              onOptionSelect={handleDoctorSelect}
              onClear={() => { setDoctorQuery(""); setSelectedDoctorId(""); }}
              type="doctor"
            />
            <SearchDropdown
              value={specializationQuery}
              onChange={setSpecializationQuery}
              placeholder="Search specializations..."
              options={availableSpecializationOptions}
              selectedOption={selectedSpecializationId}
              onOptionSelect={handleSpecializationSelect}
              onClear={() => { setSpecializationQuery(""); setSelectedSpecializationId(""); }}
              type="specialty"
            />
          </>
        )}
        <button type="submit" className="w-full bg-gray-700 text-white py-3 rounded-xs hover:bg-gray-800 transition-all font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400/50">
          Search & Redirect
        </button>
        <button type="button" onClick={clearFilters} className="w-full bg-gray-50/50 text-gray-600 py-3 rounded-xs hover:bg-gray-100 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400/50">
          Clear All Filters
        </button>
      </form>
      <p className="text-xs text-gray-500 mt-3 text-center">Redirects to hospital directory with auto-filled filters</p>
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
  <div className={`bg-white p-8 rounded-xs shadow-sm border border-gray-100 animate-pulse ${inter.variable} font-light`}>
    <div className="h-8 bg-gray-300 rounded w-48 mb-6" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-60 bg-gray-200 rounded-xs" />)}
    </div>
  </div>
)

const FacilitiesSkeleton = () => (
  <div className={`bg-white p-8 rounded-xs shadow-sm border border-gray-100 animate-pulse ${inter.variable} font-light`}>
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

// Main Component
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
              return expectedBranchSlug === branchSlug
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

  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-50 ${inter.variable} font-light`}>
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
        <div className="text-center space-y-6 max-w-md p-10 bg-white rounded-xs shadow-sm border border-gray-100">
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
  const similarBranches = allHospitals
    .filter((h: any) => h?._id !== hospital._id && h.branches)
    .flatMap((h: any) =>
      h.branches
        .filter((b: any) => b.city?.some((c: any) => currentCities.includes(c?.cityName)))
        .map((b: any) => ({ ...b, hospitalName: h.hospitalName }))
    )
  const currentCityDisplay = currentCities.length > 0 ? currentCities.join(', ') : 'Nearby Locations'
  const firstSpecialtyName = branch.specialization?.[0]?.name || 'N/A'

  return (
    <div className={`min-h-screen bg-gray-50 ${inter.variable} font-light`}>
      <section className="relative w-full h-[70vh] bg-gray-50">
        {heroImage && (
          <img
            src={heroImage}
            alt={`${branch.branchName} - ${hospital.hospitalName}`}
            className="object-cover w-full h-full"
            style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
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
          <div className="container mx-auto px-6 space-y-6">
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
                <h1 className="text-3xl md:text-4xl font-medium text-white mb-1 leading-tight">{branch.branchName}</h1>
                <div className="flex flex-wrap gap-x-2 mt-0 text-lg text-white/80">
                  {branch.specialization?.slice(0, 3).map((spec: any) => <span key={spec._id}>{spec.name} Speciality</span>)}
                  {branch.specialization?.length > 3 && <span className="text-white/60">+{branch.specialization.length - 3} more</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
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

      <section className="py-16 relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-8">
            <main className="lg:col-span-9 space-y-8">
              <div className={`bg-white p-6 rounded-xs shadow-sm border border-gray-100 ${inter.variable} font-light`}>
                <h2 className="text-2xl md:text-2xl font-medium text-gray-900 tracking-tight flex items-center gap-3 mb-6">Quick Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <StatCard icon={Bed} value={branch.totalBeds || 'N/A'} label="Bed Capacity" showPlus={true} />
                  <StatCard icon={Users} value={branch.noOfDoctors || 'N/A'} label=" Staff" showPlus={true} />
                  <StatCard icon={Heart} value={firstSpecialtyName} label="Specialty" showPlus={false} />
                  <StatCard icon={Calendar} value={hospital.yearEstablished || 'N/A'} label="Established" showPlus={false} />
                </div>
              </div>

              {branch.aboutBranchHtml && (
                <section className={`bg-white p-8 rounded-xs shadow-sm border border-gray-100 ${inter.variable} font-light`}>
                  <h2 className="text-2xl md:text-3xl font-medium text-gray-900 tracking-tight mb-6">About {branch.branchName}</h2>
                  {renderRichText(branch.aboutBranchHtml)}
                </section>
              )}

              {branch.facilities?.length > 0 && (
                <section className={`bg-white p-8 rounded-xs shadow-sm border border-gray-100 ${inter.variable} font-light`}>
                  <h2 className="text-2xl md:text-3xl font-medium text-gray-900 tracking-tight mb-8 flex items-center gap-3">
                    <Building2 className="w-7 h-7" />
                    Key Facilities
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {branch.facilities.map((fac: any) => (
                      <div key={fac._id || Math.random()} className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xs">
                        <Hospital className="w-5 h-5 text-gray-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700 font-light">{fac.name}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {branch.doctors?.length > 0 && <DoctorsList doctors={branch.doctors} />}
              {branch.treatments?.length > 0 && <TreatmentsList treatments={branch.treatments} />}
              <SimilarBranchesList branches={similarBranches} currentCityDisplay={currentCityDisplay} />
            </main>

            <aside className="lg:col-span-3 space-y-8">
              <HospitalSearch allHospitals={allHospitals} />
              <ContactForm />
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}