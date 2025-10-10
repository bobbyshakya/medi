// File: app/branches/[slug]/page.tsx

"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import type { HospitalWithBranchPreview } from "@/types/hospital"
import { Building2, Calendar, Bed, Award, Phone, Mail, Globe, MapPin, Users, Heart, Star, ChevronLeft, Loader2 } from "lucide-react"
import Link from "next/link"

// Helper function to generate a URL-friendly slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

// Component for displaying branch details
export default function BranchDetail({ params }: { params: { slug: string } }) {
  const [branch, setBranch] = useState<any>(null)
  const [hospital, setHospital] = useState<HospitalWithBranchPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBranch = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/hospitals')
        if (!res.ok) throw new Error("Failed to fetch hospitals")
        const data = await res.json()
        if (data.items && data.items.length > 0) {
          let matchedBranch = null
          let matchedHospital = null
          for (const h of data.items) {
            const matched = h.branchesPreview?.find((b: any) => generateSlug(b.name) === params.slug)
            if (matched) {
              matchedBranch = matched
              matchedHospital = h
              break
            }
          }
          if (matchedBranch && matchedHospital) {
            setBranch(matchedBranch)
            setHospital(matchedHospital)
          } else {
            throw new Error("Branch not found")
          }
        } else {
          throw new Error("No hospitals available")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load branch details")
      } finally {
        setLoading(false)
      }
    }

    if (params.slug) {
      fetchBranch()
    }
  }, [params.slug])

  // --- Loading State UI ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4 p-8 bg-white rounded-xl shadow-lg">
          <Loader2 className="animate-spin w-8 h-8 text-indigo-500" />
          <p className="text-[#241d1f] font-medium">Loading branch details...</p>
        </div>
      </div>
    )
  }

  // --- Error State UI ---
  if (error || !branch || !hospital) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="absolute top-4 left-4">
          <Link href="/hospitals" className="flex items-center gap-2 text-[#241d1f] hover:text-indigo-600 transition-colors">
            <ChevronLeft className="w-5 h-5" />
            Back to Search
          </Link>
        </div>
        <div className="text-center space-y-6 max-w-md p-8 bg-white rounded-xl shadow-xl">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto" />
          <h2 className="title-heading">Branch Not Found 😔</h2>
          <p className="text-[#241d1f] leading-relaxed">{error || "The requested branch could not be found. Please check the URL or try searching again."}</p>
          <Link href="/hospitals" className="inline-block w-full bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all font-semibold shadow-md">
            Go to Hospital Search
          </Link>
        </div>
      </div>
    )
  }

  // --- Main Content Logic ---
  const hospitalSlug = generateSlug(hospital.name)
  const phone = branch.emergencyContact || hospital.contactNumber || hospital.phone

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* Hero Header Section */}
      <section className="relative w-full h-[80vh]">
        {/* Background Image */}
        {branch.image ? (
          <Image
            src={branch.image}
            alt={`${branch.name} facility`}
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
          <div className="container mx-auto space-y-4">
            {/* Verified Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-1.5 rounded-full text-sm font-semibold border border-white/30 backdrop-blur-sm">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              Verified Branch
            </div>

            {/* Branch Name */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight drop-shadow-lg">
              {branch.name}
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl max-w-2xl drop-shadow-sm">
              Part of {hospital.name} • {branch.address || "Leading healthcare facility"}
            </p>

            {/* Tags / Badges */}
            <div className="flex flex-wrap gap-3 mt-4">
              {branch.address && (
                <span className="flex items-center gap-1 bg-white/20 text-gray-100 px-3 py-1 rounded-full text-sm font-medium border border-white/30 backdrop-blur-sm">
                  <MapPin className="w-4 h-4 text-white/80" />
                  {branch.address.split(',')[0] || "Location"}
                </span>
              )}
              {branch.emergencyContact && (
                <span className="flex items-center gap-1 bg-red-600/20 text-red-100 px-3 py-1 rounded-full text-sm font-medium border border-red-400/30">
                  <Heart className="w-4 h-4 fill-red-400 text-red-400" />
                  Emergency Available
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
      <section className="py-10 relative z-10">
        <div className="container mx-auto px-4 pb-12">
          <div className="grid lg:grid-cols-12 gap-12">

            {/* Main Content */}
            <main className="lg:col-span-8 space-y-4">

              {/* Key Statistics */}
              <section className="bg-white rounded-xs shadow-xs p-6 border border-gray-100">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {branch.totalBeds && (
                    <div className="text-center p-4 bg-gray-50 rounded-xs border border-gray-100 hover:shadow-sm">
                      <Bed className="w-7 h-7 text-[#241d1f] mx-auto mb-2" />
                      <p className="title-heading">{branch.totalBeds}</p>
                      <p className="description-1 mt-1">Total Beds</p>
                    </div>
                  )}
                  {branch.icuBeds && (
                    <div className="text-center p-4 bg-gray-50 rounded-xs border border-gray-100 hover:shadow-sm">
                      <Users className="w-7 h-7 text-[#241d1f] mx-auto mb-2" />
                      <p className="title-heading">{branch.icuBeds}</p>
                      <p className="description-1 mt-1">ICU Beds</p>
                    </div>
                  )}
                  {hospital.accreditation && (
                    <div className="text-center p-4 bg-gray-50 rounded-xs border border-gray-100 hover:shadow-sm">
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

              {/* Emergency Services Highlight */}
              {branch.emergencyContact && (
                <section className="bg-white border border-gray-100 rounded-xs p-5 shadow-xs">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <Heart className="w-8 h-8 text-[#241d1f] fill-gray-500" />
                    </div>
                    <div>
                      <h3 className="title-heading mb-1">24/7 Emergency Contact</h3>
                      <p className="text-[#241d1f] description leading-relaxed">
                        Reach our dedicated emergency line for immediate assistance: <strong>{branch.emergencyContact}</strong>.
                      </p>
                    </div>
                  </div>
                </section>
              )}

            </main>

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-6">

              {/* Back to Hospital */}
              <div className="bg-white rounded-xs shadow-xs p-5 border border-gray-200">
                <Link
                  href={`/hospitals/${hospitalSlug}`}
                  className="flex items-center gap-2 text-[#241d1f] hover:text-indigo-600 transition-colors font-medium"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back to {hospital.name}
                </Link>
              </div>

              {/* Contact Card */}
              <div className="bg-white rounded-xs shadow-xs p-5 border border-gray-200">
                <h3 className="title-heading mb-3 flex items-center gap-2 border-b pb-2 border-gray-100">
                  <Phone className="w-5 h-5 mt-1 text-[#241d1f]" />
                  Contact Information
                </h3>
                <div className="space-y-2 text-sm">
                  {phone && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xs hover:bg-gray-100 transition-colors">
                      <Phone className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <a href={`tel:${phone}`} className="description hover:text-[#241d1f] transition-colors">{phone}</a>
                    </div>
                  )}
                  {hospital.email && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xs hover:bg-gray-100 transition-colors">
                      <Mail className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <a href={`mailto:${hospital.email}`} className="description hover:text-[#241d1f] transition-colors truncate">{hospital.email}</a>
                    </div>
                  )}
                  {hospital.website && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xs hover:bg-gray-100 transition-colors">
                      <Globe className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <a href={hospital.website} target="_blank" rel="noopener noreferrer" className="text-[#241d1f] font-medium hover:underline">Visit Official Website</a>
                    </div>
                  )}
                  {branch.address && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xs">
                      <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <span className="description">{branch.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white sticky top-16 rounded-xs shadow-xs p-5 border border-gray-200">
                <h3 className="title-heading mb-3 border-b pb-2 border-gray-100">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    href={`/hospitals/${hospitalSlug}`}
                    className="block w-full text-center bg-gray-100 text-[#241d1f] py-3 px-4 rounded-xs hover:bg-gray-200 transition-colors font-medium"
                  >
                    View Hospital Overview
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