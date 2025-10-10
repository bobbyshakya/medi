


"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import CtaSection from "@/components/CtaSection"
import { Badge } from "@/components/ui/badge"
import Banner from "@/components/BannerService"
import { Input } from "@/components/ui/input"
import {
  Play,
  Search,
  Clock,
  Eye,
  Stethoscope,
  Activity,
  X,
  ChevronRight,
  Calendar,
  CheckCircle,
  Loader2,
} from "lucide-react"
import Image from "next/image"

const API_KEY = "AIzaSyBcen5tfHQchDzIID1uT6awba29gJGebKg"
const CHANNEL_ID = "UCXGDsVXUX2ixe6NyvijGYaw"
const MAX_RESULTS = 12

interface Video {
  id: string
  title: string
  description: string
  thumbnail: string
  publishedAt: string
  viewCount?: string
  duration?: string
  channelTitle?: string
}

const treatmentCategories = [
  "All Stories",
  "Cardiac Surgery",
  "Orthopedic",
  "Neurology",
  "Oncology",
  "Pediatric",
  "Emergency Care",
  "Rehabilitation",
  "Mental Health",
]

const convertISO8601ToSeconds = (isoDuration: string): number => {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = Number.parseInt(match[1] || "0", 10)
  const minutes = Number.parseInt(match[2] || "0", 10)
  const seconds = Number.parseInt(match[3] || "0", 10)

  return hours * 3600 + minutes * 60 + seconds
}

