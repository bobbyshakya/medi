"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { wixClient } from "@/lib/wixClient"
import { getBestCoverImage } from "@/lib/wixMedia"
import { stripHtmlTags, processWixRichContent } from "@/lib/richContentUtils"
import type { HappyMoment } from "@/types/happy-moment"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Heart,
  MapPin,
  Calendar,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { OptimizedImage } from "@/components/optimized-image"
import Banner from "@/components/BannerService"
import PartnerSection from "@/components/Partners"
import Ctasection from "@/components/CtaSection"

const COLLECTION_ID = "photo-album"
const ITEMS_PER_PAGE = 12

export default function GalleryPage() {
  const [allMoments, setAllMoments] = useState<HappyMoment[]>([])
  const [visibleMoments, setVisibleMoments] = useState<HappyMoment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // ✅ fetch all API data once
  const fetchHappyMoments = async () => {
    try {
      const response = await wixClient.items
        .query(COLLECTION_ID)
        .descending("date")
        .find({ consistentRead: true })

      if (!response || !response.items) return []

      return response.items.map((item: any) => {
        let mediaGalleryParsed: HappyMoment["mediagallery"] = []
        if (item.mediagallery) {
          try {
            const parsedGallery =
              typeof item.mediagallery === "string" ? JSON.parse(item.mediagallery) : item.mediagallery
            mediaGalleryParsed = parsedGallery.filter(
              (media: any) => media.type === "image" || (media.src && media.src.startsWith("wix:image://"))
            )
          } catch (e) {
            console.error("Failed to parse Media Gallery:", e)
            mediaGalleryParsed = []
          }
        }

        const processedDescription = processWixRichContent(item.description_fld || item.description)
        const processedExcerpt = processWixRichContent(item.excerpt)
        const processedContent = processWixRichContent(item.content || item.detail)

        return {
          _id: item._id,
          ...item,
          order: item.order?.toString(),
          mediagallery: mediaGalleryParsed,
          coverMedia: item.coverMedia || undefined,
          excerpt: processedExcerpt.hasContent
            ? processedExcerpt.excerpt
            : processedDescription.hasContent
            ? processedDescription.excerpt
            : "No description available.",
          description_fld: processedDescription.plainText,
          content: processedContent.plainText,
          firstPublishedDate: item.firstPublishedDate || item.date || item._createdDate,
        }
      })
    } catch (error) {
      console.error("Error fetching HappyMoments:", error)
      return []
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const data = await fetchHappyMoments()
      setAllMoments(data)
      setVisibleMoments(data.slice(0, ITEMS_PER_PAGE))
      setLoading(false)
    }
    loadData()
  }, [])

  // ✅ Load page data
  const loadPage = (page: number) => {
    const start = (page - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    setVisibleMoments(allMoments.slice(start, end))
    setCurrentPage(page)
  }

  const totalPages = Math.ceil(allMoments.length / ITEMS_PER_PAGE)

  // ✅ Auto-load on scroll for mobile
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth > 768) return // only on mobile
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        if (visibleMoments.length < allMoments.length) {
          setVisibleMoments((prev) => [
            ...prev,
            ...allMoments.slice(prev.length, prev.length + ITEMS_PER_PAGE),
          ])
          setCurrentPage((prev) => prev + 1)
        }
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [visibleMoments, allMoments])

  // Skeleton Loader
  const SkeletonCard = () => (
    <Card className="w-full h-full animate-pulse">
      <div className="h-56 bg-gray-200 rounded-t-lg"></div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    </Card>
  )

  const MomentCard = ({ moment }: { moment: HappyMoment }) => {
    const imageUrl = getBestCoverImage(moment)
    return (
      <Link href={`/photo-albums/${moment._id}`} passHref>
        <Card className="flex flex-col overflow-hidden shadow-none hover:shadow-sm bg-white border border-gray-100 transition-all duration-300 cursor-pointer h-full group">
          <div className="relative overflow-hidden bg-gray-50 h-72">
            {imageUrl ? (
              <OptimizedImage
                src={imageUrl}
                alt={stripHtmlTags(moment.title_fld) || "Happy moment"}
                fill
                className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <Heart className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
          <CardHeader className="px-4 pt-3 pb-3">
            <CardTitle className="title-text">
              {stripHtmlTags(moment.title_fld) || "Untitled"}
            </CardTitle>
            <div className="flex items-center gap-2 description-1">
              {moment.firstPublishedDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(moment.firstPublishedDate).toLocaleDateString()}
                </div>
              )}
              {moment.location && (
                <div className="flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3" />
                  <span>{stripHtmlTags(moment.location)}</span>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>
      </Link>
    )
  }

  const Pagination = () => {
    if (totalPages <= 1 || window.innerWidth < 768) return null // ✅ hide on mobile
    return (
      <div className="flex justify-center bg-white items-center gap-2 py-8">
        <Button
          onClick={() => loadPage(currentPage - 1)}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
          className="flex items-center border-gray-300 gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <span className="px-2 text-[#241d1f]">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          onClick={() => loadPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          variant="outline"
          size="sm"
          className="flex items-center border-gray-300 gap-1"
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <>
      <section className="">
        <Banner
          topSpanText="Patient Activities"
          title="Bringing Comfort, Care, and Happiness"
          description="At Medivisor, we believe that maintaining a positive mindset is essential for faster healing and recovery, especially when undergoing treatment in a foreign land without all your family members around. This conviction drives us to organize a myriad of activities and events designed not only to alleviate boredom but also to create a vibrant environment that positively influences the mental and emotional well-being of our patients."
          buttonText="Explore Activities"
          buttonLink="/patient-activities/#activities-gallery"
          bannerBgImage="/faq-banner.png"
          mainImageSrc="/about-main.png"
          mainImageAlt="Medivisor India Patient Activities and Recovery"
        />
      </section>
      

      <section className="bg-gray-50 px-2 md:px-0 py-8 md:py-10">
        
        <div className="container mx-auto ">
          {error && (
            <Card className="mb-8 border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Connection Issue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700 mb-4">{error}</p>
                <Button onClick={() => fetchHappyMoments()} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 space-y-10 md:space-y-5 xl:grid-cols-4 gap-6">
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : visibleMoments.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#241d1f] mb-2">No Happy Moments Found</h3>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 space-y-10 md:space-y-5 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {visibleMoments.map((moment) => (
                  <MomentCard key={moment._id} moment={moment} />
                ))}
              </div>

              {/* ✅ Pagination on desktop */}
              <Pagination />
            </div>
          )}
        </div>
      </section>

      <Ctasection />
    </>
  )
}
