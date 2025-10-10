"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, MapPin, Star, Clock, Phone, Calendar, Stethoscope, Bed, Building2, Plus, CheckCircle, Heart, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RelatedCarousel } from "@/components/related-carousel"
import { db } from "@/lib/facilities-data"
import { GiHospital } from "react-icons/gi";
import { FaParking, FaWifi, FaCoffee, FaShieldAlt, FaHeartbeat, FaUsers, FaAward } from "react-icons/fa";

interface HospitalDetailProps {
  hospital: any
}

export function HospitalDetail({ hospital }: HospitalDetailProps) {
  const [selectedBranch, setSelectedBranch] = useState(0)

  // Get hospital branches
  const hospitalBranches = db.branches.filter((branch) => branch.hospitalId === hospital.id)

  // Get doctors affiliated with this hospital
  const hospitalDoctors = db.doctors.filter((doctor) =>
    doctor.affiliations.some((branchId) => hospitalBranches.some((branch) => branch.id === branchId))
  )

  // Get treatments available at this hospital
  const hospitalTreatments = db.treatments.filter((treatment) =>
    treatment.branches_available.some((branchId) => hospitalBranches.some((branch) => branch.id === branchId))
  )

  const totalDoctors = hospitalDoctors.length
  const totalBranches = hospitalBranches.length
  const totalTreatments = hospitalTreatments.length
  const averageRating = hospitalDoctors.reduce((sum, doctor) => sum + doctor.rating, 0) / hospitalDoctors.length || 0
  const totalExperience = hospitalDoctors.reduce((sum, doctor) => sum + doctor.experienceYears, 0)
  const uniqueSpecialties = Array.from(new Set(hospitalDoctors.flatMap((doctor) => doctor.specialties))).length

  // Calculate total beds and total doctors from all branches
  const totalBeds = hospitalBranches.reduce((sum, branch) => sum + (branch.bedCount || 0), 0)
  const totalBranchDoctors = hospitalBranches.reduce((sum, branch) => sum + (branch.totalDoctors || 0), 0)

  // Get similar hospitals (same departments)
  const similarHospitals = db.hospitals
    .filter((h) => h.id !== hospital.id && h.departments.some((dept) => hospital.departments.includes(dept)))
    .slice(0, 6)

  const relatedDoctors = hospitalDoctors.map((doctor) => ({
    id: doctor.id,
    name: doctor.name,
    type: "doctor" as const,
    rating: doctor.rating,
    reviewCount: doctor.reviewCount,
    location: hospitalBranches.find((branch) => doctor.affiliations.includes(branch.id))?.city,
    department: doctor.title,
    specialties: doctor.specialties,
    description: doctor.about,
  }))

  const relatedTreatments = hospitalTreatments.map((treatment) => ({
    id: treatment.id,
    name: treatment.name,
    type: "treatment" as const,
    department: treatment.department,
    price: treatment.starting_price,
    location: hospitalBranches.find((branch) => treatment.branches_available.includes(branch.id))?.city,
    description: treatment.description,
  }))

  const relatedHospitals = similarHospitals.map((h) => ({
    id: h.id,
    name: h.name,
    type: "hospital" as const,
    rating: h.rating,
    reviewCount: h.reviewCount,
    location: db.branches.find((branch) => branch.hospitalId === h.id)?.city,
    department: h.tagline,
    specialties: h.departments,
    description: h.description,
  }))

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? "fill-gray-900 text-gray-900" : "text-gray-300"}`}
      />
    ))
  }

  const createSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const facilityIcons: { [key: string]: any } = {
    Parking: FaParking,
    WiFi: FaWifi,
    Cafeteria: FaCoffee,
    Emergency: FaShieldAlt,
    ICU: FaHeartbeat,
    OPD: FaUsers,
    Pharmacy: FaAward,
  }

  const departmentIcons: { [key: string]: any } = {
    Cardiology: FaHeartbeat,
    Neurology: GiHospital,
    Pediatrics: FaUsers,
    Orthopedics: Bed,
    Oncology: Shield,
    // Add more departments and their respective icons here
  };

  return (
    <>
      {/* Hospital Header */}
      <div
        className="relative rounded-lg mb-10 py-10 shadow-md border border-gray-200 overflow-hidden"
        style={{
          backgroundImage: `url(/hospital-logo/max-super-specialit.webp)`, // ✅ Dynamically set background
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark Overlay for Contrast */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Content Wrapper */}
      <div className="container mx-auto">
          <div className="relative ">
          {/* Back Button */}
          <div className="mb-4">
            <Link href="/">
              <Button
                variant="ghost"
                className="gap-2 bg-gray-100 text-[#241d1f] hover:bg-gray-200 rounded-xs px-4 py-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
          </div>

          <div className="flex grid grid-cols-12 gap-6">
            {/* Main Content */}
            <div className="flex-1 bg-white/60 col-span-8 backdrop-blur-md rounded-xs p-6 shadow-xs flex flex-col">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gray-100 rounded-xs">
                  <GiHospital className="w-8 h-8 text-[#241d1f]" />
                </div>
                <div>
                  <h1 className="title-heading">{hospital.name}</h1>
                  <p className="description text-gray-100">{hospital.tagline}</p>
                </div>
              </div>

              {/* Rating & Badges */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex items-center gap-1">
                  {renderStars(hospital.rating)}
                  <span className="text-title">
                    {hospital.rating}
                  </span>
                  <span className="text-gray-800">
                    ({hospital.reviewCount} reviews)
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="description mb-4">{hospital.description}</p>

              {/* Hospital Type */}
              <div className="py-1 mb-4 title-heading">
                {hospital.type}
              </div>

              {/* Departments with new design */}
              <div className="flex flex-wrap gap-2 mb-3">
                {hospital.departments.slice(0, 5).map((dept: string) => {
                  const IconComponent = departmentIcons[dept] || Stethoscope;
                  return (
                    <div key={dept} className="flex items-center gap-2 px-3 py-1 rounded-xs bg-gray-50/60 hover:bg-gray-100 transition">
                      {/* <IconComponent className="w-4 h-4 text-[#241d1f]" /> */}
                      <span className="text-[#241d1f] font-medium">
                        {dept}
                      </span>
                    </div>
                  );
                })}
                {hospital.departments.length > 5 && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-xs bg-gray-50/60 hover:bg-gray-100 transition">
                    <Plus className="w-4 h-4 text-[#241d1f]" />
                    <span className="text-[#241d1f] font-medium">
                      {hospital.departments.length - 5} Specialty
                    </span>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mt-auto">
                {[
                  { value: hospital.establishedYear, label: "Year Established" },
                  { value: totalBranches, label: "Branches" },
                  { value: totalBeds, label: "Total Beds" },
                  { value: totalBranchDoctors, label: "Total Doctors" },
                  { value: averageRating.toFixed(1), label: "Avg Rating" },

                ].map((item, i) => (
                  <Card
                    key={i}
                    className="text-center border-none shadow-xs rounded-xs bg-gray-50/50 hover:shadow-md transition"
                  >
                    <CardContent className="p-3">
                      <div className="title-text">
                        {item.value}
                      </div>
                      <div className=" description-1 ">{item.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>


      <div className="container mx-auto px-2 md:px-0 py-8">
        {/* Back Button */}




        

        <div className="space-y-8 mb-8 bg-white">
          {relatedDoctors.length > 0 && <RelatedCarousel title="Our Doctors" items={relatedDoctors} type="doctor" />}

          {relatedTreatments.length > 0 && (
            <RelatedCarousel title="Available Treatments" items={relatedTreatments} type="treatment" />
          )}

          {relatedHospitals.length > 0 && (
            <RelatedCarousel title="Similar Hospitals" items={relatedHospitals} type="hospital" />
          )}
        </div>

        {/* Main Content */}
        
      </div>
    </>
  )
}