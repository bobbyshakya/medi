"use client"

import { useKeenSlider } from "keen-slider/react"
import "keen-slider/keen-slider.min.css"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Users, AlertCircle } from "lucide-react"
import { getBestCoverImage, getWixScaledToFillImageUrl } from "@/lib/wixMedia"

const COLLECTION_ID = "MedicalAdvisors"

interface MedicalAdvisor {
  _id?: string
  name: string
  specialty: string
  image: string
  experience: string
  profileUrl: string
}

const LoadingSkeleton = () => (
  <section className="bg-gray-50 py-10">
    <div className="container mx-auto px-4 md:px-0">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-2">
          <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="w-full h-60 bg-gray-200 rounded-t-xl animate-pulse" />
            <div className="p-5 space-y-3">
              <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
)

export default function MeetOurDoctors() {
  const [advisors, setAdvisors] = useState<MedicalAdvisor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    slides: {
      perView: 1,
      spacing: 10,
    },
    breakpoints: {
      "(min-width: 768px)": {
        slides: { perView: 2, spacing: 20 },
      },
      "(min-width: 1024px)": {
        slides: { perView: 4, spacing: 16 },
      },
    },
  })

  const processImageUrl = (item: any): string => {
    const bestImage = getBestCoverImage(item)
    if (bestImage) return bestImage

    const imageFields = ["photo", "image", "picture", "avatar", "profileImage"]

    for (const field of imageFields) {
      if (item[field]) {
        let imageUrl = null

        if (typeof item[field] === "string" && item[field].startsWith("wix:image://")) {
          imageUrl = item[field]
        } else if (item[field]?.url?.startsWith("wix:image://")) {
          imageUrl = item[field].url
        }

        if (imageUrl) {
          const processedUrl = getWixScaledToFillImageUrl(imageUrl, 400, 300)
          if (processedUrl) return processedUrl
        }
      }
    }

    return `/placeholder.svg?height=240&width=240&query=medical advisor portrait`
  }

  const fetchMedicalAdvisors = async (): Promise<MedicalAdvisor[]> => {
    try {
      const { wixClient } = await import("@/lib/wixClient")

      const response = await wixClient.items
        .query(COLLECTION_ID)
        .skip(0)
        .limit(20)
        .ascending("order")
        .find({ consistentRead: true })

      if (!response?.items?.length) return []

      return response.items.map((item: any) => ({
        _id: item._id,
        name: item.name || item.title || "Medical Advisor",
        specialty: item.specialty || item.role || "Medical Specialist",
        image: processImageUrl(item),
        experience: item.experience || "Extensive experience",
        profileUrl: item["link-medical-advisors-all"] || "/medical-advisors/",
      }))
    } catch (error: any) {
      if (error.message?.includes("Collection not found")) {
        throw new Error("COLLECTION_NOT_FOUND")
      }
      throw error
    }
  }

  const staticAdvisors: MedicalAdvisor[] = [
    {
      _id: "static-1",
      name: "Dr Anant Kumar",
      specialty: "Urology and Kidney Transplant",
      image: "/doctor1.jpg",
      experience: "36+ years",
      profileUrl: "/medical-advisors/",
    },
    {
      _id: "static-2",
      name: "Dr Anurag Jain",
      specialty: "ENT (Ear Nose Throat)",
      image: "/doctor2.jpg",
      experience: "30+ years",
      profileUrl: "/medical-advisors/",
    },
    {
      _id: "static-3",
      name: "Dr. Sandeep Singh",
      specialty: "Surgical Oncologist",
      image: "/doctor3.jpg",
      experience: "20+ years",
      profileUrl: "/medical-advisors/",
    },
    {
      _id: "static-4",
      name: "Dr. Anil Kumar",
      specialty: "Surgical Oncologist",
      image: "/doctor4.jpg",
      experience: "25+ years",
      profileUrl: "/medical-advisors/",
    },
  ]

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchMedicalAdvisors()
      setAdvisors(result.length > 0 ? result : staticAdvisors)
    } catch (err: any) {
      setError(
        err.message === "COLLECTION_NOT_FOUND"
          ? "Medical advisors data is being updated"
          : "Unable to load medical advisors data",
      )
      setAdvisors(staticAdvisors)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) return <LoadingSkeleton />

  if (advisors.length === 0) {
    return (
      <section className="bg-gray-50 py-10">
        <div className="container mx-auto px-4 md:px-0">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-100 to-purple-100 rounded-full mb-8">
              <Users className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="heading-base">
              Our Medical Advisors
            </h2>
            <p className="text-lg text-[#241d1f]">
              Our medical advisor information is currently being updated. Check back soon!
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-gray-50 md:py-10 md:px-0 px-2 py-10">
      <div className="container mx-auto ">
        <div className="flex justify-between items-center mb-3 md:mb-3">
          <div>
            <h2 className="heading-base"> Medical Advisors</h2>
            {error && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
          {/* Removed 'hidden md:flex' to show arrows on all screen sizes */}
          <div className="flex gap-2">
            <button
              onClick={() => instanceRef.current?.prev()}
              className="bg-white text-[#241d1f] p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
              aria-label="Previous advisor"
            >
              <ChevronLeft className="w-4 md:w-5 h-4  md:h-5" />
            </button>
            <button
              onClick={() => instanceRef.current?.next()}
              className="bg-white text-[#241d1f] p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
              aria-label="Next advisor"
            >
              <ChevronRight className="w-4 md:w-5 h-4  md:h-5" />
            </button>
          </div>
        </div>

        <div ref={sliderRef} className="keen-slider">
          {advisors.map((advisor, index) => (
            <div
              key={advisor._id || index}
              className="keen-slider__slide bg-white rounded-xs border border-gray-100 shadow-xs hover:shadow-lg transition-shadow duration-300 group overflow-hidden"
            >
              <div className="relative w-full h-60">
                <img
                  src={advisor.image || "/placeholder.svg"}
                  alt={`Portrait of ${advisor.name}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = `/placeholder.svg?height=240&width=240&query=${encodeURIComponent(advisor.name + " medical advisor")}`
                  }}
                />
              </div>
              <div className="p-5">
                <h3 className="title-text mb-1">{advisor.name}</h3>
                <p className=" description">{advisor.specialty}</p>
                <p className="description-1">
                  <span className="description-1"></span> {advisor.experience}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}