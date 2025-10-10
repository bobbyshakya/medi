import { wixServerClient } from '@/lib/wixServer'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { HeartPulse, Stethoscope, BriefcaseMedical, Building, BedDouble, CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { getWixScaledToFillImageUrl } from "@/lib/wixMedia"

// ============ Type Definitions ============
interface Hospital {
  _id: string
  Name: string
  Type: string
  specialty: string
  specialties: string
  numberOfBranches: string
  totalBeds: string
  slug: string
  description: string
  image: string
  yearEstablished: string
  department1Name: string[]
  Facilities: string[]
  Services: string[]
  InsurancePartners: string[]
  Rating: number
  ReviewCount: number
  Website: string
  contactEmail: string
  accreditations: string[]
  contactPhone: string
  city: string
  state: string
  country: string
  address: string
}

interface Doctor {
  _id: string;
  slug: string;
  name: string;
  specializations: string[];
  profilePicture: string;
  rating: number;
}

interface Treatment {
  _id: string;
  slug: string;
  name: string;
  category: string;
  image: string;
  successRate: number;
}

interface SearchResponse<T> {
  items: T[]
}

interface Props {
  params: {
    slug: string
  }
}

// ============ Data Fetching Functions ============
async function getHospitalBySlug(slug: string): Promise<Hospital | null> {
  try {
    const res = await wixServerClient.items.query('Hospital')
      .eq('slug', slug)
      .limit(1)
      .find({ consistentRead: true })

    if (res.items.length === 0) {
      return null
    }

    const item = res.items[0]
    
    // Helper functions from route.ts
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

    const hospital: Hospital = {
      _id: item._id,
      Name: item.name || 'Unknown Hospital',
      Type: item.type || '',
      specialty: item.specialty || '',
      specialties: item.specialties || '',
      numberOfBranches: item.numberOfBranches || '',
      totalBeds: item.totalBeds || '',
      slug: item.slug || '',
      description: item.description || '',
      image: item.image || '',
      yearEstablished: item.yearEstablished || '',
      department1Name: parseArrayLike(item.department1Name),
      Facilities: parseArrayLike(item.facilities),
      Services: parseArrayLike(item.services),
      InsurancePartners: parseArrayLike(item.insurancePartners),
      Rating: toNumberSafe(item.rating, 0),
      ReviewCount: toNumberSafe(item.reviewCount, 0),
      Website: item.website || '#',
      contactEmail: item.contactEmail || '',
      accreditations: parseArrayLike(item.accreditations),
      contactPhone: item.contactPhone || '',
      city: item.city || item.City || '',
      state: item.state || item.State || '',
      country: item.country || '',
      address: item.address || '',
    }

    return hospital
  } catch (error) {
    console.error('Error fetching hospital:', error)
    return null
  }
}

async function getRelatedData(specialties: string[], currentSlug: string) {
  const specialtiesQuery = specialties.join(",")
  
  // Use a promise.all to fetch all related data concurrently
  const [relatedHospitalsRes, relatedDoctorsRes, relatedTreatmentsRes] = await Promise.all([
    fetch(`http://localhost:3000/api/search?type=hospital&specialties=${specialtiesQuery}`),
    fetch(`http://localhost:3000/api/search?type=doctor&specialties=${specialtiesQuery}`),
    fetch(`http://localhost:3000/api/search?type=treatment&category=${specialtiesQuery}`),
  ]);

  const relatedHospitals: SearchResponse<Hospital> = relatedHospitalsRes.ok ? await relatedHospitalsRes.json() : { items: [] }
  const relatedDoctors: SearchResponse<Doctor> = relatedDoctorsRes.ok ? await relatedDoctorsRes.json() : { items: [] }
  const relatedTreatments: SearchResponse<Treatment> = relatedTreatmentsRes.ok ? await relatedTreatmentsRes.json() : { items: [] }

  // Filter out the current hospital from the related hospitals list
  const filteredHospitals = relatedHospitals.items.filter(h => h.slug !== currentSlug);

  return {
    hospitals: filteredHospitals.slice(0, 3), // Get top 3 related hospitals
    doctors: relatedDoctors.items.slice(0, 3), // Get top 3 related doctors
    treatments: relatedTreatments.items.slice(0, 3) // Get top 3 related treatments
  }
}

// ============ Page and Metadata Generation ============
export async function generateMetadata({ params }: Props) {
  const hospital = await getHospitalBySlug(params.slug)
  
  if (!hospital) {
    return {
      title: 'Hospital Not Found'
    }
  }

  return {
    title: `${hospital.Name} - Hospital Details`,
    description: hospital.description.substring(0, 160),
  }
}

// ============ Main Component ============
export default async function HospitalPage({ params }: Props) {
  const hospital = await getHospitalBySlug(params.slug)
  
  if (!hospital) {
    notFound()
  }

  const imageSrc = hospital.image ? getWixScaledToFillImageUrl(hospital.image, 128, 128) : null
  const relatedData = await getRelatedData(hospital.department1Name, params.slug);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link href="/hospitals" className="text-blue-600 hover:text-blue-800">
            ← Back to Hospitals
          </Link>
        </nav>

        {/* Hospital Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="md:flex">
            <div className="md:flex-shrink-0 md:w-80">
              {imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageSrc || "/placeholder.svg"}
                  alt={hospital.Name}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gray-200">
                  <HeartPulse size={48} className="text-blue-400" />
                </div>
              )}
            </div>
            
            <div className="p-8 flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {hospital.Name}
                  </h1>
                  <p className="text-lg text-[#241d1f] mb-4">{hospital.Type}</p>
                  
                  <div className="flex items-center mb-4">
                    <div className="flex items-center">
                      <span className="text-yellow-400 text-xl">★</span>
                      <span className="ml-1 text-[#241d1f] font-medium">
                        {hospital.Rating.toFixed(1)}
                      </span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-gray-500">
                        {hospital.ReviewCount} reviews
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Key Metrics */}
                <div className="flex flex-col md:flex-row items-center gap-4 text-center">
                  {hospital.totalBeds && (
                    <div className="bg-blue-50 px-4 py-2 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <BedDouble size={20} className="text-blue-600" />
                        <span className="ml-2 text-blue-600 font-semibold text-lg">
                          {hospital.totalBeds}
                        </span>
                      </div>
                      <span className="text-blue-600 text-sm">Beds</span>
                    </div>
                  )}
                  {hospital.numberOfBranches && (
                    <div className="bg-blue-50 px-4 py-2 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <Building size={20} className="text-blue-600" />
                        <span className="ml-2 text-blue-600 font-semibold text-lg">
                          {hospital.numberOfBranches}
                        </span>
                      </div>
                      <span className="text-blue-600 text-sm">Branches</span>
                    </div>
                  )}
                  {hospital.yearEstablished && (
                    <div className="bg-blue-50 px-4 py-2 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <CalendarDays size={20} className="text-blue-600" />
                        <span className="ml-2 text-blue-600 font-semibold text-lg">
                          {hospital.yearEstablished}
                        </span>
                      </div>
                      <span className="text-blue-600 text-sm">Established</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Info */}
              <div className="mb-4 mt-4">
                <p className="text-[#241d1f]">
                  📍 {hospital.address}, {hospital.city}, {hospital.state}, {hospital.country}
                </p>
              </div>

              {/* Contact Info */}
              <div className="flex flex-wrap gap-4 mb-4">
                {hospital.contactPhone && (
                  <a 
                    href={`tel:${hospital.contactPhone}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    📞 {hospital.contactPhone}
                  </a>
                )}
                {hospital.contactEmail && (
                  <a 
                    href={`mailto:${hospital.contactEmail}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ✉️ {hospital.contactEmail}
                  </a>
                )}
                {hospital.Website && hospital.Website !== '#' && (
                  <a 
                    href={hospital.Website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    🌐 Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <section className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">About</h2>
              <p className="text-[#241d1f] leading-relaxed">
                {hospital.description || 'No description available.'}
              </p>
            </section>

            {/* Departments */}
            {hospital.department1Name.length > 0 && (
              <section className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Departments & Specialties</h2>
                <div className="flex flex-wrap gap-2">
                  {hospital.department1Name.map((dept, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {dept}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Services */}
            {hospital.Services.length > 0 && (
              <section className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Services</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {hospital.Services.map((service, index) => (
                    <div key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <span className="text-[#241d1f]">{service}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Facilities */}
            {hospital.Facilities.length > 0 && (
              <section className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Facilities</h2>
                <div className="space-y-2">
                  {hospital.Facilities.map((facility, index) => (
                    <div key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      <span className="text-[#241d1f]">{facility}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Accreditations */}
            {hospital.accreditations.length > 0 && (
              <section className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Accreditations</h2>
                <div className="space-y-2">
                  {hospital.accreditations.map((accreditation, index) => (
                    <div key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <span className="text-[#241d1f]">{accreditation}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Insurance Partners */}
            {hospital.InsurancePartners.length > 0 && (
              <section className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Insurance Partners</h2>
                <div className="space-y-2">
                  {hospital.InsurancePartners.map((insurance, index) => (
                    <div key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      <span className="text-[#241d1f]">{insurance}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* ============ Related Sections ============ */}
        <div className="mt-12 space-y-8">
          {relatedData.hospitals.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Hospitals</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedData.hospitals.map(item => (
                  <Link key={item._id} href={`/hospitals/${item.slug}`} className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center mb-4">
                      {item.image ? (
                        <Image
                          src={getWixScaledToFillImageUrl(item.image, 64, 64)}
                          alt={item.Name}
                          width={64}
                          height={64}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                          <HeartPulse size={24} className="text-gray-500" />
                        </div>
                      )}
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900">{item.Name}</h3>
                        <p className="text-sm text-[#241d1f]">{item.city}, {item.state}</p>
                      </div>
                    </div>
                    <p className="text-[#241d1f] text-sm line-clamp-2">{item.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {relatedData.doctors.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Doctors</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedData.doctors.map(item => (
                  <Link key={item._id} href={`/doctors/${item.slug}`} className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center mb-4">
                      {item.profilePicture ? (
                        <Image
                          src={getWixScaledToFillImageUrl(item.profilePicture, 64, 64)}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                          <Stethoscope size={24} className="text-gray-500" />
                        </div>
                      )}
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-[#241d1f]">{item.specializations.join(', ')}</p>
                      </div>
                    </div>
                    <p className="text-[#241d1f] text-sm">Rating: {item.rating.toFixed(1)}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {relatedData.treatments.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Treatments</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedData.treatments.map(item => (
                  <Link key={item._id} href={`/treatments/${item.slug}`} className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center mb-4">
                      {item.image ? (
                        <Image
                          src={getWixScaledToFillImageUrl(item.image, 64, 64)}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                          <BriefcaseMedical size={24} className="text-gray-500" />
                        </div>
                      )}
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-[#241d1f]">{item.category}</p>
                      </div>
                    </div>
                    <p className="text-[#241d1f] text-sm">Success Rate: {item.successRate}%</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}