"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Filter, Loader2, Search, Home, ChevronDownIcon, Calendar, Clock } from "lucide-react"
import type { FilterState } from '@/types/search'
import HospitalCard from './HospitalCard'
import DoctorCard from './DoctorCard'
import TreatmentCard from './TreatmentCard'
import { HospitalCardSkeleton, DoctorCardSkeleton, TreatmentCardSkeleton } from './Skeletons'

type SortingProps = {
  sortBy: FilterState['sortBy']
  setSortBy: (sortBy: FilterState['sortBy']) => void
}

export const Sorting = ({ sortBy, setSortBy }: SortingProps) => (
  <div className="flex items-center gap-3 w-full md:w-auto">
    <label className="text-sm text-gray-700 hidden sm:block font-normal">Sort by:</label>

    <div className="relative  md:w-auto w-full">
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as FilterState['sortBy'])}
        className="
        border border-gray-200 rounded-xs px-4 py-2 text-sm focus:ring-1 
        focus:ring-gray-100 focus:border-gray-300 bg-white shadow-xs 
        pr-8 cursor-pointer text-gray-700 md:w-auto w-full
        appearance-none "
      >
        <option value="all">All (A to Z)</option>
        <option value="popular">Popular</option>
        <option value="az">A to Z</option>
        <option value="za">Z to A</option>
      </select>

      <ChevronDownIcon
        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-470 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  </div>
)

type ResultsHeaderProps = {
  clearFilters: () => void
  sortBy: FilterState['sortBy']
  setSortBy: (sortBy: FilterState['sortBy']) => void
}

export const ResultsHeader = ({
  clearFilters,
  sortBy,
  setSortBy
}: ResultsHeaderProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center  gap-4 bg-gray-50 border-b border-gray-50 py-4 md:p-4">
    <div className="flex items-center gap-4">
      <Sorting sortBy={sortBy} setSortBy={setSortBy} />
      <button
        onClick={clearFilters}
        className="hidden md:inline-flex items-center gap-1 text-base text-gray-500 hover:text-gray-700 transition-colors font-medium"
      >
        Clear Filters
      </button>
    </div>
  </div>
)

type MobileFilterButtonProps = {
  setShowFilters: (show: boolean) => void
}

export const MobileFilterButton = ({ setShowFilters }: MobileFilterButtonProps) => (
  <button
    onClick={() => setShowFilters(true)}
    className="fixed bottom-6 right-6 md:hidden bg-gray-50 text-gray-600 p-4 rounded-xs shadow-lg hover:shadow-xl transition-shadow z-30 border border-gray-100"
  >
    <Filter className="w-5 h-5" />
  </button>
)

export const BreadcrumbNav = () => (
  <nav aria-label="Breadcrumb" className="container border-y border-gray-200 bg-gray-50 mx-auto px-4 sm:px-6 lg:px-8">
    <ol className="flex items-center px-2 md:px-0 space-x-1 py-2 text-base text-gray-500 font-normal">

      <li>
        <Link href="/" className="flex items-center hover:text-gray-700 transition-colors">
          <Home className="w-4 h-4 mr-1 text-gray-400" />
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

type RenderContentProps = {
  view: string
  loading: boolean
  isLoadingMore?: boolean
  currentCount: number
  filteredBranches: any[]
  filteredDoctors: any[]
  filteredTreatments: any[]
  clearFilters: () => void
}

export const RenderContent = ({
  view,
  loading,
  isLoadingMore = false,
  currentCount,
  filteredBranches,
  filteredDoctors,
  filteredTreatments,
  clearFilters
}: RenderContentProps) => {
  const [visibleCount, setVisibleCount] = useState(12);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const items = view === "hospitals" ? filteredBranches : view === "doctors" ? filteredDoctors : filteredTreatments;

  // Reset visible count when view or items change substantially
  useEffect(() => {
    setVisibleCount(12);
  }, [view, items.length]);

  // Infinite Scroll Logic
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting) {
        setVisibleCount((prev) => prev + 12);
      }
    }, { rootMargin: '100px' });

    const currentLoadMore = loadMoreRef.current;
    if (currentLoadMore) {
      observer.observe(currentLoadMore);
    }

    return () => {
      if (currentLoadMore) observer.unobserve(currentLoadMore);
    };
  }, [items]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) =>
          view === "hospitals" ? <HospitalCardSkeleton key={i} /> :
            view === "doctors" ? <DoctorCardSkeleton key={i} /> :
              <TreatmentCardSkeleton key={i} />
        )}
      </div>
    )
  }

  // Always show Coming Soon for doctors view (temporary)
  if (view === "doctors") {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-sm border border-gray-100 mx-4">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
            <Calendar className="w-12 h-12 text-gray-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        <h3 className="text-3xl font-bold text-gray-900 mb-3">Coming Soon</h3>
        <p className="text-gray-500 mb-2 text-lg text-center max-w-md">
          Doctor profiles will be available here very soon.
        </p>
        <p className="text-gray-400 text-sm mb-8 text-center">
          Stay tuned for updates
        </p>
        <Link 
          href="/"
          className="px-8 py-3 bg-gray-900 text-white text-base font-medium rounded-lg hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          Back to Home
        </Link>
      </div>
    )
  }

  if (currentCount === 0) {
    // Default empty state for other views
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xs shadow-md border border-gray-100">
        <Search className="w-12 h-12 text-gray-300 mb-4" />
        <h4 className="text-xl font-bold text-gray-900 mb-2">No {view === 'hospitals' ? 'Branches' : view} Found</h4>
        <p className="text-gray-500 mb-6 font-normal">Try adjusting your filters or search terms.</p>
        <button
          onClick={clearFilters}
          className="px-6 py-3 text-base font-medium bg-gray-50 text-gray-700 rounded-xs hover:bg-gray-100 transition-colors shadow-sm border border-gray-100"
        >
          Clear All Filters
        </button>
      </div>
    )
  }

  const visibleItems = items.slice(0, visibleCount);

  return (
    <>
      {/* <div className="mb-4 text-sm text-gray-600 flex items-center gap-2">
        Showing {visibleItems.length} of {items.length} {view === 'hospitals' ? 'branches' : view}
        {isLoadingMore && (
          <span className="inline-flex items-center gap-1 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading more...
          </span>
        )}
      </div> */}
      <div className="grid grid-cols-1 my-4 mb-10 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleItems.map((item) => (
          <div key={item.baseId || item._id} className="h-full">
            {view === "hospitals" ? (
              <HospitalCard branch={item as any} />
            ) : view === "doctors" ? (
              <DoctorCard doctor={item as any} />
            ) : (
              <TreatmentCard treatment={item as any} />
            )}
          </div>
        ))}
      </div>

      {/* Sentinel element for infinite scroll */}
      {visibleCount < items.length && (
        <div ref={loadMoreRef} className="flex justify-center p-4">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}
    </>
  )
}