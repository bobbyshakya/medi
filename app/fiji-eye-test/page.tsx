 import { schedule, formatDateFriendly, formatScheduleDetails } from "@/lib/eye-test";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Registration from "@/components/eye-test-form";
import Link from "next/link";
import Partners from "@/components/Partners";
import BlogCarousel from "@/components/BlogSection";
import Testimonials from "@/components/Testimonials";

export const metadata = {
  title: 'Medivisor Eye Test - Fiji | Consult Indian Eye Specialist October 27-30, 2025',
  description: 'If you or your loved ones are facing vision problems related to retina, cornea, cataract, or glaucoma, consult an experienced Indian eye specialist from Sharp Sight Eye Hospitals in Fiji. Get expert advice, treatment options, and cost estimates.',
  openGraph: {
    title: 'Medivisor Eye Test - Fiji | Consult Indian Eye Specialist October 27-30, 2025',
    description: 'If you or your loved ones are facing vision problems related to retina, cornea, cataract, or glaucoma, consult an experienced Indian eye specialist from Sharp Sight Eye Hospitals in Fiji. Get expert advice, treatment options, and cost estimates.',
    images: [
      {
        url: 'https://medivisorindiatreatment.com/thumbnail/eye-test.jpg',
        width: 1200,
        height: 630,
        alt: 'Medivisor Eye Test Fiji Banner - Dr. Rahul Bhatia Consultation',
      },
    ],
    url: 'https://medivisorindiatreatment.com/fiji-eye-test',
    siteName: 'Medivisor',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Medivisor Eye Test - Fiji | Consult Indian Eye Specialist October 27-30, 2025',
    description: 'If you or your loved ones are facing vision problems related to retina, cornea, cataract, or glaucoma, consult an experienced Indian eye specialist from Sharp Sight Eye Hospitals in Fiji. Get expert advice, treatment options, and cost estimates.',
    images: ['https://medivisorindiatreatment.com/thumbnail/eye-test.jpg'],
  },
  other: {
    'whatsapp-title': 'Medivisor Eye Test - Fiji | Consult Indian Eye Specialist October 27-30, 2025',
    'whatsapp-description': 'Consult Dr. Rahul Bhatia for eye conditions in Fiji. Limited slots! Book now.',
  },
};

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
        <section className="w-full md:px-0 bg-white">
            <div className="relative overflow-hidden bg-white">
                {/* Container */}
                <div className="relative z-10 md:container mx-auto lg:px-16 md:py-20 grid md:grid-cols-2 items-center md:gap-4 md:gap-12">
                    <div className="relative flex justify-center md:justify-center">
                        <div className="relative w-full md:h-[70vh]">
                            <img
                                src="/eye-banner.png"
                                alt="Mr. Kumar Sushant - Director, Medivisor India Treatment"
                                className="w-full h-full object-cover"
                                width={800}
                                height={600}
                            />
                        </div>
                    </div>
                    {/* Left: Text Content */}
                    <div className="md:space-y-8 px-4 md:px-0 space-y-4 text-center md:text-left">
                        <div className="space-y-4">
                            <h1 className="text-4xl text-[#E22026] md:my-0 my-4 sm:text-7xl uppercase font-semibold leading-[1.3] md:leading-[0.9]">
                                <span className="md:text-3xl text-[#E22026] ml-1">Medivisor </span>
                                <br className=" " />
                                Eye Test - Fiji
                            </h1>
                            <p className="text-xl font-medium text-gray-600 ml-1.5">
                                October 27 – 30, 2025
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
                                    className="relative bg-white border border-gray-100 rounded-xs shadow-xs hover:shadow-xs"
                                >
                                    <div className="absolute inset-x-0 top-0 h-1.5 rounded-t-xs bg-[#74BF44]"></div>
                                    <div className="p-5 text-center">
                                        <p className="font-bold text-lg text-gray-800 mt-1">{item.date}</p>
                                        <p className="font-bold text-lg text-gray-800">{item.city}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <main className="md:container mx-auto px-4 sm:px-6 md:mt-10 lg:px-8">
                {/* ===================== SCHEDULE + STICKY REGISTRATION ===================== */}
                <section className="h-full py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        {/* Left - Schedule */}
                        <div id="schedule" className="lg:col-span-6 space-y-4">
                            <div className="mb-5 space-y-3">
                                {/* Intro */}
                                <h2 className="text-2xl md:title-heading">𝗕𝗹𝘂𝗿𝗿𝘆 𝗩𝗶𝘀𝗶𝗼𝗻? 𝗠𝗲𝗲𝘁 𝗮𝗻 𝗜𝗻𝗱𝗶𝗮𝗻 𝗘𝘆𝗲 𝗦𝗽𝗲𝗰𝗶𝗮𝗹𝗶𝘀𝘁 𝗶𝗻 𝗙𝗶𝗷𝗶!</h2>
                                <div className="text-gray-700 leading-relaxed text-lg md:text-base">
                                    If you or your loved ones are facing vision problems related with retina, cornea, cataract, or glaucoma, here's your chance to consult an experienced Indian eye specialist from Sharp Sight Eye Hospitals visiting your country.
                                </div>

                                {/* Heading */}
                                <div className="bg-[#E22026] p-4">
                                    <div className="text-2xl mb-3 font-bold text-gray-100 border-l-4 border-[#E22026] pl-3">
                                        During your consultation, you'll get:
                                    </div>

                                    {/* Bullet List */}
                                    <ul className="space-y-1 ml-8 text-lg md:text-base text-gray-100">
                                        <li className="list-disc">Expert advice on your eye condition</li>
                                        <li className="list-disc">Details on treatment options available in India</li>
                                        <li className="list-disc">Estimated cost and travel assistance information</li>
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
                                            {/* <CardHeader className="pb-3 px-6 pt-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative flex-shrink-0">
                                                        <img
                                                            src={flag.src}
                                                            alt={flag.alt}
                                                            className="h-16 w-28 rounded-md object-cover"
                                                            loading="lazy"
                                                            width={112}
                                                            height={64}
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
                                            </CardHeader> */}

                                            <CardContent className="px-6 pb-6 pt-4 space-y-4 border-t border-gray-100">
                                                {/* Schedule Details */}
                                                <div className="space-y-3">
                                                    <h2 className="text-4xl md:text-2xl font-normal text-[#241d1f]">𝗦𝗰𝗵𝗲𝗱𝘂𝗹𝗲</h2>
                                                    {scheduleDetails.map((detail, index) => (
                                                        <div key={index} className="flex justify-between items-start">
                                                            <p className="text-lg md:text-base text-[#241d1f] flex-1 leading-relaxed">
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
                                                            On-spot payment. Any tests to cost extra.
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                            <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-xs shadow-xs p-3 sm:p-8 md:p-10 border border-gray-100">
                                {/* Profile Header */}
                                <div className="flex flex-col md:flex-row md:items-center md:justify-start gap-6 sm:gap-8 mb-8 md:mb-5 text-center md:text-left">
                                    {/* Profile Image */}
                                    <div className="relative mx-auto md:mx-0 w-full h-auto sm:w-40 sm:h-40 md:w-48 md:h-48 md:rounded-full md:border-4 border-[#74c044]/40 bg-white md:shadow-md overflow-hidden flex-shrink-0">
                                        <img
                                            src="/doctors/dr-rahul-bhatia.png"
                                            alt="Dr. Rahul Bhatia"
                                            className="object-cover md:mt-0 mt-4 w-full h-full hover:scale-110 transition-transform duration-500 ease-out"
                                            width={192}
                                            height={192}
                                        />
                                        <p className="bg-gray-50 md:hidden absolute top-1 text-sm text-gray-700 left-1">Visiting Consultant / Specialist</p>
                                    </div>

                                    {/* Name and Credentials */}
                                    <div className="space-y-1 sm:space-y-1 mt-4 md:mt-0">
                                        <h2 className="text-3xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                                            Dr. Rahul Bhatia
                                        </h2>
                                        <p className="text-gray-800 font-semibold text-lg sm:text-lg tracking-wide">
                                            MBBS, MS, DNB
                                        </p>
                                        <p className="text-gray-700 font-medium text-base sm:text-lg tracking-wide">
                                            Sharp Sight Eye Hospitals, New Delhi
                                        </p>
                                          <p className="bg-gray-50 md:block hidden absolute top-3 text-sm text-gray-700 left-3">Visiting Consultant / Specialist</p>
                                    </div>
                                </div>
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
                                    <ul className="text-lg md:text-sm text-[#241d1f] ml-2 space-y-2">
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