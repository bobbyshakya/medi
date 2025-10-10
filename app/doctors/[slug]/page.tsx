// app/doctors/[slug]/page.tsx
import { wixServerClient } from '@/lib/wixServer'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Stethoscope, CalendarDays, MapPin, Phone, Mail, Globe, Award, Clock, DollarSign, Star } from 'lucide-react'
import Link from 'next/link'
import { getWixScaledToFillImageUrl } from "@/lib/wixMedia"
import RelatedItemsCarousel from '@/components/related-carousel'

// ============ Type Definitions ============
interface Doctor {
  _id: string
  slug: string
  name: string
  title: string
  specializations: string[]
  qualifications: string[]
  experience: number
  consultationFee: number
  rating: number
  totalReviews: number
  about: string
  education: Education[]
  experienceHistory: Experience[]
  languages: string[]
  contactEmail: string
  contactPhone: string
  website: string
  isActive: boolean
  hospitalAffiliations: string[]
  awards: string[]
  profilePicture: string
  coverImage: string
  address: string
  city: string
  state: string
  country: string
  availability: string
}

interface Education {
  degree: string
  institution: string
  year: string
}

interface Experience {
  position: string
  hospital: string
  duration: string
  description: string
}

interface Hospital {
  _id: string;
  slug: string;
  name: string;
  image: string;
}

interface Treatment {
  _id: string;
  slug: string;
  name: string;
  category: string;
  image: string;
}

interface Props {
  params: {
    slug: string
  }
}

// ============ Data Fetching Functions ============
async function getDoctorBySlug(slug: string): Promise<Doctor | null> {
  try {
    const res = await wixServerClient.items.query('Doctor')
      .eq('slug', slug)
      .limit(1)
      .find({ consistentRead: true })

    if (res.items.length === 0) {
      return null
    }

    const item = res.items[0]

    // Helper functions to parse data
    const parseArrayLike = (input: unknown): string[] => {
      if (!input) return []
      if (Array.isArray(input))
        return input
          .map(String)
          .map((s) => s.trim())
          .filter(Boolean)
      const s = String(input)
      return s
        .split(/[,|]/g)
        .map((x) => x.trim())
        .filter(Boolean)
    }

    const toNumberSafe = (v: unknown, fallback = 0): number => {
      const n = typeof v === 'number' ? v : Number.parseFloat(String(v))
      return Number.isFinite(n) ? n : fallback
    }

    const parseEducation = (input: unknown): Education[] => {
      if (!input) return []
      try {
        if (typeof input === 'string') {
          return JSON.parse(input)
        }
        if (Array.isArray(input)) {
          return input.map(edu => ({
            degree: edu.degree || '',
            institution: edu.institution || '',
            year: edu.year || ''
          }))
        }
        return []
      } catch {
        return []
      }
    }

    const parseExperience = (input: unknown): Experience[] => {
      if (!input) return []
      try {
        if (typeof input === 'string') {
          return JSON.parse(input)
        }
        if (Array.isArray(input)) {
          return input.map(exp => ({
            position: exp.position || '',
            hospital: exp.hospital || '',
            duration: exp.duration || '',
            description: exp.description || ''
          }))
        }
        return []
      } catch {
        return []
      }
    }

    // Map data according to CSV column names
    const doctor: Doctor = {
      _id: item._id || item.ID || '',
      slug: item.slug || '',
      name: item.name || 'Dr. Unknown',
      title: item.title || '',
      specializations: parseArrayLike(item.specializations),
      qualifications: parseArrayLike(item.qualifications),
      experience: toNumberSafe(item.experience, 0),
      consultationFee: toNumberSafe(item.consultationFee, 0),
      rating: toNumberSafe(item.rating, 0),
      totalReviews: toNumberSafe(item.totalReviews, 0),
      about: item.about || item.description || '',
      education: parseEducation(item.education),
      experienceHistory: parseExperience(item.experienceHistory),
      languages: parseArrayLike(item.languages),
      contactEmail: item.contactEmail || '',
      contactPhone: item.contactPhone || '',
      website: item.website || '#',
      isActive: Boolean(item.isActive),
      hospitalAffiliations: parseArrayLike(item.hospitalAffiliations),
      awards: parseArrayLike(item.awards),
      profilePicture: item.profilePicture || '',
      coverImage: item.coverImage || '',
      address: item.address || '',
      city: item.city || '',
      state: item.state || '',
      country: item.country || '',
      availability: item.availability || 'Available'
    }

    return doctor
  } catch (error) {
    console.error('Error fetching doctor:', error)
    return null
  }
}

