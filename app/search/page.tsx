"use client"

/**
 * Hospitals Search Page
 *
 * This page provides a comprehensive search interface for hospitals,
 * allowing users to filter by location, view type, and other criteria.
 * It displays filtered results for branches, doctors, and treatments.
 */

import React, { Suspense } from "react"
import { Loader2 } from "lucide-react"
import Banner from "@/components/HospitalBanner"
import FilterDropdown from "@/components/search/FilterDropdown"
import FilterSidebar from "@/components/search/FilterSidebar"
import ViewToggle from "@/components/search/ViewToggle"
import { ResultsHeader, MobileFilterButton, BreadcrumbNav, RenderContent } from "@/components/search/LayoutComponents"
import { useCMSData } from "@/hooks/useCMSData"
import type { FilterState, BranchType, DoctorType, ExtendedTreatmentType } from '@/types/search'

/**
 * Main content component for the hospitals search page.
 * Handles all the UI logic and state management for filtering and displaying results.
 */
function HospitalsPageContent() {
  // Destructure all necessary data and functions from the custom hook
  const {
    loading,
    isLoadingMore,
    filters,
    updateFilter,
    updateSubFilter,
    clearFilters,
    availableOptions,
    filteredBranches,
    filteredDoctors,
    filteredTreatments,
    currentCount,
    getFilterValueDisplay,
  } = useCMSData()

  // Type assertions for filtered data
  const branches: BranchType[] = filteredBranches as BranchType[]
  const doctors: DoctorType[] = filteredDoctors as DoctorType[]
  const treatments: ExtendedTreatmentType[] = filteredTreatments as ExtendedTreatmentType[]

  // State for controlling mobile filter sidebar visibility
  const [showFilters, setShowFilters] = React.useState(false)

  // Handler for changing view type (clears filters when switching views)
  const setView = (v: FilterState["view"]) => {
    clearFilters()
    updateFilter("view", v)
  }

  // Handler for changing sort order
  const setSortBy = (s: FilterState["sortBy"]) => updateFilter("sortBy", s)

  return (
    <div className="bg-gray-25 min-h-screen">
      {/* Hero banner section with call-to-action */}
      <Banner
        bannerBgImage="/banner/search-banner.png"
        bannerBgImageMobile="/banner/search-banner-mobile.png"
        topSpanText="Premium Healthcare Services"
        title="Access Specialist Care Right From Your Home."
        description={`
          <p>Our virtual clinic offers <strong>24/7 access</strong> to board-certified physicians.</p>
          <p>Book a consultation in minutes and get the care you need.</p>
        `}
        ctas={[
          {
            text: 'Book an Appointment',
            link: '/booking',
            isPrimary: true,
          },
          {
            text: 'Call Us',
            link: 'tel:1234567890',
            isPrimary: false,
          },
        ]}
      />

      {/* Breadcrumb navigation */}
      <BreadcrumbNav />

      {/* Main content section with filters and results */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Sidebar with filter options */}
          <FilterSidebar
            filters={filters}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            clearFilters={clearFilters}
            updateSubFilter={updateSubFilter}
            availableOptions={availableOptions}
            getFilterValueDisplay={getFilterValueDisplay}
            filteredBranches={branches}
            filteredDoctors={doctors}
            filteredTreatments={treatments}
          />

          {/* Main content area */}
          <main className="flex-1 min-w-0 lg:pb-0 min-h-screen">
            {/* Top bar with view toggle, location filter, and results header */}
            <div className="md:flex justify-between items-center bg-gray-50">
              <div className="flex flex-col lg:flex-row lg:items-center ml-4 gap-4">
                <ViewToggle view={filters.view} setView={setView} />
                <FilterDropdown
                  placeholder="Search by City or State"
                  filterKey="location"
                  filters={filters}
                  updateSubFilter={updateSubFilter}
                  options={availableOptions.location}
                />
              </div>
              <ResultsHeader
                clearFilters={clearFilters}
                sortBy={filters.sortBy}
                setSortBy={setSortBy}
              />
            </div>

            {/* Results content area */}
            <RenderContent
              view={filters.view}
              loading={loading}
              isLoadingMore={isLoadingMore}
              currentCount={currentCount}
              filteredBranches={branches}
              filteredDoctors={doctors}
              filteredTreatments={treatments}
              clearFilters={clearFilters}
            />
          </main>
        </div>
      </section>

      {/* Mobile filter button (only shown when filters are hidden) */}
      {!showFilters && <MobileFilterButton setShowFilters={setShowFilters} />}
    </div>
  )
}

/**
 * Default export for the hospitals search page.
 * Wraps the content in Suspense for loading states.
 */
export default function HospitalsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-25">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <HospitalsPageContent />
    </Suspense>
  )
}
