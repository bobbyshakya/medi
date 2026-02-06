// app/doctors/[slug]/page.tsx
"use client"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import type { HospitalType, ExtendedDoctorType, BranchType, CityType, SpecialtyType, TreatmentType } from "@/types/hospital"
import {
  Users,
  Clock,
  Award,
  Phone,
  Mail,
  Globe,
  MapPin,
  Building2,
  Calendar,
  ChevronRightIcon,
  Bed,
  Heart,
  ChevronLeft,
  Loader2,
  Stethoscope,
  Scissors,
  ChevronRight,
  ArrowLeft,
  Home,
  Hospital,
  Search,
  X,
  Filter,
  Star,
  DollarSign,
  BookOpen,
  Plus,
  ChevronDown
} from "lucide-react"
import HospitalSearch from "@/components/BranchFilter"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import classNames from "classnames"
import ContactForm from "@/components/ContactForm"
import { Inter } from "next/font/google"
import useEmblaCarousel, { EmblaOptionsType } from 'embla-carousel-react'
import { findDoctorBySlug, getAllHospitalsData, getAllDoctorsWithLocations } from "./utils"

const inter = Inter({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  variable: "--font-inter"
})

const EMBLA_CLASSES = {
  container: "embla__container flex touch-pan-y", // REMOVED ml-[-1rem]
  slide: "embla__slide flex-[0_0_auto] min-w-0 md:pl-4",
  viewport: "overflow-hidden"
}

const EMBLA_SLIDE_SIZES = {
  // MODIFIED: 'xs' (mobile) now always takes w-full, which means one card per view
  xs: "w-full", // Mobile: 1 card per view
  sm: "sm:w-1/2", // Small devices: 2 cards per view (original)
  lg: "lg:w-1/3", // Large devices: 3 cards per view (original)
}

const getWixImageUrl = (imageStr: string | null | undefined): string | null => {
  if (!imageStr || typeof imageStr !== "string" || !imageStr.startsWith("wix:image://v1/")) return null
  const parts = imageStr.split("/")
  return parts.length >= 4 ? `https://static.wixstatic.com/media/${parts[3]}` : null
}

const generateSlug = (name: string | null | undefined): string => {
  if (!name || typeof name !== 'string') return ''
  return name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
}

const getDoctorImage = (imageData: any): string | null => getWixImageUrl(imageData)
const getTreatmentImage = (imageData: any): string | null => getWixImageUrl(imageData)
const getHospitalImage = (imageData: any): string | null => getWixImageUrl(imageData)
const getBranchImage = (imageData: any): string | null => getWixImageUrl(imageData)