async function getRelatedData(specializations: string[], currentSlug: string) {
  try {
    // If no specializations, return empty arrays
    if (!specializations || specializations.length === 0) {
      return {
        hospitals: [],
        doctors: [],
        treatments: []
      }
    }

    // Take only the first 2 specializations to avoid URL too long issues
    const specializationsQuery = specializations.slice(0, 2).join(",")
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    console.log('Fetching related data for specializations:', specializationsQuery)

    const [hospitalsRes, doctorsRes, treatmentsRes] = await Promise.allSettled([
      fetch(`${baseUrl}/api/search?type=hospital&specialties=${encodeURIComponent(specializationsQuery)}`, {
        cache: 'no-store'
      }),
      fetch(`${baseUrl}/api/search?type=doctor&specialties=${encodeURIComponent(specializationsQuery)}`, {
        cache: 'no-store'
      }),
      fetch(`${baseUrl}/api/search?type=treatment&specialties=${encodeURIComponent(specializationsQuery)}`, {
        cache: 'no-store'
      })
    ]);

    // Helper function to process fetch responses
    const processResponse = async (result: PromiseSettledResult<Response>, type: string) => {
      if (result.status === 'fulfilled' && result.value.ok) {
        try {
          const data = await result.value.json()
          console.log(`Fetched ${type}:`, data.items?.length || 0)
          return data.items || []
        } catch (error) {
          console.error(`Error parsing ${type} response:`, error)
          return []
        }
      } else {
        console.error(`Error fetching ${type}:`, result.status === 'rejected' ? result.reason : result.value.statusText)
        return []
      }
    }

    const relatedHospitals = await processResponse(hospitalsRes, 'hospitals')
    const relatedDoctors = await processResponse(doctorsRes, 'doctors')
    const relatedTreatments = await processResponse(treatmentsRes, 'treatments')

    // Filter out current doctor and limit results
    const filteredDoctors = relatedDoctors
      .filter((d: Doctor) => d.slug !== currentSlug)
      .slice(0, 8)
    const filteredHospitals = relatedHospitals.slice(0, 8)
    const filteredTreatments = relatedTreatments.slice(0, 8)

    console.log('Final related data:', {
      doctors: filteredDoctors.length,
      hospitals: filteredHospitals.length,
      treatments: filteredTreatments.length
    })

    return {
      doctors: filteredDoctors,
      hospitals: filteredHospitals,
      treatments: filteredTreatments
    }
  } catch (error) {
    console.error('Error in getRelatedData:', error)
    return {
      doctors: [],
      hospitals: [],
      treatments: []
    }
  }
}

// ============ Page and Metadata Generation ============
export async function generateMetadata({ params }: Props) {
  const doctor = await getDoctorBySlug(params.slug)

  if (!doctor) {
    return {
      title: 'Doctor Not Found'
    }
  }

  return {
    title: `${doctor.name} - ${doctor.title || 'Doctor'} Details`,
    description: doctor.about.substring(0, 160),
  }
}

// ============ Rating Stars Component ============
function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
        />
      ))}
      <span className="ml-2 text-sm text-[#241d1f]">({rating.toFixed(1)})</span>
    </div>
  )
}

