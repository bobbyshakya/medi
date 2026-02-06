"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { ChevronLeft, ChevronRight, X, Search, Loader2 } from "lucide-react"
import useEmblaCarousel from "embla-carousel-react"
import classNames from "classnames"
import type { HospitalTreatmentInfo } from "../utils"
import type { CityData } from "@/lib/cms/types"
import BranchCard from "./BranchCard"

// Hospital/Branch type for the dropdown
interface DropdownItem {
  _id: string
  branchName: string
  hospitalName: string
  cityName: string
  hospitalSlug: string
  address: string
}

interface HospitalsCarouselProps {
  title: string
  hospitals: HospitalTreatmentInfo[]
  totalHospitals: number
}

export default function HospitalsCarousel({ title, hospitals, totalHospitals }: HospitalsCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    dragFree: false,
    containScroll: "keepSnaps"
  })
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true)
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true)
  
  // Dropdown states
  const [searchQuery, setSearchQuery] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [dropdownItems, setDropdownItems] = useState<DropdownItem[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const hasFetchedItems = useRef(false)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  const onSelect = useCallback((emblaApi: any) => {
    setPrevBtnDisabled(!emblaApi.canScrollPrev())
    setNextBtnDisabled(!emblaApi.canScrollNext())
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    onSelect(emblaApi)
    emblaApi.on("reInit", onSelect)
    emblaApi.on("select", onSelect)
  }, [emblaApi, onSelect])

  // Handle click outside for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch all items for dropdown (uses dropdown=true to get branches)
  const fetchAllItems = useCallback(async () => {
    if (hasFetchedItems.current) return
    
    setIsLoadingItems(true)
    try {
      const response = await fetch('/api/hospitals?dropdown=true')
      if (response.ok) {
        const data = await response.json()
        const items: DropdownItem[] = data.items || []
        
        setDropdownItems(items)
        hasFetchedItems.current = true
      }
    } catch (error) {
      console.error('Failed to fetch items:', error)
    } finally {
      setIsLoadingItems(false)
    }
  }, [])

  // Open dropdown and fetch items on focus
  const handleDropdownFocus = useCallback(() => {
    setIsDropdownOpen(true)
    fetchAllItems()
  }, [fetchAllItems])

  // Filter items based on search query
  const filteredDropdownItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return dropdownItems
    }
    
    const query = searchQuery.toLowerCase()
    return dropdownItems.filter(item => 
      item.branchName?.toLowerCase().includes(query) ||
      item.hospitalName?.toLowerCase().includes(query) ||
      item.cityName?.toLowerCase().includes(query)
    )
  }, [searchQuery, dropdownItems])

  // Handle item selection - redirect to hospital page
  const handleItemSelect = useCallback((item: DropdownItem) => {
    if (item.hospitalSlug) {
      const slug = item.hospitalSlug.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
      window.location.href = `/hospital/${slug}`
    }
  }, [])

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery("")
  }, [])

  // Filter branches based on search query
  const filteredBranches = useMemo(() => {
    if (!searchQuery.trim()) {
      const allBranches: Array<{
        branchInfo: HospitalTreatmentInfo["branches"][0]
        hospital: HospitalTreatmentInfo["hospital"]
      }> = []

      hospitals.forEach((hospitalWrapper) => {
        hospitalWrapper.branches.forEach((branchInfo) => {
          allBranches.push({
            branchInfo,
            hospital: hospitalWrapper.hospital
          })
        })
      })

      return allBranches
    }

    const query = searchQuery.toLowerCase()
    const filtered: Array<{
      branchInfo: HospitalTreatmentInfo["branches"][0]
      hospital: HospitalTreatmentInfo["hospital"]
    }> = []

    hospitals.forEach((hospitalWrapper) => {
      const hospitalName = hospitalWrapper.hospital.hospitalName?.toLowerCase() || ""
      const hospitalMatches = hospitalName.includes(query)
      
      const branchMatches = hospitalWrapper.branches.some((branchInfo) => {
        return branchInfo.branch.city?.some((city: CityData) => 
          city.cityName?.toLowerCase().includes(query)
        )
      })

      if (hospitalMatches || branchMatches) {
        hospitalWrapper.branches.forEach((branchInfo) => {
          filtered.push({
            branchInfo,
            hospital: hospitalWrapper.hospital
          })
        })
      }
    })

    return filtered
  }, [hospitals, searchQuery])

  const hasActiveFilters = searchQuery.trim() !== ""

  if (hospitals.length === 0) return null

  return (
    <section className="bg-white rounded-sm border border-gray-100 p-4 md:p-6 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h3 className="text-xl font-medium text-gray-900">
            Related Hospitals
          </h3>
          {hasActiveFilters && (
            <p className="text-sm text-gray-500 mt-1">
              Showing {filteredBranches.length} result{filteredBranches.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearSearch}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              Clear Filter
            </button>
          )}
          <div ref={dropdownRef} className="relative w-72">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setIsDropdownOpen(true)
                }}
                onFocus={handleDropdownFocus}
                placeholder="Search all branches..."
                className="w-full pl-9 pr-8 py-2 border border-gray-200 text-sm rounded-xs focus:outline-none focus:ring-1 focus:ring-gray-400/50 bg-white text-gray-900 placeholder-gray-500 shadow-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              {isLoadingItems ? (
                <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
              ) : searchQuery ? (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : null}
            </div>
            
            {/* Dropdown with all branches from API */}
            {isDropdownOpen && (
              <div className="absolute z-40 w-full mt-1 bg-white border border-gray-200 rounded-xs shadow-lg max-h-60 overflow-y-auto">
                {isLoadingItems ? (
                  <div className="flex items-center justify-center py-4 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Loading branches...
                  </div>
                ) : filteredDropdownItems.length > 0 ? (
                  <>
                    {filteredDropdownItems.map((item) => (
                      <button
                        key={item._id}
                        onClick={() => handleItemSelect(item)}
                        className="w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-100 last:border-b-0 text-gray-700 hover:bg-gray-50 hover:text-[#74BF44]"
                      >
                        <div className="font-medium">{item.branchName}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {item.hospitalName}{item.cityName ? ` • ${item.cityName}` : ''}
                        </div>
                      </button>
                    ))}
                  </>
                ) : searchQuery ? (
                  <div className="py-3 text-center text-sm text-gray-500">
                    No branches found
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative" role="region" aria-label="Hospitals Carousel">
        {filteredBranches.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p>No hospitals match your filter criteria.</p>
            <button
              onClick={clearSearch}
              className="mt-2 text-[#74BF44] hover:underline text-sm"
            >
              Clear filters to see all hospitals
            </button>
          </div>
        ) : (
          <>
            <div className="embla__viewport overflow-hidden" ref={emblaRef}>
              <div className="embla__container flex touch-pan-y ml-[-1rem]">
                {filteredBranches.map((item, index) => (
                  <div
                    key={`${item.branchInfo.branch._id}-${index}`}
                    className="embla__slide flex-[0_0_auto] min-w-0 w-full md:w-[calc(33.333%-0.666rem)] pl-4"
                  >
                    <BranchCard
                      branch={item.branchInfo.branch}
                      hospital={item.hospital}
                      treatmentCost={item.branchInfo.treatmentCost}
                      treatmentDuration={item.branchInfo.treatmentDuration}
                      matchingDoctorsCount={item.branchInfo.matchingDoctors?.length}
                    />
                  </div>
                ))}
              </div>
            </div>

            {filteredBranches.length > 1 && (
              <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between pointer-events-none px-2">
                <button
                  onClick={scrollPrev}
                  disabled={prevBtnDisabled}
                  className={classNames(
                    "pointer-events-auto p-2 rounded-full bg-white shadow-md text-gray-600 hover:text-[#74BF44] transition-all disabled:opacity-40 disabled:cursor-not-allowed ml-[-1rem]"
                  )}
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={scrollNext}
                  disabled={nextBtnDisabled}
                  className={classNames(
                    "pointer-events-auto p-2 rounded-full bg-white shadow-md text-gray-600 hover:text-[#74BF44] transition-all disabled:opacity-40 disabled:cursor-not-allowed mr-[-1rem]"
                  )}
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
