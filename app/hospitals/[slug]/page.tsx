// File: app/hospitals/[slug]/page.tsx

"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import type { HospitalWithBranchPreview } from "@/types/hospital"
import { Hospital, Building2, Calendar, Bed, Award, Phone, Mail, Globe, MapPin, Users, Heart, Star, ChevronLeft, Loader2 } from "lucide-react"
import Link from "next/link"

// Helper function to extract the main hospital image URL from rich content
const getHospitalImage = (richContent: any): string | null => {
  if (!richContent || !richContent.nodes) return null;
  const imageNode = richContent.nodes.find((node: any) => node.type === 'IMAGE');
  if (imageNode && imageNode.imageData && imageNode.imageData.image && imageNode.imageData.image.src && imageNode.imageData.image.src.id) {
    const id = imageNode.imageData.image.src.id;
    return `https://static.wixstatic.com/media/${id}`;
  }
  return null;
};

const getHospitalLogo = (richContent: any): string | null => {
  if (!richContent || !richContent.nodes) return null;
  const imageNode = richContent.nodes.find((node: any) => node.type === 'IMAGE');
  if (imageNode && imageNode.imageData && imageNode.imageData.image && imageNode.imageData.image.src && imageNode.imageData.image.src.id) {
    const id = imageNode.imageData.image.src.id;
    return `https://static.wixstatic.com/media/${id}`;
  }
  return null;
};
// Helper function to generate a URL-friendly slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

