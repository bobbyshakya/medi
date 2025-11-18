// app/pacific-patient/page.tsx (updated main page)
import { schedule, formatDateFriendly, formatScheduleDetails } from "@/lib/schedule";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Registration from "@/components/registration-form";
import Link from "next/link";
import Partners from "@/components/Partners";
import BlogCarousel from "@/components/BlogSection";
import Testimonials from "@/components/Testimonials";
import Banner from "@/components/PacificBanner";
import FaqSection from "@/components/PacificFAqSection" // Import the separate Banner component

// Helper function to map schedule labels to flag placeholders
function flagForLabel(label: string) {
  const L = label.toLowerCase();
  if (L.includes("png") || L.includes("papua")) {
    return { src: "/icon/flag/png.png", alt: "Flag of Papua New Guinea" };
  }

  if (L.includes("solomon")) {
    return { src: "/icon/flag/solomon-flag.png", alt: "Flag of Solomon Islands" };
  }
  if (L.includes("vanuatu")) {
    return { src: "/icon/flag/vanuatu.png", alt: "Flag of Vanuatu" };
  }
  if (L.includes("fiji")) {
    return { src: "/icon/flag/fiji.png", alt: "Flag of Fiji" };
  }
  return { src: "/icon/flag/fiji.png", alt: "Country flag" };
}

export const metadata = {
  title: 'Pacific Patient Visit I Nov 18-26 I PNG, Solomon, Vanuatu, Fiji',
  description: 'Hello Friends, A Medivisor medical team is coming to your country! If you or your loved ones are suffering from any long-term illness or have been recently diagnosed with a condition that cannot be treated locally, this is your chance to meet the Medivisor team in person and explore the best possible treatment options in India.',
  openGraph: {
    title: 'Pacific Patient Visit I Nov 18-26 I PNG, Solomon, Vanuatu, Fiji',
    description: 'Hello Friends, A Medivisor medical team is coming to your country! If you or your loved ones are suffering from any long-term illness or have been recently diagnosed with a condition that cannot be treated locally, this is your chance to meet the Medivisor team in person and explore the best possible treatment options in India.',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/thumbnail/pacific-meet.jpg',
        width: 1200,
        height: 630,
        alt: 'Pacific Patient Visit Banner - Mr. Kumar Sushant, Director, Medivisor India Treatment',
      },
    ],
    url: 'https://medivisorindiatreatment.com/pacific-patient',
    siteName: 'Medivisor',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pacific Patient Visit I Nov 18-26 I PNG, Solomon, Vanuatu, Fiji',
    description: 'Hello Friends, A Medivisor medical team is coming to your country! If you or your loved ones are suffering from any long-term illness or have been recently diagnosed with a condition that cannot be treated locally, this is your chance to meet the Medivisor team in person and explore the best possible treatment options in India.',
    images: ['https://medivisorindiatreatment.com/thumbnail/pacific-meet.jpg'],
  },
  other: {
    'whatsapp-title': 'Pacific Patient Visit | Medivisor Director in Pacific Islands Nov 18-26, 2025',
    'whatsapp-description': 'Meet Mr. Kumar Sushant for expert medical guidance on your condition. Limited slots! Register now.',
  },
};

