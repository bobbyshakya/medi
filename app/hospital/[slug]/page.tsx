"use client"

import { useState, useEffect, useMemo } from "react"
import { WixClient } from "@wix/sdk"
// Import necessary types from Wix SDK (or your custom data types if you have them)
// import { items } from '@wix/data-v2' 

/**
 * 💡 WIX CLIENT SETUP 💡
 *
 * This component ASSUMES you have a correctly configured Wix Client instance
 * exported from a file like "@/lib/wixClient".
 *
 * EXAMPLE of required setup in '@/lib/wixClient.ts':
 *
 * import { createClient } from "@wix/sdk";
 * export const wixClient = createClient({
 * modules: { data }, // Add other modules like 'media' if needed
 * auth: {
 * // Configure your application's authentication here (e.g., public/anonymous or private/session)
 * // For public data access, you often use the 'anonymous' method with the site ID and API Key.
 * },
 * });
 *
 */
import { wixClient } from "@/lib/wixClient" 

// UI components remain the same
import { Card, CardContent } from "@/components/ui/card"
import Banner from "@/components/BannerService"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    AlertCircle,
    RefreshCw,
    Search,
    Filter,
    Calendar,
    Grid3X3,
    List,
    HeartPulse,
    Hospital as HospitalIcon, 
    ChevronRight,
    Eye,
} from "lucide-react"
// IMPORTANT: Replace this with your actual image component if it integrates Wix Media.
// Wix Media URLs often require special handling or a dedicated component for optimization.
import { OptimizedImage } from "@/components/optimized-image" 

// --- INTERFACES BASED ON CSV DATA (Assuming your Wix Collection matches these fields) ---
interface Hospital {
    ID: string // Often '_id' in Wix Data
    Name: string // Often 'title' or a custom field
    Slug: string // Often 'slug' or a custom field
    LogoUrl: string // Wix Media URL or file name/path
    BannerUrl: string // Wix Media URL or file name/path
    Description: string
    EstablishedDate: Date
    MultiSpecialty: boolean
    Facilities: string[] 
    Specialties: string[] 
    GalleryUrls: string[] // Array of Wix Media URLs/paths
    BranchesRef: string[] // Array of branch IDs/references
}

// ** UPDATED: Function to fetch from Collection ID (Real Wix Query) **
const COLLECTION_ID = "hospitalmaster" // <-- ENSURE THIS MATCHES YOUR WIX DATA COLLECTION ID

const mapWixItemToHospital = (item: any): Hospital => {
    // This is a crucial mapping step as Wix Data fields might differ from your interface.
    // Adjust field names (e.g., item.title instead of item.Name) as needed.
    const establishedDateValue = item.EstablishedDate || item.establishedDate; // Wix sometimes uses camelCase
    
    return {
        ID: item._id || item.ID,
        Name: item.Name || item.title || "Untitled Hospital",
        Slug: item.Slug || item.slug || item._id,
        // Assuming your Wix fields are directly named LogoUrl, BannerUrl, etc.,
        // which hold the Wix Media URL or file key (e.g., 'wix:image://v1/...')
        LogoUrl: item.LogoUrl || "", 
        BannerUrl: item.BannerUrl || "",
        Description: item.Description || item.description || "",
        EstablishedDate: establishedDateValue ? new Date(establishedDateValue) : new Date(),
        MultiSpecialty: !!item.MultiSpecialty,
        // Assuming Specialties and Facilities are array fields in Wix Data
        Facilities: Array.isArray(item.Facilities) ? item.Facilities : (item.Facilities ? [item.Facilities] : []),
        Specialties: Array.isArray(item.Specialties) ? item.Specialties : (item.Specialties ? [item.Specialties] : []),
        GalleryUrls: Array.isArray(item.GalleryUrls) ? item.GalleryUrls : [],
        BranchesRef: Array.isArray(item.BranchesRef) ? item.BranchesRef : [],
    }
}

const fetchHospitalsFromCollection = async (): Promise<Hospital[]> => {
    try {
        // Wix Data query without explicit filters/sorting for simplicity
        const response = await wixClient.data.query(COLLECTION_ID)
            .limit(100) // Adjust limit as necessary
            .find()

        if (!response || !response.items) {
            console.error("Wix Data query returned no items or an invalid response.");
            return [];
        }
        
        // Map the raw Wix items to your application's Hospital interface
        return response.items.map(mapWixItemToHospital) as Hospital[]

    } catch (e) {
        console.error("Wix Data Fetch Error:", e);
        // Throw a specific error to be caught by the calling function
        throw new Error(`Failed to query Wix Data collection "${COLLECTION_ID}". Check wixClient setup and collection ID. Error: ${e instanceof Error ? e.message : String(e)}`);
    }
}

