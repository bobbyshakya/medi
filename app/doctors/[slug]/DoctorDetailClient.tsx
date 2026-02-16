// app/doctors/[slug]/DoctorDetailClient.tsx
// Client component for doctor detail page

"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { 
  Award, 
  MapPin, 
  Building2, 
  ChevronRight, 
  Stethoscope,
  Home
} from "lucide-react"
import ContactForm from "@/components/ContactForm"
import { Inter } from "next/font/google"
import RichTextDisplay from "@/lib/ui/RichTextDisplay"

// =============================================================================
// TYPES
// =============================================================================

interface DoctorData {
  _id: string
  doctorName: string
  specialization: any[]
  qualification?: string | null
  experienceYears?: string | null
  designation?: string | null
  aboutDoctor?: any
  aboutDoctorHtml?: any
  profileImage?: string | null
  baseId?: string
  locations?: any[]
}

interface HospitalData {
  _id: string
  hospitalName: string
  logo?: string | null
  city?: { cityName: string }[]
  branches?: any[]
  doctors?: any[]
  treatments?: any[]
  yearEstablished?: string
  totalBeds?: string
  noOfDoctors?: string
  accreditation?: any[]
}

interface TreatmentData {
  _id?: string
  name: string
}

interface CityType {
  cityName: string
  _id?: string
}

// =============================================================================
// UTILITIES
// =============================================================================

const inter = Inter({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  variable: "--font-inter"
})

/**
 * Convert Wix image URL to static URL
 */
const getWixImageUrl = (imageStr: string | null | undefined): string | null => {
  if (!imageStr || typeof imageStr !== "string" || !imageStr.startsWith("wix:image://v1/")) return null
  const parts = imageStr.split("/")
  return parts.length >= 4 ? `https://static.wixstatic.com/media/${parts[3]}` : null
}

/**
 * Generate URL-friendly slug from name
 */
const generateSlug = (name: string | null | undefined): string => {
  if (!name || typeof name !== 'string') return ''
  return name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
}

/**
 * Extract short description from rich content
 */
