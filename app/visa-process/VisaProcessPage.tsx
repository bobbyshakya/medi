"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Camera,
  StampIcon as Passport,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Download,
  Users,
  Calendar,
} from "lucide-react"
import Ctasection from "@/components/CtaSection"
import Banner from "@/components/BannerService"

export default function VisaPage() {
  const [activeStep, setActiveStep] = useState<number | null>(null)

  const requiredDocuments = [
    {
      id: 1,
      icon: Passport,
      title: "Passport Bio-Page",
      description: "Submit a clear copy of your passport's bio-page.",
      details: [
        "High-quality scan or photo",
        "All text must be clearly readable",
        "Valid for at least 6 months",
        "PDF or JPEG format accepted",
      ],
      image: "/services/visa.jpg",
    },
    {
      id: 2,
      icon: Camera,
      title: "Personal Photo",
      description:
        "Take a 2x2 inches photo of yourself with your mobile phone. Ensure your face and shoulders are clearly visible against a plain background.",
      details: [
        "2x2 inches dimensions",
        "Plain white or light background",
        "Face and shoulders visible",
        "Recent photo (within 6 months)",
      ],
      image: "/photographer-looking-negatives_23-2148019147.jpg",
    },
    {
      id: 3,
      icon: FileText,
      title: "e-Visa Application Form",
      description: "If you haven't received the form from us, please download it from the link provided.",
      details: [
        "Complete all required fields",
        "Use black or blue ink if printed",
        "Sign and date the form",
        "Double-check all information",
      ],
      image: "/services/concierge-lifestyle.jpg",
    },
  ]

  const importantNotes = [
    {
      icon: Users,
      title: "All Passengers Required",
      description: "All passengers must submit the required documents, regardless of age.",
    },
    {
      icon: Calendar,
      title: "60-Day Validity",
      description: "Your initial free eVisa will be valid for 60 days from the date of issue.",
    },
    {
      icon: DollarSign,
      title: "Extension Available",
      description: "If an extension is needed, we will arrange it. The visa extension will cost $80 per person.",
    },
  ]

  return (
    <>
      <Banner
        topSpanText="Visa Made Simple"
        title="Stress-Free Medical Visa Assistance"
        description="Getting a visa for your medical treatment can be stressful—but it doesn’t have to be. At Medivisor, we handle all the paperwork, guide you through each step, and make sure your journey is smooth and worry-free. Focus on your health, and let us take care of the rest."
        buttonText="Start Your Visa Process"
        buttonLink="#visa-support"
        bannerBgImage="/visa-banner.png"
        mainImageSrc="/about-main.png"
        mainImageAlt="Friendly assistance for medical travel visas"
      />


      <section className="min-h-screen bg-white">
        <div>
          <div>
            <div className="space-y-0">
              {requiredDocuments.map((document, index) => {
                const IconComponent = document.icon
                const isEven = index % 2 === 0
                const bgColor = isEven ? "bg-gray-50" : "bg-white"

                return (
                  <div key={document.id} className={`${bgColor} py-12 px-4 sm:px-6 md:px-0`} id="visa-support">
                    <div className="container mx-auto">
                      <div
                        className={`flex flex-col ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-6 lg:gap-12`}
                      >
                        {/* Image Section */}
                        <div className="flex-1 relative group w-full">
                          <div className="relative overflow-hidden rounded-xs shadow-xs">
                            <img
                              src={document.image || "/placeholder.svg"}
                              alt={document.title}
                              className="w-full h-[200px] sm:h-[250px] md:h-[400px] object-cover"
                            />
                          </div>
                          <div className="absolute -top-4 -left-3 sm:-top-5 sm:-left-4 md:w-14 w-10 md:h-14 h-10 bg-white text-[#241d1f] rounded-full flex items-center justify-center shadow-md border border-gray-200">
                            <IconComponent className="md:w-7 w-5 md:h-7 h-5" />
                          </div>
                        </div>

                        {/* Text Section */}
                        <div className="flex-1 space-y-2 w-full">
                          <h2 className="heading-sm">
                            Step {index + 1}: {document.title}
                          </h2>
                          <p className="description">{document.description}</p>

                          <div className="rounded-xs border border-gray-100 shadow-xs overflow-hidden bg-white">
                            <div className="px-4 sm:px-5 pt-3">
                              <h3 className="title-text">Requirements:</h3>
                            </div>
                            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {document.details.map((detail, detailIndex) => (
                                <div
                                  key={detailIndex}
                                  className="flex items-center gap-2 px-3 py-2 rounded-xs bg-gray-50 hover:bg-gray-100 transition"
                                >
                                  <CheckCircle className="w-5 h-5 text-[#74BF44] flex-shrink-0" />
                                  <span className="description">{detail}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Download + Visa Extension */}
            <div className="py-10 px-4 sm:px-6 md:px-0">
              <div className="container mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Box */}
                  <div>
                    <div className="text-center md:text-left bg-gray-50 rounded-xs p-6 sm:p-8 md:p-10 h-full flex flex-col justify-center shadow-xs">
                      <Download className="w-10 h-10 sm:w-12 sm:h-12 text-[#E22026] mb-4 mx-auto md:mx-0" />
                      <h3 className="text-xl sm:text-xl md:text-2xl font-semibold text-[#241d1f] mb-2">
                        Download e-Visa Application Form
                      </h3>
                      <p className="text-[19px] md:text-lg text-[#241d1f] mb-6 leading-relaxed">
                        If you haven't received the e-Visa form, download it directly below.
                      </p>
                      <a href="/e-Visa Application Form.docx" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto bg-[#E22026] border border-red-300 text-white text-sm md:text-base font-medium px-6 py-3 rounded-xs shadow-xs transition duration-300 hover:bg-[#74BF44] hover:scale-105">
                          Download Application Form
                        </Button>
                      </a>
                    </div>
                  </div>

                  {/* Right Box */}
                  <div>
                    <div className="h-full text-center md:text-left rounded-xs border border-red-300 bg-gradient-to-br from-[#E22026] to-[#c4181e] shadow-xs">
                      <div className="p-4 sm:p-8 md:p-10">
                        <div className="pb-4 flex justify-center md:justify-start">
                          <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                        </div>
                        <h4 className="text-xl sm:text-xl md:text-2xl font-semibold text-white mb-6">
                          Visa Extension Information
                        </h4>

                        <div className="space-y-6 md:border-none border-t border-red-400 pt-4">
                          {/* First Item */}
                          <div className="flex flex-col items-center md:flex-row md:items-start gap-3 pb-4 border-b border-red-400 text-center md:text-left">
                            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-green-100 md:bg-green-100">
                              <CheckCircle className="w-6 h-6 text-[#74BF44]" />
                            </div>
                            <div>
                              <p className="font-semibold text-xl sm:text-xl text-white">
                                Initial Validity: 60 days
                              </p>
                              <p className="text-[18px] text-gray-100">
                                Your initial free eVisa will be valid for 60 days from issue date.
                              </p>
                            </div>
                          </div>

                          {/* Second Item */}
                          <div className="flex flex-col items-center md:flex-row md:items-start gap-3 text-center md:text-left">
                            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-green-100 md:bg-green-100">
                              <CheckCircle className="w-6 h-6 text-[#74BF44]" />
                            </div>
                            <div>
                              <p className="font-semibold text-xl sm:text-xl text-white">
                                Extension Cost: $80 per person
                              </p>
                              <p className="text-lg text-gray-100">
                                If an extension is needed, we will arrange it for you (government fee applies).
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Information */}
            <div className="py-10 bg-gray-50 px-4 sm:px-6 md:px-0">
              <div className="container mx-auto">
                <h3 className="heading-base text-center pb-4">
                  Important Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {importantNotes.map((note, index) => {
                    const IconComponent = note.icon
                    return (
                      <div key={index} className="bg-white rounded-xs p-6 border border-gray-100 shadow-xs text-center">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <IconComponent className="w-7 h-7 sm:w-8 sm:h-8 text-[#241d1f]" />
                        </div>
                        <h4 className="title-heading mb-2">{note.title}</h4>
                        <p className="description">{note.description}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Ctasection />
    </>
  )
}
