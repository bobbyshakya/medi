"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, MapPin, Calendar, Award, Users, Clock, Phone, Video, MessageCircle } from "lucide-react"
import Image from "next/image"

interface Expert {
  id: string
  name: string
  specialty: string
  experience: number
  rating: number
  reviewCount: number
  location: string
  image: string
  languages: string[]
  consultationFee: number
  availableSlots: string[]
  verified: boolean
  education: string
  hospital: string
}

interface ExpertCardProps {
  expert: Expert
  onBookConsultation: (expertId: string) => void
  onViewProfile: (expertId: string) => void
}

export default function ExpertCard({ expert, onBookConsultation, onViewProfile }: ExpertCardProps) {
  return (
    <Card className="group bg-white hover:shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden border-0 shadow-lg hover:-translate-y-2">
      <CardContent className="p-0">
        {/* Header with Image */}
        <div className="relative h-48 bg-gradient-to-br from-blue-50 to-teal-50">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-teal-600/10" />
          
          {/* Profile Image */}
          <div className="absolute bottom-4 left-6">
            <div className="relative">
              <Image
                src={expert.image}
                alt={expert.name}
                width={80}
                height={80}
                className="rounded-2xl border-4 border-white shadow-lg object-cover"
              />
              {expert.verified && (
                <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                  <Award className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Rating Badge */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
            <span className="font-semibold text-gray-900">{expert.rating}</span>
            <span className="text-[#241d1f] text-sm">({expert.reviewCount})</span>
          </div>

          {/* Consultation Fee */}
          <div className="absolute bottom-4 right-6 bg-blue-600 text-white rounded-xl px-3 py-2">
            <div className="text-sm font-medium">₹{expert.consultationFee}</div>
            <div className="text-xs opacity-90">per session</div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Name and Specialty */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{expert.name}</h3>
            <p className="text-blue-600 font-medium">{expert.specialty}</p>
            <p className="text-[#241d1f] text-sm">{expert.education}</p>
          </div>

          {/* Hospital and Location */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#241d1f]">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{expert.hospital}, {expert.location}</span>
            </div>
            <div className="flex items-center gap-2 text-[#241d1f]">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{expert.experience} years experience</span>
            </div>
          </div>

          {/* Languages */}
          <div className="flex flex-wrap gap-2">
            {expert.languages.map((language) => (
              <Badge key={language} variant="secondary" className="text-xs bg-gray-100 text-[#241d1f]">
                {language}
              </Badge>
            ))}
          </div>

          {/* Available Slots */}
          <div>
            <p className="text-sm font-medium text-gray-900 mb-2">Available Today:</p>
            <div className="flex gap-2 flex-wrap">
              {expert.availableSlots.slice(0, 3).map((slot) => (
                <Badge key={slot} className="bg-green-100 text-green-700 hover:bg-green-200">
                  {slot}
                </Badge>
              ))}
              {expert.availableSlots.length > 3 && (
                <Badge variant="outline" className="text-[#241d1f]">
                  +{expert.availableSlots.length - 3} more
                </Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => onBookConsultation(expert.id)}
              className="flex-1 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white rounded-xl font-medium"
            >
              <Video className="h-4 w-4 mr-2" />
              Book Video Call
            </Button>
            <Button
              onClick={() => onViewProfile(expert.id)}
              variant="outline"
              className="px-4 rounded-xl border-gray-200 hover:bg-gray-50"
            >
              <Users className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="px-4 rounded-xl border-gray-200 hover:bg-gray-50"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}