const getShortDescription = (richContent: any, maxLength: number = 200): string => {
  if (!richContent) return ''
   
  if (typeof richContent === 'string') {
    const text = richContent.replace(/<[^>]*>/g, '').trim()
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }
   
  if (!richContent?.nodes) return ''
   
  let extractedText: string[] = []
   
  const extractTextFromNode = (node: any): string => {
    if (!node) return ''
    if (node.type === 'TEXT' || node.type === undefined) return node.text || ''
    if (node.nodes && Array.isArray(node.nodes)) return node.nodes.map(extractTextFromNode).join(' ')
    return node.nodes ? node.nodes.map(extractTextFromNode).join(' ') : ''
  }
   
  richContent.nodes.forEach((node: any) => {
    const text = extractTextFromNode(node)
    if (text) extractedText.push(text)
  })
   
  const text = extractedText.join(' ').replace(/\s+/g, ' ').trim()
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

/**
 * Merge treatments from different sources
 */
const mergeTreatments = (existing: any[] | undefined, current: any[] | undefined): any[] => {
  const allTreatments = [...(existing || []), ...(current || [])]
  const treatmentMap = new Map<string, any>()
  allTreatments.forEach(t => {
    if (t._id) {
      treatmentMap.set(t._id, t)
    }
  })
  return Array.from(treatmentMap.values())
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface DoctorDetailClientProps {
  doctor: any
  allHospitals: any[]
}

export default function DoctorDetailClient({ doctor, allHospitals }: DoctorDetailClientProps) {
  const [aboutExpanded, setAboutExpanded] = useState(false)

  // Guard clause for missing data
  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Doctor information not available</p>
        </div>
      </div>
    )
  }

  // Memoized values
  const doctorImage = useMemo(() => getWixImageUrl(doctor.profileImage), [doctor.profileImage])
  const shortAbout = useMemo(() => getShortDescription(doctor.aboutDoctor || doctor.aboutDoctorHtml, 200), [doctor.aboutDoctor, doctor.aboutDoctorHtml])
  
  const specializationDisplay = useMemo(() => {
    if (!doctor?.specialization) return []
    return doctor.specialization.map((spec: any) => 
      typeof spec === 'object' ? spec : { _id: spec, name: spec }
    ).filter((s: any) => s.name)
  }, [doctor?.specialization])

  const primarySpecializationQueryValue = useMemo(() => {
    if (!specializationDisplay.length) return ''
    return generateSlug(specializationDisplay[0]?.name || '')
  }, [specializationDisplay])

  // Get doctor branches from hospitals
  const doctorBranches = useMemo(() => {
    if (!doctor || !allHospitals) return []
    const branches: any[] = []
    allHospitals.forEach((h: HospitalData) => {
      h.branches?.forEach((b: any) => {
        const hasDoctor = b.doctors?.some((d: any) => d._id === doctor.baseId || d.doctorName === doctor.doctorName)
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
      const hasDoctorInMain = h.doctors?.some((d: any) => d._id === doctor.baseId || d.doctorName === doctor.doctorName)
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
    return branches.sort((a: any, b: any) => (a.branchName || '').localeCompare(b.branchName || ''))
  }, [allHospitals, doctor])

  // Get similar doctors
  const similarDoctors = useMemo(() => {
    if (!allHospitals?.length || !doctor) return []
    
    const allDoctors: any[] = []
    allHospitals.forEach((h: HospitalData) => {
      // Main hospital doctors
      if (h.doctors) {
        h.doctors.forEach((d: any) => {
          allDoctors.push({
            ...d,
            baseId: d._id || d.doctorName,
            locations: [{
              hospitalId: h._id,
              hospitalName: h.hospitalName,
              hospitalLogo: h.logo || null,
              cities: h.city || []
            }]
          })
        })
      }
      // Branch doctors
      if (h.branches) {
        h.branches.forEach((b: any) => {
          if (b.doctors) {
            b.doctors.forEach((d: any) => {
              allDoctors.push({
                ...d,
                baseId: d._id || d.doctorName,
                locations: [{
                  hospitalId: h._id,
                  hospitalName: h.hospitalName,
                  hospitalLogo: h.logo || null,
                  branchId: b._id,
                  branchName: b.branchName,
                  cities: b.city || []
                }]
              })
            })
          }
        })
      }
    })

    const doctorSpecialtyNames = specializationDisplay.map((s: any) => s.name)
    const doctorBaseId = doctor.baseId || doctor._id || doctor.doctorName

    const candidates = allDoctors.filter((d: any) =>
      d.baseId !== doctorBaseId &&
      d.specialization?.some((s: any) => doctorSpecialtyNames.includes(s.name || s.title || s))
    )

    return candidates
      .sort((a: any, b: any) => {
        const expA = parseInt(a.experienceYears || '0') || 0
        const expB = parseInt(b.experienceYears || '0') || 0
        return expB - expA
      })
  }, [allHospitals, doctor, specializationDisplay])

  return (
    <div className={`min-h-screen bg-white ${inter.variable} font-light`}>
      {/* Hero Section */}
      <HeroSection 
        doctor={doctor} 
        doctorImage={doctorImage} 
        specializationDisplay={specializationDisplay}
      />

      {/* Breadcrumb */}
      <Breadcrumb doctorName={doctor.doctorName} />

      {/* Main Content */}
      <section className="py-10 w-full relative z-10">
        <div className="container mx-auto px-6">
          <div className="lg:grid lg:grid-cols-12 gap-8">
            {/* Main Content Area */}
            <main className="lg:col-span-9 space-y-4">
              {/* About Section */}
              {doctor.aboutDoctor && (
                <AboutSection 
                  doctor={doctor} 
                  shortAbout={shortAbout}
                  aboutExpanded={aboutExpanded}
                  setAboutExpanded={setAboutExpanded}
                />
              )}

              {/* Similar Doctors Section */}
              {similarDoctors.length > 0 && (
                <SimilarDoctorsSection 
                  similarDoctors={similarDoctors}
                  primarySpecializationQueryValue={primarySpecializationQueryValue}
                />
              )}

              {/* Practice Locations Section */}
              {doctorBranches.length > 0 && (
                <LocationsSection branches={doctorBranches} />
              )}
            </main>

            {/* Sidebar */}
            <aside className="lg:col-span-3 space-y-6">
              <ContactForm />
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function HeroSection({ 
  doctor, 
  doctorImage, 
  specializationDisplay 
}: { 
  doctor: DoctorData
  doctorImage: string | null
  specializationDisplay: any[]
}) {
  return (
    <section className="relative w-full md:min-h-[85vh] min-h-[55vh] overflow-hidden bg-white">
      {/* Mobile Background Image */}
      {doctorImage && (
        <div className="absolute inset-0 md:hidden">
          <img
            src={doctorImage}
            alt={doctor.doctorName}
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
      )}

      {/* Desktop Right-Side Image */}
      {doctorImage && (
        <div className="hidden md:block absolute right-0 top-0 w-[50%] h-full">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-white rounded-l-lg shadow-lg overflow-hidden border border-gray-100">
              <img
                src={doctorImage}
                alt={doctor.doctorName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute left-5 bottom-5 bg-white shadow-md border border-gray-100 text-gray-800 px-4 py-2 rounded-md">
              <div className="flex items-center gap-2 text-sm">
                <Award className="w-4 h-4 text-green-600" />
                Verified Professional
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-end">
        <div className="container mx-auto w-full px-5 md:px-0">
          <div className="w-full max-w-xl pb-8 md:pb-12 space-y-6 md:space-y-8">
            {/* Doctor Info Row */}
            <div className="flex gap-4 md:gap-6 items-center text-white md:text-gray-900">
              {/* Profile Picture */}
              <div className="w-20 h-20 md:w-28 md:h-28 bg-white/90 md:bg-white backdrop-blur-md rounded-lg shadow-lg border border-gray-100 p-1 flex-shrink-0">
                {doctorImage ? (
                  <img src={doctorImage} alt="doctor-profile" className="rounded-lg object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                    <Stethoscope className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Text Content */}
              <div className="space-y-1 md:space-y-3">
                <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
                  Dr. {doctor.doctorName}
                </h1>

                <div className="flex flex-wrap gap-1 md:gap-2 text-sm md:text-base">
                  {specializationDisplay.slice(0, 3).map((spec: any, idx: number) => (
                    <span key={spec._id || `spec-${idx}`}>{spec.name},</span>
                  ))}
                  {specializationDisplay.length > 3 && (
                    <span>+{specializationDisplay.length - 3} more</span>
                  )}
                  <span className="font-medium">• {doctor.experienceYears || "5"}+ yrs exp.</span>
                </div>

                <h2 className="text-sm md:text-lg opacity-90">
                  {doctor.qualification || "MBBS, MD"}
                </h2>
              </div>
            </div>

            {/* Mobile Badges */}
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

      <div className="hidden md:block absolute bottom-0 left-0 w-full h-[2px] bg-gray-200" />
    </section>
  )
}

function Breadcrumb({ doctorName }: { doctorName: string }) {
  return (
    <nav className="bg-gray-50 border-b border-gray-200">
      <div className="container mx-auto px-6 py-3">
        <ol className="flex items-center gap-2 text-sm">
          <li>
            <Link href="/" className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <Home className="w-4 h-4" />
              Home
            </Link>
          </li>
          <li><ChevronRight className="w-4 h-4 text-gray-400" /></li>
          <li>
            <Link href="/hospitals/?view=doctors" className="text-gray-500 hover:text-gray-700">
              Doctors
            </Link>
          </li>
          <li><ChevronRight className="w-4 h-4 text-gray-400" /></li>
          <li className="text-gray-900 font-medium truncate max-w-[200px]">
            Dr. {doctorName}
          </li>
        </ol>
      </div>
    </nav>
  )
}

function AboutSection({ 
  doctor, 
  shortAbout, 
  aboutExpanded, 
  setAboutExpanded 
}: { 
  doctor: DoctorData
  shortAbout: string
  aboutExpanded: boolean
  setAboutExpanded: (value: boolean) => void
}) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 p-4 md:p-8 shadow-md">
      <h2 className="text-2xl md:text-xl font-medium text-gray-900 tracking-tight mb-4 flex items-center gap-3">
        About {doctor.doctorName}
      </h2>
      <div className="space-y-4">
        {!aboutExpanded ? (
          <p className="text-base text-gray-700 leading-relaxed font-light">{shortAbout}</p>
        ) : (
          doctor.aboutDoctorHtml ? (
            <RichTextDisplay 
              htmlContent={doctor.aboutDoctorHtml} 
              className="text-base text-gray-700 leading-relaxed font-light" 
            />
          ) : (
            <p className="text-base text-gray-700 leading-relaxed font-light">{doctor.aboutDoctor}</p>
          )
        )}
        <button
          onClick={() => setAboutExpanded(!aboutExpanded)}
          className="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center gap-1 transition-colors"
        >
          {aboutExpanded ? 'Read Less' : 'Read More'} 
          <ChevronRight className={`w-4 h-4 ${aboutExpanded ? 'rotate-90' : ''}`} />
        </button>
      </div>
    </section>
  )
}

function SimilarDoctorsSection({ 
  similarDoctors,
  primarySpecializationQueryValue 
}: { 
  similarDoctors: any[]
  primarySpecializationQueryValue: string
}) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 p-4 md:p-8 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl md:text-xl font-medium text-gray-900 tracking-tight flex items-center gap-3">
          Similar Doctors
        </h2>
        <Link 
          href={`/hospitals/?view=doctors&specialization=${primarySpecializationQueryValue}`}
          className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
        >
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {similarDoctors.slice(0, 6).map((d: any, idx: number) => {
          const slug = generateSlug(d.doctorName)
          return (
            <Link 
              key={d._id || d.baseId || `similar-${idx}`}
              href={`/doctors/${slug}${primarySpecializationQueryValue ? `?specialization=${primarySpecializationQueryValue}` : ''}`}
              className="block p-4 bg-white rounded-md border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all group"
            >
              <div className="flex gap-3">
                {d.profileImage ? (
                  <img 
                    src={getWixImageUrl(d.profileImage) || ''} 
                    alt={d.doctorName}
                    className="w-16 h-16 rounded-md object-cover"
                    onError={(e) => { e.currentTarget.style.display = "none" }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    Dr. {d.doctorName}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {d.specialization?.[0]?.name || d.specialization?.[0] || 'Specialist'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {d.experienceYears || '5'}+ yrs exp.
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function LocationsSection({ branches }: { branches: any[] }) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 p-4 md:p-8 shadow-md">
      <h2 className="text-2xl md:text-xl font-medium text-gray-900 tracking-tight mb-4 flex items-center gap-3">
        Practice Locations
        <span className="text-sm font-normal text-gray-500">({branches.length})</span>
      </h2>
      <div className="space-y-4">
        {branches.map((branch: any, idx: number) => {
          const hospitalSlug = generateSlug(branch.hospitalName)
          const branchSlug = branch.branchName ? generateSlug(branch.branchName) : null
          const detailUrl = branchSlug 
            ? `/search/${hospitalSlug}/branch/${branchSlug}`
            : `/search/${hospitalSlug}`
          
          return (
            <div key={branch._id || branch.hospitalId || `branch-${idx}`} className="p-4 bg-white rounded-md border border-gray-100 hover:border-gray-300 transition-colors">
              <Link href={detailUrl} className="block">
                <div className="flex items-start gap-4">
                  {branch.branchImage || branch.logo ? (
                    <img 
                      src={getWixImageUrl(branch.branchImage || branch.logo) || ''}
                      alt={branch.hospitalName}
                      className="w-16 h-16 rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {branch.branchName || branch.hospitalName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {branch.city?.[0]?.cityName || 'Location not specified'}
                    </p>
                    {branch.isMain && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                        Main Hospital
                      </span>
                    )}
                    {!branch.isMain && branch.branchName && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded">
                        Branch
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
            </div>
          )
        })}
      </div>
    </section>
  )
}
