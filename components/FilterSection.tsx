// components/FilterSidebar.tsx
'use client';

import React from 'react';

interface FilterSidebarProps {
  filters: any;
  setFilters: (filters: any) => void;
  onClose?: () => void;
}

export default function FilterSidebar({ filters, setFilters, onClose }: FilterSidebarProps) {
  const handleChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 h-fit">
      <h3 className="text-lg font-semibold mb-4">Filter Hospitals</h3>

      <div className="space-y-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            placeholder="Hospital name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Specialty */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
          <select
            value={filters.specialty}
            onChange={(e) => handleChange('specialty', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Specialties</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Pediatrics">Pediatrics</option>
            <option value="Orthopedics">Orthopedics</option>
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <input
            type="text"
            value={filters.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="City or state..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Minimum Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Rating: {filters.rating}★
          </label>
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={filters.rating}
            onChange={(e) => handleChange('rating', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <button
          onClick={() => setFilters({ specialty: '', location: '', rating: 0, search: '' })}
          className="w-full py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}