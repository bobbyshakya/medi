"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { wixServerClient } from "@/lib/wixServer"
import { getBestCoverImage } from "@/lib/wixMedia"
import { OptimizedImage } from "@/components/optimized-image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import type { MedicalAdvisor } from "@/types/medicalAdvisor"
import { Clock, HeartPulse, ShieldCheck, Stethoscope, DollarSign } from "lucide-react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

// Define the collection IDs
const COLLECTION_ID_DOCTOR = "Import2"
const COLLECTION_ID_HOSPITAL = "Hospital"
const COLLECTION_ID_TREATMENT = "TreatmentAngioplastyPci"

// Define the interfaces for each data type
interface Hospital {
  _id: string
  Name: string
  Type: string
  Tagline: string
  Description: string
  Logo: string
  Departments: string[]
  Facilities: string[]
  Services: string[]
  "Insurance Partners": string[]
  Rating: number
  "Review Count": number
  "Established Year": number
  Website: string
  "Contact Email": string
  "Facebook Link": string
  "Instagram Link": string
  "LinkedIn Link": string
  slug: string // Added slug to interface for consistency
  type: "hospital"
}

// Updated Treatment interface to match the new API response structure
interface Treatment {
  _id: string
  name: string
  description: string
  slug: string
  department: string
  tags: string[]
  priceRangeMin: number
  priceRangeMax: number
  relatedDoctors: string[]
  durationMinutes: number
  faqs: { question: string; answer: string }[]
  type: "treatment"
}

// Create a union type for all searchable items
type SearchableItem = (MedicalAdvisor & { type: "doctor" }) | Hospital | Treatment

// Define the state interface for filters
interface FilterState {
  searchQuery: string
  specialties: string[]
  languages: string[]
  type: "all" | "doctor" | "hospital" | "treatment"
}

// Helper function to create a URL-friendly slug
function createSlug(name: string | null | undefined): string {
  if (!name) return ""
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "")
}

// Helper function to format strings to arrays
function formatStringToArray(data: string[] | string | null | undefined): string[] {
  if (!data) return []
  if (Array.isArray(data)) {
    return data.map((item) => String(item).trim())
  }
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data.replace(/'/g, '"'))
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim())
      }
    } catch (e) {
      return data.split(",").map((item) => item.trim())
    }
  }
  return []
}

