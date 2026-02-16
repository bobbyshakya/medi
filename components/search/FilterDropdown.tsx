"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { X } from "lucide-react"
import type { FilterKey, FilterState, OptionType } from '@/types/search'

type FilterDropdownProps = {
  placeholder: string
  filterKey: FilterKey
  filters: FilterState
  updateSubFilter: (key: FilterKey, subKey: "id" | "query", value: string) => void
  options: OptionType[]
  mobile?: boolean
  className?: string
}

const FilterDropdown = React.memo(({ placeholder, filterKey, filters, updateSubFilter, options }: FilterDropdownProps) => {
  const [showOptions, setShowOptions] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const filter = filters[filterKey] as { id: string; query: string }

  const query = useMemo(() => {
    if (filter.id) {
      const opt = options.find(o => o.id === filter.id)
      if (opt) {
        return opt.name.replace(/^(City|State): /, '')
      }
      return filter.query || ""
    }
    return filter.query
  }, [filter.id, filter.query, options])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowOptions(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredOptions = useMemo(
    () => options.filter((opt) => opt.name.toLowerCase().includes(query.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name)),
    [options, query],
  )

  const handleQueryChange = (q: string) => {
    console.log(`[FilterDropdown] ${filterKey} query changed: "${q}"`)
    updateSubFilter(filterKey, "id", "")
    updateSubFilter(filterKey, "query", q)
  }

  const handleOptionSelect = (id: string, name: string) => {
    console.log(`[FilterDropdown] ${filterKey} selected:`, { id, name })
    if (filterKey === 'location') {
      if (id.startsWith('city:')) {
        const cityId = id.split(':')[1]
        updateSubFilter('city', 'id', cityId)
        updateSubFilter('city', 'query', '')
        updateSubFilter('location', 'id', id)
        updateSubFilter('location', 'query', '')
      } else if (id.startsWith('state:')) {
        const stateId = id.split(':')[1]
        updateSubFilter('state', 'id', stateId)
        updateSubFilter('state', 'query', '')
        updateSubFilter('location', 'id', id)
        updateSubFilter('location', 'query', '')
      }
    } else {
      updateSubFilter(filterKey, "id", id)
      updateSubFilter(filterKey, "query", "")
    }
    setShowOptions(false)
  }

  const handleClear = () => {
    console.log(`[FilterDropdown] ${filterKey} cleared`)
    if (filterKey === 'location') {
      updateSubFilter('city', 'id', '')
      updateSubFilter('city', 'query', '')
      updateSubFilter('state', 'id', '')
      updateSubFilter('state', 'query', '')
      updateSubFilter('location', 'id', '')
      updateSubFilter('location', 'query', '')
    } else {
      updateSubFilter(filterKey, "id", "")
      updateSubFilter(filterKey, "query", "")
    }
    setShowOptions(false)
  }

  const handleFocus = () => {
    if (filterKey === 'location') {
      if (filter.id) {
        updateSubFilter('city', 'id', '')
        updateSubFilter('city', 'query', '')
        updateSubFilter('state', 'id', '')
        updateSubFilter('state', 'query', '')
        updateSubFilter('location', 'id', '')
        updateSubFilter('location', 'query', '')
      }
    } else {
      if (filter.id) {
        updateSubFilter(filterKey, "id", "")
        updateSubFilter(filterKey, "query", "")
      }
    }
    setShowOptions(true)
  }

  return (
    <div className="relative mt-1" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={handleFocus}
          className={`w-full px-2 py-2 border rounded-xs text-base md:text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 bg-white shadow-xs pr-10
          ${(filter.id || filter.query)
              ? "border-gray-100 focus:ring-gray-100 focus:border-gray-200"
              : "border-gray-100 focus:ring-gray-50 focus:border-gray-200"
            }`}
        />
        {(filter.id || filter.query) && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {showOptions && filteredOptions.length > 0 && (
        <div className="absolute z-30 w-full bg-white border border-gray-200 rounded-xs shadow-lg mt-1 max-h-60 overflow-auto">
          {filteredOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleOptionSelect(opt.id, opt.name)}
              className={`w-full px-2 py-1 pt-3 text-left text-sm border-b border-gray-100 text-gray-700 hover:bg-gray-50 transition-colors
              ${filter.id === opt.id ? "bg-gray-50 text-gray-900 font-semibold" : "font-normal"}`}
            >
              {opt.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
})
FilterDropdown.displayName = 'FilterDropdown'

export default FilterDropdown