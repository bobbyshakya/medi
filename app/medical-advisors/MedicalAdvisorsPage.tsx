"use client"
import Overview from "@/components/Overview"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Hospital } from 'lucide-react';
import { wixClient } from "@/lib/wixClient"
import CtaSection from "@/components/CtaSection"
import { getBestCoverImage } from "@/lib/wixMedia" // No longer needed for direct photo field
import type { MedicalAdvisor } from "@/types/medicalAdvisor" // New type import
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle, Stethoscope, Briefcase } from "lucide-react" // Added Stethoscope, Briefcase
import { OptimizedImage } from "@/components/optimized-image"
import Banner from "@/components/BannerService"

const COLLECTION_ID = "MedicalAdvisors"
const ITEMS_PER_PAGE = 22

export default function MedicalAdvisorsPage() {
  // Renamed component
  const [allAdvisors, setAllAdvisors] = useState<MedicalAdvisor[]>([]) // Updated state type and name
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const fetchMedicalAdvisors = async (skip = 0, limit: number = ITEMS_PER_PAGE) => {
    // Renamed function
    try {
      const response = await wixClient.items
        .query(COLLECTION_ID)
        .skip(skip)
        .limit(limit)
        .descending("_createdDate") // Assuming _createdDate is a good field to sort by for advisors
        .find({ consistentRead: true })

      if (!response || !response.items) {
        return { items: [], hasMore: false, totalCount: 0 }
      }

      console.log("Raw response items:", response.items.slice(0, 2)) // Log first 2 items

      const medicalAdvisorsData: MedicalAdvisor[] = response.items.map((item: any) => {
        const processedItem: MedicalAdvisor = {
          _id: item._id,
          name: item.name || "Untitled Advisor",
          photo: item.photo || undefined, // Use item.photo directly
          specialty: item.specialty || "N/A",
          experience: item.experience || "N/A",
        }

        console.log("Processed advisor item:", {
          id: processedItem._id,
          name: processedItem.name,
          specialty: processedItem.specialty,
          experience: processedItem.experience,
          photo: processedItem.photo ? "present" : "absent",
          availableFields: Object.keys(item),
        })

        return processedItem
      })

      const totalCount = response.totalCount || 0
      const hasMore = skip + limit < totalCount

      return {
        items: medicalAdvisorsData,
        hasMore,
        totalCount,
      }
    } catch (error) {
      console.error("Error fetching MedicalAdvisors collection:", error)
      return { items: [], hasMore: false, totalCount: 0 }
    }
  }

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchMedicalAdvisors(0, ITEMS_PER_PAGE) // Call new function
      setAllAdvisors(result.items) // Update state
      setHasMore(result.hasMore)
      setTotalCount(result.totalCount)
    } catch (err) {
      setError("Failed to load medical advisors. Please try again.")
      console.error("Error loading initial data:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const result = await fetchMedicalAdvisors(allAdvisors.length, ITEMS_PER_PAGE) // Call new function
      setAllAdvisors((prev) => [...prev, ...result.items]) // Update state
      setHasMore(result.hasMore)
    } catch (err) {
      setError("Failed to load more advisors. Please try again.")
      console.error("Error loading more data:", err)
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  // Loading Skeleton Component
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

  // Advisor Card Component (Renamed from MomentCard)
  const AdvisorCard = ({ advisor }: { advisor: MedicalAdvisor }) => {
    const imageUrl = advisor.photo ? getBestCoverImage(advisor.photo, { width: 400, height: 400 }) : null

    return (

      <Card className="group relative border-gray-100 flex flex-col overflow-hidden rounded-md border bg-white shadow-none ring-1 ring-gray-100 transition-all duration-300 hover:shadow-sm rounded-xs hover:ring-primary/50  ">
        {/* Image Section */}
        <div className="relative h-72 w-full overflow-hidden">
          {imageUrl ? (
            <OptimizedImage
              src={imageUrl}
              alt={advisor.name || "Medical Advisor"}
              fill
              className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
              fallbackSrc="/placeholder.svg?height=500&width=800&text=Image Not Found"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-800">
              <Stethoscope className="h-10 w-10 text-gray-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
        {/* Content */}
        <div className="flex flex-col px-5 py-2 md:py-4  border  border-gray-100">
          {/* Name */}
          <h2 className="title-text ">
            {advisor.name || "Medical Advisor"}
          </h2>

          {/* Specialty */}
          {advisor.specialty && (
            <div className="flex items-center border-b border-gray-100 mb-1 pb-1">
              <span className="description-1 text-[#241d1f]">
                {advisor.specialty}
              </span>
            </div>
          )}

          {/* Experience / Bio */}
          {advisor.experience && (
            <p className="description text-[#241d1f] line-clamp-2">
              {advisor.experience}
            </p>
          )}
        </div>

        {/* Footer CTA */}
        {/* <div className="flex items-center justify-end px-5 pb-4">
            <button className="text-sm font-semibold text-gray-800 dark:text-black text-primary transition duration-200 hover:underline">
              View Profile →
            </button>
          </div> */}
      </Card>

    )
  }

  return (
    <main className="min-h-screen ">
      {" "}
      {/* Updated gradient colors */}
      <Banner
        topSpanText="Meet Our Experts"
        title="Our Esteemed Medical Advisors"
        description="
At Medivisor India Treatment, our esteemed medical advisors combine global expertise with compassionate care. They are here to guide you at every step, making your treatment journey smooth, transparent, and stress-free. Explore the specialists below and discover the doctors who bring world-class healthcare closer to you."
        buttonText="Explore Advisors"
        buttonLink="/medical-advisors/#advisor-gallery" // Updated anchor

        bannerBgImage="/placeholder.svg?height=800&width=1200" // Placeholder for a relevant image
        mainImageSrc="/about-main.png"
        mainImageAlt="Medivisor India Medical Advisors"
      />

      <section className="bg-gray-50 px-2 md:px-0 py-10">
        <div className="container mx-auto md:px-0 px-4 py-4  md:py-10">
          {/* Error State */}
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
                <Button
                  onClick={loadInitialData}
                  variant="outline"
                  className="border-red-300 text-red-700 bg-transparent"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          )}

          {/* Content */}
          {!loading && (
            <>
              {allAdvisors.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Stethoscope className="h-16 w-16 text-gray-300 mx-auto mb-4" /> {/* Updated icon */}
                    <h3 className="text-xl font-semibold text-[#241d1f] mb-2">No Medical Advisors Found</h3>
                    <p className="text-gray-500 mb-4">
                      Your MedicalAdvisors collection appears to be empty or inaccessible.
                    </p>
                    <Button onClick={loadInitialData} variant="outline">
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-8">
                  {/* <h2 className="text-3xl md:text-4xl mb-10 font-bold text-center md:mb-12 text-gray-900">
                    Meet Our World-Class Specialists
                  </h2> */}
                  {/* Gallery Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
                    {allAdvisors.map(
                      (
                        advisor, // Updated map variable
                      ) => (
                        <AdvisorCard key={advisor._id} advisor={advisor} /> // Render AdvisorCard
                      ),
                    )}
                  </div>

                  {/* Load More Button */}
                  {hasMore && (
                    <div className="text-center pt-8">
                      <Button
                        onClick={loadMore}
                        disabled={loadingMore}
                        size="lg"
                        className="bg-gradient-to-r from-blue-500 to-teal-600 hover:from-blue-600 hover:to-teal-700 text-white px-8 py-3" // Updated button colors
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading More...
                          </>
                        ) : (
                          <>
                            Load More Advisors
                            {totalCount - allAdvisors.length > 0 && (
                              <span className="ml-2 text-sm opacity-80">
                                ({Math.min(ITEMS_PER_PAGE, totalCount - allAdvisors.length)} more)
                              </span>
                            )}
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* End Message */}
                  {!hasMore && allAdvisors.length > ITEMS_PER_PAGE && (
                    <div className="text-center pt-8">
                      <p className="text-gray-500 text-sm">🎉 You've seen all {totalCount} medical advisors!</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
      <CtaSection />
    </main>
  )
}