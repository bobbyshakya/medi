"use client"

import { useState, useMemo, use } from "react"
import { useQuery } from "@tanstack/react-query"
import ContactForm from "@/components/ContactForm"
import { Users, Heart } from "lucide-react"
import HeroSection from "./components/HeroSection"
import EmblaCarousel from "./components/EmblaCarousel"
import Breadcrumb from "./components/Breadcrumb"
import RichTextDisplay from "./components/RichTextDisplay"
import BranchesSection from "./components/BranchesSection"
import HospitalDetailSkeleton from "./components/HospitalDetailSkeleton"
import ErrorState from "./components/ErrorState"
import SimilarHospitalsSection from "./components/SimilarHospitalsSection"
import type { HospitalData, AccreditationData } from "@/lib/cms/types"

// =============================================================================
// TYPES
// =============================================================================

interface HospitalDetailResponse {
  hospital: HospitalData | null
  similarHospitals: HospitalData[]
  error?: string
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getHospitalCity(hospital: HospitalData): string {
  const firstBranch = hospital.branches?.[0]
  const firstCity = firstBranch?.city?.[0]
  return firstCity?.cityName || "Unknown City"
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function HospitalDetail({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const hospitalSlugFromParams = resolvedParams.slug

  const [showAllBranches, setShowAllBranches] = useState(false)
  const [selectedCity, setSelectedCity] = useState("")

  // Fetch hospital data using the unified CMS API
  const {
    data: hospitalData,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["hospital", hospitalSlugFromParams],
    queryFn: async () => {
      const res = await fetch(`/api/cms?action=hospital&slug=${encodeURIComponent(hospitalSlugFromParams)}`)
      if (!res.ok) throw new Error("Failed to fetch hospital details")
      return res.json() as Promise<HospitalDetailResponse>
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  })

  const hospital = hospitalData?.hospital || null
  const similarHospitals = hospitalData?.similarHospitals || []

  // Compute city options for filtering
  const allCityOptions = useMemo(() => {
    if (!hospital?.branches) return []
    const cities = new Set<string>()
    hospital.branches.forEach((branch) => {
      const city = branch.city?.[0]?.cityName
      if (city) cities.add(city)
    })
    return Array.from(cities)
  }, [hospital])

  // Filter branches by selected city
  const filteredBranches = useMemo(() => {
    if (!hospital?.branches) return []
    return hospital.branches.filter((branch) => {
      const branchCity = branch.city?.[0]?.cityName || ""
      return !selectedCity || branchCity === selectedCity
    })
  }, [hospital, selectedCity])

  const visibleBranches = showAllBranches ? filteredBranches : filteredBranches.slice(0, 3)

  // Extract unique doctors and treatments from branches
  const allDoctors = useMemo(() => {
    if (!hospital?.branches) return []
    const doctorMap = new Map()
    hospital.branches.forEach((branch) => {
      branch.doctors?.forEach((doctor) => {
        if (doctor._id && !doctorMap.has(doctor._id)) {
          doctorMap.set(doctor._id, { ...doctor, branch: branch.branchName })
        }
      })
    })
    return Array.from(doctorMap.values()).slice(0, 9)
  }, [hospital])

  const allTreatments = useMemo(() => {
    if (!hospital?.branches) return []
    const treatmentMap = new Map()
    hospital.branches.forEach((branch) => {
      branch.treatments?.forEach((treatment) => {
        if (treatment._id && !treatmentMap.has(treatment._id)) {
          treatmentMap.set(treatment._id, { ...treatment, branch: branch.branchName })
        }
      })
    })
    return Array.from(treatmentMap.values()).slice(0, 9)
  }, [hospital])

  // Unique accreditations
  const uniqueAccreditations = useMemo(() => {
    if (!hospital?.accreditations) return []
    const titlesSeen = new Set<string>()
    const unique: AccreditationData[] = []
    hospital.accreditations.forEach((acc) => {
      if (!titlesSeen.has(acc.title)) {
        titlesSeen.add(acc.title)
        unique.push(acc)
      }
    })
    return unique
  }, [hospital])

  // Loading state
  if (loading) return <HospitalDetailSkeleton />

  // Error state
  if (error || !hospital) {
    return <ErrorState error={error instanceof Error ? error.message : hospitalData?.error || "Hospital not found"} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection hospital={hospital as any} accreditations={uniqueAccreditations as any} />
      <Breadcrumb hospitalName={hospital.hospitalName} hospitalSlug={hospitalSlugFromParams} />

      <section className="pt-8 pb-10 md:pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <main className="lg:col-span-9 space-y-10 md:space-y-8">
              {/* Description */}
              {hospital.description && (
                <section className="bg-white rounded-xl first-heading border border-gray-100 p-4 md:p-8 shadow-md">
                  <RichTextDisplay htmlContent={hospital.description} className="mt-0" />
                </section>
              )}

              {/* Branches */}
              {hospital.branches && hospital.branches.length > 0 && (
                <BranchesSection
                  hospital={hospital as any}
                  selectedCity={selectedCity}
                  allCityOptions={allCityOptions}
                  visibleBranches={visibleBranches as any}
                  filteredBranches={filteredBranches as any}
                  setShowAllBranches={setShowAllBranches}
                  showAllBranches={showAllBranches}
                  setSelectedCity={setSelectedCity}
                  hospitalSlug={hospitalSlugFromParams}
                />
              )}

              {/* Doctors Carousel */}
              {allDoctors.length > 0 && (
                <section className="bg-white rounded-xl border border-gray-100 p-4 md:p-8 shadow-md">
                  <EmblaCarousel
                    items={allDoctors}
                    title="Featured Specialist Doctors"
                    icon={Users}
                    type="doctors"
                  />
                </section>
              )}

              {/* Treatments Carousel */}
              {allTreatments.length > 0 && (
                <section className="bg-white rounded-xl border border-gray-100 p-4 md:p-8 shadow-md">
                  <EmblaCarousel
                    items={allTreatments}
                    title="Popular Treatments & Procedures"
                    icon={Heart}
                    type="treatments"
                  />
                </section>
              )}

              {/* Similar Hospitals */}
              {similarHospitals.length > 0 && (
                <SimilarHospitalsSection similarHospitals={similarHospitals as any} />
              )}
            </main>

            {/* Sidebar */}
            <aside className="lg:col-span-3 space-y-10 mt-10 lg:mt-0">
              <div className="lg:sticky lg:top-16">
                <ContactForm />
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}
