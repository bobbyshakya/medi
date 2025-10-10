"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface TreatmentItem {
  _id: string
  slug: string
  name: string
  description?: string
  image?: string
  category?: string
  duration?: string
  successRate?: number
  costRangeMin?: number
  costRangeMax?: number
  mode?: string
}

export default function TreatmentCard({ treatment }: { treatment: TreatmentItem }) {
  const imageSrc = typeof treatment.image === "string" ? treatment.image : undefined

  return (
    <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Image */}
      {imageSrc && (
        <div className="w-full h-44 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc || "/placeholder.svg"}
            alt={treatment.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            crossOrigin="anonymous"
          />
        </div>
      )}

      {/* Header */}
      <CardHeader className="px-5 pt-5 pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 truncate">{treatment.name}</CardTitle>
        {treatment.category && <p className="text-sm text-gray-500 mt-1">{treatment.category}</p>}
      </CardHeader>

      {/* Content */}
      <CardContent className="px-5 pb-5 space-y-3">
        {treatment.description && (
          <p className="text-sm text-[#241d1f] leading-relaxed line-clamp-2">
            {treatment.description}
          </p>
        )}

        {/* Details Badges */}
        <div className="flex flex-wrap gap-2 text-xs">
          {treatment.duration && (
            <span className="px-2 py-1 rounded-full bg-gray-50 border border-gray-200 text-[#241d1f]">
              Duration: {treatment.duration}
            </span>
          )}
          {typeof treatment.successRate === "number" && treatment.successRate > 0 && (
            <span className="px-2 py-1 rounded-full bg-green-50 border border-green-200 text-green-700">
              Success: {treatment.successRate}%
            </span>
          )}
          {(treatment.costRangeMin || treatment.costRangeMax) && (
            <span className="px-2 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
              Cost: ₹{treatment.costRangeMin || 0}
              {treatment.costRangeMax ? ` - ₹${treatment.costRangeMax}` : ""}
            </span>
          )}
          {treatment.mode && (
            <span className="px-2 py-1 rounded-full bg-gray-50 border border-gray-200 text-[#241d1f] capitalize">
              Mode: {treatment.mode}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