// Helper function to parse social links
function parseSocialLinks(data: string | null | undefined): Record<string, string> {
  if (!data || typeof data !== "string") return {}
  try {
    const parsed = JSON.parse(data.replace(/'/g, '"'))
    if (typeof parsed === "object" && parsed !== null) {
      return parsed
    }
  } catch (e) {
    console.error("Failed to parse social links string:", e)
  }
  return {}
}

// Helper function to parse FAQs from a string
function parseFaqs(data: string | null | undefined): { question: string; answer: string }[] {
  if (!data || typeof data !== "string") return []
  try {
    return JSON.parse(data)
  } catch (e) {
    console.error("Failed to parse FAQs string:", e)
  }
  return []
}

// Asynchronous function to fetch and combine data from all collections
async function getCombinedData(): Promise<SearchableItem[]> {
  try {
    const [doctorsResponse, hospitalResponse, treatmentResponse] = await Promise.all([
      wixServerClient.items.query(COLLECTION_ID_DOCTOR).limit(1000).find({ consistentRead: true }),
      wixServerClient.items.query(COLLECTION_ID_HOSPITAL).limit(1000).find({ consistentRead: true }),
      wixServerClient.items.query(COLLECTION_ID_TREATMENT).limit(1000).find({ consistentRead: true }),
    ])

    const doctors: SearchableItem[] =
      doctorsResponse.items?.map((item: any) => ({
        ...item,
        _id: item._id,
        name: item.name || "Medical Advisor",
        title: item.Title || item.title,
        specialty: item.specialty,
        photo: item.photo,
        experience: item.experience,
        languages: formatStringToArray(item.languages),
        hospital: item.hospital,
        contactPhone: item.contactPhone,
        whatsapp: item.whatsapp,
        about: item.about,
        workExperience: item.workExperience,
        education: item.education,
        memberships: item.memberships,
        awards: item.awards,
        specialtyInterests1yy: formatStringToArray(item.specialtyInterests1yy),
        // Slug generation logic: use existing slug or create one from the name
        slug: item.slug || createSlug(item.name),
        type: "doctor",
      })) || []

   const hospitals: SearchableItem[] =
  hospitalResponse.items?.map((item: any) => {
    const socialLinks = parseSocialLinks(item.socialLinks)
    return {
      _id: item._id,
      Name: item.name || "Unknown Hospital",
      Type: item.type || "",
      Tagline: item.tagline || "",
      Description: item.description || "",
      Logo: item.logo,
      Departments: formatStringToArray(item.departments),
      Facilities: formatStringToArray(item.facilities),
      Services: formatStringToArray(item.services),
      "Insurance Partners": formatStringToArray(item.insurancePartners),
      Rating: item.rating ? Number.parseFloat(item.rating) : 0,
      "Review Count": item.reviewCount ? Number.parseInt(item.reviewCount) : 0,
      "Established Year": item.establishedYear ? Number.parseInt(item.establishedYear) : 0,
      Website: item.website || "#",
      "Contact Email": item.contactEmail || "",
      "Facebook Link": socialLinks.facebook || "",
      "Instagram Link": socialLinks.instagram || "",
      "LinkedIn Link": socialLinks.linkedin || "",
      // Slug generation logic: use existing slug or create one from the name
      slug: item.slug || createSlug(item.name),
      type: "hospital",
    }
  }) || []

    // Fetch and map treatment data
    const treatments: SearchableItem[] =
      treatmentResponse.items?.map((item: any) => ({
        ...item,
        _id: item._id,
        name: item.name || "Treatment",
        description: item.description || "",
        // Slug generation logic: use existing slug or create one from the name
        slug: item.slug || createSlug(item.name),
        department: item.department || "",
        tags: formatStringToArray(item.tags),
        priceRangeMin: item.priceRangeMin || 0,
        priceRangeMax: item.priceRangeMax || 0,
        relatedDoctors: formatStringToArray(item.relatedDoctors),
        durationMinutes: item.durationMinutes || 0,
        faqs: parseFaqs(item.faqs),
        type: "treatment",
      })) || []

    return [...doctors, ...hospitals, ...treatments]
  } catch (error) {
    console.error("Error fetching combined data:", error)
    return []
  }
}

export default function Searchpage() {
  const [allData, setAllData] = useState<SearchableItem[] | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    specialties: [],
    languages: [],
    type: "all",
  })

  useEffect(() => {
    async function fetchData() {
      const combinedItems = await getCombinedData()
      setAllData(combinedItems)
    }
    fetchData()
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
  }

  const handleTypeChange = (value: "all" | "doctor" | "hospital" | "treatment") => {
    setFilters((prev) => ({ ...prev, type: value }))
  }

  const handleFilterToggle = (filterType: "specialties" | "languages", value: string, checked: boolean) => {
    setFilters((prev) => {
      const currentFilters = prev[filterType]
      return {
        ...prev,
        [filterType]: checked ? [...currentFilters, value] : currentFilters.filter((item) => item !== value),
      }
    })
  }

  const filteredData = useMemo(() => {
    if (!allData) return null

    return allData.filter((item) => {
      const matchesType =
        filters.type === "all" ||
        (filters.type === "doctor" && item.type === "doctor") ||
        (filters.type === "hospital" && item.type === "hospital") ||
        (filters.type === "treatment" && item.type === "treatment")

      let nameToCheck = ""
      if (item.type === "doctor") {
        nameToCheck = (item as MedicalAdvisor).name
      } else if (item.type === "hospital") {
        nameToCheck = (item as Hospital).Name
      } else if (item.type === "treatment") {
        nameToCheck = (item as Treatment).name
      }

      const matchesSearch = nameToCheck?.toLowerCase().includes(filters.searchQuery.toLowerCase())

      const matchesSpecialties =
        filters.specialties.length === 0 ||
        (item.type === "doctor" &&
          filters.specialties.some((spec) =>
            (item as MedicalAdvisor).specialty?.toLowerCase().includes(spec.toLowerCase()),
          )) ||
        (item.type === "hospital" &&
          (item as Hospital).Departments.some((dept) => filters.specialties.includes(dept))) ||
        (item.type === "treatment" &&
          filters.specialties.some((spec) =>
            (item as Treatment).department?.toLowerCase().includes(spec.toLowerCase()),
          ))

      const matchesLanguages =
        filters.languages.length === 0 ||
        (item.type === "doctor" && (item as MedicalAdvisor).languages?.some((lang) => filters.languages.includes(lang)))

      return matchesType && matchesSearch && matchesSpecialties && matchesLanguages
    })
  }, [allData, filters])

  const uniqueSpecialties = useMemo(() => {
    if (!allData) return []
    const allSpecialties = new Set<string>()
    allData.forEach((item) => {
      if (item.type === "doctor" && item.specialty) {
        allSpecialties.add(item.specialty)
      } else if (item.type === "hospital" && Array.isArray(item.Departments)) {
        item.Departments.forEach((dept) => allSpecialties.add(dept))
      } else if (item.type === "treatment" && item.department) {
        allSpecialties.add(item.department)
      }
    })
    return Array.from(allSpecialties).sort()
  }, [allData])

  const uniqueLanguages = useMemo(() => {
    if (!allData) return []
    const allLanguages = new Set<string>()
    allData.forEach((item) => {
      if (item.type === "doctor" && item.languages) {
        item.languages.forEach((lang) => allLanguages.add(lang))
      }
    })
    return Array.from(allLanguages).sort()
  }, [allData])

  if (!allData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p>Loading data...</p>
      </div>
    )
  }

  const renderItem = (item: SearchableItem) => {
    if (item.type === "doctor") {
      const doctor = item as MedicalAdvisor
      const imageSrc = doctor.photo ? getBestCoverImage(doctor.photo, { width: 150 }) : null

      return (
        <Card key={doctor._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center space-x-4 p-4">
            {imageSrc && (
              <OptimizedImage
                src={imageSrc}
                alt={doctor.name}
                width={80}
                height={80}
                className="rounded-full object-cover border border-gray-200"
              />
            )}
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">{doctor.title}</CardTitle>
              <p className="text-sm text-[#241d1f]">{doctor.specialty}</p>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-sm space-y-2">
            <p className="flex items-center gap-2 text-[#241d1f]">
              <Clock size={14} className="text-gray-500" />
              <span className="font-medium">{doctor.experience}</span> years experience
            </p>
            <p className="flex items-center gap-2 text-[#241d1f]">
              <ShieldCheck size={14} className="text-gray-500" />
              <span className="font-medium">Languages:</span> {doctor.languages?.join(", ")}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {doctor.specialtyInterests1yy?.map((interest, index) => (
                <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-800">
                  {interest}
                </Badge>
              ))}
            </div>
            <Link href={`/medical-advisor/${doctor.slug}`} passHref>
              <Button className="w-full mt-4 text-sm bg-transparent" variant="outline">
                View Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      )
    } else if (item.type === "hospital") {
      const hospital = item as Hospital
      const imageSrc = hospital.Logo ? getBestCoverImage(hospital.Logo, { width: 150 }) : null

      return (
        <Card key={hospital._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center space-x-4 p-4">
            {imageSrc && (
              <OptimizedImage
                src={imageSrc}
                alt={hospital.Name}
                width={80}
                height={80}
                className="rounded-md object-cover border border-gray-200"
              />
            )}
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">{hospital.Name}</CardTitle>
              <p className="text-sm text-[#241d1f]">{hospital.Tagline}</p>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-sm space-y-2">
            <p className="flex items-center gap-2 text-[#241d1f]">
              <HeartPulse size={14} className="text-gray-500" />
              <span className="font-medium">Departments:</span> {hospital.Departments.join(", ")}
            </p>
            <p className="flex items-center gap-2 text-[#241d1f]">
              <ShieldCheck size={14} className="text-gray-500" />
              <span className="font-medium">Insurance Partners:</span> {hospital["Insurance Partners"]?.join(", ")}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                {hospital.Type}
              </Badge>
              <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                Est. {hospital["Established Year"]}
              </Badge>
            </div>
            <Link href={`/hospitals/${hospital.slug}`} passHref>
              <Button className="w-full mt-4 text-sm bg-transparent" variant="outline">
                View Details
              </Button>
            </Link>
          </CardContent>
        </Card>
      )
    } else {
      const treatment = item as Treatment
      return (
        <Card key={treatment._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center space-x-4 p-4">
            <Stethoscope size={48} className="text-gray-500" />
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">{treatment.name}</CardTitle>
              <p className="text-sm text-[#241d1f]">{treatment.department}</p>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-sm space-y-2">
            <p className="text-[#241d1f]">{treatment.description}</p>
            <p className="flex items-center gap-2 text-[#241d1f]">
              <DollarSign size={14} className="text-gray-500" />
              <span className="font-medium">Price:</span> ${treatment.priceRangeMin} - ${treatment.priceRangeMax}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {treatment.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-800">
                  {tag}
                </Badge>
              ))}
            </div>
            {treatment.slug && (
              <Link href={`/treatment/${treatment.slug}`} passHref>
                <Button className="w-full mt-4 text-sm bg-transparent" variant="outline">
                  View Details
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 md:px-8">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Find the Right Medical Resource</h1>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <Card className="p-4 lg:sticky lg:top-8 bg-white shadow-sm border border-gray-200">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-xl font-semibold text-gray-800">Filters</CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-6">
                {/* Search input */}
                <div>
                  <Label htmlFor="search" className="text-sm font-medium text-[#241d1f]">
                    Search by Name
                  </Label>
                  <Input
                    id="search"
                    type="text"
                    placeholder="e.g., Dr. Smith, Max Healthcare or Angioplasty"
                    value={filters.searchQuery}
                    onChange={handleSearchChange}
                    className="mt-1"
                  />
                </div>

                {/* Type filter */}
                <div>
                  <Label className="text-sm font-medium text-[#241d1f]">Resource Type</Label>
                  <Select
                    value={filters.type}
                    onValueChange={(value: "all" | "doctor" | "hospital" | "treatment") => handleTypeChange(value)}
                  >
                    <SelectTrigger className="w-full mt-1 border border-gray-300">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="doctor">Doctors</SelectItem>
                        <SelectItem value="hospital">Hospitals</SelectItem>
                        <SelectItem value="treatment">Treatments</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Specialties */}
                {uniqueSpecialties.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-[#241d1f]">Specialty / Department</Label>
                    <ScrollArea className="h-40 border rounded-md p-2 mt-1 bg-gray-50 border-gray-200">
                      {uniqueSpecialties.map((specialty) => (
                        <div key={specialty} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`specialty-${specialty}`}
                            checked={filters.specialties.includes(specialty)}
                            onCheckedChange={(checked: boolean) =>
                              handleFilterToggle("specialties", specialty, checked)
                            }
                            className="border-gray-300"
                          />
                          <Label htmlFor={`specialty-${specialty}`} className="cursor-pointer text-sm text-[#241d1f]">
                            {specialty}
                          </Label>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                )}

                {/* Languages */}
                {uniqueLanguages.length > 0 && filters.type !== "hospital" && filters.type !== "treatment" && (
                  <div>
                    <Label className="text-sm font-medium text-[#241d1f]">Languages</Label>
                    <ScrollArea className="h-40 border rounded-md p-2 mt-1 bg-gray-50 border-gray-200">
                      {uniqueLanguages.map((language) => (
                        <div key={language} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`language-${language}`}
                            checked={filters.languages.includes(language)}
                            onCheckedChange={(checked: boolean) => handleFilterToggle("languages", language, checked)}
                            className="border-gray-300"
                          />
                          <Label htmlFor={`language-${language}`} className="cursor-pointer text-sm text-[#241d1f]">
                            {language}
                          </Label>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:w-3/4">
            {filteredData && filteredData.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{filteredData.map(renderItem)}</div>
            ) : (
              <div className="text-center text-gray-500 mt-12">
                <p className="text-lg">No results found.</p>
                <p>Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}