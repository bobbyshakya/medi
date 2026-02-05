"use client"

import React, { useState, useCallback, useEffect, useMemo } from "react"
import { ChevronLeft, ChevronRight, Stethoscope, Scissors, X } from "lucide-react"
import { useRouter } from "next/navigation"
import classNames from "classnames"
import useEmblaCarousel from 'embla-carousel-react'
import { Inter } from "next/font/google"
import SearchDropdown from "./SearchDropdown"
import DoctorCard from "./DoctorCard"
import TreatmentCard from "./TreatmentCard"
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

const CarouselSection = ({ title, items, type, searchPlaceholder, onSearchSelect }: {
  title: string; items: any[]; type: 'doctor' | 'treatment'; searchPlaceholder: string; onSearchSelect?: (id: string) => void;
}) => {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start', dragFree: false, containScroll: 'keepSnaps' })
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

  const searchOptions = useMemo(() => items.map(item => ({
    id: item._id,
    slug: generateSlug(item.name || item.title || item.doctorName || ''),
    name: type === 'doctor' ? `${item.doctorName} - ${item.specialization?.[0]?.name || 'General Practitioner'}` : `${item.name || item.title}`
  })), [items, type])

  const filteredItems = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase()
    return items.filter(item =>
      (item.doctorName || item.name || item.title || '').toLowerCase().includes(lowerSearch) ||
      (item.specialistName || '').toLowerCase().includes(lowerSearch)
    ).sort((a, b) => (a.doctorName || a.name || a.title || '').localeCompare(b.doctorName || b.name || b.title || ''))
  }, [items, searchTerm])

  if (!items.length) return (
    <div className={`bg-gray-50 md:p-4 p-2 rounded-xs shadow-xs border border-gray-100 text-center ${inter.variable} font-light`}>
      {type === 'doctor' ? <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" /> : <Scissors className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
      <p className="text-gray-500 text-sm">No {type}s available at this branch</p>
    </div>
  )

  // Helper function to find slug by ID
  const getSlugById = (id: string) => {
    const option = searchOptions.find(opt => opt.id === id)
    return option?.slug || generateSlug(option?.name || '')
  }

  return (
    <section className={`bg-gray-50 rounded-xs shadow-xs border border-gray-100 ${inter.variable} font-light`}>
      <div className="md:px-4 px-2 pt-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3">
          <h2 className="text-2xl md:text-xl font-medium text-gray-900 tracking-tight flex items-center mt-2">{title}</h2>
          <div className="relative w-full md:w-80">
            <SearchDropdown value={searchTerm} onChange={setSearchTerm} placeholder={searchPlaceholder} options={searchOptions} onOptionSelect={(id) => {
              if (type === 'treatment') {
                const slug = getSlugById(id);
                router.push(`/search?treatment=${slug}&view=treatments`);
              } else {
                onSearchSelect?.(id);
              }
            }} onClear={() => setSearchTerm("")} type={type} />
          </div>
        </div>
      </div>
      <div className="relative px-2 md:px-4 pb-8">
        <div className={EMBLA_CLASSES.viewport} ref={emblaRef}>
          <div className={EMBLA_CLASSES.container}>
            {filteredItems.map((item, index) => (
              <div key={item._id || `${item.name || item.title || 'item'}-${index}`} className={classNames(EMBLA_CLASSES.slide, EMBLA_SLIDE_SIZES.xs, EMBLA_SLIDE_SIZES.sm, EMBLA_SLIDE_SIZES.lg)}>
                {type === 'doctor' ? <DoctorCard doctor={item} /> : <TreatmentCard item={item} />}
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className="pl-4 py-8 text-center w-full min-h-40 flex flex-col items-center justify-center">
                <X className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-gray-500">No {type}s found matching "{searchTerm}".</p>
              </div>
            )}
          </div>
        </div>
        {filteredItems.length > 3 && (
          <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between pointer-events-none px-2 md:px-0">
            <button onClick={scrollPrev} disabled={prevBtnDisabled} className={classNames("p-3 rounded-full bg-white shadow-lg transition-opacity duration-200 pointer-events-auto disabled:opacity-40 disabled:cursor-not-allowed ml-[-1rem]")} aria-label={`Previous ${type}`}>
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button onClick={scrollNext} disabled={nextBtnDisabled} className={classNames("p-3 rounded-full bg-white shadow-lg transition-opacity duration-200 pointer-events-auto disabled:opacity-40 disabled:cursor-not-allowed mr-[-1rem]")} aria-label={`Next ${type}`}>
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default CarouselSection