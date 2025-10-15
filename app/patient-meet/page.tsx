import { schedule, formatDateFriendly } from "@/lib/schedule";
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
    return { src: "/icon/flag/solomon.png", alt: "Flag of Solomon Islands" };
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
    <section className="w-full bg-gray-50 py-10 sm:py-10 lg:py-10">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* ===================== HERO ===================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-12">
          {/* Left Section */}
          <div className="space-y-5">
            <span className="inline-flex items-center rounded-full border border-gray-300 bg-gray-50 px-4 py-1.5 text-xs font-semibold text-gray-700">
              Patient Meet
            </span>

            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-gray-900 tracking-tight">
              Meet Our Expert Team
              <br />
              Nov&nbsp;18 – 26,&nbsp;2025
              <br />
              <span className="text-lg sm:text-xl font-medium text-gray-600">
                Compassion • Expertise • Excellence
              </span>
            </h1>

            <p className="text-gray-600 text-base leading-relaxed">
              Our medical experts will be visiting the following countries to meet patients and
              provide personalized consultations, helping you understand treatment options, costs,
              and the process for receiving care in India.
            </p>

            <p className="text-gray-700">
              Hosted by{" "}
              <span className="font-semibold text-gray-900">Mr. Kumar Sushant</span>, Director,{" "}
              <span className="font-semibold">Medivisor India Treatment</span>
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-3">
              <Button
                asChild
                className="px-7 py-2.5 text-base font-medium bg-primary text-gray-800 hover:bg-primary/90 shadow-sm"
              >
                <a href="#schedule" aria-label="Register for Patient Meet">
                  Register Now
                </a>
              </Button>
              <Button
                variant="outline"
                asChild
                className="px-7 py-2.5 text-base font-medium border-gray-300 hover:bg-gray-50"
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

        {/* ===================== SCHEDULE + STICKY REGISTRATION ===================== */}
       <section className="h-full">
         <div className="md:grid grid-cols-1  lg:grid-cols-12 md:gap-x-4 gap-y-10 mt-20">
          {/* Left - Schedule */}
          <div id="schedule" className="lg:col-span-6 space-y-6">
            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
                Choose Your City & Date
              </h2>
              <p className="text-gray-600 mt-1">
                All slots are available by appointment only.
              </p>
            </div>

            <div className="md:grid md:gap-6">
              {schedule.map((loc) => {
                const flag = flagForLabel(loc.label);
                return (
                  <Card
                    key={loc.id}
                    className="bg-white/90 border w-full border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300 rounded-xl backdrop-blur-sm"
                  >
                    <CardHeader className="pb-2 px-6 pt-5">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img
                            src={flag.src}
                            alt={flag.alt}
                            className="h-16 w-auto rounded-md"
                            loading="lazy"
                          />
                          <span className="absolute inset-0 rounded-md bg-gradient-to-tr from-white/30 to-transparent" />
                        </div>
                        <CardTitle className="text-xl font-semibold text-gray-800 tracking-tight">
                          {loc.label}
                        </CardTitle>
                      </div>
                    </CardHeader>

                    <CardContent className="px-6 pb-5 pt-3 space-y-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          {loc.dates.map(formatDateFriendly).join(" · ")}
                        </p>
                        <div className="text-right text-sm">
                          <p className="text-gray-500">Meeting Fee</p>
                          <p className="font-semibold text-gray-800">
                            {loc.feeLabel}
                          </p>
                        </div>
                      </div>

                      {loc.localContact && (
                        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                          <p className="text-sm text-gray-500">Local Contact</p>
                          <span className="font-medium text-gray-800">
                            {loc.localContact}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

           <div className=" col-span-6 z-10">
              <Registration />
            </div>
        </div>
       </section>
      </main>

      {/* ===================== BLOG SECTION ===================== */}
      <div className="mt-20">
        <BlogCarousel />
      </div>

      
    </section>
  );
}