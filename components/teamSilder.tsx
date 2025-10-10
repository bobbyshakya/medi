"use client"

import { useState, useEffect } from "react"
import useEmblaCarousel from "embla-carousel-react"
import "embla-carousel-react"
import { ChevronLeft, ChevronRight, Users } from "lucide-react"
import { getBestCoverImage, getWixScaledToFillImageUrl } from "@/lib/wixMedia"
import Link from "next/link"

const COLLECTION_ID = "Team1"

interface TeamMember {
  _id?: string
  name: string
  role: string
  image: string
  bio: string
  shortDescription: string
  longDescription: string
  order: number
  title: string
  slug: string
  rawData?: any
}

const SkeletonBox = ({ className = "", animate = true }: { className?: string; animate?: boolean }) => (
  <div className={`bg-gray-200 rounded ${animate ? "animate-pulse" : ""} ${className}`} />
)

const ShimmerEffect = ({ className = "" }: { className?: string }) => (
  <div className={`relative overflow-hidden bg-gray-200 ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
  </div>
)

const ModernSkeleton = () => (
  <section className="bg-white py-10">
    <div className="container mx-auto px-4 md:px-0">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-2">
          <ShimmerEffect className="h-10 w-64 rounded-lg" />
          <ShimmerEffect className="h-4 w-48 rounded" />
        </div>
        <div className="flex gap-2">
          <SkeletonBox className="w-10 h-10 rounded-full bg-gray-300" />
          <SkeletonBox className="w-10 h-10 rounded-full bg-gray-300" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <ShimmerEffect className="w-full h-60 rounded-t-xl" />
            <div className="p-5 space-y-3">
              <ShimmerEffect className="h-5 w-3/4 rounded" />
              <ShimmerEffect className="h-4 w-full rounded" />
              <div className="space-y-2">
                <ShimmerEffect className="h-3 w-full rounded" />
                <ShimmerEffect className="h-3 w-5/6 rounded" />
                <ShimmerEffect className="h-3 w-4/5 rounded" />
              </div>
              <ShimmerEffect className="h-8 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
)

export default function TeamSlider() {
  const [currentTeamMembers, setCurrentTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    breakpoints: {
      "(min-width: 1024px)": {
        slidesToScroll: 4,
      },
      "(min-width: 768px)": {
        slidesToScroll: 2,
      },
    },
  })

  const processWixImageUrl = (item: any): string => {
    const bestImage = getBestCoverImage(item)
    if (bestImage) {
      return bestImage
    }

    const imageFields = [
      "Photo",
      "photo",
      "image",
      "picture",
      "avatar",
      "profileImage",
      "mainImage",
      "featuredImage",
      "coverImage",
      "thumbnail",
    ]

    for (const field of imageFields) {
      if (item[field]) {
        let imageUrl = null

        if (typeof item[field] === "string" && item[field].startsWith("wix:image://")) {
          imageUrl = item[field]
        } else if (item[field]?.url && item[field].url.startsWith("wix:image://")) {
          imageUrl = item[field].url
        } else if (item[field]?.src && item[field].src.startsWith("wix:image://")) {
          imageUrl = item[field].src
        }

        if (imageUrl) {
          const processedUrl = getWixScaledToFillImageUrl(imageUrl, 400, 300)
          if (processedUrl) {
            return processedUrl
          }
        }
      }
    }

    return `/placeholder.svg?height=240&width=240&query=team member portrait`
  }
 const generateSlug = (name: string, id: string): string => {
    const nameSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .trim()
    return nameSlug || id || "team-member"
}

  const fetchTeamMembers = async () => {
    try {
      const { wixClient } = await import("@/lib/wixClient")

      const response = await wixClient.items
        .query(COLLECTION_ID)
        .skip(0)
        .limit(20)
        .ascending("Order")
        .find({ consistentRead: true })

      if (!response?.items?.length) {
        return []
      }

      const teamMembersData: TeamMember[] = response.items.map((item: any) => {
        const memberName = item.Name || item.name || item.title || "Team Member"
        const memberId = item._id || item.ID
        const slug = generateSlug(memberName, memberId)

        return {
          _id: memberId,
          name: memberName,
          role: item["Job Title"] || item.jobTitle || item.role || item.position || "Team Member",
          image: processWixImageUrl(item),
          bio: item["Long Description"] || item.longDescription || item.bio || item.description || "Dedicated team member.",
          shortDescription: item["Short Description"] || item.shortDescription || item.excerpt || "",
          longDescription: item["Long Description"] || item.longDescription || item.bio || item.description || "",
          order: Number.parseInt(item.Order) || Number.parseInt(item.order) || 0,
          title: item.title || item.link || item.profileUrl || item.website || "#",
          slug: slug,
          rawData: item,
        }
      })

      return teamMembersData.sort((a, b) => a.order - b.order)
    } catch (error: any) {
      throw error
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await fetchTeamMembers()
      setCurrentTeamMembers(result)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return <ModernSkeleton />
  }

  if (currentTeamMembers.length === 0) {
    return (
      <section className="bg-white md:py-10 md:px-0 px-2 py-10">
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-100 to-purple-100 rounded-full mb-8">
              <Users className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-6">
              Our Team
            </h2>
            <p className="text-lg text-[#241d1f]">Our team information is currently being updated. Check back soon!</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-gray-50 px-2 md:px-0 md:py-10 py-10">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-3 md:mb-3">
          <div>
            <h2 className="heading-base">Our Team</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => emblaApi?.scrollPrev()}
              className="bg-white text-[#241d1f] p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors duration-300"
              aria-label="Previous slide"
            >
              <ChevronLeft className="md:w-5 w-4 h-4 md:h-5" />
            </button>
            <button
              onClick={() => emblaApi?.scrollNext()}
              className="bg-white text-[#241d1f] p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors duration-300"
              aria-label="Next slide"
            >
              <ChevronRight className="md:w-5 w-4 h-4 md:h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-4">
            {currentTeamMembers.map((member, index) => (
              <div
                key={member._id || index}
                className="relative min-w-0 flex-grow-0 flex-shrink-0 basis-full pl-4 md:basis-1/2 lg:basis-1/4"
              >
                <Link
                  href={`/team/${member.slug}`}
                  passHref
                  className="bg-white rounded-xs border border-gray-200 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden group flex flex-col h-full"
                >
                  <div className="relative w-full h-60">
                    <img
                      src={member.image || "/placeholder.svg"}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = `/placeholder.svg?height=240&width=240&query=${encodeURIComponent(
                          member.name + " team member"
                        )}`
                      }}
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="title-text">{member.name}</h3>
                    <p className="description-1 pb-2">{member.role}</p>
                    <p className="description line-clamp-4">
                      {member.shortDescription || member.bio}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}