import { notFound } from "next/navigation"
import { wixServerClient } from "@/lib/wixServer"
import { getBestCoverImage } from "@/lib/wixMedia"
import { OptimizedImage } from "@/components/optimized-image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Link from "next/link"
import type { Treatment, MedicalAdvisor } from "@/types/medical"
import {
  Clock,
  DollarSign,
  Stethoscope,
  Users,
  CheckCircle,
  AlertTriangle,
  Heart,
  Award,
  Calendar,
  Target,
} from "lucide-react"

const COLLECTION_ID_TREATMENT = "TreatmentAngioplastyPci"
const COLLECTION_ID_DOCTOR = "Import2"

// Helper function to format arrays from strings
function formatStringToArray(data: string[] | string | null | undefined): string[] {
  if (!data) return []
  if (Array.isArray(data)) return data.map((item) => String(item).trim())
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data.replace(/'/g, '"'))
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim())
    } catch (e) {
      return data.split(",").map((item) => item.trim())
    }
  }
  return []
}

// Helper function to parse FAQs
function parseFaqs(data: string | null | undefined): { question: string; answer: string }[] {
  if (!data || typeof data !== "string") return []
  try {
    return JSON.parse(data)
  } catch (e) {
    console.error("Failed to parse FAQs string:", e)
  }
  return []
}

async function getTreatmentBySlug(slug: string): Promise<Treatment | null> {
  try {
    const response = await wixServerClient.items
      .query(COLLECTION_ID_TREATMENT)
      .eq("slug", slug)
      .find({ consistentRead: true })

    if (!response.items || response.items.length === 0) {
      return null
    }

    const item = response.items[0]
    return {
      _id: item._id,
      name: item.name || "Treatment",
      description: item.description || "",
      slug: item.slug || "",
      department: item.department || "",
      tags: formatStringToArray(item.tags),
      priceRangeMin: item.priceRangeMin || 0,
      priceRangeMax: item.priceRangeMax || 0,
      relatedDoctors: formatStringToArray(item.relatedDoctors),
      durationMinutes: item.durationMinutes || 0,
      faqs: parseFaqs(item.faqs),
      type: "treatment",
      beforeAfterImages: formatStringToArray(item.beforeAfterImages),
      steps: formatStringToArray(item.steps),
      benefits: formatStringToArray(item.benefits),
      risks: formatStringToArray(item.risks),
    }
  } catch (error) {
    console.error("Error fetching treatment:", error)
    return null
  }
}

async function getRelatedDoctors(doctorIds: string[]): Promise<MedicalAdvisor[]> {
  if (doctorIds.length === 0) return []

  try {
    const response = await wixServerClient.items
      .query(COLLECTION_ID_DOCTOR)
      .in("_id", doctorIds)
      .find({ consistentRead: true })

    return (
      response.items?.map((item: any) => ({
        _id: item._id,
        name: item.name || "Medical Advisor",
        title: item.Title || item.title,
        specialty: item.specialty,
        photo: item.photo,
        experience: item.experience,
        languages: formatStringToArray(item.languages),
        hospital: item.hospital,
        contactPhone: item.contactPhone,
        whatsapp: item.whatsapp,
        about: item.about,
        workExperience: item.workExperience,
        education: item.education,
        memberships: item.memberships,
        awards: item.awards,
        specialtyInterests1yy: formatStringToArray(item.specialtyInterests1yy),
        slug: item.slug,
        type: "doctor" as const,
      })) || []
    )
  } catch (error) {
    console.error("Error fetching related doctors:", error)
    return []
  }
}

