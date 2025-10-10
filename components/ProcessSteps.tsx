"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollText, UserRoundCheck, FileStack, PlaneTakeoff, Download } from "lucide-react"

export default function ProcessSteps() {
  const [activeStep, setActiveStep] = useState(4)

  const steps = [
    {
      id: 1,
      title: "Get a Quote",
      icon: <ScrollText className="w-5 h-5" />,
      description:
        "Send us your medical reports. We'll share a complete treatment plan with cost, including travel and stay.",
      benefit: "Receive a comprehensive treatment plan and cost estimate.",
      outcome: "Clear understanding of your medical journey and expenses.",
      buttonText: "Get a Quotation",
    },
    {
      id: 2,
      title: "Talk to the Doctor",
      icon: <UserRoundCheck className="w-5 h-5" />,
      description: "Need clarity? We'll connect you with the right specialist.",
      benefit: "Direct consultation with the treating doctor.",
      outcome: "Clarity on procedures and expected outcomes.",
      buttonText: "Talk to the Doctor",
    },
    {
      id: 3,
      title: "Share Visa Documents",
      icon: <FileStack className="w-5 h-5" />, // Changed icon to FileStack
      description: "To process your visa quickly, please send us:",
      benefit: "Required Documents",
      outcome: "Our Assistance",
      buttonText: "Share Documents",
      isVisa: true,
    },
    {
      id: 4,
      title: "Book & Fly",
      icon: <PlaneTakeoff className="w-5 h-5" />,
      description:
        "Book your flight (or we'll help). Once you land in India, we take care of the rest—airport pickup, hotel, hospital, SIM, currency exchange, and full assistance throughout.",
      buttonText: "Know the Air Fare",
    },
  ]

  const currentStep = steps.find((step) => step.id === activeStep)

  return (
    <section className="bg-gray-50 py-10  md:pt-10">
      <div className="container mx-auto px-0">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">
            How it Works - Treatment Process
          </h2>
          <p className="text-[#241d1f]  text-base md:text-lg  max-w-2xl mx-auto">
            Embarking on your medical journey in India with Medivisor India Treatment is a streamlined and supportive
            process. We guide you through each step, ensuring clarity and ease.
          </p>
        </div>

        <div className="grid md:grid-cols-4 h-full gap-3 md:gap-6">
          <div className="md:col-span-1 md:bg-white md:border border-gray-100 overflow-hidden rounded-md md:shadow-sm h-full p-5 h-fit z-10">
            <h3 className="text-xl font-semibold text-gray-800 mb-2 md:mb-5 flex items-center">Steps</h3>

            <div className="md:space-y-2 grid md:grid-cols-1 grid-cols-2 gap-2 md:block">
              {steps.map((step) => (
                <Button
                  key={step.id}
                  variant={activeStep === step.id ? "default" : "outline"}
                  className={`flex items-center gap-2 w-full px-0 py-3 min-h-12 text-base md:text-lg text-center justify-center  font-medium transition ${
                    activeStep === step.id
                      ? "bg-[#E22026]/10 text-[#E22026] border-[#E22026]"
                      : "hover:bg-[#E22026]/10 text-[#241d1f] border-gray-100"
                  }`}
                  onClick={() => setActiveStep(step.id)}
                >
                  <span className={`textgray-900 ${
                    activeStep === step.id
                      ? " text-[#E22026] "
                      : " text-[#241d1f] "
                  }`}
                  onClick={() => setActiveStep(step.id)}>{step.icon}</span>
                  {step.title}
                </Button>
              ))}
            </div>
          </div>

          <div className="md:col-span-3 h-full gap-4 flex flex-col">
            {currentStep && (
              <div className="bg-white border border-gray-100 rounded-md shadow p-3 pt-3 md:p-6 flex-grow">
                <div className="flex items-center justify-between mb-1 md:mb-3">
                  <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <span className="text-gray-900">{currentStep.icon}</span>
                    {currentStep.title}
                  </h4>
                  <span className="text-xs bg-[#74BF44]/10 text-[#74BF44] px-2 py-1 rounded-full">
                    Step {currentStep.id} of 4
                  </span>
                </div>

                <p className="text-[#241d1f]  text-base md:text-lg  mb-3">{currentStep.description}</p>

                {currentStep.isVisa ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="bg-gray-50 p-3 border border-gray-100 rounded-md">
                      <h5 className="font-semibold text-gray-800 text-base mb-1">Required Documents</h5>
                      <ul className="text-base text-[#241d1f] space-y-1">
                        <li className="flex items-center gap-2">
                          <span className="text-[#4CAF50] font-bold">✓</span>
                          Passport copy
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-[#4CAF50] font-bold">✓</span>
                          2x2 inch photo
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-[#4CAF50] font-bold">✓</span>
                          e-Visa form
                          <a
                            href="/assets/e-Visa Application Form.docx"
                            className="text-[#74BF44] underline flex items-center gap-1"
                          >
                            <Download className="w-3 h-3 text-gray-900" />
                            Download
                          </a>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gray-50 p-3 border border-gray-100 rounded-md">
                      <h5 className="font-semibold text-gray-800 text-base mb-1">Our Assistance</h5>
                      <ul className="text-base text-[#241d1f] space-y-1">
                        <li className="flex items-center gap-2">
                          <span className="text-[#4CAF50] font-bold">✓</span>
                          Visa within 24-72 Hours
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-[#4CAF50] font-bold">✓</span>
                          Zero Lodgement Fee
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-[#4CAF50] font-bold">✓</span>
                          Expert guidance
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  currentStep.benefit &&
                  currentStep.outcome && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="bg-gray-50 p-3 border border-gray-100 rounded-md">
                        <h5 className="font-semibold text-gray-800 text-lg mb-1">Benefit</h5>
                        <p className="text-base md:text-lg text-[#241d1f]">{currentStep.benefit}</p>
                      </div>
                      <div className="bg-gray-50 p-3 border border-gray-100 rounded-md">
                        <h5 className="font-semibold text-gray-800 text-lg mb-1">Outcome</h5>
                        <p className="text-base md:text-lg text-[#241d1f]">{currentStep.outcome}</p>
                      </div>
                    </div>
                  )
                )}

                <div className="mt-4">
                  {currentStep.id === 3 ? (
                    <a
                      href="https://wa.me/918340780250?text=Hello%2C%20I%20am%20interested%20in%20your%20services"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block w-full md:w-auto"
                    >
                      <Button className="bg-[#E22026] text-white px-4 py-2 md:text-base rounded-md w-full md:w-auto hover:bg-[#74BF44]">
                        {currentStep.buttonText}
                      </Button>
                    </a>
                  ) : currentStep.id === 4 ? (
                    <div className="md:flex gap-4">
                      <a
                        href="https://wa.me/918340780250?text=Hello%2C%20I%20am%20interested%20in%20your%20services"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block w-full md:w-auto"
                      >
                        <Button className="bg-[#E22026] text-white px-4 py-2 md:text-base rounded-md w-full md:w-auto hover:bg-[#74BF44]">
                          {currentStep.buttonText}
                        </Button>
                      </a>
                      <a href="/assets/patient-workflow.png" target="_blank" rel="noreferrer">
                        <Button
                          variant="outline"
                          className="bg-[#E22026] text-white px-4 py-2 md:text-base mt-2 md:mt-0 rounded-md w-full md:w-auto hover:bg-[#74BF44]"
                        >
                          View Treatment Flow
                        </Button>
                      </a>
                    </div>
                  ) : (
                    <Button className="bg-[#E22026] modal-open-btn   md:text-base text-white px-4 py-2 rounded-md w-full md:w-auto hover:bg-[#74BF44]">
                      {currentStep.buttonText}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
