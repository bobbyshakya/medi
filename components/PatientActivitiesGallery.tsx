"use client"

import { useState, useCallback, useEffect } from "react"
import { Heart, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface PatientActivity {
  id: string
  title: string
  imageUrl: string
  category: "therapy" | "recreation" | "exercise" | "social" | "educational"
  likes: number
}

const dummyActivities: PatientActivity[] = [
  {
    id: "1",
    title: "Art Therapy Session",
    imageUrl: "/photo-1513475382585-d06e58bcb0e0?w=1200&h=800&fit=crop",
    category: "therapy",
    likes: 24,
  },
  {
    id: "2",
    title: "Garden Therapy",
    imageUrl: "/photo-1416879595882-3373a0480b5b?w=1200&h=800&fit=crop",
    category: "therapy",
    likes: 31,
  },
  {
    id: "3",
    title: "Music Therapy Concert",
    imageUrl: "/photo-1493225457124-a3eb161ffa5f?w=1200&h=800&fit=crop",
    category: "therapy",
    likes: 67,
  },
  {
    id: "4",
    title: "Yoga & Meditation",
    imageUrl: "/photo-1544367567-0f2fcb009e0b?w=1200&h=800&fit=crop",
    category: "exercise",
    likes: 42,
  },
  {
    id: "5",
    title: "Cooking Workshop",
    imageUrl: "/photo-1556909114-f6e7ad7d3136?w=1200&h=800&fit=crop",
    category: "educational",
    likes: 38,
  },
  {
    id: "6",
    title: "Pet Therapy Visit",
    imageUrl: "/photo-1601758228041-f3b2795255f1?w=1200&h=800&fit=crop",
    category: "therapy",
    likes: 89,
  },
  {
    id: "7",
    title: "Board Game Tournament",
    imageUrl: "/photo-1606092195730-5d7b9af1efc5?w=1200&h=800&fit=crop",
    category: "social",
    likes: 28,
  },
  {
    id: "8",
    title: "Aqua Therapy",
    imageUrl: "/photo-1571019613454-1cb2f99b2d8b?w=1200&h=800&fit=crop",
    category: "exercise",
    likes: 35,
  },
  {
    id: "9",
    title: "Reading Circle",
    imageUrl: "/photo-1481627834876-b7833e8f5570?w=1200&h=800&fit=crop",
    category: "educational",
    likes: 19,
  },
]

const categoryColors = {
  therapy: "bg-red-100 text-red-800 border-red-200",
  recreation: "bg-purple-100 text-purple-800 border-purple-200",
  exercise: "bg-blue-100 text-blue-800 border-blue-200",
  social: "bg-orange-100 text-orange-800 border-orange-200",
  educational: "bg-indigo-100 text-indigo-800 border-indigo-200",
}

export function PatientActivitiesGallery() {
  const [activities, setActivities] = useState<PatientActivity[]>(dummyActivities)
  const [likedActivities, setLikedActivities] = useState<Set<string>>(new Set())
  const [selectedActivityIndex, setSelectedActivityIndex] = useState<number | null>(null)

  const handleLike = useCallback((activityId: string) => {
    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              likes: likedActivities.has(activityId) ? activity.likes - 1 : activity.likes + 1,
            }
          : activity,
      ),
    )

    setLikedActivities((prev) => {
      const newLiked = new Set(prev)
      if (newLiked.has(activityId)) {
        newLiked.delete(activityId)
      } else {
        newLiked.add(activityId)
      }
      return newLiked
    })
  }, [likedActivities])

  const openDetailsModal = useCallback((index: number) => {
    setSelectedActivityIndex(index)
  }, [])

  const closeDetailsModal = useCallback(() => {
    setSelectedActivityIndex(null)
  }, [])

  const goToNextActivity = useCallback(() => {
    if (selectedActivityIndex !== null) {
      setSelectedActivityIndex((prevIndex) =>
        (prevIndex as number) === activities.length - 1 ? 0 : (prevIndex as number) + 1,
      )
    }
  }, [selectedActivityIndex, activities.length])

  const goToPrevActivity = useCallback(() => {
    if (selectedActivityIndex !== null) {
      setSelectedActivityIndex((prevIndex) =>
        (prevIndex as number) === 0 ? activities.length - 1 : (prevIndex as number) - 1,
      )
    }
  }, [selectedActivityIndex, activities.length])

  // Effect to handle keyboard navigation (Escape, Left, Right) and body scroll
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedActivityIndex !== null) {
        if (event.key === "Escape") {
          closeDetailsModal()
        } else if (event.key === "ArrowLeft") {
          goToPrevActivity()
        } else if (event.key === "ArrowRight") {
          goToNextActivity()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    // Manage body scroll when modal is open/closed
    if (selectedActivityIndex !== null) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      // Ensure scroll is reset if component unmounts while modal is open
      document.body.style.overflow = "unset"
    }
  }, [selectedActivityIndex, closeDetailsModal, goToNextActivity, goToPrevActivity])

  const currentActivity = selectedActivityIndex !== null ? activities[selectedActivityIndex] : null

  return (
    <div className="container mx-auto px-4 py-16 bg-gray-50 min-h-screen font-sans">
      {/* Header Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 tracking-tight leading-tight">
          Moments of Joy & Healing
        </h1>
        <p className="text-xl text-[#241d1f] max-w-3xl mx-auto leading-relaxed">
          Discover our vibrant gallery of patient activities, designed to inspire well-being, foster connection, and
          enrich lives.
        </p>
      </div>

      {/* Image Gallery Grid - Only Image and Title on hover, with subtle like count */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className="group relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer transform hover:-translate-y-1"
            onClick={() => openDetailsModal(index)}
          >
            <div className="relative w-full h-60 overflow-hidden">
              <Image
                src={activity.imageUrl || "/placeholder.svg"}
                alt={activity.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                crossOrigin="anonymous"
              />
              {/* Overlay with Title and Like Button/Count */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                <h3 className="text-xl font-bold text-white mb-1 drop-shadow-md">{activity.title}</h3>
                <div className="flex items-center justify-between mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleLike(activity.id)
                    }}
                    className={`flex items-center space-x-1 p-2 rounded-md transition-colors text-white hover:text-red-400`}
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        likedActivities.has(activity.id) ? "fill-red-500 text-red-500" : "text-gray-300"
                      }`}
                    />
                    <span className="font-semibold text-sm">{activity.likes}</span>
                  </Button>
                  <Badge
                    className={`${
                      categoryColors[activity.category]
                    } text-xs px-2 py-1 rounded-full font-semibold border opacity-90`}
                  >
                    {activity.category.charAt(0).toUpperCase() + activity.category.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Details Modal - Only Image, Title, Category, and Like Button */}
      {currentActivity && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={closeDetailsModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-5xl h-[90vh] w-full mx-auto p-6 relative animate-zoomIn flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={closeDetailsModal}
              className="absolute top-4 right-4 text-[#241d1f] hover:text-gray-900 transition-colors duration-200 rounded-full bg-gray-100 hover:bg-gray-200 w-10 h-10 flex items-center justify-center z-20"
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Image Container with fixed height and arrows */}
            <div className="relative w-full h-3/5 rounded-lg overflow-hidden shadow-md mb-6">
              {" "}
              {/* Changed h-full to h-3/5 for spacing */}
              <Image
                src={currentActivity.imageUrl || "/placeholder.svg"}
                alt={currentActivity.title}
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-cover"
                crossOrigin="anonymous"
              />
              {/* Image Navigation Arrows */}
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrevActivity}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/50 backdrop-blur-sm hover:bg-white/70 text-gray-800 rounded-full w-12 h-12 flex items-center justify-center z-10 opacity-80 hover:opacity-100 transition-opacity duration-200"
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextActivity}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/50 backdrop-blur-sm hover:bg-white/70 text-gray-800 rounded-full w-12 h-12 flex items-center justify-center z-10 opacity-80 hover:opacity-100 transition-opacity duration-200"
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
              <div className="absolute top-4 left-4">
                <Badge
                  className={`${
                    categoryColors[currentActivity.category]
                  } text-base px-4 py-2 rounded-full font-semibold border`}
                >
                  {currentActivity.category.charAt(0).toUpperCase() + currentActivity.category.slice(1)}
                </Badge>
              </div>
            </div>
            {/* Content below the image */}
            <h2 className="text-3xl md:text-4xl font-bold text-[#241d1f] mb-4">{currentActivity.title}</h2>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="lg"
                onClick={(e) => {
                  e.stopPropagation()
                  handleLike(currentActivity.id)
                }}
                className={`flex items-center space-x-2 p-3 rounded-md transition-colors ${
                  likedActivities.has(currentActivity.id)
                    ? "text-red-500 hover:text-red-600"
                    : "text-gray-500 hover:text-[#241d1f]"
                }`}
              >
                <Heart className={`w-7 h-7 ${likedActivities.has(currentActivity.id) ? "fill-red-500" : ""}`} />
                <span className="font-bold text-lg">{currentActivity.likes} Likes</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}