// --- HOSPITAL SKELETON COMPONENT (unchanged) ---
const HospitalSkeleton = ({ viewMode }: { viewMode: "grid" | "list" }) => {
    const CardSkeleton = () => (
        <Card
            className={`overflow-hidden border-gray-200 ${viewMode === "list" && "flex flex-col sm:flex-row"}`}
        >
            <div
                className={`relative overflow-hidden bg-gray-100 ${viewMode === "grid" ? "aspect-video" : "w-full sm:w-48 aspect-[16/9] flex-shrink-0"}`}
            >
                <Skeleton className="w-full h-full" />
            </div>
            <CardContent className={`${viewMode === "grid" ? "p-4 space-y-2" : "p-4 flex-1 space-y-2"}`}>
                <Skeleton className="h-5 w-3/4 rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-2/3 rounded" />
                <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-100 ">
                    <Skeleton className="h-3 w-1/4 rounded" />
                    <Skeleton className="h-3 w-1/5 rounded" />
                </div>
            </CardContent>
        </Card>
    )
    return (
        <div
            className={`${viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid grid-cols-1"} gap-6 animate-pulse`}
        >
            {Array.from({ length: 8 }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    )
}

// --- HOSPITAL CARD RENDERER (Updated for Image Handling) ---
const renderHospitalCard = (hospital: Hospital, viewMode: "grid" | "list") => {
    const primarySpecialty = hospital.Specialties[0]
    // Prioritize BannerUrl, fall back to the first gallery image.
    const imageUrl = hospital.BannerUrl || hospital.GalleryUrls[0]
    const hospitalLink = `/hospital/${hospital.Slug}`

    // Robust Date check for rendering
    const establishedYear = hospital.EstablishedDate instanceof Date && !isNaN(hospital.EstablishedDate.getTime())
        ? hospital.EstablishedDate.getFullYear() : 'Unknown';

    return (
        <Card
            className={`group cursor-pointer border-gray-100 bg-white hover:shadow-lg shadow-xs transition-all duration-300 overflow-hidden rounded-xs ${viewMode === "list" && "flex flex-col sm:flex-row"}`}
        >
            <a href={hospitalLink} className={`${viewMode === "list" && "flex w-full"}`}>
                <div
                    className={`relative overflow-hidden bg-gray-100 flex items-center justify-center ${viewMode === "grid" ? "aspect-video" : "w-full sm:w-48 aspect-[16/9] flex-shrink-0"}`}
                >
                    {/* *** IMAGE FIX: Using OptimizedImage with the fetched Wix Media URL ***
                        Ensure that your 'OptimizedImage' component correctly handles Wix Media URLs.
                        If the URL is a standard 'wix:image://v1/...' format, you might need to use 
                        the wix-media module to get a displayable URL first, or use a component 
                        specifically designed for it. For now, we pass the URL directly.
                    */}
                    <OptimizedImage
                        src={imageUrl} 
                        alt={hospital.Name + " Banner"}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        fallbackSrc="/placeholder.svg?height=338&width=600&text=Hospital Image"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Button
                            variant="secondary"
                            className="scale-0 cursor-pointer text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm text-lg font-medium group-hover:scale-100 transition-transform duration-300"
                        >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                        </Button>
                    </div>
                </div>

                <CardContent className={`${viewMode === "grid" ? "p-4 border-t border-gray-200" : "p-4 flex-1"}`}>
                    <div className="flex flex-col h-full">
                        <div className="flex-grow pt-2">
                            {hospital.Name && (
                                <h3 className="font-bold text-gray-800 text-xl line-clamp-2 mb-2 leading-snug">{hospital.Name}</h3>
                            )}
                            {hospital.Description && (
                                <p className="text-sm text-[#241d1f] line-clamp-2 leading-relaxed">
                                    {hospital.Description}
                                </p>
                            )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                            <Badge variant="secondary" className="text-xs font-normal capitalize">
                                <HeartPulse className="h-3 w-3 mr-1" />
                                {primarySpecialty || "General Medicine"}
                            </Badge>
                            <div className="flex items-center justify-between description">
                                <span className="flex items-center gap-1 text-sm text-gray-500">
                                    <Calendar className="h-4 w-4" />
                                    Est. {establishedYear}
                                </span>
                                <span className="flex items-center gap-1 text-sm font-medium text-blue-600">
                                    {hospital.BranchesRef.length || '1'} {hospital.BranchesRef.length === 1 ? 'Branch' : 'Branches'}
                                    <ChevronRight className="h-4 w-4" />
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </a>
        </Card>
    )
}


// --- MAIN HOSPITAL MASTER PAGE COMPONENT (unchanged logic) ---
export default function HospitalMasterPage() {
    const [allHospitals, setAllHospitals] = useState<Hospital[]>([])
    const [filteredHospitals, setFilteredHospitals] = useState<Hospital[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterSpecialty, setFilterSpecialty] = useState<string>("all")
    const [sortBy, setSortBy] = useState<string>("name")
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

    // Extract all unique specialties for the filter dropdown
    const allSpecialties = useMemo(() => {
        const specialties = new Set<string>()
        allHospitals.forEach(h => h.Specialties.forEach(s => specialties.add(s)))
        return Array.from(specialties).sort()
    }, [allHospitals])


    const fetchAllHospitalData = async () => {
        try {
            setLoading(true)
            setError(null)

            const hospitals = await fetchHospitalsFromCollection()

            setAllHospitals(hospitals)
            setFilteredHospitals(hospitals)

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load hospital network data: Unknown error.";
            console.error("Error fetching hospital data:", errorMessage, err);
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAllHospitalData()
    }, [])

    useEffect(() => {
        let filtered = [...allHospitals]

        // 1. Search Filtering
        if (searchTerm) {
            filtered = filtered.filter(
                (hospital) =>
                    hospital.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    hospital.Description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    hospital.Specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())),
            )
        }

        // 2. Specialty Filtering
        if (filterSpecialty !== "all") {
            filtered = filtered.filter((hospital) =>
                hospital.Specialties.some(s => s.toLowerCase() === filterSpecialty.toLowerCase())
            )
        }

        // 3. Sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "date":
                    // Safely compare dates, pushing invalid/null dates to the end
                    const dateA = a.EstablishedDate instanceof Date && !isNaN(a.EstablishedDate.getTime()) ? a.EstablishedDate.getTime() : 0;
                    const dateB = b.EstablishedDate instanceof Date && !isNaN(b.EstablishedDate.getTime()) ? b.EstablishedDate.getTime() : 0;
                    return dateB - dateA 
                case "name":
                    return a.Name.localeCompare(b.Name)
                case "specialty":
                    return (a.Specialties[0] || "").localeCompare(b.Specialties[0] || "")
                case "branches":
                    return b.BranchesRef.length - a.BranchesRef.length
                default:
                    return 0
            }
        })

        setFilteredHospitals(filtered)
    }, [allHospitals, searchTerm, filterSpecialty, sortBy])

    // --- LOADING / ERROR STATES ---
    if (loading) {
        return (
            <div>
                <Banner
                    topSpanText="India's Top Hospitals"
                    title="The Medivisor Network of Premier Healthcare Providers"
                    description="Explore our curated network of leading multi-specialty hospitals across India, known for clinical excellence, state-of-the-art technology, and patient-centric care."
                    buttonText="Contact Us for Treatment"
                    buttonLink="/contact"
                    bannerBgImage="bg-blogs.png"
                    mainImageSrc="/hospital-network-main.png"
                    mainImageAlt="Hospital Network Overview"
                />
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-8 space-y-2">
                        <Skeleton className="h-12 w-96 rounded-lg" />
                        <Skeleton className="h-6 w-3/4 rounded-lg" />
                    </div>
                    <div className="mb-6 flex flex-col sm:flex-row gap-4">
                        <Skeleton className="h-10 flex-1 rounded-lg" />
                        <Skeleton className="h-10 w-full sm:w-48 rounded-lg" />
                        <Skeleton className="h-10 w-full sm:w-48 rounded-lg" />
                    </div>
                    <HospitalSkeleton viewMode={viewMode} />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div>
                <Banner
                    topSpanText="India's Top Hospitals"
                    title="The Medivisor Network of Premier Healthcare Providers"
                    description="Explore our curated network of leading multi-specialty hospitals across India, known for clinical excellence, state-of-the-art technology, and patient-centric care."
                    buttonText="Contact Us for Treatment"
                    buttonLink="/contact"
                    bannerBgImage="bg-blogs.png"
                    mainImageSrc="/hospital-network-main.png"
                    mainImageAlt="Hospital Network Overview"
                />
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-2 tracking-tight">Our Hospital Network</h1>
                        <p className="text-lg text-muted-foreground">Discover the best healthcare facilities in India</p>
                    </div>
                    <Alert variant="destructive" className="max-w-2xl mx-auto">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="space-y-4">
                            <div>
                                <div className="font-semibold">Failed to load hospital data</div>
                                <div className="text-sm mt-1">{error}</div>
                            </div>
                            <Button onClick={fetchAllHospitalData} variant="outline" size="sm">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Try Again
                            </Button>
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        )
    }

    // --- MAIN RENDER ---
    return (
        <div>
            <Banner
                topSpanText="India's Top Hospitals"
                title="The Medivisor Network of Premier Healthcare Providers"
                description="Explore our curated network of leading multi-specialty hospitals across India, known for clinical excellence, state-of-the-art technology, and patient-centric care."
                buttonText="Contact Us for Treatment"
                buttonLink="/contact"
                bannerBgImage="bg-blogs.png"
                mainImageSrc="/hospital-network-main.png"
                mainImageAlt="Hospital Network Overview"
            />
            <section className="bg-gray-50 pb-10 py-6 md:px-0 px-2 min-h-screen">
                <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 py-3 sm:py-4 mb-6">
                    <div className="container mx-auto px-3 sm:px-4 md:px-6">
                        {/* Controls */}
                        <div className="flex flex-row lg:items-center lg:justify-between gap-4">

                            {/* Search */}
                            <div className="relative md:block hidden flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                                <Input
                                    placeholder="Search hospitals by name, description, or specialty..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 w-full rounded-md border-gray-200 bg-white focus-visible:ring-gray-300"
                                />
                            </div>

                            {/* Filters + Sort */}
                            <div className="flex flex-row gap-3 sm:gap-4 w-full lg:w-auto">
                                <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
                                    <SelectTrigger className="w-full sm:w-48 rounded-md border-gray-200 bg-white focus-visible:ring-gray-300">
                                        <Filter className="h-4 w-4 mr-2 text-gray-500" />
                                        <SelectValue placeholder="Filter by Specialty" />
                                    </SelectTrigger>
                                    <SelectContent
                                        className="bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-[300px] overflow-y-auto"
                                    >
                                        <SelectItem value="all">All Specialties ({allHospitals.length})</SelectItem>
                                        {allSpecialties.map(specialty => (
                                            <SelectItem key={specialty} value={specialty.toLowerCase()}>
                                                {specialty}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="w-full sm:w-48 rounded-md border-gray-200 bg-white focus-visible:ring-gray-300">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent
                                        className="bg-white border border-gray-200 rounded-md shadow-lg z-50"
                                    >
                                        <SelectItem value="name">Hospital Name (A-Z)</SelectItem>
                                        <SelectItem value="date">Established Date</SelectItem>
                                        <SelectItem value="specialty">Primary Specialty</SelectItem>
                                        <SelectItem value="branches">Number of Branches</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* View Mode Toggle */}
                            <div className="flex gap-3 justify-end lg:justify-start">
                                <Button
                                    variant={viewMode === "grid" ? "default" : "outline"}
                                    size="icon"
                                    className="rounded-md border-gray-300 border bg-white"
                                    onClick={() => setViewMode("grid")}
                                    aria-label="Grid view"
                                >
                                    <Grid3X3 className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === "list" ? "default" : "outline"}
                                    size="icon"
                                    className="rounded-md border-gray-300 bg-white"
                                    onClick={() => setViewMode("list")}
                                    aria-label="List view"
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 md:px-0">
                    {/* Content */}
                    {filteredHospitals.length > 0 ? (
                        <div
                            className={`${viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid grid-cols-1"} gap-6`}
                        >
                            {filteredHospitals.map((hospital) => (
                                <div key={hospital.ID} className="col-span-1">
                                    {renderHospitalCard(hospital, viewMode)}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <HospitalIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-2xl font-semibold mb-2">
                                {searchTerm || filterSpecialty !== "all" ? "No matching hospitals found" : "No hospitals available"}
                            </h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                {searchTerm || filterSpecialty !== "all"
                                    ? "Try adjusting your search or filter criteria (e.g., search for 'Cardiology' or clear your filters)"
                                    : "No hospital data is currently available in the system."}
                            </p>
                            {(searchTerm || filterSpecialty !== "all") && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSearchTerm("")
                                        setFilterSpecialty("all")
                                    }}
                                    className="mt-4"
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}