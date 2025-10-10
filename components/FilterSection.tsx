"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, MapPin, Star, Clock, DollarSign, X } from "lucide-react"

interface FilterSectionProps {
  onSearch: (term: string) => void
  onFilterChange: (filters: FilterState) => void
  searchTerm: string
}

export interface FilterState {
  specialty: string
  location: string
  rating: string
  experience: string
  consultationFee: string
  availability: string
}

const specialties = [
  "All Specialties",
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Radiology",
  "Surgery",
  "Oncology"
]

const locations = [
  "All Locations",
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Chennai",
  "Kolkata",
  "Hyderabad",
  "Pune",
  "Ahmedabad"
]

const ratingOptions = [
  "All Ratings",
  "4.5+ Stars",
  "4.0+ Stars",
  "3.5+ Stars"
]

const experienceOptions = [
  "All Experience",
  "10+ Years",
  "5+ Years",
  "2+ Years"
]

const feeOptions = [
  "All Fees",
  "Under ₹500",
  "₹500 - ₹1000",
  "₹1000 - ₹2000",
  "Above ₹2000"
]

const availabilityOptions = [
  "All Times",
  "Available Today",
  "Available Tomorrow",
  "Available This Week"
]

export default function FilterSection({ onSearch, onFilterChange, searchTerm }: FilterSectionProps) {
  const [filters, setFilters] = useState<FilterState>({
    specialty: "All Specialties",
    location: "All Locations",
    rating: "All Ratings",
    experience: "All Experience",
    consultationFee: "All Fees",
    availability: "All Times"
  })

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearAllFilters = () => {
    const clearedFilters: FilterState = {
      specialty: "All Specialties",
      location: "All Locations",
      rating: "All Ratings",
      experience: "All Experience",
      consultationFee: "All Fees",
      availability: "All Times"
    }
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
    onSearch("")
  }

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => !value.startsWith("All")).length
  }

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="container mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search doctors by name, specialty, or hospital..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-12 pr-4 py-4 bg-white border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-lg"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              variant="outline"
              className="rounded-xl px-6 py-3 border-gray-200 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {getActiveFiltersCount() > 0 && (
                <Badge className="ml-2 bg-blue-600 text-white rounded-full px-2 py-1 text-xs">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>

            {getActiveFiltersCount() > 0 && (
              <Button
                onClick={clearAllFilters}
                variant="ghost"
                className="text-gray-500 hover:text-[#241d1f] rounded-xl"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <Select value={filters.specialty} onValueChange={(value) => handleFilterChange("specialty", value)}>
            <SelectTrigger className="w-auto min-w-[180px] rounded-xl border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {specialties.map((specialty) => (
                <SelectItem key={specialty} value={specialty}>
                  {specialty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.location} onValueChange={(value) => handleFilterChange("location", value)}>
            <SelectTrigger className="w-auto min-w-[150px] rounded-xl border-gray-200">
              <MapPin className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.availability} onValueChange={(value) => handleFilterChange("availability", value)}>
            <SelectTrigger className="w-auto min-w-[160px] rounded-xl border-gray-200">
              <Clock className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availabilityOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="bg-gray-50 rounded-2xl p-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
            <h3 className="font-semibold text-gray-900 mb-4">Advanced Filters</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={filters.rating} onValueChange={(value) => handleFilterChange("rating", value)}>
                <SelectTrigger className="rounded-xl border-gray-200">
                  <Star className="h-4 w-4 mr-2 text-yellow-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ratingOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.experience} onValueChange={(value) => handleFilterChange("experience", value)}>
                <SelectTrigger className="rounded-xl border-gray-200">
                  <Clock className="h-4 w-4 mr-2 text-blue-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {experienceOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.consultationFee} onValueChange={(value) => handleFilterChange("consultationFee", value)}>
                <SelectTrigger className="rounded-xl border-gray-200">
                  <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {feeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}