export default async function TreatmentPage({ params }: { params: { slug: string } }) {
  const treatment = await getTreatmentBySlug(params.slug)

  if (!treatment) {
    notFound()
  }

  const relatedDoctors = await getRelatedDoctors(treatment.relatedDoctors)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            {/* Treatment Icon */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Stethoscope className="h-12 w-12 text-white" />
              </div>
            </div>

            {/* Treatment Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-4xl font-bold text-gray-900 text-balance">{treatment.name}</h1>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                  {treatment.department}
                </Badge>
              </div>

              <p className="text-xl text-[#241d1f] mb-6 text-pretty">{treatment.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-2 text-[#241d1f]">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">
                    ${treatment.priceRangeMin.toLocaleString()} - ${treatment.priceRangeMax.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[#241d1f]">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span>
                    {Math.floor(treatment.durationMinutes / 60)}h {treatment.durationMinutes % 60}m duration
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[#241d1f]">
                  <Users className="h-5 w-5 text-purple-500" />
                  <span>{relatedDoctors.length} specialists available</span>
                </div>
              </div>

              {/* Tags */}
              {treatment.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {treatment.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="border-gray-300">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Consultation
                </Button>

                <Button variant="outline">
                  <Heart className="h-4 w-4 mr-2" />
                  Save Treatment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Treatment Steps */}
            {treatment.steps && treatment.steps.length > 0 && (
              <Card className="bg-white shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Target className="h-5 w-5 text-blue-600" />
                    Treatment Process
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {treatment.steps.map((step, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-[#241d1f] leading-relaxed">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Benefits & Risks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {treatment.benefits && treatment.benefits.length > 0 && (
                <Card className="bg-white shadow-sm border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Benefits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {treatment.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-[#241d1f] text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {treatment.risks && treatment.risks.length > 0 && (
                <Card className="bg-white shadow-sm border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      Considerations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {treatment.risks.map((risk, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span className="text-[#241d1f] text-sm">{risk}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Before/After Gallery */}
            {treatment.beforeAfterImages && treatment.beforeAfterImages.length > 0 && (
              <Card className="bg-white shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Award className="h-5 w-5 text-purple-600" />
                    Treatment Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Carousel className="w-full">
                    <CarouselContent>
                      {treatment.beforeAfterImages.map((image, index) => {
                        const imageSrc = getBestCoverImage({ photo: image })
                        return imageSrc ? (
                          <CarouselItem key={index} className="md:basis-1/2">
                            <OptimizedImage
                              src={imageSrc}
                              alt={`Treatment result ${index + 1}`}
                              width={400}
                              height={300}
                              className="rounded-lg object-cover w-full h-64"
                            />
                          </CarouselItem>
                        ) : null
                      })}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                </CardContent>
              </Card>
            )}

            {/* FAQs */}
            {treatment.faqs.length > 0 && (
              <Card className="bg-white shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {treatment.faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left text-gray-900">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-[#241d1f]">{faq.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )}

            {/* Related Doctors */}
            {relatedDoctors.length > 0 && (
              <Card className="bg-white shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Users className="h-5 w-5 text-blue-600" />
                    Specialists for this Treatment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Carousel className="w-full">
                    <CarouselContent>
                      {relatedDoctors.map((doctor) => {
                        const doctorImageSrc = doctor.photo ? getBestCoverImage({ photo: doctor.photo }) : null
                        return (
                          <CarouselItem key={doctor._id} className="md:basis-1/2 lg:basis-1/3">
                            <Card className="bg-gray-50 border-gray-200 hover:shadow-md transition-shadow">
                              <CardHeader className="text-center pb-2">
                                {doctorImageSrc && (
                                  <OptimizedImage
                                    src={doctorImageSrc}
                                    alt={doctor.name}
                                    width={80}
                                    height={80}
                                    className="rounded-full mx-auto mb-3 border-2 border-gray-200"
                                  />
                                )}
                                <CardTitle className="text-lg text-gray-900">{doctor.title}</CardTitle>
                                <p className="text-sm text-[#241d1f]">{doctor.specialty}</p>
                              </CardHeader>
                              <CardContent className="pt-0 text-center">
                                <p className="text-sm text-[#241d1f] mb-3">{doctor.experience} years experience</p>
                                <Link href={`/medical-advisor/${doctor.slug}`}>
                                  <Button size="sm" variant="outline" className="w-full bg-transparent">
                                    View Profile
                                  </Button>
                                </Link>
                              </CardContent>
                            </Card>
                          </CarouselItem>
                        )
                      })}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Booking */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 sticky top-8">
              <CardHeader>
                <CardTitle className="text-blue-900">Book This Treatment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900 mb-1">
                    ${treatment.priceRangeMin.toLocaleString()} - ${treatment.priceRangeMax.toLocaleString()}
                  </div>
                  <p className="text-sm text-blue-700">Starting price range</p>
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Consultation
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 bg-transparent"
                >
                  Get Quote
                </Button>

                <div className="text-xs text-blue-600 text-center">Free consultation available</div>
              </CardContent>
            </Card>

            {/* Treatment Info */}
            <Card className="bg-white shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Treatment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-[#241d1f]">Duration</span>
                  <span className="font-semibold text-gray-900">
                    {Math.floor(treatment.durationMinutes / 60)}h {treatment.durationMinutes % 60}m
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-[#241d1f]">Department</span>
                  <span className="font-semibold text-gray-900">{treatment.department}</span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-[#241d1f]">Specialists</span>
                  <span className="font-semibold text-gray-900">{relatedDoctors.length} available</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
