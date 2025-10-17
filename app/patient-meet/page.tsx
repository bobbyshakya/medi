import { schedule, formatDateFriendly, formatScheduleDetails } from "@/lib/schedule";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Registration from "@/components/registration-form";
import Link from "next/link";
import BlogCarousel from "@/components/BlogSection";

// Helper function to map schedule labels to flag placeholders
function flagForLabel(label: string) {
  const L = label.toLowerCase();
  if (L.includes("png") || L.includes("papua")) {
    return { src: "/icon/flag/png.png", alt: "Flag of Papua New Guinea" };
  }
  if (L.includes("solomon")) {
    return { src: "/icon/flag/Solomon.png", alt: "Flag of Solomon Islands" };
  }
  if (L.includes("vanuatu")) {
    return { src: "/icon/flag/vanuatu.png", alt: "Flag of Vanuatu" };
  }
  if (L.includes("fiji")) {
    return { src: "/icon/flag/fiji.png", alt: "Flag of Fiji" };
  }
  return { src: "/icon/flag/fiji.png", alt: "Country flag" };
}

export default function Page() {
  return (
    <section className="w-full bg-white">
      <div className="bg-gray-50 py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-12">
            {/* Left Section */}
            <div className="space-y-5">
              <span className="inline-flex items-center rounded-full border border-gray-300 bg-gray-50 px-4 py-1.5 text-xs font-semibold text-[#241d1f]">
                Patient Meet
              </span>

              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-[#241d1f] tracking-tight">
                Meet Our Expert Team
                <br />
                Nov&nbsp;18 – 26,&nbsp;2025
                <br />
                <span className="text-lg sm:text-xl font-medium text-[#241d1f]">
                  Compassion • Expertise • Excellence
                </span>
              </h1>

              <p className="text-[#241d1f] text-lg md:text-base leading-relaxed">
                Our medical experts will be visiting the following countries to meet patients and
                provide personalized consultations, helping you understand treatment options, costs,
                and the process for receiving care in India.
              </p>

              <p className="text-[#241d1f] text-lg md:text-base">
                Hosted by{" "}
                <span className="font-semibold text-[#241d1f]">Mr. Kumar Sushant</span>, Director,{" "}
                <span className="font-semibold">Medivisor India Treatment</span>
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-3">
                <Button
                  asChild
                  variant="outline"
                  className="px-7 py-2.5 text-lg md:text-base bg-white font-medium border-gray-300 hover:bg-gray-50 transition-colors duration-200"
                >
                  <a href="#registration-form" aria-label="Register for Patient Meet">
                    Register Now
                  </a>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="px-7 py-2.5 text-lg md:text-base bg-white font-medium border-gray-300 hover:bg-gray-50 transition-colors duration-200"
                >
                  <a href="#schedule" aria-label="View schedule and cities">
                    View Schedule
                  </a>
                </Button>
              </div>
            </div>

            {/* Right Section - Image */}
            <div className="relative flex justify-center">
              <img
                src="/teams/sushant-sir.png"
                alt="Patient Meet Event"
                className="w-full max-w-md md:max-w-lg h-auto rounded-2xl object-cover shadow-lg"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-white/30 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* ===================== SCHEDULE + STICKY REGISTRATION ===================== */}
        <section className="h-full py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left - Schedule */}
            <div id="schedule" className="lg:col-span-6 space-y-8">
              <div className="text-center md:text-left">
                <h2 className="text-4xl md:text-3xl font-semibold text-[#241d1f]">
                  Choose Your City & Date
                </h2>
                <p className="text-[#241d1f] text-lg md:text-base mt-2">
                  All slots are available by appointment only.
                </p>
              </div>

              <div className="space-y-6">
                {schedule.map((loc) => {
                  const flag = flagForLabel(loc.label);
                  const scheduleDetails = formatScheduleDetails(loc);

                  return (
                    <Card
                      key={loc.id}
                      className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-lg overflow-hidden backdrop-blur-sm"
                    >
                      <CardHeader className="pb-3 px-6 pt-6">
                        <div className="flex items-center gap-4">
                          <div className="relative flex-shrink-0">
                            <img
                              src={flag.src}
                              alt={flag.alt}
                              className="h-16 w-16 rounded-md object-cover"
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
                            <div className="text-right text-lg md:text-base">
                              <p className="text-gray-500 text-sm">Local Contact</p>
                              <span className="font-medium text-[#241d1f] mt-1 block">
                                {loc.localContact}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Right - Sticky Registration Form */}
            <div className="lg:col-span-6">
              <div className="sticky top-24">
                <div 
                  id="registration-form"
                  className=" "
                >
                  <div className=" ">
                    <div className="">
                    
                      <Registration />
                    </div>
                  </div>
                </div>
                
                {/* Additional Info Card */}
                <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6 transition-all duration-300 hover:shadow-md">
                  <h4 className="font-semibold text-[#241d1f] mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Why Register Early?
                  </h4>
                  <ul className="text-sm text-[#241d1f] space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-gray-600 mt-1">•</span>
                      Limited slots available per day
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-600 mt-1">•</span>
                      Priority scheduling for early registrations
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-600 mt-1">•</span>
                      Personalized consultation time
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-600 mt-1">•</span>
                      Complete medical guidance
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ===================== BLOG SECTION ===================== */}
      <div className="mt-16 bg-gray-50 py-12">
        <BlogCarousel />
      </div>
    </section>
  );
}