const getShortDescription = (richContent: any, maxLength: number = 200): string => {
  if (!richContent) return ''
  
  if (typeof richContent === 'string') {
    const text = richContent.replace(/<[^>]*>/g, '').trim()
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }
  
  if (!richContent?.nodes) return ''
  
  // Extract text from rich content nodes including lists
  let extractedText: string[] = []
  
  const extractTextFromNode = (node: any): string => {
    if (!node) return ''
    
    if (node.type === 'TEXT' || node.type === undefined) {
      return node.text || ''
    }
    
    if (node.nodes && Array.isArray(node.nodes)) {
      return node.nodes.map(extractTextFromNode).join(' ')
    }
    
    // For list items, add bullet point
    if (node.type === 'LIST_ITEM' || node.type === 'LI' || node.type === 'list-item') {
      const itemText = node.nodes?.map(extractTextFromNode).join(' ').trim()
      return itemText ? '• ' + itemText : ''
    }
    
    return node.nodes ? node.nodes.map(extractTextFromNode).join(' ') : ''
  }
  
  richContent.nodes.forEach((node: any) => {
    const text = extractTextFromNode(node)
    if (text) extractedText.push(text)
  })
  
  const text = extractedText.join(' ').replace(/\s+/g, ' ').trim()
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const renderRichText = (richContent: any): JSX.Element | null => {
  // Handle null/undefined
  if (!richContent) return null
  
  // Handle plain HTML string from Wix CMS
  if (typeof richContent === 'string') {
    return (
      <div 
        className={`text-base text-gray-700 leading-relaxed space-y-3 prose prose-sm max-w-none font-light wix-rich-text ${inter.variable}`}
        dangerouslySetInnerHTML={{ __html: richContent }} 
      />
    )
  }
  
  // Handle Wix rich content object with nodes
  if (richContent.nodes && Array.isArray(richContent.nodes)) {
    return (
      <div className={`space-y-3 ${inter.variable} font-light rich-text-content wix-rich-nodes`}>
        {richContent.nodes.map((node: any, idx: number) => renderNode(node, idx))}
      </div>
    )
  }
  
  // Handle other object formats (e.g., HTML in 'html' property)
  if (richContent.html && typeof richContent.html === 'string') {
    return (
      <div 
        className={`text-base text-gray-700 leading-relaxed space-y-3 prose prose-sm max-w-none font-light wix-rich-text ${inter.variable}`}
        dangerouslySetInnerHTML={{ __html: richContent.html }} 
      />
    )
  }
  
  return null
}

const renderNode = (node: any, index: number): JSX.Element | null => {
  if (!node) return null
  
  // Handle text node directly
  if (node.type === 'TEXT' || !node.type) {
    return renderTextNode(node, index)
  }
  
  const key = node._id || `node-${index}`
  
  switch (node.type.toUpperCase()) {
    case 'PARAGRAPH':
    case 'PARAGRAPHS':
      return (
        <p key={key} className={`text-base text-gray-700 leading-relaxed mb-3 font-light ${inter.variable}`}>
          {node.nodes?.map((child: any, idx: number) => renderTextNode(child, idx)) || node.text}
        </p>
      )
      
    case 'HEADING1':
    case 'H1':
      return (
        <h1 key={key} className={`text-2xl md:text-3xl font-semibold text-gray-900 mb-4 mt-6 leading-tight ${inter.variable}`}>
          {node.nodes?.map((child: any, idx: number) => renderTextNode(child, idx)) || node.text}
        </h1>
      )
      
    case 'HEADING2':
    case 'H2':
      return (
        <h2 key={key} className={`text-xl md:text-2xl font-semibold text-gray-900 mb-3 mt-5 leading-tight ${inter.variable}`}>
          {node.nodes?.map((child: any, idx: number) => renderTextNode(child, idx)) || node.text}
        </h2>
      )
      
    case 'HEADING3':
    case 'H3':
      return (
        <h3 key={key} className={`text-lg md:text-xl font-semibold text-gray-900 mb-2 mt-4 leading-tight ${inter.variable}`}>
          {node.nodes?.map((child: any, idx: number) => renderTextNode(child, idx)) || node.text}
        </h3>
      )
      
    case 'HEADING4':
    case 'H4':
      return (
        <h4 key={key} className={`text-base md:text-lg font-semibold text-gray-900 mb-2 mt-3 leading-tight ${inter.variable}`}>
          {node.nodes?.map((child: any, idx: number) => renderTextNode(child, idx)) || node.text}
        </h4>
      )
      
    case 'ORDERED_LIST':
    case 'OL':
    case 'UL':
    case 'UNORDERED_LIST':
      const ListTag = (node.type.toUpperCase() === 'OL' || node.type.toUpperCase() === 'ORDERED_LIST') ? 'ol' : 'ul'
      return (
        <ListTag key={key} className={`list-${ListTag === 'ol' ? 'decimal' : 'disc'} list-inside space-y-2 ml-4 my-4`}>
          {node.nodes?.map((item: any, idx: number) => renderListItemNode(item, idx))}
        </ListTag>
      )
      
    case 'LIST_ITEM':
    case 'LI':
    case 'LISTITEM':
      return (
        <li key={key} className="text-base text-gray-700 leading-relaxed font-light">
          {node.nodes?.map((child: any, idx: number) => renderTextNode(child, idx)) || node.text}
        </li>
      )
      
    case 'IMAGE':
    case 'IMG':
      const imgSrc = getWixImageUrl(node.imageData?.image?.src || node.src || node.url)
      if (imgSrc) {
        return (
          <div key={key} className="my-4">
            <img
              src={imgSrc}
              alt={node.alt || 'Embedded image'}
              className="w-full h-auto rounded-lg max-w-full shadow-sm"
              onError={(e) => { e.currentTarget.style.display = "none" }}
            />
          </div>
        )
      }
      return null
      
    case 'LINK':
    case 'A':
      return (
        <a key={key} href={node.href || node.url || '#'} className="text-blue-600 hover:text-blue-800 underline">
          {node.nodes?.map((child: any, idx: number) => renderTextNode(child, idx)) || node.text}
        </a>
      )
      
    case 'BLOCKQUOTE':
      return (
        <blockquote key={key} className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-600">
          {node.nodes?.map((child: any, idx: number) => renderTextNode(child, idx)) || node.text}
        </blockquote>
      )
      
    case 'HR':
    case 'HORIZONTAL_RULE':
      return <hr key={key} className="my-6 border-gray-200" />
      
    case 'BREAK':
    case 'BR':
      return <br key={key} />
      
    default:
      // Fallback: try to render as paragraph with text content
      const textContent = node.text || node.content || ''
      if (textContent) {
        return (
          <p key={key} className={`text-base text-gray-700 leading-relaxed mb-3 font-light ${inter.variable}`}>
            {textContent}
          </p>
        )
      }
      // Try to render children
      if (node.nodes && Array.isArray(node.nodes)) {
        return (
          <div key={key} className="space-y-2">
            {node.nodes.map((child: any, idx: number) => renderNode(child, idx))}
          </div>
        )
      }
      return null
  }
}

const renderListItemNode = (node: any, index: number): JSX.Element | null => {
  if (!node) return null
  
  // If it's already a list item
  if (node.type === 'LIST_ITEM' || node.type === 'LI' || node.type === 'LISTITEM') {
    return (
      <li key={node._id || `li-${index}`} className="text-base text-gray-700 leading-relaxed font-light">
        {node.nodes?.map((child: any, idx: number) => renderTextNode(child, idx)) || node.text}
      </li>
    )
  }
  
  // If list contains paragraphs directly
  if (node.type === 'PARAGRAPH' || node.nodes) {
    return (
      <li key={`li-${index}`} className="text-base text-gray-700 leading-relaxed font-light">
        {node.nodes?.map((child: any, idx: number) => renderTextNode(child, idx)) || node.text}
      </li>
    )
  }
  
  return null
}

const renderTextNode = (textNode: any, idx: number): React.ReactNode => {
  // Handle null/undefined
  if (!textNode) return null
  
  // Handle non-TEXT nodes by rendering their text content
  if (textNode.type !== 'TEXT' && textNode.type !== undefined) {
    if (textNode.text) return <span key={idx}>{textNode.text}</span>
    if (textNode.nodes && Array.isArray(textNode.nodes)) {
      return textNode.nodes.map((child: any, cIdx: number) => renderTextNode(child, cIdx))
    }
    return null
  }
  
  const text = textNode.text || ''
  if (!text) return null
  
  const textStyle = textNode.textStyle || {}
  const isBold = textStyle.bold || false
  const isItalic = textStyle.italic || false
  const isUnderline = textStyle.underline || false
  const isStrikethrough = textStyle.strikethrough || false
  const isCode = textStyle.code || false
  
  let content: React.ReactNode = <span key={idx} className={`font-light ${inter.variable}`}>{text}</span>
  
  if (isCode) {
    content = <code key={idx} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{content}</code>
  }
  if (isStrikethrough) content = <s key={`${idx}-s`}>{content}</s>
  if (isUnderline) content = <u key={`${idx}-u`}>{content}</u>
  if (isItalic) content = <em key={`${idx}-em`}>{content}</em>
  if (isBold) content = <strong key={`${idx}-b`} className="font-semibold">{content}</strong>
  
  return content
}

const mergeTreatments = (existing: TreatmentType[] | undefined, current: TreatmentType[] | undefined): TreatmentType[] => {
  const allTreatments = [...(existing || []), ...(current || [])]
  const treatmentMap = new Map<string, TreatmentType>()
  allTreatments.forEach(t => {
    if (t._id) {
      treatmentMap.set(t._id, t)
    }
  })
  return Array.from(treatmentMap.values())
}

interface FilterValue {
  id: string
  query: string
}
type FilterKey = 'city' | 'branch' | 'treatment' | 'doctor'
type Filters = {
  [K in FilterKey]: FilterValue
}

const enforceOnePrimaryFilter = (key: FilterKey, prevFilters: Filters, newFilterValue: FilterValue): Filters => {
  let newFilters = { ...prevFilters, [key]: newFilterValue }
  const primaryKeys: FilterKey[] = ['doctor', 'treatment', 'branch']
  if (primaryKeys.includes(key) && (newFilterValue.id || newFilterValue.query)) {
    primaryKeys.forEach(primaryKey => {
      if (primaryKey !== key) {
        newFilters[primaryKey] = { id: '', query: '' }
      }
    })
  }
  return newFilters
}

interface SearchDropdownProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  options: { id: string; name: string }[]
  selectedOption: string | null
  onOptionSelect: (id: string) => void
  onClear: () => void
  type: "branch" | "city" | "treatment" | "doctor" | "specialty"
}

