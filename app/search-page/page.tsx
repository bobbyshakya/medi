// app/hospitals/search/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Building, Plus, Users, Star, Phone, Mail } from 'lucide-react'

interface Location {
  id: string
  name: string
  state?: {
    id: string
    name: string
  }
  country?: {
    id: string
    name: string
  }
}

interface Doctor {
  id: string
  name: string
  specialty: string
  designation: string
  phone: string
  email: string
}

interface Branch {
  id: string
  "Branch Name": string
  "primary Location": string
  "Slug": string
  "Address": string
  "Pin Code": string
  "Phone": string
  "Email": string
  "Branch Image (Image URL)": string
  "Map Embed (URL)": string
  location: Location
  doctors: Doctor[]
  doctorCount: number
}

interface Hospital {
  id: string
  "Name": string
  "Slug": string
  "Logo (Image URL)": string
  "Banner Image (Image URL)": string
  "Description": string
  "Established Date": string
  "Multi-Specialty": string[]
  branches: Branch[]
  branchesByCity: { [city: string]: Branch[] }
  branchCount: number
}

export default function HospitalSearchPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [cities, setCities] = useState<string[]>([])
  const [visibleBranches, setVisibleBranches] = useState<{ [hospitalId: string]: number }>({})

  // Fetch hospitals data
  useEffect(() => {
    fetchHospitals()
  }, [searchQuery, selectedCity])

  const fetchHospitals = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedCity) params.append('city', selectedCity)
      params.append('debug', 'true')

      const response = await fetch(`/api/hospitals?${params}`)
      const data = await response.json()
      
      if (data.data) {
        setHospitals(data.data)
        // Extract unique cities from all hospitals
        const allCities = new Set<string>()
        data.data.forEach((hospital: Hospital) => {
          Object.keys(hospital.branchesByCity || {}).forEach(city => {
            if (city && city !== 'Unknown City') allCities.add(city)
          })
        })
        setCities(Array.from(allCities).sort())
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleBranches = (hospitalId: string) => {
    setVisibleBranches(prev => ({
      ...prev,
      [hospitalId]: prev[hospitalId] ? 0 : 2 // Show 2 branches initially
    }))
  }

  const showMoreBranches = (hospitalId: string) => {
    setVisibleBranches(prev => ({
      ...prev,
      [hospitalId]: (prev[hospitalId] || 0) + 2
    }))
  }

  const getVisibleBranches = (hospital: Hospital) => {
    const visibleCount = visibleBranches[hospital.id] || 0
    const allBranches = hospital.branches || []
    return {
      visible: allBranches.slice(0, visibleCount || 2), // Show 2 by default
      hidden: allBranches.slice(visibleCount || 2),
      total: allBranches.length
    }
  }

  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{2})(\d{2})(\d{4})(\d{4})/, '+$1 $2 $3 $4')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Find Hospitals & Branches
            </h1>
            <p className="text-lg text-gray-600">
              Discover hospitals with their locations and services
            </p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search hospitals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* City Filter */}
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>

            {/* Results Count */}
            <div className="flex items-center justify-center md:justify-end">
              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                {loading ? 'Loading...' : `${hospitals.length} hospitals found`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          // Loading Skeleton
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-sm border p-6 animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : hospitals.length === 0 ? (
          // Empty State
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No hospitals found</h3>
            <p className="mt-2 text-gray-500">
              Try adjusting your search criteria or browse all hospitals.
            </p>
          </div>
        ) : (
          // Hospitals List
          <div className="space-y-6">
            {hospitals.map((hospital) => {
              const { visible, hidden, total } = getVisibleBranches(hospital)
              const isExpanded = visibleBranches[hospital.id] > 0

              return (
                <div key={hospital.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                  {/* Hospital Header */}
                  <div className="p-6 border-b">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        {hospital["Logo (Image URL)"] && (
                          <img
                            src={hospital["Logo (Image URL)"]}
                            alt={hospital["Name"]}
                            className="w-16 h-16 rounded-lg object-cover border"
                          />
                        )}
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            {hospital["Name"]}
                            {hospital["Established Date"] && (
                              <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                Est. {new Date(hospital["Established Date"]).getFullYear()}
                              </span>
                            )}
                          </h2>
                          <p className="text-gray-600 mt-1 line-clamp-2">
                            {hospital["Description"]}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{hospital.branchCount} branches</span>
                            </div>
                            {hospital["Multi-Specialty"]?.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4" />
                                <span>{hospital["Multi-Specialty"].length} specialties</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Toggle Button */}
                      <button
                        onClick={() => toggleBranches(hospital.id)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        {isExpanded ? 'Hide' : 'Show'} Branches
                        <Building className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Branches Section */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {visible.map((branch, index) => (
                        <div key={branch.id} className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-blue-500" />
                              {branch["Branch Name"]}
                            </h3>
                            <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              #{index + 1}
                            </span>
                          </div>

                          {/* Location Info */}
                          <div className="space-y-2 text-sm text-gray-600">
                            {branch.location && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Location:</span>
                                <span>
                                  {branch.location.name}
                                  {branch.location.state && `, ${branch.location.state.name}`}
                                  {branch.location.country && `, ${branch.location.country.name}`}
                                </span>
                              </div>
                            )}
                            
                            {branch["Address"] && (
                              <div className="flex items-start gap-2">
                                <span className="font-medium">Address:</span>
                                <span>{branch["Address"]}</span>
                              </div>
                            )}

                            {branch["Pin Code"] && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">PIN:</span>
                                <span>{branch["Pin Code"]}</span>
                              </div>
                            )}
                          </div>

                          {/* Contact Info */}
                          <div className="mt-4 pt-4 border-t space-y-2">
                            {branch["Phone"] && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-green-600" />
                                <a 
                                  href={`tel:${branch["Phone"]}`}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  {formatPhone(branch["Phone"])}
                                </a>
                              </div>
                            )}
                            
                            {branch["Email"] && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-blue-600" />
                                <a 
                                  href={`mailto:${branch["Email"]}`}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  {branch["Email"]}
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Doctors Count */}
                          {branch.doctorCount > 0 && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-purple-600">
                              <Users className="h-4 w-4" />
                              <span>{branch.doctorCount} doctors available</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Show More Button */}
                    {hidden.length > 0 && (
                      <div className="mt-6 text-center">
                        <button
                          onClick={() => showMoreBranches(hospital.id)}
                          className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          Show {hidden.length} More Branches
                        </button>
                      </div>
                    )}

                    {/* Total Branches Info */}
                    <div className="mt-4 text-center text-sm text-gray-500">
                      Showing {visible.length} of {total} branches
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}