export default function Page() {
  return (
    <section className="w-full bg-white">
      {/* Separate Banner Component with Link */}
      <Banner />

      {/* <Testimonials /> */}

      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* ===================== SCHEDULE + STICKY REGISTRATION ===================== */}
        <section className="h-full px-2 md:px-0 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left - Schedule */}
            <div className="lg:col-span-6 space-y-4">
              <div className="space-y-6">
                <div className="text-gray-700 leading-relaxed text-base">
                  <p className="mb-1">
                    <strong>Hello Friends,</strong>
                  </p>
                  <p className="mb-1 flex items-center gap-1 description">
                    A Medivisor and Yashoda medical team from India is coming to your country!

                  </p>

                  <p className="description">
                    If you or your loved ones are suffering from any long-term illness or have been recently diagnosed with a
                    condition that cannot be treated locally, this is your chance to meet the Medivisor and Yasodha medical team in person and explore the
                    best possible treatment options in India.
                  </p>
                </div>

                {/* Ideal For Section */}
                <div className="">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">👩‍⚕️ Ideal for patients suffering from:</h3>
                  <ul className="space-y-1 ml-5 description list-disc ">
                    <li>Brain, Head & Neck Tumours — Including all types of cancerous and non-cancerous growths</li>
                    <li>Any Type of Cancer — Comprehensive diagnosis and advanced treatment options</li>
                    <li>Infertility & Gynecological Problems — Including IVF, endometriosis, fibroids, and PCOS</li>
                    <li>Spinal Deformities & Chronic Back Pain — Minimally invasive and corrective spine surgeries</li>
                    <li>Cardiac (Heart) Conditions — Bypass surgery, valve replacement, angioplasty, and more</li>
                    <li>Knee, Hip & Other Orthopedic Problems — Joint replacements and sports injury management</li>
                    <li>Kidney Failure, Stones & Other Renal Disorders — Including dialysis and transplant options</li>
                    <li>Liver Cirrhosis, Liver Failure & Other Liver Diseases — With transplant and regenerative therapies</li>
                    <li>Other Surgical & Complex Medical Needs — Multispecialty solutions under one roof</li>
                  </ul>
                </div>

                {/* Note / Call-to-Action */}
                <div className="bg-gray-100 border border-gray-100 rounded-xs p-4 text-gray-700 leading-relaxed shadow-xs">
                  <p>
                    📅 <strong>Don’t miss this opportunity</strong> to receive expert medical guidance directly from the Medivisor team — right in your country!
                  </p>
                </div>
                <div className="bg-[#E22026] p-4">
                  <div className="text-2xl mb-3 font-bold text-gray-100 border-l-4 border-[#E22026] pl-3">
                    What You’ll Learn
                  </div>

                  {/* Bullet List */}
                  <ul className="space-y-1 ml-4 text-gray-100">
                    <li className="list-disc">Treatment options available for your medical condition</li>
                    <li className="list-disc">Estimated treatment cost in India</li>
                    <li className="list-disc">Travel, visa, and hospital arrangements</li>
                    <li className="list-disc">How Medivisor supports you throughout your journey to recovery</li>
                  </ul>
                </div>
                {/* Schedule Heading */}
                <h2 className="text-3xl md:text-2xl font-semibold text-[#241d1f] mt-6">
                  Schedule
                </h2>
              </div>

              <div className="space-y-4">
                {schedule.map((loc) => {
                  const flag = flagForLabel(loc.label);
                  const scheduleDetails = formatScheduleDetails(loc);

                  return (
                    <Card
                      key={loc.id}
                      className="bg-white border border-gray-200 shadow-xs hover:shadow-sm transition-all duration-300 rounded-xs overflow-hidden backdrop-blur-sm"
                    >
                      <CardHeader className="pb-3 px-6 pt-6">
                        <div className="flex items-center gap-4">
                          <div className="relative flex-shrink-0">
                            <img
                              src={flag.src}
                              alt={flag.alt}
                              className="h-16 w-28 rounded-md object-cover"
                              loading="lazy"
                            />
                            <span className="absolute inset-0 rounded-md bg-gradient-to-tr from-white/30 to-transparent" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-xl font-semibold text-[#241d1f] tracking-tight">
                              {loc.label}
                            </CardTitle>
                            {loc.city && (
                              <p className="text-lg md:text-base text-[#241d1f] mt-1">
                                {loc.city}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="px-6 pb-6 pt-4 space-y-4 border-t border-gray-100">
                        {/* Schedule Details */}
                        <div className="space-y-3">
                          {scheduleDetails.map((detail, index) => (
                            <div key={index} className="flex justify-between items-start">
                              <p className="text-base text-[#241d1f] flex-1 leading-relaxed">
                                {detail}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Fee and Contact */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="text-lg md:text-base">
                            <p className="text-gray-500 text-sm">Meeting Fee</p>
                            <p className="font-semibold text-[#241d1f] mt-1">
                              {loc.feeLabel}
                            </p>
                          </div>

                          {loc.localContact && (
                            <div className="text-right text-md:text-sm">
                              <p className="text-gray-500 text-sm">Local Contact</p>
                              <span className="font-medium text-[#241d1f] mt-1 block">
                                {loc.localContact}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Register Now Button */}
                        <div className="pt-4 border-t border-gray-100">
                          <a
                            href="#registration-form" // ID-based registration link
                            className="bg-[#E22026] text-center cursor-pointer md:hidden block w-auto hover:bg-[#74BF44] text-white font-medium px-5 py-3 rounded-md shadow-md transition-all"
                          >
                            Register Now
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <FaqSection />
            </div>

            {/* Right - Sticky Registration Form */}
            <div className="lg:col-span-6">
              <div className="sticky top-16">
                <div id="schedule" className=" ">
                  <div className=" ">
                    <div className="">
                      <Registration />
                    </div>
                  </div>
                </div>
                {/* Additional Info Card */}
                <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xs p-6 transition-all duration-300 hover:shadow-xs">
                  <h4 className="font-semibold text-[#241d1f] mb-3 flex items-center gap-2">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Why Register Early?
                  </h4>
                  <ul className="text-sm text-[#241d1f] ml-2 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-gray-600 mb-2">•</span>
                      Limited slots available per day
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-600 mb-2">•</span>
                      Priority scheduling for early registrations
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-600 mb-2">•</span>
                      Personalized consultation time
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-600 mb-2">•</span>
                      Complete medical guidance
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </section>
  );
}