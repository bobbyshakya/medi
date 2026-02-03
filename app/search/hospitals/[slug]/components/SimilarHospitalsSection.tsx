"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import classNames from "classnames"
import useEmblaCarousel from 'embla-carousel-react'
import { useRouter } from "next/navigation"
import { Inter } from "next/font/google"
import SearchDropdown from "./SearchDropdown"
import BranchCard from "./BranchCard"
import { BranchCardSkeleton } from "@/components/search/Skeletons"
import { generateSlug } from "../utils"

const inter = Inter({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  variable: "--font-inter"
})

const EMBLA_CLASSES = {
  container: "embla__container flex touch-pan-y ml-[-1rem]",
  slide: "embla__slide flex-[0_0_auto] min-w-0 pl-4",
  viewport: "overflow-hidden"
}

const EMBLA_SLIDE_SIZES = {
  xs: "w-full",
  sm: "sm:w-1/2",
  lg: "lg:w-1/3",
}

const SimilarHospitalsSection = ({ 
  currentHospitalId, 
  currentBranchId, 
  currentCity, 
  displayCityName,
  allHospitals // NEW: Pre-fetched hospitals data from server
}: { 
  currentHospitalId: string; 
  currentBranchId: string; 
  currentCity: string; 
  displayCityName: string;
  allHospitals?: any[]
}) => {
  const router = useRouter()
  const [branches, setBranches] = useState<any[]>([])
  const [allBranches, setAllBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start', dragFree: false, containScroll: 'keepSnaps' })
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true)
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true)

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  const onSelect = useCallback((emblaApi: any) => {
    setPrevBtnDisabled(!emblaApi.canScrollPrev())
    setNextBtnDisabled(!emblaApi.canScrollNext())
  }, [])

  // Process pre-fetched data on mount
  useEffect(() => {
    if (allHospitals && allHospitals.length > 0) {
      // Extract all branches with hospital info from pre-fetched data
      const allHospitalBranches = allHospitals
        .flatMap((h: any) => (h.branches || []).map((b: any) => ({
          ...b,
          hospitalName: h.hospitalName,
          yearEstablished: b.yearEstablished || h.yearEstablished,
          logo: b.logo || h.logo,
          accreditation: b.accreditation || h.accreditation
        })))
        .filter((b: any) => b?.branchName)
        .sort((a: any, b: any) => (a.branchName || '').localeCompare(b.branchName || ''))

      // Filter similar branches (same city, different hospital)
      const similarBranches = allHospitalBranches
        .filter((b: any) => {
          const isInSameCity = b.city?.some((c: any) => 
            c?.cityName?.toLowerCase().includes(currentCity.toLowerCase()) || 
            currentCity.toLowerCase().includes(c?.cityName?.toLowerCase())
          )
          const isDifferentBranch = b._id !== currentBranchId
          return isInSameCity && isDifferentBranch
        })
        .slice(0, 10)

      setBranches(similarBranches)
      setAllBranches(allHospitalBranches)
      setLoading(false)
    }
  }, [allHospitals, currentHospitalId, currentBranchId, currentCity])

  const fetchData = useCallback(async (retryCount = 0) => {
    // Skip if we already have data from pre-fetch
    if (allHospitals && allHospitals.length > 0) {
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      setError(false)

      // Use the new unified CMS API for faster data fetching
      const res = await fetch(`/api/cms?action=all&pageSize=500`)
      if (!res.ok) throw new Error('Failed to fetch hospitals')
      const data = await res.json()
      const hospitals = data.hospitals || []

      // Extract all branches with hospital info
      const allHospitalBranches = hospitals
        .flatMap((h: any) => (h.branches || []).map((b: any) => ({
          ...b,
          hospitalName: h.hospitalName,
          yearEstablished: b.yearEstablished || h.yearEstablished,
          logo: b.logo || h.logo,
          accreditation: b.accreditation || h.accreditation
        })))
        .filter((b: any) => b?.branchName)
        .sort((a: any, b: any) => (a.branchName || '').localeCompare(b.branchName || ''))

      // Filter similar branches (same city, different hospital)
      const similarBranches = allHospitalBranches
        .filter((b: any) => {
          const isInSameCity = b.city?.some((c: any) => 
            c?.cityName?.toLowerCase().includes(currentCity.toLowerCase()) || 
            currentCity.toLowerCase().includes(c?.cityName?.toLowerCase())
          )
          const isDifferentBranch = b._id !== currentBranchId
          return isInSameCity && isDifferentBranch
        })
        .slice(0, 10)

      setBranches(similarBranches)
      setAllBranches(allHospitalBranches)
      setLoading(false)
    } catch (err) {
      console.warn('Failed to fetch data:', err)
      if (retryCount < 3) {
        setTimeout(() => fetchData(retryCount + 1), 1000 * (retryCount + 1)) // Exponential backoff
      } else {
        setError(true)
        setLoading(false)
      }
    }
  }, [currentHospitalId, currentBranchId, currentCity])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!emblaApi) return
    onSelect(emblaApi)
    emblaApi.on('reInit', onSelect)
    emblaApi.on('select', onSelect)
  }, [emblaApi, onSelect])

  const searchOptions = useMemo(() => allBranches.map(branch => ({
    id: branch._id,
    name: `${branch.branchName}${branch.city?.[0]?.cityName ? ` (${branch.city[0].cityName})` : ''}`
  })), [allBranches])

  const handleSelect = useCallback((id: string) => {
    const branch = allBranches.find(b => b._id === id)
    if (branch) {
      setSearchTerm("")
      router.push(`/search/hospitals/${generateSlug(branch.branchName)}`)
    }
  }, [allBranches, router])

  return (
    <section className={`bg-gray-50 rounded-xs shadow-xs border border-gray-100 ${inter.variable} font-light`}>
      <div className="px-2 md:px-4 py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-0">
          <h2 className="text-2xl md:text-xl font-medium mt-2 text-gray-900 tracking-tight flex items-center">
            Similar Hospitals in {displayCityName}
          </h2>
          <div className="relative w-full md:w-80">
            <SearchDropdown value={searchTerm} onChange={setSearchTerm} placeholder="Search hospital by name and city" options={searchOptions} onOptionSelect={handleSelect} onClear={() => setSearchTerm("")} type="branch" />
          </div>
        </div>
      </div>
      {loading ? (
        <div className="relative px-2 md:px-4 pb-8">
          <div className={EMBLA_CLASSES.viewport} ref={emblaRef}>
            <div className={EMBLA_CLASSES.container}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={classNames(EMBLA_CLASSES.slide, EMBLA_SLIDE_SIZES.xs, EMBLA_SLIDE_SIZES.sm, EMBLA_SLIDE_SIZES.lg)}>
                  <BranchCardSkeleton />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="p-8 pt-0">
          <p className="text-red-500 text-sm italic">Failed to load similar hospitals. Please try again later.</p>
        </div>
      ) : branches.length === 0 ? (
        <div className="p-8 pt-0">
          <p className="text-gray-500 text-sm italic">No similar hospitals found in {displayCityName}. Use the search above to find all hospital branches.</p>
        </div>
      ) : (
        <div className="relative px-2 md:px-4 pb-8">
          <div className={EMBLA_CLASSES.viewport} ref={emblaRef}>
            <div className={EMBLA_CLASSES.container}>
              {branches.map(branch => (
                <div key={branch._id} className={classNames(EMBLA_CLASSES.slide, EMBLA_SLIDE_SIZES.xs, EMBLA_SLIDE_SIZES.sm, EMBLA_SLIDE_SIZES.lg)}>
                  <BranchCard data={branch} />
                </div>
              ))}
            </div>
          </div>
          {branches.length > 3 && (
            <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between pointer-events-none px-2 md:px-0">
              <button onClick={scrollPrev} disabled={prevBtnDisabled} className={classNames("p-3 rounded-full bg-white shadow-lg transition-opacity duration-200 pointer-events-auto disabled:opacity-40 disabled:cursor-not-allowed ml-[-1rem]")} aria-label="Previous hospital">
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button onClick={scrollNext} disabled={nextBtnDisabled} className={classNames("p-3 rounded-full bg-white shadow-lg transition-opacity duration-200 pointer-events-auto disabled:opacity-40 disabled:cursor-not-allowed mr-[-1rem]")} aria-label="Next hospital">
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default SimilarHospitalsSection