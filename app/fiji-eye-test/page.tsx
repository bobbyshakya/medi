import { schedule, formatDateFriendly, formatScheduleDetails } from "@/lib/eye-test";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Registration from "@/components/eye-test-form";
import Link from "next/link";
import Partners from "@/components/Partners";
import BlogCarousel from "@/components/BlogSection";
import Testimonials from "@/components/Testimonials";

// Helper function to map schedule labels to flag placeholders
function flagForLabel(label: string) {
    const L = label.toLowerCase();
    if (L.includes("fiji") || L.includes("eye")) {
        return { src: "/icon/flag/fiji.png", alt: "Flag of Fiji" };
    }
    return { src: "/icon/flag/fiji.png", alt: "Country flag" };
}

export default function Page() {
    return (
        <section className="w-full bg-white">
            <div className="relative overflow-hidden bg-white">
                {/* Container */}
                <div className="relative z-10 container mx-auto px-6 lg:px-16 py-20 grid md:grid-cols-2 items-center gap-4 md:gap-12">
                    <div className="relative flex justify-center md:justify-center">
                        <div className="relative w-full md:h-[70vh] ">
                            <img
                                src="/eye-banner.png"
                                alt="Mr. Kumar Sushant - Director, Medivisor India Treatment"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                    {/* Left: Text Content */}
                    <div className="md:space-y-8 space-y-4 text-center md:text-left">
                        <div className="space-y-4">

                            <h1 className="text-4xl text-[#E22026] md:my-0 my-4 sm:text-8xl uppercase font-semibold leading-[0.9] ">
                                <span className="md:text-3xl text-[#E22026]  ml-1">Medivisor </span>
                                <br className="md:block hidden"/>
                                Eye Test
                            </h1>
                            <p className="text-xl font-medium text-gray-600 ml-1.5">
                                FIJI- October 27 – 30, 2025
                            </p>
                        </div>

                        {/* Schedule Boxes */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                            {[
                                { city: "Suva", date: "Oct 27" },
                                { city: "Suva", date: "Oct 28" },
                                { city: "Lautoka", date: "Oct 29" },
                                { city: "Namaka", date: "Oct 30" },
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className="relative bg-white border border-gray-100 rounded-xs shadow-xs hover:shadow-xs "
                                >
                                    <div className="absolute inset-x-0 top-0 h-1.5 rounded-t-xs bg-[#74BF44]"></div>
                                    <div className="p-5 text-center">
                                        <p className="font-bold text-base text-[#E22026] mt-1">{item.date}</p>
                                        <p className="font-semibold  text-gray-800  text-xl">{item.city}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 sm:px-6 mt-10 lg:px-8">
                {/* ===================== SCHEDULE + STICKY REGISTRATION ===================== */}
                <section className="h-full py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        {/* Left - Schedule */}
                        <div id="schedule" className="lg:col-span-6 space-y-4">
                            <div className="mb-5 space-y-3">
                                {/* Intro */}
                                <h2 className="title-text">Blurry Vision? Consult with an Indian Eye Specialist</h2>
                                <div className="text-gray-700 leading-relaxed text-base">
                                    If you or your loved ones are experiencing vision-related problems such as retina, cornea, cataract, or glaucoma, here's an opportunity to meet an experienced Indian eye specialist visiting your country.
                                </div>

                                {/* Heading */}
                                <div className="bg-[#E22026] p-4">
                                    <div className="text-2xl mb-3 font-bold text-gray-100 border-l-4 border-[#E22026] pl-3">
                                        During your consultation, you will learn about:
                                    </div>

                                    {/* Bullet List */}
                                    <ul className="space-y-1 ml-8 text-gray-100">
                                        <li className="list-disc">Treatment options available for your condition</li>
                                        <li className="list-disc">Estimated treatment cost in India</li>
                                        <li className="list-disc">Travel assistance and requirements</li>
                                    </ul>
                                </div>
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
                                                        <p className="text-gray-500 text-sm">Consultation Fee</p>
                                                        <p className="font-semibold text-[#241d1f] mt-1">
                                                            {loc.feeLabel}
                                                        </p>
                                                        <p className="text-gray-700 text-xs mt-0.5 italic">
                                                            Any tests to cost extra.
                                                        </p>
                                                    </div>



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
                                <div id="registration-form">
                                    <div className="">
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
                                            Complete medical guidance for eye conditions
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