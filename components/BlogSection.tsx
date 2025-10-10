"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { media } from "@wix/sdk"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import useEmblaCarousel from "embla-carousel-react"
import { Skeleton } from "@/components/ui/skeleton"
import useSWR from "swr"

interface Post {
  _id: string
  title: string
  slug: string
  firstPublishedDate?: string
  url?: {
    base: string
    path: string
  }
  media?: {
    wixMedia?: {
      image?: string
      video?: string
    }
    embedMedia?: {
      thumbnail?: {
        url: string
        width?: number
        height?: number
      }
      video?: {
        url: string
        width?: number
        height?: number
      }
    }
    displayed?: boolean
    custom?: boolean
  }
  coverMedia?: {
    image?: string
  }
  excerpt?: string
  content?: string
}

function getWixImageUrl(wixUrl: string | undefined): string | null {
  if (!wixUrl || !wixUrl.startsWith("wix:image://")) {
    return null
  }
  try {
    const { url } = media.getImageUrl(wixUrl)
    return url
  } catch (error) {
    console.error("Error getting Wix image URL:", error)
    return null
  }
}

// Function to get YouTube embed URL
function getYouTubeEmbedUrl(youtubeUrl: string | undefined): string | null {
  if (!youtubeUrl) return null

  const regExp =
    /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?$/
  const match = youtubeUrl.match(regExp)

  if (match && match[1] && match[1].length === 11) {
    // Note: The original code had a typo here. This is the correct way.
    return `https://www.youtube.com/embed/${match[1]}`
  }
  return null
}

// Function to calculate read time
function calculateReadTime(text: string | undefined): string {
  if (!text) return " 1 min read"
  const wordsPerMinute = 200 // Average reading speed
  const plainText = text.replace(/<[^>]*>/g, "")
  const wordCount = plainText.split(/\s+/).filter((word) => word.length > 0).length
  const minutes = Math.ceil(wordCount / wordsPerMinute)
  return minutes === 0 ? " 1 min read" : `${minutes} min read`
}

