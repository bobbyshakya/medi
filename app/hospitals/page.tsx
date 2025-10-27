"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import Banner from "@/components/BannerService"
import {
  Search,
  Filter,
  Loader2,
  Hospital,
  Building2,
  Award,
  MapPin,
  Heart,
  Stethoscope,
  Cross,
  ChevronRight,
  ChevronLeft,
  Home,
  X,
  ChevronDown,
} from "lucide-react"

const getWixImageUrl = (richContent: any): string | null => {
  if (!richContent?.nodes) return null

  const findImageNode = (nodes: any[]): any => {
    for (const node of nodes) {
      if (node.type === "IMAGE") {
        return node
      }
      if (node.nodes?.length > 0) {
        const found = findImageNode(node.nodes)
        if (found) return found
      }
    }
    return null
  }

  const imageNode = findImageNode(richContent.nodes)
  if (
    imageNode?.imageData?.image?.src?.id
  ) {
    const id = imageNode.imageData.image.src.id
    return `https://static.wixstatic.com/media/${id}`
  }
  return null
}

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

interface HospitalType {
  _id: string
  name: string
  slug: string | null
  image: any | null
  logo: any | null
  yearEstablished: string | null
  accreditation: string | null
  beds: string | null
  emergencyServices: boolean | null
  description: string | null
  website: string | null
  email: string | null
  contactNumber: string | null
  branches: Array<{
    _id: string
    name: string
    address: string | null
    city: Array<{
      _id: string
      name: string
      state: string | null
      country: string | null
    }>
    contactNumber: string | null
    email: string | null
    totalBeds: string | null
    icuBeds: string | null
    emergencyContact: string | null
    branchImage: any | null
    doctors: Array<any>
    treatments: Array<any>
  }>
  doctors: Array<{
    _id: string
    name: string
    specialization: string | null
    qualification: string | null
    experience: string | null
    designation: string | null
    languagesSpoken: string | null
    about: string | null
    profileImage: any | null
  }>
  treatments: Array<{
    _id: string
    name: string
    description: string | null
    category: string | null
    duration: string | null
    cost: string | null
  }>
}

// Sub-component: Breadcrumb Navigation
const BreadcrumbNav = () => (
  <nav aria-label="Breadcrumb" className="container border-t border-gray-300 bg-white mx-auto px-4 sm:px-6 lg:px-8 ">
    <ol className="flex items-center space-x-1 py-3 text-sm text-gray-500">
      <li>
        <Link href="/" className="flex items-center hover:text-gray-700 transition-colors">
          <Home className="w-4 h-4 mr-1" />
          Home
        </Link>
      </li>
      <li>
        <span className="mx-1">/</span>
      </li>
      <li className="text-gray-900 font-medium">Hospitals</li>
    </ol>
  </nav>
)

