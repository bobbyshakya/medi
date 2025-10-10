import Image from "next/image"
import { Check } from "lucide-react"

export default function SupportTrustSection() {
  return (
    <section className="w-full py-10 md:py-10 bg-gray-50">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Text Content */}
          <div className="flex flex-col col-span-7 justify-center space-y-6 text-center lg:text-left">
            <div className="space-y-4">
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 leading-snug">
                Your Trusted Partner in Global Healthcare
              </h2>
              <p className=" md:text-lg text-base text-[#241d1f] leading-relaxed">
                We are dedicated to building unwavering trust and providing comprehensive support for international
                patients seeking world-class medical treatment in India. Your well-being is our priority.
              </p>
            </div>
            <ul className="grid gap-3 text-[#241d1f] dark:text-gray-200 text-left mx-auto lg:mx-0">
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className=" md:text-lg text-base text-[#241d1f] leading-relaxed">Personalized care coordination from arrival to departure</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className=" md:text-lg text-base text-[#241d1f] leading-relaxed">Transparent communication and clear treatment plans</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className=" md:text-lg text-base text-[#241d1f] leading-relaxed">
                  Comprehensive assistance with travel, visa, and accommodation
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className=" md:text-lg text-base text-[#241d1f] leading-relaxed">Dedicated support for cultural and language needs</span>
              </li>
            </ul>
          </div>

          {/* Right Column: Image */}
          <div className="flex justify-center bg-gray-50 p-10 col-span-5 lg:justify-end">
            <div className="relative w-full aspect-square">
              <Image
                src="/caduceus-medical.jpg"
                layout="fill"
                objectFit="contain"
                alt="Caduceus Medical Symbol representing trust and support in healthcare"
                className="mix-blend-mode"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
