"use client"

import { useState, useEffect, useRef } from "react"
import { wixClient } from "@/lib/wixClient"
import { getBestCoverImage } from "@/lib/wixMedia"
import type { HappyMoment } from "@/types/happy-moment"
import { OptimizedImage } from "@/components/optimized-image"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Heart, Calendar, MapPin, Play, Pause } from "lucide-react"

const COLLECTION_ID = "photo-album"

// Modern Skeleton Components
const SkeletonBox = ({ className = "", animate = true }: { className?: string; animate?: boolean }) => (
  <div className={`bg-gray-200 rounded ${animate ? "animate-pulse" : ""} ${className}`} />
)

const ShimmerEffect = ({ className = "" }: { className?: string }) => (
  <div className={`relative overflow-hidden bg-gray-200 ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
  </div>
)

const ModernSkeleton = () => (
  <section className="py-10 bg-[fff]/10 relative overflow-hidden">
    <div className="container mx-auto px-0 relative">
      <div className="grid lg:grid-cols-12 gap-12 items-center">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-5 space-y-5">
          <div className="space-y-4">
            {/* Title Skeleton */}
            <div className="space-y-3">
              <ShimmerEffect className="h-10 w-4/5 rounded-lg" />
              <ShimmerEffect className="h-10 w-3/4 rounded-lg" />
              <ShimmerEffect className="h-10 w-2/3 rounded-lg" />
            </div>

            {/* Description Skeleton */}
            <div className="space-y-3 pt-4">
              <ShimmerEffect className="h-4 w-full rounded" />
              <ShimmerEffect className="h-4 w-11/12 rounded" />
              <ShimmerEffect className="h-4 w-4/5 rounded" />
              <ShimmerEffect className="h-4 w-5/6 rounded" />
              <ShimmerEffect className="h-4 w-3/4 rounded" />
            </div>
          </div>
        </div>

        {/* Right Column Skeleton - Carousel */}
        <div className="lg:col-span-7">
          <div className="relative">
            {/* Main Carousel Skeleton */}
            <div className="relative overflow-hidden rounded-3xl shadow-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="relative h-96 md:h-[520px]">
                {/* Image Skeleton with Shimmer */}
                <ShimmerEffect className="w-full h-full rounded-3xl" />

                {/* Content Overlay Skeleton */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                  <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                    <div className="max-w-2xl space-y-4">
                      {/* Title Skeleton */}
                      <div className="space-y-2">
                        <SkeletonBox className="h-8 w-4/5 bg-white/20" />
                        <SkeletonBox className="h-8 w-3/5 bg-white/20" />
                      </div>

                      {/* Description Skeleton */}
                      <div className="space-y-2">
                        <SkeletonBox className="h-5 w-full bg-white/15" />
                        <SkeletonBox className="h-5 w-4/5 bg-white/15" />
                      </div>

                      {/* Tags Skeleton */}
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <SkeletonBox className="h-8 w-24 bg-white/20 rounded-full" />
                        <SkeletonBox className="h-8 w-20 bg-white/20 rounded-full" />
                        <SkeletonBox className="h-8 w-28 bg-white/20 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Controls Skeleton */}
            <div className="absolute inset-0 flex items-center justify-between p-6 pointer-events-none">
              <SkeletonBox className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm" />
              <SkeletonBox className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm" />
            </div>

            {/* Auto-play Control Skeleton */}
            <div className="absolute top-6 right-6">
              <SkeletonBox className="h-9 w-20 rounded bg-white/20" />
            </div>

            {/* Progress Indicator Skeleton */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <SkeletonBox className="w-8 h-2 rounded-full bg-white/60" />
                <SkeletonBox className="w-2 h-2 rounded-full bg-white/40" />
                <SkeletonBox className="w-2 h-2 rounded-full bg-white/40" />
                <SkeletonBox className="w-2 h-2 rounded-full bg-white/40" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Add shimmer keyframe to globals.css if not already present */}
    <style jsx global>{`
      @keyframes shimmer {
        100% {
          transform: translateX(100%);
        }
      }
    `}</style>
  </section>
)

export default function SocialActivityCarousel() {
  const [moments, setMoments] = useState<HappyMoment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const carouselRef = useRef<HTMLDivElement>(null)
  const autoPlayRef = useRef<NodeJS.Timeout>()

  const fetchHappyMoments = async () => {
    try {
      const response = await wixClient.items
        .query(COLLECTION_ID)
        .skip(0)
        .limit(8) // Get 8 items for carousel
        .descending("date")
        .find({ consistentRead: true })

      if (!response || !response.items) {
        return []
      }

      const happyMomentsData: HappyMoment[] = response.items.map((item: any) => {
        let mediaGalleryParsed: HappyMoment["mediagallery"] = []
        if (item.mediagallery) {
          try {
            const parsedGallery =
              typeof item.mediagallery === "string" ? JSON.parse(item.mediagallery) : item.mediagallery
            mediaGalleryParsed = parsedGallery.filter(
              (media: any) => media.type === "image" || (media.src && media.src.startsWith("wix:image://")),
            )
          } catch (e) {
            console.error("Failed to parse Media Gallery for item:", item._id, e)
            mediaGalleryParsed = []
          }
        }

        return {
          _id: item._id,
          ...item,
          order: item.order?.toString(),
          mediagallery: mediaGalleryParsed,
          coverMedia: item.coverMedia || undefined,
          excerpt: item.excerpt || item.shortDescription || "No description available.",
          content: item.content || item.detail || "",
          firstPublishedDate: item.firstPublishedDate || item.date || item._createdDate,
        }
      })

      return happyMomentsData
    } catch (error) {
      console.error("Error fetching HappyMoments collection:", error)
      return []
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await fetchHappyMoments()
      setMoments(result)
    } catch (err) {
      console.error("Error loading data:", err)
    } finally {
      setLoading(false)
    }
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % moments.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + moments.length) % moments.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && moments.length > 1) {
      autoPlayRef.current = setInterval(nextSlide, 5000)
    }
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [isAutoPlaying, moments.length])

  // Pause auto-play on hover
  const handleMouseEnter = () => setIsAutoPlaying(false)
  const handleMouseLeave = () => setIsAutoPlaying(true)

  useEffect(() => {
    loadData()
  }, [])

  // Show modern skeleton while loading
  if (loading) {
    return <ModernSkeleton />
  }

  if (moments.length === 0) {
    return (
      <section className="py-10">
        <div className="container mx-auto px-0 relative">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-100 to-purple-100 rounded-full mb-8">
              <Heart className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-6">
              Social Activities & Recovery Stories
            </h2>
            <p className="text-lg text-[#241d1f]">
              No moments to display at the moment. Check back soon for inspiring stories!
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-10 bg-[fff]/10 relative overflow-hidden">
      <div className="container mx-auto px-0 relative">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-5">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl my-5 font-bold w-10/12 mb-7 text-gray-900">
                Our commitment extends beyond medical care
              </h2>

              <p className="text-lg text-[#241d1f] leading-relaxed">
                We place importance on not just the medical needs of our patients, but also prioritize their emotional
                well-being. To this end, we visit our patients daily at hospitals and hotels. Furthermore, we ensure
                that significant milestones and special occasions are celebrated, including birthdays and anniversaries.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              {/* Main Carousel */}
              <div className="relative overflow-hidden rounded-xs shadow-sm bg-white/10 backdrop-blur-sm border border-white/20">
                <div
                  ref={carouselRef}
                  className="flex transition-transform duration-700 ease-out"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                  {moments.map((moment, index) => {
                    const imageUrl = getBestCoverImage(moment)
                    return (
                      <div key={moment._id} className="w-full flex-shrink-0 relative">
                        <div className="relative h-96 md:h-[520px] bg-gradient-to-br from-gray-100 to-gray-200">
                          {imageUrl ? (
                            <OptimizedImage
                              src={imageUrl}
                              alt={moment.title_fld || "Happy moment"}
                              fill
                              className="object-cover"
                              fallbackSrc="/placeholder.svg?height=520&width=800&text=Recovery Story"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-200 via-purple-200 to-pink-200">
                              <div className="text-center">
                                <Heart className="h-20 w-20 text-red-500 mx-auto mb-4 animate-pulse" />
                                <p className="text-red-700 font-semibold text-lg">Recovery Story</p>
                              </div>
                            </div>
                          )}

                          {/* Enhanced Overlay Content */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 text-white">
                              <div className="max-w-2xl space-y-4">
                                <h3 className="text-3xl md:text-4xl font-bold leading-tight">
                                  {moment.title_fld || "Untitled Story"}
                                </h3>

                                <p className="text-lg md:text-xl opacity-90 leading-relaxed line-clamp-2">
                                  {moment.shortDescription || moment.excerpt}
                                </p>

                                <div className="flex flex-wrap items-center gap-6 text-sm opacity-80">
                                  {moment.firstPublishedDate && (
                                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                      <Calendar className="h-4 w-4" />
                                      <span>{new Date(moment.firstPublishedDate).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                  {moment.location && (
                                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                      <MapPin className="h-4 w-4" />
                                      <span>{moment.location}</span>
                                    </div>
                                  )}
                                  {moment.category && (
                                    <span className="bg-gradient-to-r from-red-500 to-purple-500 px-4 py-1.5 rounded-full font-medium">
                                      {moment.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Enhanced Navigation Controls */}
              {moments.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-between p-6 pointer-events-none">
                  <Button
                    variant="outline"
                    size="icon"
                    className="pointer-events-auto w-12 h-12 bg-white/90 hover:bg-white border-white/50 shadow-xl backdrop-blur-sm hover:scale-110 transition-all duration-300"
                    onClick={prevSlide}
                  >
                    <ChevronLeft className="h-6 w-6 text-[#241d1f]" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="pointer-events-auto w-12 h-12 bg-white/90 hover:bg-white border-white/50 shadow-xl backdrop-blur-sm hover:scale-110 transition-all duration-300"
                    onClick={nextSlide}
                  >
                    <ChevronRight className="h-6 w-6 text-[#241d1f]" />
                  </Button>
                </div>
              )}

              {/* Auto-play Control */}
            

              {/* Enhanced Progress Indicator */}
              {moments.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    {moments.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentIndex ? "bg-white w-8" : "bg-white/50 hover:bg-white/70"
                        }`}
                        onClick={() => goToSlide(index)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
