"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Mail, Linkedin, Twitter, Globe, Users } from "lucide-react"
import { getBestCoverImage, getWixScaledToFillImageUrl } from "@/lib/wixMedia"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const COLLECTION_ID = "Team1"

// Helper function to extract text from a rich text object
const extractTextFromRichText = (richTextObj: any): string => {
  if (!richTextObj) return ""

  // If it's already a string, return it
  if (typeof richTextObj === "string") return richTextObj

  // If it's a rich text object with nodes
  if (richTextObj.nodes && Array.isArray(richTextObj.nodes)) {
    return richTextObj.nodes
      .map((node: any) => {
        if (node.type === "PARAGRAPH" && node.nodes) {
          return node.nodes
            .map((textNode: any) => {
              if (textNode.type === "TEXT" && textNode.textData) {
                return textNode.textData.text || ""
              }
              return ""
            })
            .join("")
        }
        return ""
      })
      .join("\n\n")
      .trim()
  }

  // Fallback: try to extract any text property
  if (richTextObj.text) return richTextObj.text
  if (richTextObj.textData && richTextObj.textData.text) return richTextObj.textData.text

  return ""
}

// Interface for the team member data structure
interface TeamMember {
  _id?: string
  name: string
  role: string
  image: string
  bio: string
  shortDescription: string
  longDescription: string
  order: number
  "link-team-1-title": string
  email?: string
  linkedin?: string
  twitter?: string
  website?: string
  rawData?: any
}

