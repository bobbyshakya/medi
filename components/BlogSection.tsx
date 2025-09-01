"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { media } from "@wix/sdk"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"
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
  const [isPlaying, setIsPlaying] = useState(true)
  const autoplayRef = useRef<NodeJS.Timeout | null>(null)
  const AUTOPLAY_DELAY = 3000 // 3 seconds

  const { data, error, isLoading } = useSWR(`/api/wix-posts?limit=${LIMIT}&offset=${0}`, fetcher)

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

  const toggleAutoplay = useCallback(() => {
    if (isPlaying) {
      stopAutoplay()
    } else {
      startAutoplay()
    }
  }, [isPlaying, startAutoplay, stopAutoplay])

  const scrollPrev = useCallback(() => {
    emblaApi && emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    emblaApi && emblaApi.scrollNext()
  }, [emblaApi])

  const handleMouseEnter = useCallback(() => {
    if (isPlaying) {
      stopAutoplay()
    }
  }, [isPlaying, stopAutoplay])

  const handleMouseLeave = useCallback(() => {
    if (!isPlaying) {
      startAutoplay()
    }
  }, [isPlaying, startAutoplay])

  useEffect(() => {
    if (!emblaApi) return
    startAutoplay()
    return () => {
      stopAutoplay()
    }
  }, [emblaApi, startAutoplay, stopAutoplay])

  return (
    <section className="py-4 md:py-10">
      <div className="container mx-auto md:px-0 px-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex flex-col overflow-hidden border-gray-200 shadow-sm">
                <Skeleton className="w-full h-56" />
                <div className="p-4 bg-white">
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
          <p className="text-center text-gray-600 dark:text-gray-400 mt-10 text-lg">No featured posts available.</p>
        ) : (
          <div className="relative">
            <div
              className="overflow-hidden"
              ref={emblaRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div className="flex -ml-4">
                {posts.map((post) => {
                  const embedVideoUrl = post.media?.embedMedia?.video?.url
                  const embedThumbnailUrl = post.media?.embedMedia?.thumbnail?.url
                  const youtubeEmbedUrl = getYouTubeEmbedUrl(embedVideoUrl)
                  const wixImageUrl = getWixImageUrl(
                    post.media?.wixMedia?.image || post.coverMedia?.image,
                  )
                  const readTime = calculateReadTime(post.content)

                  return (
                    <div key={post._id} className="flex-none w-full sm:w-1/2 lg:w-1/4 pl-4">
                      <div className="flex flex-col overflow-hidden border border-gray-100 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 ease-in-out">
                        <Link href={`/blog/${post.slug}`} className="block">
                          <div className="relative w-full h-48 overflow-hidden">
                            {youtubeEmbedUrl ? (
                              <iframe
                                className="absolute top-0 left-0 w-full h-full"
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
                                className="w-full h-full object-cover"
                                aria-label={`Play video for ${post.title}`}
                              >
                                Your browser does not support the video tag.
                              </video>
                            ) : wixImageUrl ? (
                              <img
                                src={wixImageUrl || "/placeholder.svg"}
                                alt={post.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            ) : (
                              <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-lg">
                                No Media Available
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="p-4 bg-white flex flex-col flex-grow">
                          <div className="pb-2">
                            <div className="text-xl font-medium leading-tight">
                              <Link
                                href={`/blog/${post.slug}`}
                                className="hover:text-primary line-clamp-2 text-gray-700 transition-colors duration-200"
                              >
                                {post.title}
                              </Link>
                            </div>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {post.firstPublishedDate &&
                              new Date(post.firstPublishedDate).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                          </span>
                          <div className="flex-grow pt-2">
                            {post.excerpt && (
                              <p className="text-gray-600 dark:text-gray-300 text-base line-clamp-3">{post.excerpt}</p>
                            )}
                          </div>
                          <div className="flex justify-between items-center pt-4 mt-auto">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{readTime}</span>
                            <Link href={`/blog/${post.slug}`} passHref>
                              <button className="border-gray-200 text-medium rounded-sm border px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200">
                                Read More
                              </button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <Button
              className="absolute top-1/2 -translate-y-1/2 border-gray-200 cursor-pointer left-4 -ml-4 z-40 rounded-full bg-white w-10 h-10 p-0"
              variant="outline"
              onClick={scrollPrev}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="sr-only">Previous slide</span>
            </Button>
            <Button
              className="absolute top-1/2 -translate-y-1/2 border-gray-200 cursor-pointer right-4 -mr-4 z-10 rounded-full bg-white w-10 h-10 p-0"
              variant="outline"
              onClick={scrollNext}
            >
              <ChevronRight className="w-5 h-5" />
              <span className="sr-only">Next slide</span>
            </Button>
          </div>
        )}
      </div>
      
    </section>
  )
}