// Sub-component: Hospital Card Skeleton
const HospitalCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden animate-pulse">
    {/* Image Skeleton */}
    <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 relative">
      <div className="absolute top-3 right-3 bg-gray-300 rounded w-20 h-6" />
    </div>

    {/* Content Skeleton */}
    <div className="p-4 space-y-4">
      {/* Title */}
      <div className="h-6 bg-gray-200 rounded w-3/4" />

      {/* Treatments Section Skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded w-20" />
          <div className="h-6 bg-gray-200 rounded w-16" />
        </div>
      </div>

      {/* Branches Section Skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded w-24" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 gap-2 pt-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded p-3 h-16" />
        ))}
      </div>
    </div>
  </div>
)

// Sub-component: Hospital Card
interface HospitalCardProps {
  hospital: HospitalType
}

const HospitalCard = ({ hospital }: HospitalCardProps) => {
  const slug = hospital.slug || generateSlug(hospital.name)
  const imageUrl = getWixImageUrl(hospital.image) || getWixImageUrl(hospital.logo)
  const displayTreatments = hospital.treatments?.slice(0, 2) || []
  const remainingTreatments = hospital.treatments?.length - 2 || 0

  // Get unique branch names with their cities
  const branchData = useMemo(() => {
    const branches = hospital.branches?.map(branch => ({
      name: branch.name,
      cities: branch.city?.map(c => c.name).filter(Boolean) || []
    })) || []

    return branches
  }, [hospital.branches])

  const displayBranches = branchData.slice(0, 2)
  const remainingBranches = branchData.length - 2

  return (
    <Link href={`/hospitals/${slug}`} className="block">
      <article className="group bg-white rounded-xs shadow-xs hover:shadow-xs transition-all duration-300 border border-gray-50 overflow-hidden cursor-pointer h-full flex flex-col">
        {/* Image Section */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Badges Overlay */}
          <div className="absolute top-2 left-2 right-3 z-10 flex justify-end flex-wrap gap-2">
            {hospital.accreditation && (
              <span className="inline-flex items-center gap-1 text-sm bg-gray-50 text-gray-700 px-3 py-1 rounded-xs shadow-xs">
                <Award className="w-4 h-4" />
                {hospital.accreditation}
              </span>
            )}
          </div>

          {imageUrl ? (
            <img
              src={imageUrl}
              alt={hospital.name}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Hospital className="w-16 h-16 text-gray-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
        </div>

        {/* Content Section */}
        <div className="p-2 flex-1 flex flex-col">
          {/* Hospital Name */}
          <header className="mb-2">
            <h2 className="text-lg font-semibold line-clamp-2 group-hover:text-gray-900 transition-colors">
              {hospital.name}
            </h2>
          </header>

          {/* Treatments Section */}
          {displayTreatments.length > 0 && (
            <section className="mb-2">
              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-900 uppercase">Treatments</p>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {displayTreatments.map((treatment) => (
                  <span
                    key={treatment._id}
                    className="inline-flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded border border-gray-100 text-sm"
                  >
                    <Cross className="w-3 h-3" />
                    {treatment.name}
                  </span>
                ))}
                {remainingTreatments > 0 && (
                  <span className="inline-flex items-center text-xs text-gray-700">
                    +{remainingTreatments} more
                  </span>
                )}
              </div>
            </section>
          )}

          {/* Branches Section */}
          {branchData.length > 0 && (
            <section className="mb-4">
              {/* Heading */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-900 uppercase">Branches</p>
              </div>

              {/* City List */}
              <div className="space-y-0 items-center flex gap-x-2 mt-2">
                {displayBranches.map((branch, index) => (
                  <div key={index} className="flex items-start gap-2">
                    {/* <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" /> */}
                    <div className="flex-1 min-w-0">
                      {branch.cities.length > 0 && (
                        <p className="inline-flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded border border-gray-100 text-sm">
                          {branch.cities.slice(0, 2).join(", ")}
                          {branch.cities.length > 2 && (
                            <span className="text-gray-500 font-medium">
                              +{branch.cities.length - 2} more
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Show remaining branches count */}
                {remainingBranches > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-700 pt-0">
                  
                       <span className="inline-flex items-center text-xs text-gray-700">+{remainingBranches} more </span>
                  </div>
                )}
              </div>
            </section>
          )}


          {/* Stats Grid */}
          <footer className="border-t border-gray-100 pt-3 mt-auto">
            <div className="grid grid-cols-2 gap-2">
              {hospital.beds && (
                <div className="text-center rounded bg-gray-50 p-3 border border-gray-100">
                  <p className="text-sm font-bold text-gray-900">{hospital.beds}</p>
                  <p className="text-xs text-gray-900 uppercase font-medium">Total Beds</p>
                </div>
              )}
              {hospital.yearEstablished && (
                <div className="text-center rounded bg-gray-50 p-3 border border-gray-100">
                  <p className="text-sm font-bold text-gray-900">{hospital.yearEstablished}</p>
                  <p className="text-xs text-gray-900 uppercase font-medium">Established</p>
                </div>
              )}
              {hospital.accreditation && (
                <div className="text-center rounded bg-gray-50 p-3 border border-gray-100">
                  <p className="text-sm font-bold text-gray-900">{hospital.accreditation}</p>
                  <p className="text-xs text-gray-900 uppercase font-medium">Accreditation</p>
                </div>
              )}
              {hospital.branches?.length > 0 && (
                <div className="text-center rounded bg-gray-50 p-3 border border-gray-100">
                  <p className="text-sm font-bold text-gray-900">{hospital.branches.length}</p>
                  <p className="text-xs text-gray-900 uppercase font-medium">Branches</p>
                </div>
              )}
            </div>
          </footer>
        </div>
      </article>
    </Link>
  )
}

// Sub-component: Search Dropdown
interface SearchDropdownProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  options: { id: string; name: string }[]
  selectedOption: string
  onOptionSelect: (id: string) => void
  onClear: () => void
  type: "hospital" | "city" | "treatment"
}

const SearchDropdown = ({
  value,
  onChange,
  placeholder,
  options,
  selectedOption,
  onOptionSelect,
  onClear,
  type,
}: SearchDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(value.toLowerCase())
  )

  const selectedOptionName = options.find(opt => opt.id === selectedOption)?.name

  const getIcon = () => {
    switch (type) {
      case "hospital":
        return <Hospital className="w-4 h-4 text-gray-500" />
      case "city":
        return <MapPin className="w-4 h-4 text-gray-500" />
      case "treatment":
        return <Stethoscope className="w-4 h-4 text-gray-500" />
      default:
        return <Search className="w-4 h-4 text-gray-500" />
    }
  }

  const getPlaceholder = () => {
    switch (type) {
      case "hospital":
        return "Search hospitals..."
      case "city":
        return "Search cities..."
      case "treatment":
        return "Search treatments..."
      default:
        return placeholder
    }
  }

  return (
    <div className="relative space-y-2">
      <label className="block text-sm font-medium text-gray-800 flex items-center gap-2">
        {getIcon()}
        {type === "hospital" ? "Hospital" : type === "city" ? "City" : "Treatment"}
      </label>

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {getIcon()}
        </div>
        <input
          type="text"
          placeholder={getPlaceholder()}
          value={selectedOptionName || value}
          onChange={(e) => {
            onChange(e.target.value)
            if (selectedOption) onOptionSelect("")
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg w-full text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400"
        />

        {(value || selectedOption) && (
          <button
            onClick={() => {
              onChange("")
              onOptionSelect("")
              onClear()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (value || filteredOptions.length > 0) && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 z-20 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onOptionSelect(option.id)
                    onChange("")
                    setIsOpen(false)
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                >
                  {getIcon()}
                  <div className="font-medium text-gray-900">{option.name}</div>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No {type === "hospital" ? "hospitals" : type === "city" ? "cities" : "treatments"} found
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// Sub-component: Filter Sidebar
interface FilterSidebarProps {
  search: string
  setSearch: (value: string) => void
  cityQuery: string
  setCityQuery: (value: string) => void
  treatmentQuery: string
  setTreatmentQuery: (value: string) => void
  selectedHospitalId: string
  setSelectedHospitalId: (value: string) => void
  selectedCityId: string
  setSelectedCityId: (value: string) => void
  selectedTreatmentId: string
  setSelectedTreatmentId: (value: string) => void
  hospitals: { id: string; name: string }[]
  cities: { id: string; name: string }[]
  treatments: { id: string; name: string }[]
  showFilters: boolean
  setShowFilters: (value: boolean) => void
  clearFilters: () => void
}

const FilterSidebar = ({
  search,
  setSearch,
  cityQuery,
  setCityQuery,
  treatmentQuery,
  setTreatmentQuery,
  selectedHospitalId,
  setSelectedHospitalId,
  selectedCityId,
  setSelectedCityId,
  selectedTreatmentId,
  setSelectedTreatmentId,
  hospitals,
  cities,
  treatments,
  showFilters,
  setShowFilters,
  clearFilters,
}: FilterSidebarProps) => (
  <aside
    className={`fixed lg:static inset-y-0 left-0 z-20 w-full lg:w-80 bg-white border border-gray-50 rounded-xs shadow-xs transform transition-transform duration-300 ease-in-out ${showFilters ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } overflow-y-auto lg:sticky lg:top-6 max-h-[calc(100vh-2rem)]`}
  >
    {/* Header */}
    <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-gray-100 bg-white sticky top-0 z-10">
      <h2 className="title-text flex items-center gap-2">
        <Filter className="w-5 h-5 text-gray-700" />
        Search & Filters
      </h2>
      <button
        onClick={() => setShowFilters(false)}
        className="lg:hidden text-gray-500 hover:text-gray-700 transition-colors"
        aria-label="Close filters"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
    </div>

    {/* Filter Content */}
    <div className="p-5 space-y-6">
      {/* Hospital Search */}
      <SearchDropdown
        value={search}
        onChange={setSearch}
        placeholder="Search hospitals..."
        options={hospitals}
        selectedOption={selectedHospitalId}
        onOptionSelect={setSelectedHospitalId}
        onClear={() => {
          setSearch("")
          setSelectedHospitalId("")
        }}
        type="hospital"
      />

      {/* City Filter */}
      <SearchDropdown
        value={cityQuery}
        onChange={setCityQuery}
        placeholder="Search cities..."
        options={cities}
        selectedOption={selectedCityId}
        onOptionSelect={setSelectedCityId}
        onClear={() => {
          setCityQuery("")
          setSelectedCityId("")
        }}
        type="city"
      />

      {/* Treatment Filter */}
      <SearchDropdown
        value={treatmentQuery}
        onChange={setTreatmentQuery}
        placeholder="Search treatments..."
        options={treatments}
        selectedOption={selectedTreatmentId}
        onOptionSelect={setSelectedTreatmentId}
        onClear={() => {
          setTreatmentQuery("")
          setSelectedTreatmentId("")
        }}
        type="treatment"
      />

      {/* Clear Filters Button */}
      <button
        onClick={clearFilters}
        className="w-full py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-colors text-sm font-medium flex items-center justify-center gap-2"
      >
        <X className="w-4 h-4" />
        Clear All Filters
      </button>
    </div>
  </aside>
)

// Sub-component: Mobile Filter Toggle
interface MobileFilterToggleProps {
  showFilters: boolean
  setShowFilters: (value: boolean) => void
  resultsCount: number
}

const MobileFilterToggle = ({ setShowFilters, resultsCount }: MobileFilterToggleProps) => (
  <div className="lg:hidden mb-4">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm text-gray-600">
        Showing <span className="font-semibold text-gray-900">{resultsCount}</span> hospitals
      </p>
      <button
        onClick={() => setShowFilters(true)}
        className="py-2.5 px-4 bg-white border border-gray-300 rounded-lg flex items-center justify-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Filter className="w-4 h-4" />
        Search & Filters
      </button>
    </div>
  </div>
)

// Sub-component: Results Header
interface ResultsHeaderProps {
  hospitals: HospitalType[]
  clearFilters: () => void
}

const ResultsHeader = ({ hospitals, clearFilters }: ResultsHeaderProps) => (
  <>
    {!hospitals.length ? null : (
      <div className="hidden lg:flex items-center justify-between mb-4">
        <p className="title-text mt-4">
          Found <span className="text-gray-800">{hospitals.length}</span> hospitals
        </p>
        <button
          onClick={clearFilters}
          className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400"
        >
          <X className="w-4 h-4" />
          Clear all filters
        </button>
      </div>
    )}
  </>
)

// Sub-component: No Results
const NoResults = () => (
  <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 bg-white rounded-lg border border-gray-200 p-8">
    <Hospital className="w-16 h-16 text-gray-400" />
    <h3 className="text-lg font-semibold text-gray-900">No hospitals found</h3>
    <p className="text-sm text-gray-600 max-w-md">
      Try adjusting your search criteria or filters to find what you're looking for.
    </p>
  </div>
)

// Sub-component: Loading Skeletons
const LoadingSkeletons = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, index) => (
      <HospitalCardSkeleton key={index} />
    ))}
  </div>
)

// Main Component
export default function HospitalDirectory() {
  const [hospitals, setHospitals] = useState<HospitalType[]>([])
  const [search, setSearch] = useState("")
  const [hospitalsList, setHospitalsList] = useState<{ id: string; name: string }[]>([])
  const [cities, setCities] = useState<{ id: string; name: string }[]>([])
  const [treatments, setTreatments] = useState<{ id: string; name: string }[]>([])
  const [cityQuery, setCityQuery] = useState("")
  const [treatmentQuery, setTreatmentQuery] = useState("")
  const [selectedHospitalId, setSelectedHospitalId] = useState("")
  const [selectedCityId, setSelectedCityId] = useState("")
  const [selectedTreatmentId, setSelectedTreatmentId] = useState("")
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  // Memoized filter parameters
  const filterParams = useMemo(() => {
    const params = new URLSearchParams()

    if (selectedHospitalId) {
      params.append("hospitalId", selectedHospitalId)
    } else if (search) {
      params.append("q", search)
    }
    if (selectedCityId) {
      params.append("cityId", selectedCityId)
    } else if (cityQuery) {
      params.append("city", cityQuery)
    }
    if (selectedTreatmentId) {
      params.append("treatmentId", selectedTreatmentId)
    } else if (treatmentQuery) {
      params.append("treatment", treatmentQuery)
    }

    // Add cache buster for fresh data
    params.append("_t", Date.now().toString())

    return params
  }, [search, selectedHospitalId, cityQuery, selectedCityId, treatmentQuery, selectedTreatmentId])

  // Fetch hospitals with debounced callback
  const fetchHospitals = useCallback(async () => {
    setLoading(true)
    try {
      console.log("[HospitalDirectory] Fetching hospitals with params:", filterParams.toString())

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const res = await fetch(`/api/hospitals?${filterParams.toString()}`, {
        signal: controller.signal,
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      clearTimeout(timeoutId)

      if (!res.ok) throw new Error(`Failed to fetch hospitals: ${res.status}`)
      const data = await res.json()

      console.log("[HospitalDirectory] Fetched hospitals count:", data.items?.length || 0)
      setHospitals(data.items || [])
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("[HospitalDirectory] Error fetching hospitals:", err)
        setHospitals([])
      }
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }, [filterParams])

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const res = await fetch("/api/hospitals?pageSize=200&_t=" + Date.now(), {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!res.ok) throw new Error("Failed to fetch filter options")
      const data = await res.json()

      const hospitalMap: Record<string, string> = {}
      const cityMap: Record<string, string> = {}
      const treatmentMap: Record<string, string> = {}

      data.items?.forEach((hospital: any) => {
        if (hospital?._id && hospital?.name) {
          hospitalMap[hospital._id] = hospital.name
        }

        hospital.branches?.forEach((branch: any) => {
          branch.city?.forEach((city: any) => {
            if (city?._id && city?.name) cityMap[city._id] = city.name
          })
          branch.treatments?.forEach((t: any) => {
            if (t?._id && t?.name) treatmentMap[t._id] = t.name
          })
        })
      })

      setHospitalsList(Object.entries(hospitalMap).map(([id, name]) => ({ id, name })))
      setCities(Object.entries(cityMap).map(([id, name]) => ({ id, name })))
      setTreatments(Object.entries(treatmentMap).map(([id, name]) => ({ id, name })))
    } catch (e) {
      console.error("[HospitalDirectory] Error fetching filter options:", (e as Error).message)
    }
  }, [])

  // Debounced fetch on filter changes
  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      fetchHospitals()
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [fetchHospitals])

  // Fetch filter options on mount
  useEffect(() => {
    fetchFilterOptions()
  }, [fetchFilterOptions])

  const clearFilters = () => {
    setSearch("")
    setCityQuery("")
    setTreatmentQuery("")
    setSelectedHospitalId("")
    setSelectedCityId("")
    setSelectedTreatmentId("")
  }

  const renderContent = () => {
    if (initialLoad || loading) return <LoadingSkeletons />
    if (hospitals.length === 0) return <NoResults />
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {hospitals.map((hospital) => (
          <HospitalCard key={hospital._id} hospital={hospital} />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Banner */}
      <Banner
        topSpanText="Find the Right Hospital"
        title="Search, Compare, and Discover Trusted Hospitals Across India"
        description="Explore Medivisor India's verified hospital directory — search by city, specialty, or accreditation to find the best medical care for your needs. View hospital profiles, facilities, and branch networks with accurate, up-to-date details to make confident healthcare choices."
        buttonText="Start Your Hospital Search"
        buttonLink="/hospital-network/#hospital-search"
        bannerBgImage="bg-hospital-search.png"
        mainImageSrc="/about-main.png"
        mainImageAlt="Medivisor India Hospital Search – Discover Top Hospitals Across India"
      />

      {/* Breadcrumb Navigation */}
      <BreadcrumbNav />

      {/* Main Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6 py-10">
          {/* Mobile Search Overlay */}
          {showFilters && (
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowFilters(false)}
            />
          )}

          {/* Sidebar Filters */}
          <FilterSidebar
            search={search}
            setSearch={setSearch}
            cityQuery={cityQuery}
            setCityQuery={setCityQuery}
            treatmentQuery={treatmentQuery}
            setTreatmentQuery={setTreatmentQuery}
            selectedHospitalId={selectedHospitalId}
            setSelectedHospitalId={setSelectedHospitalId}
            selectedCityId={selectedCityId}
            setSelectedCityId={setSelectedCityId}
            selectedTreatmentId={selectedTreatmentId}
            setSelectedTreatmentId={setSelectedTreatmentId}
            hospitals={hospitalsList}
            cities={cities}
            treatments={treatments}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            clearFilters={clearFilters}
          />

          {/* Main Content */}
          <main className="flex-1">
            <MobileFilterToggle
              setShowFilters={setShowFilters}
              resultsCount={hospitals.length}
            />
            <ResultsHeader hospitals={hospitals} clearFilters={clearFilters} />
            {renderContent()}
          </main>
        </div>
      </section>
    </div>
  )
}