// Skeleton loader component for better user experience while data is loading
const SkeletonProfile = () => (
  <div className="min-h-screen bg-white">
    <div className="container mx-auto px-4 py-16">
      <div className="h-10 bg-gray-200 rounded animate-pulse w-32 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1">
          <div className="aspect-[4/5] bg-gray-200 rounded-lg animate-pulse mb-6" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="h-10 bg-gray-200 rounded animate-pulse w-48" />
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default function TeamMemberPage() {
  const params = useParams()
  const router = useRouter()
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Processes the Wix image URL to get a scaled version
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
          const processedUrl = getWixScaledToFillImageUrl(imageUrl, 600, 750)
          if (processedUrl) {
            return processedUrl
          }
        }
      }
    }

    return `/placeholder.svg?height=750&width=600&query=team member portrait`
  }

  // Fetches team member data based on the provided slug
  const fetchTeamMember = async (memberId: string) => {
    try {
      const { wixClient } = await import("@/lib/wixClient")

      console.log("[v0] Searching for team member with slug:", memberId)

      // First, try to get by exact ID match
      let response = await wixClient.items.query(COLLECTION_ID).eq("_id", memberId).find({ consistentRead: true })
      console.log("[v0] Search by ID result:", response?.items?.length || 0)

      // If not found by ID, get all members and find a slug match
      if (!response?.items?.length) {
        console.log("[v0] ID search failed, trying slug matching")
        const allMembersResponse = await wixClient.items
          .query(COLLECTION_ID)
          .skip(0)
          .limit(100)
          .find({ consistentRead: true })

        if (allMembersResponse?.items?.length) {
          console.log("[v0] Found", allMembersResponse.items.length, "total members")

          const targetMember = allMembersResponse.items.find((item: any) => {
            const itemData = item.data || item
            const memberName = itemData.title || item.title || item.Name || item.name || ""
            const memberSlug = memberName
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/\s+/g, "-")
              .replace(/-+/g, "-")
              .replace(/^-|-$/g, "")
              .trim()

            const linkSlug = itemData["link-team-1-title"] || item["link-team-1-title"] || ""
            const extractedSlug = linkSlug.replace("/team/", "").replace("/", "")

            console.log("[v0] Comparing slugs:", {
              memberSlug,
              extractedSlug,
              targetSlug: memberId,
              memberName,
              linkSlug,
            })

            return memberSlug === memberId || extractedSlug === memberId || item._id === memberId
          })

          if (targetMember) {
            const targetData = targetMember.data || targetMember
            console.log("[v0] Found matching member:", targetData.title || targetMember.title)
            response = { items: [targetMember] }
          }
        }
      }

      // Final fallback: try partial name matching
      if (!response?.items?.length) {
        console.log("[v0] Slug matching failed, trying partial name search")
        const nameFromSlug = memberId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
        console.log("[v0] Searching for name:", nameFromSlug)

        response = await wixClient.items
          .query(COLLECTION_ID)
          .contains("title", nameFromSlug)
          .find({ consistentRead: true })

        console.log("[v0] Partial name search result:", response?.items?.length || 0)
      }

      if (!response?.items?.length) {
        console.log("[v0] No team member found for slug:", memberId)
        return null
      }

      const item = response.items[0]
      const itemData = item.data || item
      console.log("[v0] Successfully found team member:", itemData.title || item.title)

      // Map the Wix item data to the TeamMember interface
      const teamMemberData: TeamMember = {
        _id: item._id || item.ID,
        name: itemData.title || item.title || item.Name || item.name || "Team Member",
        role: itemData.jobTitle || item.jobTitle || item["Job Title"] || item.role || item.position || "Team Member",
        image: processWixImageUrl(itemData),
        bio:
          extractTextFromRichText(
            itemData.longDescription ||
            item.longDescription ||
            item["Long Description"] ||
            item.bio ||
            item.description,
          ) || "Dedicated team member.",
        shortDescription:
          extractTextFromRichText(
            itemData.shortDescription || item.shortDescription || item["Short Description"] || item.excerpt,
          ) || "",
        longDescription:
          extractTextFromRichText(
            itemData.longDescription ||
            item.longDescription ||
            item["Long Description"] ||
            item.bio ||
            item.description,
          ) || "",
        order: Number.parseInt(itemData.order) || Number.parseInt(item.order) || Number.parseInt(item.Order) || 0,
        "link-team-1-title":
          itemData["link-team-1-title"] ||
          item["link-team-1-title"] ||
          item.link ||
          item.profileUrl ||
          item.website ||
          "#",
        email: itemData.email || item.email || item.Email || "",
        linkedin: itemData.linkedin || item.linkedin || item.LinkedIn || "",
        twitter: itemData.twitter || item.twitter || item.Twitter || "",
        website: itemData.website || item.website || item.Website || "",
        rawData: item,
      }

      return teamMemberData
    } catch (error: any) {
      console.error("Error fetching team member:", error)
      throw error
    }
  }

  // Load data when the component mounts or the slug changes
  const loadData = async () => {
    try {
      setLoading(true)
      const slug = params.slug as string
      const result = await fetchTeamMember(slug)

      if (result) {
        setTeamMember(result)
      } else {
        setNotFound(true)
      }
    } catch (error) {
      console.error("Failed to load team member:", error)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.slug) {
      loadData()
    }
  }, [params.slug])

  // Display skeleton loader while fetching data
  if (loading) {
    return <SkeletonProfile />
  }

  // Display "Not Found" message if no data is found
  if (notFound || !teamMember) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-100 to-purple-100 rounded-full mb-8">
            <Users className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-6">
            Team Member Not Found
          </h1>
          <p className="text-lg text-[#241d1f] mb-8">
            The team member you're looking for doesn't exist or may have been removed.
          </p>
          <Button asChild className="bg-red-600 mt-5 hover:bg-red-700 text-white">
            <Link href="/team">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Team
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // Main component to display team member details
  return (
    <div className="min-h-screen px-2 bg-white">
      <div className="container mx-auto py-10">
        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          {/* Back to previous page */}
          <Button variant="ghost" className="hover:bg-red-50 w-auto bg-gray-100 cursor-pointer hover:text-red-600" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
             Back
          </Button>
          {/* Back to Professional Stage Page */}
          
        </div>

        <div className="grid grid-cols-1 pb-10 mt-4 md:pt-2 lg:grid-cols-3 gap-6">
          {/* Profile Image and Basic Info */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden shadow-xs  border-gray-200">
              <div className="md:aspect-[4/5] aspect-[3/2] overflow-hidden ">
                <img
                  src={teamMember.image || "/placeholder.svg"}
                  alt={teamMember.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = `/placeholder.svg?height=750&width=600&query=${encodeURIComponent(teamMember.name + " team member")}`
                  }}
                />
              </div>
              <div className="p-4">
                <h1 className="title-heading">{teamMember.name}</h1>
                <p className="description">{teamMember.role}</p>

                {/* Social Links */}
                <div className="flex gap-3">
                  {teamMember.email && (
                    <a
                      href={`mailto:${teamMember.email}`}
                      className="p-3 bg-gray-100 hover:bg-red-100 rounded-full transition-colors group"
                    >
                      <Mail className="w-5 h-5 text-[#241d1f] group-hover:text-red-600" />
                    </a>
                  )}
                  {teamMember.linkedin && (
                    <a
                      href={teamMember.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-gray-100 hover:bg-red-100 rounded-full transition-colors group"
                    >
                      <Linkedin className="w-5 h-5 text-[#241d1f] group-hover:text-red-600" />
                    </a>
                  )}
                  {teamMember.twitter && (
                    <a
                      href={teamMember.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-gray-100 hover:bg-red-100 rounded-full transition-colors group"
                    >
                      <Twitter className="w-5 h-5 text-[#241d1f] group-hover:text-red-600" />
                    </a>
                  )}
                  {teamMember.website && (
                    <a
                      href={teamMember.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-gray-100 hover:bg-red-100 rounded-full transition-colors group"
                    >
                      <Globe className="w-5 h-5 text-[#241d1f] group-hover:text-red-600" />
                    </a>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Detailed Information */}
          <div className="lg:col-span-2">
            <div className="space-y-8">
              <div>
                <h2 className="title-heading mb-4">About {teamMember.name}</h2>
                <div className="prose prose-lg max-w-none">
                  <p className="description">
                    {teamMember.longDescription || teamMember.bio}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}