const LIMIT = 12
const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function BlogCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start", skipSnaps: false, dragFree: false })
  const [isPlaying, setIsPlaying] = useState(false) // Initially set to false to stop autoplay
  const autoplayRef = useRef<NodeJS.Timeout | null>(null)
  const AUTOPLAY_DELAY = 3000 // 3 seconds

  const { data, isLoading } = useSWR(`/api/wix-posts?limit=${LIMIT}&offset=${0}`, fetcher)

  const posts: Post[] = Array.isArray(data?.posts)
    ? data.posts.map((p: any) => ({
      ...p,
      excerpt: p.excerpt || "No description available.",
      content: p.content || "",
    }))
    : []

  const startAutoplay = useCallback(() => {
    if (!emblaApi) return

    if (autoplayRef.current) {
      clearInterval(autoplayRef.current)
    }

    autoplayRef.current = setInterval(() => {
      emblaApi.scrollNext()
    }, AUTOPLAY_DELAY)

    setIsPlaying(true)
  }, [emblaApi])

  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current)
      autoplayRef.current = null
    }
    setIsPlaying(false)
  }, [])

  const scrollPrev = useCallback(() => {
    emblaApi && emblaApi.scrollPrev()
    stopAutoplay() // Stop autoplay on user interaction
  }, [emblaApi, stopAutoplay])

  const scrollNext = useCallback(() => {
    emblaApi && emblaApi.scrollNext()
    stopAutoplay() // Stop autoplay on user interaction
  }, [emblaApi, stopAutoplay])

  const handleMouseEnter = useCallback(() => {
    stopAutoplay()
  }, [stopAutoplay])

  const handleMouseLeave = useCallback(() => {
    // You can choose to re-enable autoplay here if desired
    // For this request, we are not re-enabling it.
  }, [])

  useEffect(() => {
    // Removed the initial call to startAutoplay() to fulfill the request.
    return () => {
      stopAutoplay()
    }
  }, [emblaApi, stopAutoplay])

  return (
    <section className="py-4 md:py-10">
      <div className="container mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex flex-col overflow-hidden rounded-lg shadow-sm">
                <Skeleton className="w-full h-56 rounded-t-lg" />
                <div className="p-4 bg-gray-100">
                  <div className="pb-2">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                  </div>
                  <Skeleton className="h-4 w-1/2 mb-1" />
                  <div className="pt-2">
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                  <div className="flex justify-between items-center pt-4">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center text-[#241d1f] dark:text-gray-400 mt-10 text-lg">No featured posts available.</p>
        ) : (
          <div className="relative p-2 md:p-0">
            <div className="overflow-hidden" ref={emblaRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              <div className="flex -ml-4">
                {posts.map((post) => {
                  const embedVideoUrl = post.media?.embedMedia?.video?.url
                  const embedThumbnailUrl = post.media?.embedMedia?.thumbnail?.url
                  const youtubeEmbedUrl = getYouTubeEmbedUrl(embedVideoUrl)
                  const wixImageUrl = getWixImageUrl(post.media?.wixMedia?.image || post.coverMedia?.image)
                  const readTime = calculateReadTime(post.content)

                  return (
                    <div key={post._id} className="flex-none w-full sm:w-1/2 lg:w-1/4 pl-4">
                      <Card className="flex flex-col h-full shadow-xs hover:shadow-sm transition-shadow duration-300 ease-in-out border-gray-200">
                        <Link href={`/blog/${post.slug}`} className="block">
                          <CardHeader className="p-0 rounded-t-xs overflow-hidden">
                            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                              {youtubeEmbedUrl ? (
                                <iframe
                                  className="absolute top-0 left-0 w-full h-full object-cover rounded-t-lg"
                                  src={youtubeEmbedUrl}
                                  title={post.title}
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              ) : embedVideoUrl ? (
                                <video
                                  src={embedVideoUrl}
                                  poster={embedThumbnailUrl || "/placeholder.svg"}
                                  controls
                                  className="absolute top-0 left-0 w-full h-full object-cover rounded-t-lg"
                                  aria-label={`Play video for ${post.title}`}
                                >
                                  Your browser does not support the video tag.
                                </video>
                              ) : wixImageUrl ? (
                                <img
                                  src={wixImageUrl || "/placeholder.svg"}
                                  alt={post.title}
                                  className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              ) : (
                                <div className="absolute top-0 left-0 w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-lg rounded-t-lg">
                                  No Media Available
                                </div>
                              )}
                            </div>
                          </CardHeader>
                        </Link>
                        <Link href={`/blog/${post.slug}`} className=" transition-colors duration-200">
                          <CardContent className="flex flex-col flex-grow p-3 bg-white rounded-b-xs">
                            <div className="line-clamp-2 md:h-15">
                              <CardTitle className="md:text-xl hover:text-primary text-[#241d1f] text-2xl font-medium leading-tight  overflow-hidden mt-2">

                                {post.title}

                              </CardTitle>
                            </div>

                            <div className="flex justify-start gap-x-3 items-center my-2">
                              <CardDescription className="description-1">
                                {post.firstPublishedDate &&
                                  new Date(post.firstPublishedDate).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                              </CardDescription>
                              <span className="description-1 ">{readTime}</span>
                            </div>
                            <p className="description-1">
                              {post.excerpt}
                            </p>
                          </CardContent>
                        </Link>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>
            <Button
              className="absolute top-[45%] -translate-y-1/2 border-gray-200 cursor-pointer left-4 -ml-4 z-40 rounded-full bg-white md:w-8 w-8 h-8 md:h-8 p-0 shadow-md hover:shadow-lg transition-shadow"
              variant="outline"
              onClick={scrollPrev}
            >
              <ChevronLeft className="md:w-5 w-4 w-4 md:h-5" />
              <span className="sr-only">Previous slide</span>
            </Button>
            <Button
              className="absolute top-[45%] -translate-y-1/2 border-gray-200 cursor-pointer right-4 -mr-4 z-10 rounded-full bg-white md:w-8 w-8 h-8 md:h-8 p-0 shadow-md hover:shadow-lg transition-shadow"
              variant="outline"
              onClick={scrollNext}
            >
              <ChevronRight className="md:w-5 w-4 w-4 md:h-5" />
              <span className="sr-only">Next slide</span>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}