// Component for displaying hospital details
export default function HospitalDetail({ params }: { params: { slug: string } }) {
  const [hospital, setHospital] = useState<HospitalWithBranchPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHospital = async () => {
      setLoading(true)
      setError(null)
      try {
        // NOTE: Keeping the original fetch logic for finding by slug
        const res = await fetch('/api/hospitals')
        if (!res.ok) throw new Error("Failed to fetch hospitals")
        const data = await res.json()
        if (data.items && data.items.length > 0) {
          const matchedHospital = data.items.find((h: HospitalWithBranchPreview) =>
            generateSlug(h.name) === params.slug
          )
          if (matchedHospital) {
            setHospital(matchedHospital)
          } else {
            throw new Error("Hospital not found")
          }
        } else {
          throw new Error("No hospitals available")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load hospital details")
      } finally {
        setLoading(false)
      }
    }

    if (params.slug) {
      fetchHospital()
    }
  }, [params.slug])

  // --- Loading State UI ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4 p-8 bg-white rounded-xl shadow-lg">
          <Loader2 className="animate-spin w-8 h-8 text-indigo-500" />
          <p className="text-[#241d1f] font-medium">Loading hospital details...</p>
        </div>
      </div>
    )
  }

  // --- Error State UI ---
  if (error || !hospital) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="absolute top-4 left-4">
          <Link href="/hospitals" className="flex items-center gap-2 text-[#241d1f] hover:text-indigo-600 transition-colors">
            <ChevronLeft className="w-5 h-5" />
            Back to Search
          </Link>
        </div>
        <div className="text-center space-y-6 max-w-md p-8 bg-white rounded-xl shadow-xl">
          <Hospital className="w-16 h-16 text-gray-400 mx-auto" />
          <h2 className="title-heading">Hospital Not Found 😔</h2>
          <p className="text-[#241d1f] leading-relaxed">{error || "The requested hospital could not be found. Please check the URL or try searching again."}</p>
          <Link href="/hospitals" className="inline-block w-full bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all font-semibold shadow-md">
            Go to Hospital Search
          </Link>
        </div>
      </div>
    )
  }

  // --- Main Content Logic ---
  const hospitalImage = getHospitalLogo(hospital.image);
  const hospitalLogo = getHospitalLogo(hospital.logo);
  const phone = hospital.contactNumber || hospital.phone;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* Back Link */}
      {/* <div className="container mx-auto px-4 pt-6 md:pt-8">
        <Link href="/hospitals" className="flex items-center gap-2 text-[#241d1f] hover:text-indigo-600 transition-colors font-medium">
          <ChevronLeft className="w-5 h-5" />
          Back to Hospital Directory
        </Link>
      </div> */}

      {/* Hero Header Section */}
      <section className="relative w-full h-[80vh]">
        {/* Background Image */}
        {hospitalImage ? (
          <Image
            src={hospitalImage || hospital.logo || ""}
            alt={`${hospital.name} facility`}
            fill
            priority
            className="object-cover object-center"
          />
        ) : (
          <div className="w-full h-full bg-gray-200" />
        )}

        {/* Bottom-to-top gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/50 to-transparent"></div>

        {/* Content at bottom */}
        <div className="absolute bottom-0 left-0 w-full z-10 px-6 pb-12 text-white">
          <div className="container mx-auto space-y-2">
            {/* Verified Badge */}


            {/* Hospital Name */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight drop-shadow-lg">
              {hospital.name}
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl max-w-2xl drop-shadow-sm">
              {hospital.description ||
                "A leading healthcare provider delivering compassionate, world-class medical care with advanced technology and expert professionals."}
            </p>

            {/* Tags / Badges */}
            <div className="flex flex-wrap gap-3 mt-4">
              {hospital.city && (
                <span className="flex items-center gap-1 bg-white/20 text-gray-100 px-3 py-1 rounded-full text-sm font-medium border border-white/30 backdrop-blur-sm">
                  <MapPin className="w-4 h-4 text-white/80" />
                  {hospital.city}, {hospital.state || "N/A"}
                </span>
              )}
              {hospital.emergencyServices && (
                <span className="flex items-center gap-1 bg-red-600/20 text-red-100 px-3 py-1 rounded-full text-sm font-medium border border-red-400/30">
                  <Heart className="w-4 h-4 fill-red-400 text-red-400" />
                  24/7 Emergency
                </span>
              )}
              {hospital.accreditation && (
                <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-100 px-3 py-1 rounded-full text-sm font-medium border border-yellow-400/30">
                  <Award className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {hospital.accreditation}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>


      {/* Main Content & Sidebar Layout */}
      <section className="py-10  relative z-10">
        <div className="container mx-auto px-4 pb-12">
          <div className="grid lg:grid-cols-12 gap-12">

            {/* Main Content */}
            <main className="lg:col-span-8 space-y-4">

              {/* Key Statistics */}
              <section className="bg-white rounded-xs shadow-xs p-6 border border-gray-100">
                {/* <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-3 border-gray-200">Key Statistics</h2> */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {hospital.branchesCount && (
                    <div className="text-center p-4 bg-gray-50 rounded-xs border border-gray-100 hover:shadow-sm ">
                      <Building2 className="w-7 h-7 text-[#241d1f] mx-auto mb-2" />
                      <p className="title-heading">{hospital.branchesCount}</p>
                      <p className="description-1 mt-1">Branches</p>
                    </div>
                  )}
                  {(hospital.beds || hospital.noOfBeds) && (
                    <div className="text-center p-4 bg-gray-50 rounded-xs border border-gray-100 hover:shadow-sm ">
                      <Bed className="w-7 h-7 text-[#241d1f] mx-auto mb-2" />
                      <p className="title-heading">{hospital.beds || hospital.noOfBeds}</p>
                      <p className="description-1 mt-1">Beds</p>
                    </div>
                  )}
                  {hospital.yearEstablished && (
                    <div className="text-center p-4 bg-gray-50 rounded-xs border border-gray-100 hover:shadow-sm ">
                      <Calendar className="w-7 h-7 text-[#241d1f] mx-auto mb-2" />
                      <p className="title-heading">{hospital.yearEstablished}</p>
                      <p className="description-1 mt-1">Established</p>
                    </div>
                  )}

                  {hospital.accreditation && (
                    <div className="text-center p-4 bg-gray-50 rounded-xs border border-gray-100 hover:shadow-sm ">
                      <Award className="w-7 h-7 text-[#241d1f] mx-auto mb-2" />
                      <p className="title-heading">{hospital.accreditation.split(' ')[0]}</p>
                      <p className="description-1 mt-1">Accreditation</p>
                    </div>
                  )}
                </div>
              </section>

              {/* About Section */}
              {hospital.description && (
                <section className="bg-white rounded-xs shadow-xs p-4 border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-3 border-gray-200">About Hospital</h2>
                  <p className="text-[#241d1f] leading-relaxed text-base">{hospital.description}</p>
                </section>
              )}

              {/* Branches Section */}
              {hospital.branchesPreview && hospital.branchesPreview.length > 0 && (
                <section className="bg-white rounded-xs shadow-xs p-4 border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-3 border-gray-200">Branch Locations</h2>
                  <div className="flex overflow-x-auto space-x-6 pb-4 snap-x snap-mandatory scrollbar-none">
                    {hospital.branchesPreview.map((branch) => (
                      <Link
                        key={branch._id}
                        href={`/hospitals/branches/${generateSlug(branch.name)}`}
                        className="flex-shrink-0 w-80 snap-start bg-gray-50 rounded-xs p-5 border border-gray-100 shadow-xs hover:shadow-sm transition-shadow block"
                      >
                        {branch.image && (
                          <img
                            src={branch.image}
                            alt={branch.name}
                            className="w-full h-36 object-cover rounded-xs mb-4 shadow-sm"
                          />
                        )}
                        <h3 className="title-text mb-3">{branch.name}</h3>
                        <div className="space-y-2 text-sm text-[#241d1f]">
                          {branch.address && (
                            <p className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-[#241d1f] mt-1 flex-shrink-0" />
                              <span className="description-1">{branch.address}</span>
                            </p>
                          )}
                          {branch.totalBeds && (
                            <p className="flex items-center gap-2">
                              <Bed className="w-4 h-4 text-[#241d1f] flex-shrink-0" />
                              <span className="description-1">{branch.totalBeds}</span> Total Beds
                            </p>
                          )}
                          {branch.icuBeds && (
                            <p className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-[#241d1f] flex-shrink-0" />
                              <span className="description-1">{branch.icuBeds}</span> ICU Beds
                            </p>
                          )}
                       
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Emergency Services Highlight */}
              {hospital.emergencyServices && (
                <section className="bg-white border border-gray-100 rounded-xs p-5 shadow-xs">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <Heart className="w-8 h-8 text-[#241d1f] fill-gray-500" />
                    </div>
                    <div>
                      <h3 className="title-heading mb-1">Dedicated 24/7 Emergency Care</h3>
                      <p className="text-[#241d1f] description leading-relaxed">
                        Our <strong>Emergency Department</strong> is fully staffed and equipped around the clock to provide immediate and critical care for all medical emergencies. Your health is our priority.
                      </p>
                    </div>
                  </div>
                </section>

              )}

            </main>

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-6">

              {/* Contact Card */}
              <div className="bg-white p-4 w-full relative h-52 border border-gray-200 ">
                <Image
                  src={hospitalLogo || hospital.logo || ""}
                  alt={`${hospital.name} facility`}
                  fill
                  priority
                  className="object-cover p-4 w-full h-60 object-center"
                />
              </div>

              {/* Quick Actions */}
              <div className="bg-white sticky top-16 rounded-xs shadow-xs p-5 border border-gray-200">
                <h3 className="title-heading mb-3 border-b pb-2 border-gray-100">Quick Actions</h3>
                <div className="space-y-3">
                  <Link href="/hospitals" className="block w-full text-center bg-gray-100 text-[#241d1f] py-3 px-4 rounded-xs hover:bg-gray-200 transition-colors font-medium">
                    Explore All Hospitals
                  </Link>
                  <button className="block w-full bg-[#74c044] text-white py-3 px-4 rounded-xs hover:bg-indigo-700 transition-colors font-semibold shadow-xs hover:shadow-sm transform hover:-translate-y-0.5">
                    Book Appointment Now
                  </button>
                  <button className="block w-full bg-[#e12428] text-white py-3 px-4 rounded-xs hover:bg-green-700 transition-colors font-semibold shadow-xs hover:shadow-sm transform hover:-translate-y-0.5">
                    Call for Emergency
                  </button>

                </div>
              </div>

            </aside>

          </div>
        </div>

      </section>
    </div>
  )
}