const SearchDropdown = ({ value, onChange, placeholder, options, selectedOption, onOptionSelect, onClear, type }: SearchDropdownProps) => {
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
      doctor: Stethoscope,
      treatment: Scissors,
      default: Search
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
          className={`w-full pl-10 pr-10 py-3 border border-gray-200 text-sm rounded-xs focus:outline-none focus:ring-1 focus:ring-gray-400/50 bg-white text-gray-900 placeholder-gray-500 shadow-sm font-light ${inter.variable}`}
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
                className={`w-full text-left px-4 border-b border-gray-100 py-3 text-sm transition-colors font-light ${inter.variable} ${option.id === selectedOption ? 'bg-gray-700 text-white' : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {option.name}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 italic font-light ${inter.variable}">No matching {getNoResultsText()} found.</div>
          )}
        </div>
      )}
    </div>
  )
}

const getAllExtendedDoctors = (hospitals: HospitalType[]): ExtendedDoctorType[] => {
  const extendedMap = new Map<string, ExtendedDoctorType>()

  hospitals.forEach((h) => {
    const processDoctor = (item: any, branch?: BranchType) => {
      const baseId = item._id || item.doctorName

      if (!baseId || !item.doctorName) return

      const doctorDepartments: any[] = []
      item.specialization?.forEach((spec: any) => {
        spec.department?.forEach((dept: any) => {
          doctorDepartments.push(dept)
        })
      })
      const uniqueDepartments = Array.from(new Map(doctorDepartments.map(dept => [dept._id, dept])).values())

      const location = {
        hospitalName: h.hospitalName,
        hospitalId: h._id,
        branchName: branch?.branchName,
        branchId: branch?._id,
        cities: branch?.city || h.city || [],
      }

      let treatmentsFromThisLocation: TreatmentType[] = []

      treatmentsFromThisLocation = mergeTreatments(
        branch?.treatments,
        h.treatments
      )

      const doctorTreatments = item.specialization?.flatMap((spec: any) => spec.treatments || []) || []
      treatmentsFromThisLocation = mergeTreatments(treatmentsFromThisLocation, doctorTreatments)

      const doctorSpecNames = item.specialization?.map((s: any) => typeof s === 'string' ? s : s.name).filter(Boolean) || []
      h.specialists?.forEach((spec: any) => {
        if (doctorSpecNames.includes(spec.name)) {
          treatmentsFromThisLocation = mergeTreatments(treatmentsFromThisLocation, spec.treatments)
        }
      })

      branch?.specialists?.forEach((spec: any) => {
        if (doctorSpecNames.includes(spec.name)) {
          treatmentsFromThisLocation = mergeTreatments(treatmentsFromThisLocation, spec.treatments)
        }
      })

      if (extendedMap.has(baseId)) {
        const existingDoctor = extendedMap.get(baseId)!

        const isLocationDuplicate = existingDoctor.locations.some(
          loc => loc.hospitalId === h._id && (loc.branchId === branch?._id || (!loc.branchId && !branch?._id))
        )
        if (!isLocationDuplicate) {
          existingDoctor.locations.push(location)
        }

        const allDepts = [...existingDoctor.departments, ...uniqueDepartments]
        // @ts-ignore
        existingDoctor.departments = Array.from(new Map(allDepts.map(dept => [dept._id, dept])).values())

        existingDoctor.relatedTreatments = mergeTreatments(existingDoctor.relatedTreatments, treatmentsFromThisLocation)

      } else {
        extendedMap.set(baseId, {
          ...item,
          baseId,
          locations: [location],
          // @ts-ignore
          departments: uniqueDepartments,
          relatedTreatments: treatmentsFromThisLocation,
        } as ExtendedDoctorType)
      }
    }

    h.doctors.forEach((d: any) => processDoctor(d))
    h.branches.forEach((b: any) => {
      b.doctors.forEach((d: any) => processDoctor(d, b))
    })
  })

  return Array.from(extendedMap.values())
}

const Breadcrumb = ({ doctorName }: { doctorName: string }) => (
  <nav className={`bg-gray-100 border-b border-gray-100 py-4 ${inter.variable} font-light`}>
    <div className="container mx-auto px-6">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/" className="flex items-center gap-1 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400/50 rounded-xs">
          <Home className="w-4 h-4" />
          Home
        </Link>
        <ChevronRightIcon className="w-4 h-4" aria-hidden />
        <Link href="/search?view=doctors" className="hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400/50 rounded-xs">
          Doctors
        </Link>
        <ChevronRightIcon className="w-4 h-4" aria-hidden />
        <span className="text-gray-900 font-medium">{doctorName}</span>
      </div>
    </div>
  </nav>
)

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
        <h3 className="md:text-base text-2xl font-medium text-gray-900 leading-tight mb-1 line-clamp-1">{doctor.doctorName}</h3>
        <div className="gap-1">
          <p className="text-gray-800 text-base md:text-sm flex items-center">{specializationDisplay},</p>
          {doctor.experienceYears && (
            <p className="text-gray-800 text-sm flex items-center">
              {doctor.experienceYears} years of exp
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

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
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            onError={(e) => { e.currentTarget.style.display = "none" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Scissors className="w-12 h-12 text-gray-300" />
          </div>
        )}
      </div>
      <div className={`p-3 flex-1 flex flex-col ${inter.variable} font-light`}>
        <h3 className="text-xl md:text-base font-medium text-gray-900 leading-tight line-clamp-1">{item.name}</h3>
      </div>
    </Link>
  )
}

const BranchCard = ({ branch }: { branch: any }) => {
  const branchImage = getBranchImage(branch.branchImage || branch.logo)
  const hospitalSlug = generateSlug(branch.hospitalName)
  const branchNameDisplay = branch.isMain ? `${branch.branchName} (Main)` : branch.branchName
  const branchSlug = generateSlug(branch.branchName)
  const linkHref = branch.isMain
    ? `/search/hospitals/${branchSlug}`
    : `/search/hospitals/${branchSlug}`

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

  const firstCityName = branch.city?.[0]?.cityName || 'N/A'
  const firstSpecialty = specialties[0] || 'Multi Speciality'
  const doctorsCount = branch.noOfDoctors || branch.doctors?.length || 0
  const bedsCount = branch.totalBeds || 0
  const estdYear = branch.yearEstablished || 'N/A'
  const hospitalLogo = getHospitalImage(branch.logo)
  const accImage = branch.accreditation?.[0] ? getWixImageUrl(branch.accreditation[0].image) : null

  return (
    <Link href={linkHref} className="block h-full focus:outline-none focus:ring-2 focus:ring-gray-400/50 border border-gray-100 rounded-xs shadow-xs bg-white hover:shadow-sm transition-shadow relative flex flex-col overflow-hidden">
      <div className="relative w-full h-48 bg-gray-50">
        {branchImage ? (
          <img
            src={branchImage}
            alt={`${branchNameDisplay} facility`}
            className="object-cover w-full h-full"
            onError={(e) => { e.currentTarget.style.display = "none" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="w-12 h-12 text-gray-300" />
          </div>
        )}
        {accImage && (
          <div className="absolute top-4 right-4 z-10">
            <img
              src={accImage}
              alt="Accreditation badge"
              className="w-7 h-7 object-contain rounded-full shadow-lg"
              onError={(e) => { e.currentTarget.style.display = "none" }}
            />
          </div>
        )}
        {hospitalLogo && (
          <div className="absolute bottom-2 left-2 z-10">
            <img
              src={hospitalLogo}
              alt={`${branch.hospitalName} logo`}
              className="w-12 h-auto object-contain"
              onError={(e) => { e.currentTarget.style.display = "none" }}
            />
          </div>
        )}
      </div>

      <div className={`p-3 flex-1 flex flex-col justify-between ${inter.variable} font-light relative`}>
        <div className="mb-1">
          <h3 className="md:text-base text-2xl font-medium text-gray-900 leading-tight">{branchNameDisplay}</h3>
        </div>

        <div className="mb-2">
          <p className="text-base md:text-sm text-gray-600">{`${firstCityName}, ${firstSpecialty} Speciality`}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-gray-50 rounded-xs border border-gray-100">
            <p className="text-base md:text-sm font-medium text-gray-700">{doctorsCount}+</p>
            <p className="text-base md:text-sm text-gray-700">Doctors</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-xs border border-gray-100">
            <p className="text-base md:text-sm font-medium text-gray-700">{bedsCount}+</p>
            <p className="text-base md:text-sm text-gray-700">Beds</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-xs border border-gray-100">
            <p className="text-base md:text-sm font-medium text-gray-700">{estdYear}</p>
            <p className="text-base md:text-sm text-gray-700">Est.</p>
          </div>
        </div>
      </div>
    </Link>
  )
}

const PrimarySpecialtyAndTreatments = ({
  specializationDisplay,
  relatedTreatments
}: {
  specializationDisplay: any[],
  relatedTreatments: TreatmentType[]
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start', dragFree: false, containScroll: 'keepSnaps' } as EmblaOptionsType)
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

  const handleTreatmentSelect = useCallback((id: string) => {
    const treatmentSlug = generateSlug(id)
    window.location.href = `/treatment/${treatmentSlug}`
  }, [])

  if (relatedTreatments.length === 0) return null

  // MODIFIED: Use EMBLA_SLIDE_SIZES.xs (w-full) for mobile, sm:w-1/2 for small, and lg:w-1/3 for large.
  const slideSizeClasses = `${EMBLA_SLIDE_SIZES.xs} ${EMBLA_SLIDE_SIZES.sm} ${EMBLA_SLIDE_SIZES.lg}`;

  return (
    <section className={`bg-gray-50 rounded-xs shadow-xs border border-gray-100 ${inter.variable} font-light`}>
      <div className="md:px-4 px-2 pt-4">
        <h2 className="text-2xl md:text-xl font-medium text-gray-900 md:ml-4 tracking-tight mb-3 flex items-center gap-3">

          Primary Specialties &amp; Treatments ({relatedTreatments.length})
        </h2>
      </div>
      <div className="relative px-2 md:px-4 pb-8">
        <div className={EMBLA_CLASSES.viewport} ref={emblaRef}>
          <div className={EMBLA_CLASSES.container}>
            {relatedTreatments.map((item: any, index: number) => (
              <div key={item._id || index} className={`${EMBLA_CLASSES.slide} ${slideSizeClasses}`}>
                <TreatmentCard item={item} />
              </div>
            ))}
          </div>
        </div>
        {relatedTreatments.length > 3 && (
          <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between pointer-events-none px-6"> {/* Changed px-2 md:px-0 to px-6 */}
            <button
              onClick={scrollPrev}

              className={classNames(
                "p-3 rounded-full bg-white shadow-lg transition-opacity duration-200 pointer-events-auto",
                "disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer",
                "ml-[-1rem]" // Keeping this for the offset from the content, but the button should now be visible within the container due to px-6. Let's remove to bring it inside the 4px padding.
              )}
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={scrollNext}

              className={classNames(
                "p-3 rounded-full bg-white shadow-lg transition-opacity duration-200 pointer-events-auto",
                "disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer",
                "mr-[-1rem]" // Same here.
              )}
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

const AffiliatedBranchesList = ({
  allBranches,
  cityFilter,
  branchFilter,
  treatmentFilter,
  doctorFilter
}: {
  allBranches: any[],
  cityFilter: FilterValue,
  branchFilter: FilterValue,
  treatmentFilter: FilterValue,
  doctorFilter: FilterValue
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start', dragFree: false, containScroll: 'keepSnaps' } as EmblaOptionsType)
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true)
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true)

  const globallyFilteredBranches = useMemo(() => {
    let filtered = allBranches.filter(b => !b.isMain)
    if (cityFilter.id || cityFilter.query) {
      filtered = filtered.filter(b =>
        b.city?.some((c: any) =>
          cityFilter.id ? c.cityName === cityFilter.id :
            c.cityName?.toLowerCase().includes(cityFilter.query.toLowerCase())
        )
      )
    }
    if (branchFilter.id || branchFilter.query) {
      filtered = filtered.filter(b => {
        if (branchFilter.id) {
          const [hospitalId, branchId] = branchFilter.id.split('-')
          return hospitalId && branchId && b.hospitalId === hospitalId && b._id === branchId
        }
        return b.branchName?.toLowerCase().includes(branchFilter.query.toLowerCase())
      })
    }
    if (treatmentFilter.id || treatmentFilter.query) {
      filtered = filtered.filter(b =>
        b.treatments?.some((t: any) =>
          treatmentFilter.id ? t._id === treatmentFilter.id :
            t.name?.toLowerCase().includes(treatmentFilter.query.toLowerCase())
        )
      )
    }
    if (doctorFilter.id || doctorFilter.query) {
      filtered = filtered.filter(b =>
        b.doctors?.some((d: any) =>
          doctorFilter.id ? d.doctorName === doctorFilter.id :
            d.doctorName?.toLowerCase().includes(doctorFilter.query.toLowerCase())
        )
      )
    }
    return filtered
  }, [allBranches, cityFilter, branchFilter, treatmentFilter, doctorFilter])

  const filteredBranches = useMemo(() => globallyFilteredBranches, [globallyFilteredBranches])

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  useEffect(() => {
    const onSelect = () => {
      if (!emblaApi) return
      setPrevBtnDisabled(!emblaApi.canScrollPrev())
      setNextBtnDisabled(!emblaApi.canScrollNext())
    }
    emblaApi?.on('reInit', onSelect)
    emblaApi?.on('select', onSelect)
    onSelect()
  }, [emblaApi])

  if (filteredBranches.length === 0) {
    return (
      <section className={`bg-gray-50 p-4 rounded-xs shadow-xs border border-gray-100 text-center ${inter.variable} font-light`}>
        <div className="md:px-4 px-2 pt-4">
          <h2 className="text-2xl md:text-xl font-medium text-gray-900 ml-4 tracking-tight mb-6 flex items-center gap-3 justify-center">
            <Building2 className="w-7 h-7" />
            Affiliated Branches
          </h2>
        </div>
        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No affiliated branches found matching the search or filters.</p>
      </section>
    )
  }

  // MODIFIED: Use EMBLA_SLIDE_SIZES.xs (w-full) for mobile, sm:w-1/2 for small, and lg:w-1/3 for large.
  const slideSizeClasses = `${EMBLA_SLIDE_SIZES.xs} ${EMBLA_SLIDE_SIZES.sm} ${EMBLA_SLIDE_SIZES.lg}`;

  return (
    <section className={`bg-gray-50 rounded-xs shadow-xs border border-gray-100 ${inter.variable} font-light`}>
      <div className="md:px-4 px-2 pt-4">
        <h2 className="text-2xl md:text-xl font-medium text-gray-900 md:ml-4 mb-3 tracking-tight flex items-center gap-3">

          Affiliated Branches ({filteredBranches.length})
        </h2>
      </div>
      <div className="relative px-2 md:px-4 pb-8">
        <div className={EMBLA_CLASSES.viewport} ref={emblaRef}>
          <div className={EMBLA_CLASSES.container}>
            {filteredBranches.map((branch: any, index: number) => (
              <div key={branch._id || index} className={`${EMBLA_CLASSES.slide} ${slideSizeClasses}`}>
                <BranchCard branch={branch} />
              </div>
            ))}
          </div>
        </div>
        {filteredBranches.length > 3 && (
          <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between pointer-events-none px-6"> {/* Changed px-2 md:px-0 to px-6 */}
            <button
              onClick={scrollPrev}
              disabled={prevBtnDisabled}
              className={classNames(
                "p-3 rounded-full bg-white shadow-lg transition-opacity duration-200 pointer-events-auto",
                "disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer",
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
                "disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer",
              )}
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

const SimilarDoctorsList = ({
  similarDoctors,
  cityFilter,
  branchFilter,
  doctorFilter,
  specializationQuery, // PROP: Holds the specialization ID or slug
  cityOptions, // PASSING NEW PROP
  updateSubFilter // PASSING NEW PROP
}: {
  similarDoctors: ExtendedDoctorType[],
  cityFilter: FilterValue,
  branchFilter: FilterValue,
  doctorFilter: FilterValue,
  specializationQuery: string, // NOW THIS WILL HOLD THE CURRENT DOCTOR'S PRIMARY SPECIALIZATION ID/SLUG
  cityOptions: { id: string; name: string }[], // PASSING NEW PROP
  updateSubFilter: (key: FilterKey, subKey: 'id' | 'query', value: string) => void // PASSING NEW PROP
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start', dragFree: false, containScroll: 'keepSnaps' } as EmblaOptionsType)
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true)
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true)
  const [searchTerm, setSearchTerm] = useState(doctorFilter.query) // Initialize with current doctorFilter query

  const globallyFilteredDoctors = useMemo(() => {
    let filtered = similarDoctors
    if (searchTerm) {
      const lower = searchTerm.toLowerCase()
      filtered = filtered.filter(d =>
        d.doctorName?.toLowerCase().includes(lower) ||
        d.specialization?.some((s: any) =>
          typeof s === 'object' ? s.name?.toLowerCase().includes(lower) : s.toLowerCase().includes(lower)
        )
      )
    }
    if (cityFilter.id || cityFilter.query) {
      const cityId = cityFilter.id
      const cityQuery = cityFilter.query.toLowerCase()
      filtered = filtered.filter(d =>
        d.locations.some((loc: any) => loc.cities.some((c: any) =>
          cityId ? c.cityName === cityId : c.cityName?.toLowerCase().includes(cityQuery)
        ))
      )
    }
    if (branchFilter.id || branchFilter.query) {
      filtered = filtered.filter(d => {
        if (branchFilter.id && !branchFilter.id.startsWith('main-')) {
          const [hospitalId, branchId] = branchFilter.id.split('-')
          return d.locations.some(loc => loc.hospitalId === hospitalId && loc.branchId === branchId)
        }
        return d.locations.some(loc => loc.branchName?.toLowerCase().includes(branchFilter.query.toLowerCase()))
      })
    }
    // We explicitly exclude the doctorFilter.id logic here to prevent filtering by a selected doctor's ID, 
    // as the purpose is to search for *similar* doctors, and the 'doctor' filter logic is handled 
    // by the internal searchTerm state, which should only be used for query filtering in this context.
    // The main doctor filter is controlled by the outer component's state, but for similarity search, 
    // we use the local searchTerm state.
    return filtered
  }, [similarDoctors, searchTerm, cityFilter, branchFilter])

  const filteredDoctors = useMemo(() => globallyFilteredDoctors, [globallyFilteredDoctors])

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  useEffect(() => {
    const onSelect = () => {
      if (!emblaApi) return
      setPrevBtnDisabled(!emblaApi.canScrollPrev())
      setNextBtnDisabled(!emblaApi.canScrollNext())
    }
    emblaApi?.on('reInit', onSelect)
    emblaApi?.on('select', onSelect)
    onSelect()
  }, [emblaApi])

  const doctorOptions = useMemo(() => {
    return similarDoctors // Use all similar doctors for the dropdown options
      .map(d => {
        let firstSpecialty = "General Practitioner"
        if (d.specialization) {
          if (Array.isArray(d.specialization)) {
            const names = d.specialization
              .map((spec: any) => typeof spec === 'object' ? spec?.name : spec)
              .filter(Boolean)
            firstSpecialty = names[0] || "General Practitioner"
          } else {
            firstSpecialty = d.specialization as string
          }
        }
        const displayName = `${d.doctorName} - ${firstSpecialty}`
        return {
          id: d.doctorName,
          name: displayName
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [similarDoctors])

  const handleDoctorSelect = useCallback((id: string) => {
    // This is for navigation to the selected doctor's page.
    const doctorSlug = generateSlug(id)
    window.location.href = `/doctors/${doctorSlug}`
  }, [])

  const handleCityFilterChange = (value: string) => {
    // Only update the query on change for local filtering in the dropdown
    updateSubFilter('city', 'query', value)
    updateSubFilter('city', 'id', '')
  }

  // --- UPDATED CITY REDIRECT LOGIC ---
  const handleCityOptionSelect = useCallback((id: string) => {
    // Start with the base URL
    let url = `/search?view=doctors`

    // 1. Append the selected city (id is the cityName, which should be in lowercase for the URL)
    url += `&city=${encodeURIComponent(id.toLowerCase())}`

    // 2. Append the current doctor's primary specialization (specializationQuery prop)
    if (specializationQuery) {
      // specializationQuery now holds the specialization slug (e.g., 'cardiologist')
      url += `&specialization=${encodeURIComponent(specializationQuery.toLowerCase())}`
    }

    // Redirect to the hospitals page with the selected city and specialization as search filters
    window.location.href = url
  }, [specializationQuery])
  // --- END OF UPDATED CITY REDIRECT LOGIC ---

  const handleCityClear = () => {
    updateSubFilter('city', 'id', '')
    updateSubFilter('city', 'query', '')
  }

  const handleDoctorSearchChange = (value: string) => {
    setSearchTerm(value)
    // Update the parent doctor filter query as well
    updateSubFilter('doctor', 'query', value)
  }

  const handleDoctorSearchClear = () => {
    setSearchTerm("")
    updateSubFilter('doctor', 'query', '')
  }


  if (filteredDoctors.length === 0) {
    return (
      <section className={`bg-gray-50 p-4 rounded-xs shadow-xs border border-gray-100 text-center ${inter.variable} font-light`}>
        <div className="md:px-4 px-2 pt-4">
          <h2 className="text-2xl md:text-xl font-medium text-gray-900 ml-4 tracking-tight mb-6 flex items-center gap-3 justify-center">
            <Users className="w-7 h-7" />
            Similar Doctors
          </h2>
        </div>
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No similar doctors found matching the search or filters.</p>
      </section>
    )
  }

  // MODIFIED: Use EMBLA_SLIDE_SIZES.xs (w-full) for mobile, sm:w-1/2 for small, and lg:w-1/3 for large.
  const slideSizeClasses = `${EMBLA_SLIDE_SIZES.xs} ${EMBLA_SLIDE_SIZES.sm} ${EMBLA_SLIDE_SIZES.lg}`;

  return (
    <section className={`bg-gray-50 rounded-xs shadow-xs border border-gray-100 ${inter.variable} font-light`}>
      <div className="md:px-4 px-2 pt-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-3">
          <h2 className="text-2xl md:text-xl font-medium text-gray-900 md:ml-4 tracking-tight flex items-center gap-3 flex-1">

            Similar Doctors ({filteredDoctors.length})
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto"> {/* Added flex container for filters */}
            <div className="relative w-full sm:w-48">
              <SearchDropdown
                value={cityFilter.query}
                onChange={handleCityFilterChange}
                placeholder="Filter by City..."
                options={cityOptions}
                selectedOption={cityFilter.id}
                onOptionSelect={handleCityOptionSelect} // USES REDIRECT
                onClear={handleCityClear}
                type="city"
              />
            </div>
            <div className="relative w-full sm:w-48">
              <SearchDropdown
                value={searchTerm}
                onChange={handleDoctorSearchChange}
                placeholder="Search doctors..."
                options={doctorOptions}
                selectedOption={null}
                onOptionSelect={handleDoctorSelect}
                onClear={handleDoctorSearchClear}
                type="doctor"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="relative px-2 md:px-4 pb-8">
        <div className={EMBLA_CLASSES.viewport} ref={emblaRef}>
          <div className={EMBLA_CLASSES.container}>
            {filteredDoctors.map((doctor: any, index: number) => (
              <div key={doctor.baseId || index} className={`${EMBLA_CLASSES.slide} ${slideSizeClasses}`}>
                <DoctorCard doctor={doctor} />
              </div>
            ))}
          </div>
        </div>
        {filteredDoctors.length > 3 && (
          <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between pointer-events-none px-6"> {/* Changed px-2 md:px-0 to px-6 */}
            <button
              onClick={scrollPrev}
              disabled={prevBtnDisabled}
              className={classNames(
                "p-3 rounded-full bg-white shadow-lg transition-opacity duration-200 pointer-events-auto",
                "disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer",
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
                "disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer",
              )}
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

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

const AboutSkeleton = () => (
  <div className={`bg-gray-50 p-4 rounded-xs border border-gray-100 shadow-xs animate-pulse ${inter.variable} font-light`}>
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

const SidebarSkeleton = () => (
  <div className={`space-y-6 ${inter.variable} w-full font-light`}>
    <div className="bg-white p-6 rounded-xs border border-gray-100 shadow-sm animate-pulse">
      <div className="h-6 bg-gray-300 rounded w-32 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
    <div className="bg-white p-6 rounded-xs border border-gray-100 shadow-sm animate-pulse h-96" />
  </div>
)

export default function DoctorDetail({ params }: { params: Promise<{ slug: string }> }) {
  const [doctor, setDoctor] = useState<ExtendedDoctorType | null>(null)
  const [allHospitals, setAllHospitals] = useState<HospitalType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aboutExpanded, setAboutExpanded] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    city: { id: '', query: '' },
    branch: { id: '', query: '' },
    treatment: { id: '', query: '' },
    doctor: { id: '', query: '' }
  })

  const router = useRouter()
  const searchParams = useSearchParams() // ADDED: Retrieve search parameters

  const updateSubFilter = useCallback((key: FilterKey, subKey: 'id' | 'query', value: string) => {
    setFilters(prev => {
      const newFilterValue: FilterValue = { ...prev[key], [subKey]: value }
      let newFilters = enforceOnePrimaryFilter(key, prev, newFilterValue)
      return newFilters
    })
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      city: { id: '', query: '' },
      branch: { id: '', query: '' },
      treatment: { id: '', query: '' },
      doctor: { id: '', query: '' }
    })
  }, [])

  // ADDED: useEffect to read URL query parameters and initialize filters
  useEffect(() => {
    const cityParam = searchParams.get('city')
    const specializationParam = searchParams.get('specialization')

    // Only apply URL params if at least one parameter is present
    if (cityParam || specializationParam) {
      setFilters(prev => {
        let newFilters: Filters = { ...prev }

        // 1. Handle City Filter
        // Check if city filter is currently empty to prevent overriding user-applied filters
        if (cityParam && !prev.city.id && !prev.city.query) {
          // Set city as a query string for filtering the related content (Branches, Similar Doctors)
          newFilters.city = { id: '', query: cityParam.toLowerCase() } // Ensure query is lowercase
        }

        // 2. Handle Specialization/Treatment Filter
        // Check if treatment filter is currently empty
        if (specializationParam && !prev.treatment.id && !prev.treatment.query) {
          // Map 'specialization' from URL to the 'treatment' filter's query field
          newFilters.treatment = { id: '', query: specializationParam.toLowerCase() } // Ensure query is lowercase
        }

        return newFilters
      })
    }
  }, [searchParams]) // Rerun when search params change

  useEffect(() => {
    const doctorId = filters.doctor.id
    if (doctorId && doctor && doctor.doctorName !== doctorId) {
      const doctorSlug = generateSlug(doctorId)
      router.push(`/doctors/${doctorSlug}`)
      updateSubFilter('doctor', 'id', '')
    }
  }, [filters.doctor.id, doctor, router, updateSubFilter])

  useEffect(() => {
    const selectedId = filters.branch.id
    if (selectedId) {
      if (selectedId.startsWith('main-')) {
        const hospitalId = selectedId.slice(5)
        const hospital = allHospitals.find(h => h._id === hospitalId)
        if (hospital) {
          const hospitalSlug = generateSlug(hospital.hospitalName)
          router.push(`/search/${hospitalSlug}`)
        }
      } else {
        const [hospitalId, branchId] = selectedId.split('-')
        if (hospitalId && branchId) {
          const hospital = allHospitals.find(h => h._id === hospitalId)
          const branch = hospital?.branches.find(b => b._id === branchId)
          if (branch && hospital) {
            const hospitalSlug = generateSlug(hospital.hospitalName)
            const branchSlug = generateSlug(branch.branchName)
            router.push(`/search/${hospitalSlug}/branch/${branchSlug}`)
          }
        }
      }
      updateSubFilter('branch', 'id', '')
    }
  }, [filters.branch.id, allHospitals, router, updateSubFilter])

  useEffect(() => {
    const treatmentId = filters.treatment.id
    if (treatmentId) {
      const treatmentSlug = generateSlug(treatmentId)
      router.push(`/treatment/${treatmentSlug}`)
      updateSubFilter('treatment', 'id', '')
    }
  }, [filters.treatment.id, router, updateSubFilter])

  useEffect(() => {
    const fetchDoctorData = async () => {
      setLoading(true)
      setError(null)
      try {
        const resolvedParams = await params
        const doctorSlug = resolvedParams.slug
        
        // Use the new utility function for efficient doctor fetching
        const [doctorData, hospitalsData] = await Promise.all([
          findDoctorBySlug(doctorSlug),
          getAllHospitalsData()
        ])
        
        if (doctorData) {
          setDoctor(doctorData as unknown as ExtendedDoctorType)
          setAllHospitals(hospitalsData as unknown as HospitalType[])
        } else {
          setError("Doctor not found. The URL might be incorrect or the doctor does not exist.")
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "An unknown error occurred while fetching doctor details")
      } finally {
        setLoading(false)
      }
    }
    fetchDoctorData()
  }, [params])

  const specializationDisplay = useMemo(() => {
    if (!doctor || !doctor.specialization) return []
    if (Array.isArray(doctor.specialization)) {
      // @ts-ignore
      return doctor.specialization.map((spec: any) => typeof spec === 'object' ? spec : { _id: spec, name: spec }).filter((s: any) => s.name)
    }
    // @ts-ignore
    return [{ _id: doctor.specialization, name: doctor.specialization }]
  }, [doctor?.specialization])

  const doctorSpecialtyNames = useMemo(() => specializationDisplay.map(s => s.name), [specializationDisplay])

  // FIX: Force the use of the proper name (slugified) for the specialization query parameter
  const primarySpecializationQueryValue = useMemo(() => {
    if (!specializationDisplay.length) return '';
    const primarySpec = specializationDisplay[0];

    // Always return the proper name (slugified) for a cleaner, human-readable URL parameter.
    return generateSlug(primarySpec.name);
  }, [specializationDisplay]);

  const allCities = useMemo(() => {
    const cSet = new Set<string>()
    allHospitals.forEach(h => {
      h.city?.forEach((c: CityType) => cSet.add(c.cityName))
      h.branches.forEach(b => {
        b.city?.forEach((c: CityType) => cSet.add(c.cityName))
      })
    })
    return Array.from(cSet).sort()
  }, [allHospitals])

  const cityOptions = useMemo(() => allCities.map(city => ({ id: city, name: city })), [allCities])

  const allTreatmentsSet = useMemo(() => {
    const tSet = new Set<string>()
    allHospitals.forEach(h => {
      h.treatments?.forEach((t: TreatmentType) => { if (t.name) tSet.add(t.name) })
      h.branches.forEach(b => b.treatments?.forEach((t: TreatmentType) => { if (t.name) tSet.add(t.name) }))
      h.specialists?.forEach(s => s.treatments?.forEach((t: any) => { if (t.name) tSet.add(t.name) }))
      h.branches.forEach(b => b.specialists?.forEach(s => s.treatments?.forEach((t: any) => { if (t.name) tSet.add(t.name) })))
    })
    return Array.from(tSet).sort()
  }, [allHospitals])

  const treatmentOptions = useMemo(() => allTreatmentsSet.map(t => ({ id: t, name: t })), [allTreatmentsSet])

  const uniqueBranches = useMemo(() => {
    let branches: { id: string; name: string }[] = []
    allHospitals.forEach(h => {
      if (h.city?.[0]?.cityName) {
        branches.push({
          id: `main-${h._id}`,
          name: `${h.hospitalName} (Main) - ${h.city[0].cityName}`
        })
      }
      h.branches.forEach(b => {
        if (b.branchName && b.city?.[0]?.cityName) {
          branches.push({
            id: `${h._id}-${b._id}`,
            name: `${h.hospitalName} ${b.branchName} - ${b.city[0].cityName}`
          })
        }
      })
    })
    return branches.sort((a, b) => a.name.localeCompare(b.name))
  }, [allHospitals])

  const uniqueDoctors = useMemo(() => {
    const dMap = new Map<string, { id: string, name: string }>()
    const allExtended = getAllExtendedDoctors(allHospitals)

    allExtended.forEach((d) => {
      if (d.doctorName) {
        let firstSpecialty = "General Practitioner"
        if (d.specialization) {
          if (Array.isArray(d.specialization)) {
            const names = d.specialization
              .map((spec: any) => typeof spec === 'object' ? spec?.name : spec)
              .filter(Boolean)
            firstSpecialty = names[0] || "General Practitioner"
          } else {
            firstSpecialty = d.specialization as string
          }
        }
        const displayName = `${d.doctorName} - ${firstSpecialty}`
        const simpleDoctorName = d.doctorName

        dMap.set(simpleDoctorName, {
          id: simpleDoctorName,
          name: displayName
        })
      }
    })
    return Array.from(dMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [allHospitals])

  const similarDoctors = useMemo(() => {
    if (!allHospitals.length || !doctor) return []
    const allExtended = getAllExtendedDoctors(allHospitals)
    const doctorSpecialtyNames = specializationDisplay.map(s => s.name)

    let candidates = allExtended.filter(d =>
      d.baseId !== doctor.baseId &&
      d.specialization?.some((s: any) => doctorSpecialtyNames.includes(s.name || s.title || s))
    )

    candidates = candidates.filter(d => {
      const cityId = filters.city.id
      const cityQuery = filters.city.query.toLowerCase()
      const matchesCity = !cityId && !cityQuery ||
        d.locations.some((loc: any) => loc.cities.some((c: any) =>
          cityId ? c.cityName === cityId :
            c.cityName?.toLowerCase().includes(cityQuery)
        ))

      const matchesBranch = !filters.branch.id && !filters.branch.query ||
        (filters.branch.id.startsWith('main-') ?
          d.locations.some(loc => !loc.branchId && loc.hospitalId === filters.branch.id.slice(5)) :
          d.locations.some((loc: any) => {
            const branchUniqueId = `${loc.hospitalId}-${loc.branchId}`
            return filters.branch.id === branchUniqueId ||
              loc.branchName?.toLowerCase().includes(filters.branch.query.toLowerCase())
          })
        )

      const doctorQuery = filters.doctor.query.toLowerCase()
      const matchesDoctorQuery = !doctorQuery ||
        d.doctorName?.toLowerCase().includes(doctorQuery) ||
        d.specialization?.some((s: any) =>
          typeof s === 'object' ? s.name?.toLowerCase().includes(doctorQuery) : s.toLowerCase().includes(doctorQuery)
        )


      return matchesCity && matchesBranch && matchesDoctorQuery
    })

    return candidates
      .sort((a, b) => {
        const expA = parseInt(a.experienceYears) || 0
        const expB = parseInt(b.experienceYears) || 0
        return expB - expA
      })
  }, [allHospitals, doctor, specializationDisplay, filters.city, filters.branch, filters.doctor.query])

  const doctorBranches = useMemo(() => {
    if (!doctor) return []
    const branches: any[] = []
    allHospitals.forEach(h => {
      h.branches.forEach(b => {
        const hasDoctor = b.doctors.some((d: any) => d._id === doctor.baseId || d.doctorName === doctor.doctorName)
        if (hasDoctor) {
          const branchTreatments = mergeTreatments(b.treatments, h.treatments)
          branches.push({
            ...b,
            hospitalName: h.hospitalName,
            hospitalId: h._id,
            treatments: branchTreatments,
          })
        }
      })
      const hasDoctorInMain = h.doctors.some((d: any) => d._id === doctor.baseId || d.doctorName === doctor.doctorName)
      if (hasDoctorInMain) {
        const virtualMain = {
          branchName: `${h.hospitalName} (Main)`,
          isMain: true,
          city: h.city,
          treatments: h.treatments,
          hospitalName: h.hospitalName,
          hospitalId: h._id,
          logo: h.logo,
          yearEstablished: h.yearEstablished,
          totalBeds: h.totalBeds,
          noOfDoctors: h.noOfDoctors,
          accreditation: h.accreditation,
          branchImage: h.logo,
        }
        branches.push(virtualMain)
      }
    })
    return branches.sort((a, b) => a.branchName.localeCompare(b.branchName))
  }, [allHospitals, doctor])

  if (loading) {
    return (
      <div className={`min-h-screen bg-white ${inter.variable} font-light`}>
        <HeroSkeleton />
        <Breadcrumb doctorName="Doctor Name" />
        <section className="py-10 w-full relative z-10">
          <div className="container mx-auto px-6">
            <div className="md:grid lg:grid-cols-12 gap-8">
              <main className="lg:col-span-9 space-y-4">
                <AboutSkeleton />
                <CarouselSkeleton type="treatments" />
                <CarouselSkeleton type="branches" />
                <CarouselSkeleton type="doctors" />
              </main>
              <div className="lg:col-span-3">
                <SidebarSkeleton />
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (error || !doctor) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 relative ${inter.variable} font-light`}>
        <Breadcrumb doctorName="Doctor Name" />
        <div className="text-center space-y-6 max-w-md p-10 bg-gray-50 rounded-xs shadow-xs border border-gray-100">
          <Users className="w-16 h-16 text-gray-300 mx-auto" />
          <h2 className="text-2xl md:text-3xl font-medium text-gray-900 leading-tight">Doctor Not Found</h2>
          <p className="text-base text-gray-700 leading-relaxed font-light">{error || "The requested doctor could not be found. Please check the URL or try searching again."}</p>
          <Link href="/hospitals/?view=doctors" className="inline-block w-full bg-gray-700 text-white px-6 py-3 rounded-xs hover:bg-gray-800 transition-all font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400/50">
            Go to Doctors Search
          </Link>
        </div>
      </div>
    )
  }

  const doctorImage = getDoctorImage(doctor.profileImage)
  const shortAbout = getShortDescription(doctor.aboutDoctor, 200)

  return (
    <div className={`min-h-screen bg-white ${inter.variable} font-light`}>

      <section className="relative w-full md:min-h-[85vh] min-h-[55vh] overflow-hidden bg-white">

        {/* MOBILE FULL BACKGROUND IMAGE */}
        {doctorImage && (
          <div className="absolute inset-0 md:hidden">
            <img
              src={doctorImage}
              alt={doctor.doctorName}
              className="w-full h-full object-cover object-top"
            />

            {/* Mobile gradient for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          </div>
        )}

        {/* DESKTOP RIGHT-SIDE IMAGE */}
        {doctorImage && (
          <div className="hidden md:block absolute right-0 top-0 w-[50%] h-full">
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-white rounded-l-lg shadow-lg overflow-hidden border border-gray-100">
                <img
                  src={doctorImage}
                  alt={doctor.doctorName}
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              </div>

              {/* Verified Badge */}
              <div className="absolute left-5 bottom-5 bg-white shadow-md border border-gray-100 text-gray-800 px-4 py-2 rounded-md">
                <div className="flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-green-600" />
                  Verified Professional
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTENT - POSITIONED AT BOTTOM */}
        <div className="
    absolute bottom-0 left-0 right-0 z-10
    flex items-end
  ">
          <div className="container mx-auto w-full px-5 md:px-0">

            {/* CONTENT WRAPPER - Aligns content at bottom */}
            <div className="
        w-full max-w-xl
        pb-8 md:pb-12 
        space-y-6 md:space-y-8
      ">

              {/* TOP ROW — DOCTOR IMAGE + TEXT */}
              <div className="
          flex gap-4 md:gap-6 items-center
          text-white md:text-gray-900
        ">

                {/* SMALL PROFILE PICTURE */}
                <div className="
            w-20 h-20 md:w-28 md:h-28
            bg-white/90 md:bg-white
            backdrop-blur-md
            rounded-lg shadow-lg border border-gray-100 p-1
            flex-shrink-0
          ">
                  {doctorImage ? (
                    <img
                      src={doctorImage}
                      alt="doctor-profile"
                      className="rounded-lg object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                      <Stethoscope className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* TEXT CONTENT */}
                <div className="space-y-1 md:space-y-3">

                  {/* NAME */}
                  <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
                    Dr. {doctor.doctorName}
                  </h1>

                  {/* SPECIALIZATIONS + EXPERIENCE */}
                  <div className="flex flex-wrap gap-1 md:gap-2 text-sm md:text-base">
                    {specializationDisplay.slice(0, 3).map((spec: any) => (
                      <span key={spec._id}>{spec.name},</span>
                    ))}

                    {specializationDisplay.length > 3 && (
                      <span>+{specializationDisplay.length - 3} more</span>
                    )}

                    <span className="font-medium">• {doctor.experienceYears || "5"}+ yrs exp.</span>
                  </div>

                  {/* QUALIFICATION */}
                  <h2 className="text-sm md:text-lg opacity-90">
                    {doctor.qualification || "MBBS, MD"}
                  </h2>
                </div>
              </div>

              {/* MOBILE BADGES */}
              <div className="md:hidden flex gap-3">
                <span className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-md text-[13px] text-gray-900 shadow-md border border-gray-200">
                  <Award className="w-4 h-4 inline-block text-green-600 mr-1" />
                  Verified
                </span>

                <span className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-md text-[13px] text-gray-900 shadow-md border border-gray-200">
                  Trusted Doctor
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* Bottom Divider (Desktop Only) */}
        <div className="hidden md:block absolute bottom-0 left-0 w-full h-[2px] bg-gray-200" />

      </section>


      <Breadcrumb doctorName={doctor.doctorName} />

      <section className="py-10 w-full relative z-10">
        <div className="container mx-auto px-6">
          <div className="md:grid lg:grid-cols-12 gap-8">
            <main className="lg:col-span-9 space-y-4">
              {doctor.aboutDoctor && (
                <section className={`bg-gray-50 p-2 md:p-5 rounded-xs shadow-xs border border-gray-100 ${inter.variable} font-light`}>
                  <h2 className="text-2xl md:text-xl font-medium text-gray-900  tracking-tight mb-2 flex items-center gap-3">

                    About {doctor.doctorName}
                  </h2>
                  <div className="space-y-4">
                    {!aboutExpanded ? (
                      <p className="text-base text-gray-700 leading-relaxed font-light">{shortAbout}</p>
                    ) : (
                      typeof doctor.aboutDoctor === 'string' ? (
                        <div className="text-base text-gray-700 leading-relaxed font-light">{doctor.aboutDoctor}</div>
                      ) : (
                        renderRichText(doctor.aboutDoctor)
                      )
                    )}
                    <button
                      onClick={() => setAboutExpanded(!aboutExpanded)}
                      className="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center gap-1 transition-colors"
                    >
                      {aboutExpanded ? 'Read Less' : 'Read More'} <ChevronRight className={`w-4 h-4 ${aboutExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                </section>
              )}

              <PrimarySpecialtyAndTreatments
                specializationDisplay={specializationDisplay}
                relatedTreatments={doctor.relatedTreatments || []}
              />

              {/* {doctorBranches.length > 0 && <AffiliatedBranchesList
                allBranches={doctorBranches}
                cityFilter={filters.city}
                branchFilter={filters.branch}
                treatmentFilter={filters.treatment}
                doctorFilter={filters.doctor}
              />} */}

              {similarDoctors.length > 0 && <SimilarDoctorsList
                similarDoctors={similarDoctors}
                cityFilter={filters.city}
                branchFilter={filters.branch}
                doctorFilter={filters.doctor}
                specializationQuery={primarySpecializationQueryValue} // UPDATED: Now always passes the proper name slug
                cityOptions={cityOptions}
                updateSubFilter={updateSubFilter}
              />}
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