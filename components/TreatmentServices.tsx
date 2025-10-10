"use client"

import { useState, useEffect, useCallback } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight, BriefcaseMedical, AlertCircle } from "lucide-react"
import { getWixScaledToFillImageUrl } from "@/lib/wixMedia"
import ContactModal from "@/components/ContactModal"
import Autoplay from "embla-carousel-autoplay"
  import { ArrowUpRight } from 'lucide-react';

interface Service {
  _id?: string
  hospitalName: string
  treatmentName: string
  image: string
  description?: string
}

const LoadingSkeleton = () => (
  <section className="bg-white py-12">
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-2">
          <div className="h-8 w-52 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full"
          >
            <div className="w-full h-56 bg-gray-200 animate-pulse" />
            <div className="p-6 space-y-4 flex flex-col flex-grow">
              <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
              <div className="mt-auto h-8 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
)

export default function ServiceSection() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      slidesToScroll: 1,
      breakpoints: {
        "(min-width: 1024px)": { slidesToScroll: 4 },
        "(min-width: 768px)": { slidesToScroll: 2 },
      },
    },
    [Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })],
  )

  const getImageUrlFromItem = useCallback((item: any): string => {
    const imageFields = ["mainImage", "image", "photo", "picture", "cover"]
    for (const field of imageFields) {
      if (item[field]) {
        let imageUrl = null
        if (typeof item[field] === "string" && item[field].startsWith("wix:image://")) {
          imageUrl = item[field]
        } else if (item[field]?.url?.startsWith("wix:image://")) {
          imageUrl = item[field].url
        }
        if (imageUrl) {
          return getWixScaledToFillImageUrl(imageUrl, 600, 400) || "/placeholder.svg"
        }
      }
    }
    return "/placeholder.svg"
  }, [])

  const fetchServices = async (): Promise<Service[]> => {
    try {
      const { wixClient } = await import("@/lib/wixClient")
      const response = await wixClient.items
        .query("PersonalizedTreatmentQuotation")
        .limit(20)
        .ascending("order")
        .find({ consistentRead: true })

      if (!response?.items?.length) return []

      return response.items.map((item: any) => ({
        _id: item._id,
        hospitalName: item.hospitalName || "Hospital",
        treatmentName: item.treatmentName || "Treatment",
        description: item.description || "",
        image: getImageUrlFromItem(item),
      }))
    } catch (error: any) {
      if (error.message?.includes("Collection not found")) {
        throw new Error("COLLECTION_NOT_FOUND")
      }
      throw error
    }
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchServices()
      setServices(result)
    } catch (err: any) {
      setError(
        err.message === "COLLECTION_NOT_FOUND"
          ? "Services data is being updated"
          : "Unable to load services data",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) return <LoadingSkeleton />

  if (services.length === 0) {
    return (
      <section className="bg-white py-16">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-full mb-6">
            <BriefcaseMedical className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="md:text-4xl text-3xl font-bold text-[#241d1f] mb-4">
            Our Treatments
          </h2>
          <p className="text-lg text-[#241d1f]">
            Services information is currently being updated. Please check back soon!
          </p>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="bg-gray-50 px-2 md:px-0 py-12">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="heading-base">
                Our Treatments
              </h2>
              {error && (
                <div className="flex items-center gap-2 mt-2 text-sm text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => emblaApi?.scrollPrev()}
                className="bg-white text-[#241d1f] p-1.5 rounded-full shadow-md hover:bg-gray-100 transition-colors duration-200"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => emblaApi?.scrollNext()}
                className="bg-white text-[#241d1f] p-1.5 rounded-full shadow-md hover:bg-gray-100 transition-colors duration-200"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="embla overflow-hidden" ref={emblaRef}>
            <div className="embla__container flex -mx-2 items-stretch">
              {services.map((service, index) => (
                <div
                  key={service._id || index}
                  className="embla__slide px-2 min-w-0 flex-grow-0 flex-shrink-0 basis-full md:basis-1/2 lg:basis-1/4"
                >
                  <div className="group bg-white border border-gray-100 rounded-xs overflow-hidden flex flex-col h-full min-h-[300px]">
                    {/* Image */}
                    <div className="relative w-full h-56 overflow-hidden">
                      <img
                        src={service.image}
                        alt={service.treatmentName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = `https://dummyimage.com/600x400/ececec/9ca3af&text=${encodeURIComponent(
                            service.treatmentName,
                          )}`
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1">
                      <h4 className="title-text mb-2">
                        {service.hospitalName}
                      </h4>
                      <h3 className="description">
                        {service.treatmentName}


                        <span
                          onClick={() => setIsModalOpen(true)}
                          className="description-gray ml-1 hover:underline decoration-gray-400 cursor-pointer inline-flex items-center gap-0"
                        >
                          Know More
                          <ArrowUpRight className="w-4 h-4" />
                        </span>

                      </h3>
                      {service.description && (
                        <p className="text-sm text-gray-500 flex-grow">
                          {service.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}