// components/HospitalSearch.tsx
import { Hospital } from '@/types/hospital'
import HospitalCard from './HospitalCard'

interface HospitalSearchProps {
  hospitals: Hospital[]
  searchQuery: string
  totalHospitals: number
}

export default function HospitalSearch({ 
  hospitals, 
  searchQuery, 
  totalHospitals 
}: HospitalSearchProps) {
  if (hospitals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🏥</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {searchQuery ? 'No hospitals found' : 'No hospitals available'}
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          {searchQuery 
            ? `No hospitals match your search for "${searchQuery}". Try adjusting your search criteria.`
            : 'There are no hospitals in the database at the moment.'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Showing {hospitals.length} of {totalHospitals} hospitals
          </h2>
          {searchQuery && (
            <p className="text-sm text-[#241d1f] mt-1">
              Results for "{searchQuery}"
            </p>
          )}
        </div>
      </div>

      {/* Hospital Grid */}
      <div className="grid grid-cols-1 gap-6">
        {hospitals.map((hospital) => (
          <HospitalCard key={hospital._id} hospital={hospital} />
        ))}
      </div>
    </div>
  )
}