"use client"

import { useState } from "react"
import Image from "next/image"
import { MapPin, Phone, Globe, Users, Building2, Award, Stethoscope, Heart, Bone, Baby } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Partners from "@/components/Partners"
import Banner from "@/components/BannerService"
import ContactModal from '@/components/ContactModal';
import WhyChooseUsSection from "@/components/StatsSection"
import CtaSection from "@/components/CtaSection"

// Types
interface Hospital {
  id: string
  name: string
  logo: string
  image: string
  location: string
  phone: string
  website: string
  beds: number
  established: number
  specialties: string[]
  description: string
  achievements: string[]
  category: "multi-specialty" | "cardiac" | "cancer" | "orthopedic" | "pediatric"
}

interface SpecialtyCategory {
  id: string
  name: string
  icon: any
  color: string
}

interface PartnershipBenefit {
  icon: any
  title: string
  description: string
}

// Data
const HOSPITALS: Hospital[] = [
  {
    id: "apollo",
    name: "Apollo Hospitals",
    logo: "/hospital-logo/apollo.svg",
    image: "/hospital-logo/apollo-hospital.webp",
    location: "Multiple Locations across India",
    phone: "+91-1860-500-1066",
    website: "apollohospitals.com",
    beds: 10000,
    established: 1983,
    specialties: ["Cardiology", "Oncology", "Neurology", "Orthopedics", "Transplants"],
    description:
      "Apollo Hospitals is a leading healthcare provider in India, operating over 70 hospitals across 13 countries, offering advanced medical treatments and patient-focused care with top medical teams.",
    achievements: [
      "First hospital in India to perform heart transplant",
      "JCI Accredited",
      "NABH Certified"
    ],
    category: "multi-specialty",
  },
  {
    id: "fortis",
    name: "Fortis Healthcare",
    logo: "/hospital-logo/fortis.png",
    image: "/hospital-logo/Fortis.jpg",
    location: "Pan India Network",
    phone: "+91-92-1234-5678",
    website: "fortishealthcare.com",
    beds: 4500,
    established: 2001,
    specialties: ["Cardiac Sciences", "Neurosciences", "Oncology", "Renal Sciences", "Orthopedics"],
    description:
      "Fortis Healthcare is a leading hospital network in India, with 36 hospitals nationwide, providing high-quality medical services, advanced treatments, and patient-centered care across all specialties.",
    achievements: [
      "NABH Accredited",
      "Green OT Certified",
      "ISO 9001:2015 Certified"
    ],
    category: "multi-specialty",
  },
  {
    id: "max",
    name: "Max Healthcare",
    logo: "/hospital-logo/max-hospital.svg",
    image: "/hospital-logo/max-super-specialit.webp",
    location: "North & West India",
    phone: "+91-92-6666-6666",
    website: "maxhealthcare.in",
    beds: 3500,
    established: 2000,
    specialties: ["Oncology", "Neurosciences", "Cardiac Sciences", "Orthopedics", "Gastroenterology"],
    description:
      "Max Healthcare operates 17 hospitals across North and West India, providing world-class medical services, advanced technologies, and patient-centered care with a team of expert healthcare professionals.",
    achievements: [
      "JCI Accredited",
      "NABL Certified Labs",
      "NABH Accredited"
    ],
    category: "multi-specialty",
  },
  {
    id: "medanta",
    name: "Medanta - The Medicity",
    logo: "/hospital-logo/medanta.svg",
    image: "/hospital-logo/medanta.jpg",
    location: "Gurugram, Delhi NCR",
    phone: "+91-124-414-1414",
    website: "medanta.org",
    beds: 1600,
    established: 2009,
    specialties: ["Cardiac Sciences", "Neurosciences", "Oncology", "Digestive & Hepatobiliary Sciences", "Orthopedics"],
    description:
      "Medanta is a multi-specialty hospital in Gurugram with 1600 beds, offering advanced medical care, cutting-edge technology, and patient-focused treatments across a wide range of specialties.",
    achievements: [
      "JCI Accredited",
      "NABH Certified",
      "NABL Accredited Labs"
    ],
    category: "multi-specialty",
  },
  {
    id: "manipal",
    name: "Manipal Hospitals",
    logo: "/hospital-logo/manipal-hospitals.webp",
    image: "/hospital-logo/manipal.jpeg",
    location: "Pan India Network",
    phone: "+91-80-2502-4444",
    website: "manipalhospitals.com",
    beds: 6000,
    established: 1953,
    specialties: ["Cardiology", "Neurology", "Oncology", "Orthopedics", "Gastroenterology"],
    description:
      "Manipal Hospitals is a leading healthcare provider in India, operating 28 hospitals across 15 cities, offering expert medical care, advanced treatments, and patient-focused services across all specialties.",
    achievements: [
      "NABH Accredited",
      "JCI Accredited Units",
      "NABL Certified"
    ],
    category: "multi-specialty",
  },
  {
    id: "artemis",
    name: "Artemis Hospital",
    logo: "/hospital-logo/artemis-logo1.png",
    image: "/hospital-logo/artemis.jpeg",
    location: "Gurugram, Delhi NCR",
    phone: "+91-124-451-1111",
    website: "artemishospitals.com",
    beds: 600,
    established: 2007,
    specialties: ["Cardiac Sciences", "Neurosciences", "Oncology", "Orthopedics", "Gastroenterology"],
    description:
      "Artemis Hospital is a modern multi-specialty hospital in Gurugram with 600 beds, providing advanced medical care, innovative treatments, and patient-centered services across multiple specialties.",
    achievements: [
      "JCI Accredited",
      "NABH Certified",
      "NABL Accredited"
    ],
    category: "multi-specialty",
  },
];


