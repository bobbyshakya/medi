"use client"
import { MapPin, CheckCircle, CreditCard, Stethoscope, Shield, Luggage, Navigation, Clock, Armchair } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Banner from "@/components/BannerService"
import CtaSection from "@/components/CtaSection"

export default function TravelGuidePage() {
  const beforeDepartureItems = [
    { icon: <CreditCard className="w-6 h-6" />, title: "Currency Exchange", description: "Convert your currency to USD, potentially at a local forex outlet, and request 100 denomination new notes for better deals." },
    { icon: <Luggage className="w-6 h-6" />, title: "Pack Light", description: "Keep your luggage light, not exceeding 23 kg per person, and consider doing some shopping in India." },
    { icon: <Clock className="w-6 h-6" />, title: "Weather Check", description: "Check the local temperature on Google and pack clothes accordingly." },
    { icon: <Shield className="w-6 h-6" />, title: "Travel Adaptor", description: "Carry a travel adaptor, as plug points at the transit airports and in India may differ from those in your country." },
    { icon: <Armchair className="w-6 h-6" />, title: "Comfort Items", description: "Consider bringing a neck pillow for added comfort." },
    { icon: <Navigation className="w-6 h-6" />, title: "Entertainment", description: "Load movies onto your laptop or mobile phone for entertainment during transit." },
    { icon: <Shield className="w-6 h-6" />, title: "Food Items", description: "Bring tin fish or local food items if desired, as they may not be readily available in India." },
    { icon: <Stethoscope className="w-6 h-6" />, title: "Medical Consultation", description: "Consult your local doctor, and if coming for surgery, stop taking aspirin and other blood thinners one day before departure." },
    { icon: <CheckCircle className="w-6 h-6" />, title: "Medical Reports", description: "Bring all medical reports and any medical imaging CDs (angiogram, MRI, CT)." },
    { icon: <Stethoscope className="w-6 h-6" />, title: "Health Monitoring", description: "Carry a glucometer and strips if needed to check sugar levels regularly; alternatively, purchase them in India." },
    { icon: <CheckCircle className="w-6 h-6" />, title: "Identification", description: "Send photos of the travelers via Viber (+918340780250) or email (info@medivisorhealth.com) for easy identification at the airport." },
  ]

  const transitTips = [
    { title: "Airport Help Desk", description: "Approach the airport help desk if there's confusion about the departure terminal and/or gate.", image: "/hotel-hospital-transfer.jpg" },
    { title: "Currency Exchange", description: "Convert 50-100 USD into Indian rupees; the rest can be exchanged in India for a better rate.", image: "/cropped-hand-holding-paper-currency_1048944-26635581.avif" },
    { title: "SIM Card & Connectivity", description: "Purchase a local SIM card (preferably Airtel) for better connectivity, as international roaming may be costly.", image: "/sim-card-smart-phone_63097-2548.avif" },
    { title: "Medical Assistance Desk", description: "Visit the dedicated medical assistance desk at the airport for emergency support, guidance on medical visa queries, or hospital transfers.", image: "/social-distancing-businesswoman-wearing-face-mask-sit-working-with-laptop-keeping-distance-away-from-each-other-avoid-covid19-infection-pandemic-empty-chair-seat-red-cross-shows-new.jpg" },
  ]

  const arrivalSteps = [
    "Request a wheelchair from airline staff if necessary.",
    "Turn on Wi-Fi and connect to Airport Free WiFi.",
    "Proceed to the Medical Visa Immigration Desk if on a medical visa for a shorter passenger queue.",
    "For patients with Electronic Travel Authorization (ETA), the visa will be issued upon arrival, ensuring it's an e-Medical Visa (not e-Tourist Visa).",
    "Collect your check-in baggage after crossing immigration.",
    "Approach the customs desk/officer if unsure about declaring any goods.",
    "Exit from Gate #5 or Gate #6, take a left, and wait outside KFC; our executive will have a placard of Medivisor Health.",
    "If the executive is not found, wait for some time; in case of significant delays, call 7042408473/9643015697 from a local Airtel phone booth outside Gate #5.",
    "If hungry, pick up food/snacks from the airport restaurant/food point, especially crucial if arriving at night when guest house/hotel kitchens might be closed.",
  ]

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <Banner
        topSpanText="Travel Guide"
        title="Your Medical Journey to India Made Easy"
        description="Traveling for treatment can feel overwhelming, but we make it simple. From what to pack, where to stay, and how to get around, our guide ensures you and your family feel prepared, comfortable, and confident at every step of your journey."
        buttonText="Explore Travel Tips"
        buttonLink="/initiatives"
        bannerBgImage="/service-banner.png"
        mainImageSrc="/about-main.png"
        mainImageAlt="Friendly Travel Guide for Medical Journey"
      />


      {/* Before Departure Section */}
      <section className="relative px-2 md:px-0 bg-white border-t border-gray-100 py-10">
        <div className="container  mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-gray-100 animate-pulse rounded-xs shadow-xs border border-gray-200">
                <img src="/icon/air.png" className="w-10 h-10" alt="Departure Icon" />
              </div>
            </div>
            <h2 className="heading-lg">Before Departure</h2>
            <p className="description">A comprehensive checklist to help you prepare for a successful and stress-free medical trip.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {beforeDepartureItems.map((item, index) => (
              <Card
                key={index}
                className="bg-gray-50 border border-gray-100 rounded-xs shadow-xs hover:shadow-xs "
              >
                {/* Header */}
                <div className="flex items-center gap-4 p-4 border-b border-gray-200">
                  <div className="flex-shrink-0 p-3 bg-white rounded-full shadow-inner text-gray-900">
                    {item.icon}
                  </div>
                  <CardTitle className="title-heading">
                    {item.title}
                  </CardTitle>
                </div>

                {/* Body */}
                <CardContent className="p-4">
                  <p className="description">
                    {item.description}
                  </p>
                </CardContent>
              </Card>

            ))}
          </div>
        </div>
      </section>

      {/* At the Transit Airport Section */}
      <section className="py-10 px-2 md:px-0 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-white  rounded-xs shadow-xs border border-gray-100">
                <MapPin className="w-10 h-10 text-[#241d1f]" />
              </div>
            </div>
            <h2 className="heading-lg">At the Transit Airport</h2>
            <p className="description">Smart strategies to navigate your layover with ease and confidence.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {transitTips.map((tip, index) => (
              <Card key={index} className="group overflow-hidden bg-white rounded-xs border border-gray-50 shadow-xs hover:shadow-xs transition-all duration-500">
                <div className="relative h-40 w-full overflow-hidden">
                  <img src={tip.image} alt={tip.title} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" />
                </div>
                <CardHeader className="md:px-5 px-3 pt-4 pb-1">
                  <CardTitle className="title-heading">{tip.title}</CardTitle>
                </CardHeader>
                <CardContent className="md:px-5 px-3 pb-5 pt-0">
                  <p className="description">{tip.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* After Arriving Section */}
      <section className="py-10 px-2 md:px-0 border-t border-gray-200 bg-white">
        <div className="container px-4 md:px-0 mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left Side */}
          <div className="lg:sticky top-20">
            <h2 className="heading-lg pb-4">After Arriving at Delhi Airport</h2>
            <img src="/young-brunette-woman-airport-is-waiting-her-flight-something-looking-smartphone-she-is-sitting-suitcase-backpack-side-view_255755-6978.avif" alt="Arrival assistance" className="w-full rounded-xs shadow-xs" />
          </div>

          {/* Right Side */}
          <div className="space-y-6">
            <p className="title-text">Follow these important steps to ensure a smooth arrival and transition for your medical journey in India.</p>
            <div className="space-y-4">
              {arrivalSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="text-[#75c044] mt-1 flex-shrink-0" />
                  <p className="description">{step}</p>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t border-gray-100">
              <p className="description">Safe travels, and we look forward to assisting you on your medical journey in India. If you have any further questions or need support, feel free to reach out. <strong>Take care and best wishes for a successful and comfortable stay.</strong></p>
            </div>
          </div>
        </div>
      </section>

      <CtaSection />
    </div>
  )
}