export default function EnhancedTestimonialsPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Stories")
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setIsVisible(true)
    fetchVideos()
  }, [])

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchTerm.trim()) {
        performSearch(searchTerm)
      } else {
        fetchVideos()
      }
    }, 500)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm])

  const performSearch = async (query: string) => {
    setSearchLoading(true)
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet&type=video&maxResults=${MAX_RESULTS}&order=relevance&q=${encodeURIComponent(query)}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.items) {
        const videoIds = data.items.map((item: any) => item.id.videoId).join(",")
        const videoData = await fetchVideoDetails(videoIds, data.items)
        setVideos(videoData)
        setNextPageToken(data.nextPageToken || null)
      }
    } catch (error) {
      console.error("Error searching videos:", error)
    } finally {
      setSearchLoading(false)
    }
  }

  const fetchVideos = async (pageToken?: string) => {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet&type=video&maxResults=${MAX_RESULTS}&order=date${pageToken ? `&pageToken=${pageToken}` : ""}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.items) {
        const videoIds = data.items.map((item: any) => item.id.videoId).join(",")
        const videoData = await fetchVideoDetails(videoIds, data.items)

        if (pageToken) {
          setVideos((prev) => [...prev, ...videoData])
        } else {
          setVideos(videoData)
        }

        setNextPageToken(data.nextPageToken || null)
      }
    } catch (error) {
      console.error("Error fetching videos:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const fetchVideoDetails = async (videoIds: string, items: any[]) => {
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${videoIds}&part=statistics,contentDetails`
    const statsResponse = await fetch(statsUrl)
    const statsData = await statsResponse.json()

    return items
      .map((item: any, index: number) => {
        const stats = statsData.items?.[index]?.statistics || {}
        const contentDetails = statsData.items?.[index]?.contentDetails || {}

        return {
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
          publishedAt: item.snippet.publishedAt,
          viewCount: stats.viewCount,
          duration: contentDetails.duration,
          channelTitle: item.snippet.channelTitle,
        }
      })
      .filter((video: Video) => {
        if (video.duration) {
          const totalSeconds = convertISO8601ToSeconds(video.duration)
          return totalSeconds > 60
        }
        return false
      })
  }

  const loadMoreVideos = useCallback(() => {
    if (nextPageToken && !loadingMore) {
      setLoadingMore(true)
      fetchVideos(nextPageToken)
    }
  }, [nextPageToken, loadingMore])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatViewCount = (count: string) => {
    const num = Number.parseInt(count)
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const parseDuration = (duration: string) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
    if (!match) return "0:00"

    const hours = Number.parseInt(match[1]?.replace("H", "") || "0")
    const minutes = Number.parseInt(match[2]?.replace("M", "") || "0")
    const seconds = Number.parseInt(match[3]?.replace("S", "") || "0")

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const filteredVideos = videos.filter((video) => {
    if (selectedCategory !== "All Stories") {
      return (
        video.title.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        video.description.toLowerCase().includes(selectedCategory.toLowerCase())
      )
    }
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-slate-200 rounded-full animate-spin border-t-red-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Stethoscope className="h-8 w-8 text-red-600 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-900">Loading Patient Stories</h3>
              <p className="text-slate-600">Fetching inspiring recovery journeys...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section */}
     <Banner
  topSpanText="Patient Testimonials"
  title="
2,000+ International Patients Share Their Journey"
  description="From choosing the right hospital to seamless post-treatment care, our patients’ experiences with Medivisor are filled with trust, comfort, and hope. Watch their stories and see how we make every journey unforgettable."
  buttonText="Read Their Stories"
  buttonLink="/patient-testimonials"
  bannerBgImage="/grandparents-grandchildren-globe-with-inclusion-text-concept-as-abstract-vector-featuring-g_980716-652718.jpg"
  mainImageSrc="/about-main.png"
  mainImageAlt="International Patients Sharing Experiences with Medivisor"
/>



      {/* Search and Filter Section */}
      <section className="sticky top-16 z-40 md:pt-10 md:pb-3 pt-4  md:px-0 px-2 bg-gray-50 backdrop-blur-xs border-b border-gray-100 ">

        <div className="container mx-auto px-4 md:px-0  md:pt-2">
          <div className="flex flex-col lg:flex-row items-center pb-5  justify-between gap-3 md:gap-6">


            <div className=" w-full items-center gap-4 ">
              <h2 className="md:heading-lg title-text">Real Stories, Real Recoveries</h2>
            </div>
            <div className="flex w-full ">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                {searchLoading && (
                  <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500 h-5 w-5 animate-spin" />
                )}
                <Input
                  type="text"
                  placeholder="Search patient stories, treatments, conditions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-12 py-5  w-full bg-white border-slate-200 rounded-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-xs text-base placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Category Filter */}
          {/* <div className="mt-6 flex flex-wrap gap-3">
            {treatmentCategories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-6 py-2 text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25"
                    : "border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-600 hover:bg-red-50"
                }`}
              >
                {category}
              </Button>
            ))}
          </div> */}
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="bg-white px-2 md:px-0 py-4 md:py-10">
        <div className="container  mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 space-y-10 md:space-y-4 lg:grid-cols-4 gap-6">
          {filteredVideos.map((video, index) => (
            <Card
              key={video.id}
              className={`group bg-white border border-gray-200 shadow-none  hover:shadow-sm transition-all duration-500 rounded-xs overflow-hidden cursor-pointer  ${isVisible ? "opacity-100 " : "opacity-0 "
                }`}
              style={{ transitionDelay: `${index * 100}ms` }}
              onMouseEnter={() => setHoveredCard(video.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => setSelectedVideo(video.id)}
            >
              <CardContent className="p-0">
                <div className="relative overflow-hidden">
                  <Image
                    src={video.thumbnail || "/placeholder.svg?height=240&width=400&query=patient-story"}
                    alt={video.title}
                    width={400}
                    height={240}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className={`bg-white/95 backdrop-blur-sm hover:bg-white rounded-full p-4 transition-all duration-300 shadow-2xl ${hoveredCard === video.id ? "scale-125" : "scale-100"
                        }`}
                    >
                      <Play className="h-6 w-6 text-red-600 ml-1" />
                    </div>
                  </div>

                  {/* Duration Badge */}
                  {video.duration && (
                    <Badge className="absolute bottom-4 right-4 bg-black/90 backdrop-blur-sm text-white border-0 rounded-xl px-3 py-2 font-medium text-sm">
                      <Clock className="h-3 w-3 mr-1.5" />
                      {parseDuration(video.duration)}
                    </Badge>
                  )}

                  {/* Verified Badge */}
                  {/* <div className="absolute top-4 right-4 bg-green-500 rounded-full p-2 shadow-lg">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div> */}
                </div>

                <div className="p-4 pb-2 space-y-2">


                  <h3 className="font-medium text-xl text-[#241d1f] line-clamp-2 group-hover:text-gray-800 transition-colors duration-300 leading-tight min-h-[50px]">
                    {video.title}
                  </h3>

                  <p className="text-slate-600 line-clamp-3 leading-relaxed text-sm">{video.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-1 text-xs text-[#241d1f]">
                      <Calendar className="h-3 w-3" />
                      <span className="font-medium">{formatDate(video.publishedAt)}</span>
                    </div>

                    {video.viewCount && (
                      <div className="flex items-center gap-1 text-xs text-[#241d1f]">
                        <Eye className="h-3 w-3" />
                        <span className="font-medium">{formatViewCount(video.viewCount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More Section */}
        {nextPageToken && (
          <div className="text-center mt-16">
            <Button
              onClick={loadMoreVideos}
              disabled={loadingMore}
              className="bg-[#E22026] text-white px-12 py-4 rounded-sm text-base font-medium shadow-xs shadow-red-600/25 hover:shadow-xl hover:shadow-red-600/30 transition-all duration-300 transform hover:scale-105"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  Loading More Stories...
                </>
              ) : (
                <>
                  <Activity className="h-5 w-5 mr-3" />
                  Load More Stories
                  <ChevronRight className="h-5 w-5 ml-3" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Empty State */}
        {filteredVideos.length === 0 && !loading && !searchLoading && (
          <div className="text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-8">
              <Search className="h-16 w-16 text-slate-400" />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-4">No Stories Found</h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto text-lg leading-relaxed">
              We couldn't find any patient stories matching your search criteria. Try adjusting your filters or search
              terms.
            </p>
            <Button
              onClick={() => {
                setSearchTerm("")
                setSelectedCategory("All Stories")
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Clear All Filters
            </Button>
          </div>
        )}
        </div>
      </section>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-xs max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-xs animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-r from-red-600 to-red-700 rounded-xs shadow-xs">
                  <Play className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-xl text-slate-900">Patient Success Story</h3>
                  <p className="text-[#241d1f] flex items-center gap-2 mt-1">
                    <Stethoscope className="h-4 w-4" />
                    Medivisor India • Verified Patient Story
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setSelectedVideo(null)}
                variant="ghost"
                className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-2xl p-3 transition-all duration-300"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="aspect-video bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1&rel=0&modestbranding=1&color=white`}
                title="Patient Testimonial"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-8 bg-gradient-to-r from-slate-50 to-blue-50">
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-600">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Verified Patient Success Story</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <CtaSection />
    </div>
  )
}
