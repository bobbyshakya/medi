import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Stethoscope, MessageCircleMore, ExternalLink } from "lucide-react"
import ScrollableTitle from "@/components/ScrollableTitle"

export interface Doctor {
  _id: string
  slug?: string
  name: string
  title?: string
  profilePicture?: string
  specialty?: string
  specializations: string[]
  hospitals: string[]
  working_hospital?: string
  yearsOfExperience?: number
  rating: number
  languages: string[]
  description?: string
  whatsapp?: string
}

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  const [isHovered, setIsHovered] = useState(false)
  const displayedSpecs = doctor.specializations.slice(0, 3)
  const hasMore = doctor.specializations.length > 3

  return (
    <Card
      className="group relative bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center">
            {doctor.profilePicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={doctor.profilePicture || "/placeholder.svg"}
                alt={doctor.name}
                width={64}
                height={64}
                className="object-cover w-full h-full"
                crossOrigin="anonymous"
              />
            ) : (
              <Stethoscope size={28} className="text-gray-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900"><ScrollableTitle text={doctor.name} isHovered={isHovered} /></CardTitle>
            <p className="text-sm text-gray-500 mt-1">{doctor.title || doctor.specialty}</p>
          </div>

          {doctor.rating > 0 && (
            <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-full border border-yellow-100">
              <Star size={14} className="text-yellow-500 fill-current" />
              <span className="ml-1 text-sm font-medium text-yellow-700">{doctor.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="mt-4 text-sm text-[#241d1f] line-clamp-2 leading-relaxed">
          {doctor.description || "Experienced and patient-centered physician."}
        </p>

        {/* Specializations */}
        {displayedSpecs.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-2">
              <Stethoscope size={16} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-900">Specializations</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {displayedSpecs.map((s, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs bg-gray-100 text-[#241d1f] border border-gray-200"
                >
                  {s}
                </Badge>
              ))}
              {hasMore && (
                <Badge variant="outline" className="text-xs border-gray-300 text-gray-500">
                  +{doctor.specializations.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Hospitals */}
        {doctor.hospitals?.length > 0 && (
          <div className="mt-5">
            <div className="text-xs text-gray-500 mb-2">Hospitals</div>
            <div className="flex flex-wrap gap-2">
              {doctor.hospitals.slice(0, 3).map((h, i) => (
                <Badge key={i} variant="outline" className="text-xs border-gray-300 text-[#241d1f]">
                  {h}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {doctor.slug ? (
            <Link href={`/doctors/${doctor.slug}`} passHref>
              <Button
                variant="outline"
                className="w-full border-gray-300 text-[#241d1f] hover:bg-gray-50 transition"
              >
                Profile <ExternalLink size={14} className="ml-2" />
              </Button>
            </Link>
          ) : (
            <div />
          )}

          {doctor.whatsapp ? (
            <a
              href={`https://wa.me/${doctor.whatsapp.replace(/[^\d]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white transition">
                WhatsApp <MessageCircleMore size={14} className="ml-2" />
              </Button>
            </a>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
