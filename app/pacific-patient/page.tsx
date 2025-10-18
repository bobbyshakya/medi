import { schedule, formatDateFriendly, formatScheduleDetails } from "@/lib/schedule";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Registration from "@/components/registration-form";
import Link from "next/link";
import Partners from "@/components/Partners";
import BlogCarousel from "@/components/BlogSection";
import Testimonials from "@/components/Testimonials";

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

export default function Page() {
  return (
    <section className="w-full bg-white">
      <div className="relative px-2 bg-[#fffef7]  overflow-hidden">
        <div className="container mx-auto px-6 lg:px-12 grid md:grid-cols-2 items-center md:gap-12">

          {/* Left - Image */}
          <div className="relative order-2 md:order-1 group w-full h-full">
            <div className="  w-full h-[50vh] md:h-[80vh] l">
              <img
                src="/teams/sushant-sir.png"
                alt="Mr. Kumar Sushant - Director, Medivisor India Treatment"
                className="w-full h-full absolute bottom-0 object-cover md:object-cover "
              />
            </div>

          </div>

          {/* Right - Content */}
          <div className="space-y-2 relative md:order-2 order-1  h-full">
            {/* Badge */}
            {/* <span className="inline-block bg-red-100 text-red-600 font-semibold text-xs uppercase tracking-widest px-4 py-1 rounded-full shadow-sm">
              Meet Our Director
            </span> */}

            {/* Heading */}
            <div>
              <div className="md:pt-16">
                <h2 className="text-3xl sm:text-6xl text-center font-semibold tracking-tight text-gray-900">
                  Pacific Patient Meet
                </h2>
                <p className="heading-sm my-4 text-center font-medium">
                  Nov 18 – 26, 2025
                </p>
              </div>

              {/* Director Info */}


              {/* Schedule Section */}
              <div className="flex h-full flex-wrap justify-between gap-4 pt-4">
                {[
                  { flag: "/icon/flag/png.png", country: "PNG", city: "Port Moresby", date: "Nov 18–19" },
                  { flag: "/icon/flag/solomon-flag.png", country: "Solomon Islands", city: "Honiara", date: "Nov 20–21" },
                  { flag: "/icon/flag/vanuatu.png", country: "Vanuatu", city: "Port Vila", date: "Nov 23–24" },
                  { flag: "/icon/flag/fiji.png", country: "Fiji", city: "Lautoka & Suva", date: "Nov 25–26" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center justify-center  w-[calc(25%-0.75rem)]"
                  >
                    <img
                      src={item.flag}
                      alt={`${item.country} Flag`}
                      className="w-32 h-auto  mb-0"
                    />
                    <p className="font-semibold text-gray-800 text-xs md:text-sm mt-3 text-center">
                      {item.country}
                    </p>
                    <p className="font-semibold text-gray-800 text-xs text-center">
                      ({item.city})
                    </p>

                    <p className="text-sm text-gray-800 mt-0">{item.date}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#74c044]  absolute bottom-0  -left-1/2 border border-white rounded-xs p-3 shadow-xs">
              <h3 className="text-xl font-bold text-gray-100">
                Mr. Kumar Sushant
              </h3>
              <p className="text-gray-100 text-sm">
                Director, Medivisor India Treatment
              </p>
            </div>
          </div>
        </div>

        {/* Decorative Gradient Circles */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-red-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-56 h-56 bg-green-100 rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* <Testimonials /> */}


      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* ===================== SCHEDULE + STICKY REGISTRATION ===================== */}
        <section className="h-full py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left - Schedule */}

            <div id="schedule" className="lg:col-span-6 space-y-4">

            
              <div className="   mb-5 space-y-6 ">
                {/* Intro */}
                <div className="text-gray-700 leading-relaxed text-base">
                  For those suffering from infertility, cancer, heart disease, joint pain, spine problems, or kidney disease in
                  Papua New Guinea, Solomon Islands, Vanuatu, or Fiji, here’s a valuable opportunity to meet the Medivisor Director and Doctors right in your country and receive expert medical guidance.
                </div>

               

                {/* Heading */}
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

                {/* Register Box */}
                <h2 className="text-4xl md:text-2xl font-normal text-[#241d1f]">
                  𝗦𝗰𝗵𝗲𝗱𝘂𝗹𝗲

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
                            <div className="text-right text- md:text-sm">
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
              <div className="sticky top-16">
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