// ============ Main Component ============
export default async function DoctorPage({ params }: Props) {
  const doctor = await getDoctorBySlug(params.slug)

  if (!doctor) {
    notFound()
  }

  const coverImageSrc = doctor.coverImage ? getWixScaledToFillImageUrl(doctor.coverImage, 2000, 1000) : null
  const profileImageSrc = doctor.profilePicture ? getWixScaledToFillImageUrl(doctor.profilePicture, 400, 400) : null
  const relatedData = await getRelatedData(doctor.specializations, params.slug)

  return (
    <div className="min-h-screen bg-gray-50 py-0">
      <section className="relative w-full">
        {/* Full-width background image */}
        {coverImageSrc ? (
          <div className="absolute inset-0 h-full w-full">
            <Image
              src={coverImageSrc}
              alt={`${doctor.name} - Cover`}
              fill
              className="object-fill"
              priority
            />
          </div>
        ) : (
          <div className="absolute inset-0 h-[420px] md:h-[560px] bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <Stethoscope size={72} className="text-blue-400" />
          </div>
        )}

        {/* Dark overlay */}
        <div className="absolute inset-0 h-[420px] md:h-[560px] bg-gradient-to-r from-black/80 via-black/60 to-black/10" />

        {/* Content */}
        <div className="relative z-10 h-[420px] md:h-[560px] flex items-end pb-10">
          <div className="px-6 md:px-16 lg:px-20 w-full max-w-4xl text-white">
            {/* Back link */}
            <div className="mb-6">
              <Link
                href="/doctors"
                className="inline-flex items-center text-white/80 hover:text-white transition-colors duration-200"
              >
                ← Back to Doctors
              </Link>
            </div>

            {/* Doctor Profile and Info */}
            <div className="flex flex-col lg:flex-row items-start gap-8">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                {profileImageSrc ? (
                  <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white/20">
                    <Image
                      src={profileImageSrc}
                      alt={doctor.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/20 flex items-center justify-center">
                    <Stethoscope size={48} className="text-white/60" />
                  </div>
                )}
              </div>

              {/* Doctor Info */}
              <div className="flex-1">
                {/* Badges */}
                <div className="flex items-center gap-3 mb-4">
                  {doctor.title && (
                    <span className="bg-blue-600 text-white text-base font-medium px-3 py-1 rounded-xs">
                      {doctor.title}
                    </span>
                  )}
                  {doctor.rating > 0 && (
                    <div className="inline-flex items-center bg-yellow-400/20 px-3 py-1 rounded-xs">
                      <RatingStars rating={doctor.rating} />
                    </div>
                  )}
                  {doctor.availability && (
                    <span className={`px-3 py-1 rounded-xs text-sm font-medium ${
                      doctor.availability.toLowerCase().includes('available') 
                        ? 'bg-green-600 text-white' 
                        : 'bg-red-600 text-white'
                    }`}>
                      {doctor.availability}
                    </span>
                  )}
                </div>

                {/* Name */}
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                  {doctor.name}
                </h1>

                {/* Specializations */}
                {doctor.specializations.length > 0 && (
                  <p className="text-xl text-blue-200 mb-4">
                    {doctor.specializations.join(', ')}
                  </p>
                )}

                {/* Qualifications */}
                {doctor.qualifications.length > 0 && (
                  <p className="text-lg text-gray-300 mb-6">
                    {doctor.qualifications.join(', ')}
                  </p>
                )}

                {/* Key Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
                  <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xs">
                    <div className="text-2xl font-semibold text-white">
                      {doctor.experience}+
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays size={18} className="text-gray-200" />
                      <div className="text-lg text-gray-100">Years Exp</div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xs">
                    <div className="text-2xl font-semibold text-white">
                      {doctor.totalReviews}+
                    </div>
                    <div className="flex items-center gap-2">
                      <Star size={18} className="text-gray-200" />
                      <div className="text-lg text-gray-100">Reviews</div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xs">
                    <div className="text-2xl font-semibold text-white">
                      ${doctor.consultationFee}
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign size={18} className="text-gray-200" />
                      <div className="text-lg text-gray-100">Consultation</div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xs">
                    <div className="text-2xl font-semibold text-white">
                      {doctor.languages.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe size={18} className="text-gray-200" />
                      <div className="text-lg text-gray-100">Languages</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 lg:px-0">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 mt-10 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Doctor */}
            <section className="bg-white rounded-xs shadow-xs border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Dr. {doctor.name.split(' ').pop()}</h2>
              <p className="text-[#241d1f] leading-relaxed">
                {doctor.about || "No description available."}
              </p>
            </section>

            {/* Specializations */}
            {doctor.specializations.length > 0 && (
              <section className="bg-white rounded-xs shadow-xs border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Specializations</h2>
                <div className="flex flex-wrap gap-3">
                  {doctor.specializations.map((specialization, index) => (
                    <span
                      key={index}
                      className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xs font-medium border border-blue-200"
                    >
                      {specialization}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {doctor.education.length > 0 && (
              <section className="bg-white rounded-xs shadow-xs border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Education</h2>
                <div className="space-y-4">
                  {doctor.education.map((edu, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-1">
                      <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                      <p className="text-[#241d1f]">{edu.institution}</p>
                      {edu.year && <p className="text-gray-500 text-sm">{edu.year}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Experience */}
            {doctor.experienceHistory.length > 0 && (
              <section className="bg-white rounded-xs shadow-xs border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Work Experience</h2>
                <div className="space-y-6">
                  {doctor.experienceHistory.map((exp, index) => (
                    <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                      <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                      <p className="text-[#241d1f] font-medium">{exp.hospital}</p>
                      <p className="text-gray-500 text-sm">{exp.duration}</p>
                      {exp.description && <p className="text-[#241d1f] mt-2">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <section className="bg-white rounded-xs shadow-xs border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-4">
                {(doctor.address || doctor.city || doctor.state || doctor.country) && (
                  <div className="flex items-start gap-3">
                    <MapPin size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[#241d1f]">
                        {[doctor.address, doctor.city, doctor.state, doctor.country]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {doctor.contactPhone && (
                  <div className="flex items-center gap-3">
                    <Phone size={20} className="text-gray-400 flex-shrink-0" />
                    <a href={`tel:${doctor.contactPhone}`} className="text-blue-600 hover:text-blue-800">
                      {doctor.contactPhone}
                    </a>
                  </div>
                )}

                {doctor.contactEmail && (
                  <div className="flex items-center gap-3">
                    <Mail size={20} className="text-gray-400 flex-shrink-0" />
                    <a href={`mailto:${doctor.contactEmail}`} className="text-blue-600 hover:text-blue-800">
                      {doctor.contactEmail}
                    </a>
                  </div>
                )}

                {doctor.website && doctor.website !== "#" && (
                  <div className="flex items-center gap-3">
                    <Globe size={20} className="text-gray-400 flex-shrink-0" />
                    <a 
                      href={doctor.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </section>

            {/* Languages */}
            {doctor.languages.length > 0 && (
              <section className="bg-white rounded-xs shadow-xs border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Languages Spoken</h2>
                <div className="flex flex-wrap gap-2">
                  {doctor.languages.map((language, index) => (
                    <span
                      key={index}
                      className="bg-green-50 text-green-700 px-3 py-1 rounded text-sm font-medium"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Hospital Affiliations */}
            {doctor.hospitalAffiliations.length > 0 && (
              <section className="bg-white rounded-xs shadow-xs border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Hospital Affiliations</h2>
                <div className="space-y-2">
                  {doctor.hospitalAffiliations.map((hospital, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Building size={16} className="text-gray-400" />
                      <span className="text-[#241d1f]">{hospital}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Awards */}
            {doctor.awards.length > 0 && (
              <section className="bg-white rounded-xs shadow-xs border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Awards & Recognition</h2>
                <div className="space-y-3">
                  {doctor.awards.map((award, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Award size={16} className="text-yellow-500 flex-shrink-0" />
                      <span className="text-[#241d1f]">{award}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Related Items Carousel */}
        <div className='mt-16 mb-10'>
          <RelatedItemsCarousel relatedData={relatedData} />
        </div>
      </div>
    </div>
  )
}