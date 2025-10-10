"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { HospitalWithBranchPreview } from "@/types/hospital"
import Banner from "@/components/BannerService"
import { Search, Filter, Loader2, Hospital, Building2, Calendar, Bed, Award, Phone, Mail, Globe, MapPin, Users, Heart } from "lucide-react"

const getHospitalImage = (richContent: any): string | null => {
  if (!richContent || !richContent.nodes) return null;
  const imageNode = richContent.nodes.find((node: any) => node.type === 'IMAGE');
  if (imageNode && imageNode.imageData && imageNode.imageData.image && imageNode.imageData.image.src && imageNode.imageData.image.src.id) {
    const id = imageNode.imageData.image.src.id;
    return `https://static.wixstatic.com/media/${id}`;
  }
  return null;
};

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export default function HospitalDirectory() {
  const [hospitals, setHospitals] = useState<HospitalWithBranchPreview[]>([])
  const [cities, setCities] = useState<{ id: string; name: string }[]>([])
  const [states, setStates] = useState<{ id: string; name: string }[]>([])
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([])
  const [search, setSearch] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [selectedState, setSelectedState] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("")
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  /** ─────────────── Fetch Data ─────────────── **/
  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/hospitals")
      const data = await res.json()
      const cityMap: Record<string, string> = {}
      const stateMap: Record<string, string> = {}
      const countryMap: Record<string, string> = {}
      data.items.forEach((h: HospitalWithBranchPreview) => {
        if (h.city) cityMap[h.city] = h.city
        // if (h.state) stateMap[h.state] = h.state
        // if (h.country) countryMap[h.country] = h.country
      })
      setCities(Object.entries(cityMap).map(([id, name]) => ({ id, name })))
      setStates(Object.entries(stateMap).map(([id, name]) => ({ id, name })))
      setCountries(Object.entries(countryMap).map(([id, name]) => ({ id, name })))
    } catch (err) {
      console.error("Error fetching locations:", err)
    }
  }

  const fetchHospitals = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append("q", search)
      if (selectedCity) params.append("city", selectedCity)
      if (selectedState) params.append("state", selectedState)
      if (selectedCountry) params.append("country", selectedCountry)
      const res = await fetch(`/api/hospitals?${params.toString()}`)
      const data = await res.json()
      setHospitals(data.items || [])
    } catch (err) {
      console.error("Error fetching hospitals:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLocations()
    fetchHospitals()
  }, [])

  useEffect(() => {
    fetchHospitals()
  }, [search, selectedCity, selectedState, selectedCountry])

  /** ─────────────── UI Layout ─────────────── **/
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
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


      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-1">
          {/* Mobile Search Overlay */}
          {showFilters && (
            <div className="md:hidden  fixed inset-0 bg-black/50 z-40" onClick={() => setShowFilters(false)} />
          )}

          {/* Sidebar Filters */}
          <aside
            className={`fixed mt-5 md:static inset-y-0 left-0 z-50 w-full md:w-80 bg-white backdrop-blur-md border-r border-gray-200 shadow-sm transform transition-transform duration-300 ease-in-out ${showFilters ? "translate-x-0" : "-translate-x-full md:translate-x-0"
              } overflow-y-auto`}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-[#241d1f]" />
                  Advanced Filters
                </h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-500 hover:text-[#241d1f] transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="p-6 space-y-8">
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search hospitals..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-3 border border-gray-200 rounded-lg w-full text-sm focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white shadow-sm transition-all"
                />
              </div>

              {/* Country Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  Country
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white shadow-sm transition-all appearance-none bg-no-repeat bg-right pr-10"
                >
                  <option value="">All Countries</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* State Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  State
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white shadow-sm transition-all appearance-none bg-no-repeat bg-right pr-10"
                >
                  <option value="">All States</option>
                  {states.map((state) => (
                    <option key={state.id} value={state.id}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* City Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  City
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white shadow-sm transition-all appearance-none bg-no-repeat bg-right pr-10"
                >
                  <option value="">All Cities</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
            {/* Results Info */}
            {!loading && hospitals.length > 0 && (
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-[#241d1f]">
                  Showing <span className="font-semibold">{hospitals.length}</span> hospitals
                </p>
                <button className="text-[#241d1f] hover:text-gray-800 text-sm font-medium transition-colors">
                  Clear all filters
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="animate-spin w-8 h-8 text-gray-500" />
                <span className="text-[#241d1f] text-base font-medium">Loading healthcare providers...</span>
              </div>
            ) : hospitals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                <Hospital className="w-16 h-16 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900">No hospitals found</h3>
                <p className="text-sm text-[#241d1f]">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hospitals.map((hospital) => {
                  const hospitalImage = getHospitalImage(hospital.image);
                  const slug = generateSlug(hospital.name);
                  return (
                    <Link
                      key={hospital._id}
                      href={`/hospitals/${slug}`}
                      className="block"
                    >
                      <article
                        className="group bg-white rounded-xs shadow-xs hover:shadow-sm transition-all duration-500 border border-gray-200/50 overflow-hidden relative cursor-pointer"
                      >
                        {/* Badge Overlay */}
                        {hospital.emergencyServices && (
                          <div className="absolute top-2 right-2 z-10">
                            <span className="inline-flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-xs text-xs font-bold text-gray-800 shadow-lg">
                              <Heart className="w-3 h-3 fill-current" />
                              24/7 Emergency
                            </span>
                          </div>
                        )}

                        {/* Image / Logo Section */}
                        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                          {hospitalImage ? (
                            <img
                              src={hospitalImage}
                              alt={hospital.name}
                              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : hospital.logo ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <img
                                src={hospital.logo}
                                alt={hospital.name}
                                className="object-contain h-24 w-24 bg-white rounded-full p-2 shadow-md"
                              />
                            </div>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Hospital className="w-16 h-16 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent group-hover:opacity-0 transition-opacity" />
                        </div>

                        {/* Content Body */}
                        <div className="px-4 py-4 space-y-2">
                          <header>
                            <h2 className="title-text mb-0 line-clamp-2 group-hover:text-[#241d1f] transition-colors">
                              {hospital.name}
                            </h2>
                            {hospital.description && (
                              <p className="description-1 my-2">
                                {hospital.description}
                              </p>
                            )}
                            {hospital.city && (
                              <p className="text-sm text-[#241d1f] flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {hospital.city}, {hospital.state}
                              </p>
                            )}
                          </header>

                          {/* Modern Stats Grid */}
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {hospital.branchesCount && (
                              <div className="flex items-center gap-3 p-2 rounded-xs bg-gray-50/50 border border-gray-100 shadow-xs hover:shadow-sm transition-all duration-300 text-center">
                                {/* <div className="p-2 rounded-xl bg-gray-50">
                                  <Building2 className="w-5 h-5 text-gray-500" />
                                </div> */}
                                <div className="w-full">

                                  <p className="heading-xs text-gray-800">
                                    {hospital.branchesCount}
                                  </p>
                                  <p className="text-[12px] uppercase  text-[#241d1f] font-medium">
                                    Branches
                                  </p>
                                </div>
                              </div>
                            )}

                            {hospital.yearEstablished && (
                              <div className="flex items-center gap-3 p-2 rounded-xs bg-gray-50/50 border border-gray-100 shadow-xs hover:shadow-sm transition-all duration-300 text-center">
                                {/* <div className="p-2 rounded-xl bg-gray-50">
                                  <Calendar className="w-5 h-5 text-gray-500" />
                                </div> */}
                                <div className="w-full">

                                  <p className="heading-xs text-gray-800">
                                    {hospital.yearEstablished}
                                  </p>
                                  <p className="text-[12px] uppercase  text-[#241d1f] font-medium">
                                    Established
                                  </p>
                                </div>
                              </div>
                            )}

                            {hospital.beds && (
                              <div className="flex items-center gap-3 p-2 rounded-xs bg-gray-50/50 border border-gray-100 shadow-xs hover:shadow-sm transition-all duration-300 text-center">
                                {/* <div className="p-2 rounded-xl bg-gray-50">
                                  <Bed className="w-5 h-5 text-gray-500" />
                                </div> */}
                                <div className="w-full">

                                  <p className="heading-xs text-gray-800">
                                    {hospital.beds || hospital.noOfBeds}
                                  </p>
                                  <p className="text-[12px] uppercase  text-[#241d1f] font-medium">
                                    Beds
                                  </p>
                                </div>
                              </div>
                            )}

                            {hospital.accreditation && (
                              <div className="flex items-center gap-3 p-2 rounded-xs bg-gray-50/50 border border-gray-100 shadow-xs hover:shadow-sm transition-all duration-300 text-center">
                                {/* <div className="p-2 rounded-xl bg-gray-50">
                                  <Award className="w-5 h-5 text-gray-500" />
                                </div> */}
                                <div className="w-full">

                                  <p className="heading-xs text-gray-800">
                                    {hospital.accreditation}
                                  </p>
                                  <p className="text-[12px] uppercase  text-[#241d1f] font-medium">
                                    Accreditation
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Description */}


                          {/* Contact Footer */}


                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </section>
    </div>
  )
}