// Custom Hooks
const useHospitalFilter = (hospitals: Hospital[], searchTerm: string, selectedCategory: string) => {
  return hospitals.filter((hospital) => {
    const matchesSearch =
      hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.specialties.some((specialty) => specialty.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = selectedCategory === "all" || hospital.category === selectedCategory

    return matchesSearch && matchesCategory
  })
}

// Components
const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="text-center mb-12">
    <h2 className="text-4xl font-bold text-gray-900 mb-4  ">
      {title}
    </h2>
    <p className="text-xl text-[#241d1f] max-w-3xl mx-auto leading-relaxed">{subtitle}</p>
  </div>
)

const SpecialtyCard = ({
  category,
  isSelected,
  onClick,
}: {
  category: SpecialtyCategory
  isSelected: boolean
  onClick: () => void
}) => {
  const IconComponent = category.icon

  return (
    <Card
      className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${isSelected ? "ring-2 ring-blue-500 shadow-xl scale-105" : "hover:shadow-lg"
        }`}
      onClick={onClick}
    >
      <CardContent className="p-6 text-center">
        <div
          className={`w-16 h-16 ${category.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}
        >
          <IconComponent className="h-8 w-8 text-white" />
        </div>
        <h3 className="font-semibold text-gray-900 text-sm">{category.name}</h3>
      </CardContent>
    </Card>
  )
}

const HospitalCard = ({ hospital, openModal }: { hospital: Hospital, openModal: () => void }) => (
  <Card className="overflow-hidden hover:shadow-sm shadow-none transition-all duration-500 group border border-gray-200">
    <div className="relative h-60 overflow-hidden">
      <Image
        src={hospital.image || "/placeholder.svg"}
        alt={hospital.name}
        fill
        className="object-cover group-hover:scale-110 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
    </div>

    <CardHeader className="pb-4 px-3 md:px-4">
      <div className="flex items-center space-x-3 mb-2">
        <CardTitle className="title-text">{hospital.name}</CardTitle>
      </div>
      <CardDescription className="flex description-1 items-center text-[#241d1f]">
        <MapPin className="h-4 w-4 mr-1 text-[#E22026]" />
        {hospital.location}
      </CardDescription>
    </CardHeader>

    <CardContent className="pt-0 x-3 md:px-4">
      <p className="description">{hospital.description}</p>
      <Button onClick={openModal} className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-xs mt-4 md:text-base text-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer border bg-background w-auto hover:text-accent-foreground h-10 px-4 py-2 border-gray-200 text-[#241d1f] hover:bg-gray-50  mb-3">
      Enquire Now
    </Button>
    </CardContent>
    
  </Card>
)

const BenefitCard = ({ benefit, index }: { benefit: PartnershipBenefit; index: number }) => {
  const IconComponent = benefit.icon

  return (
    <Card className="text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg">
      <CardContent className="p-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <IconComponent className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold mb-3 text-gray-900">{benefit.title}</h3>
        <p className="text-[#241d1f] leading-relaxed">{benefit.description}</p>
      </CardContent>
    </Card>
  )
}

// Main Component
export default function MediviosHospitalPartners() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  // 👇️ State for controlling the modal's open/close status
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 👇️ Functions to open and close the modal
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const filteredHospitals = useHospitalFilter(HOSPITALS, searchTerm, selectedCategory)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section with Medivios Branding */}
      <Banner
        topSpanText="Explore Our Hospital Network"
        title="Connecting You to India’s Leading Hospitals"
        description="Medivisor India Treatment partners with trusted hospitals across India — from multi-specialty centers to super-specialty institutes. With advanced facilities and expert doctors, you get the right care at the right place. Check below to explore our hospital network."
        // 🚨 Update the button's action to open the modal
        buttonText="Find a Hospital"
        buttonLink="#hospital-partners"
        // Use buttonOnClick prop to open modal
        bannerBgImage="/hospital-network-bg.jpeg"
        mainImageSrc="/about-main.png"
        mainImageAlt="Medivisor India Treatment Hospital Network"
      />
      {/* Partner Logos Section */}
      <Partners />
      {/* Featured Hospital Partners Section */}
      <section className="py-10 px-2 md:px-0 bg-gray-50" id="hospital-partners">
        <div className="container mx-auto ">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredHospitals.map((hospital) => (
              <HospitalCard key={hospital.id} hospital={hospital} openModal={openModal} />
            ))}
          </div>
          {filteredHospitals.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Building2 className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-[#241d1f] mb-2">No hospitals found</h3>
              <p className="text-gray-500">Try adjusting your search criteria or category filter</p>
            </div>
          )}
        </div>
      </section>
      <WhyChooseUsSection />
      <CtaSection />
      {/* 👇️ Render the modal and pass the state and the close function */}
      <ContactModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  )
}