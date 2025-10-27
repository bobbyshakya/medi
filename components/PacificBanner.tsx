// components/Banner.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Banner() {
  return (
    <div className="relative px-2 bg-[#fffef7] overflow-hidden">
      <div className=" grid md:grid-cols-2 items-center md:gap-12">
        {/* Left - Image */}
        <div className="relative order-2 md:order-1 group w-full h-full">
          <div className="w-full h-[50vh]  md:h-[calc(100vh-100px)]">
            <Image
              src="/teams/sushant-sir.png"
              alt="Mr. Kumar Sushant - Director, Medivisor India Treatment"
              className="w-full h-full absolute bottom-0 object-cover md:object-cover"
              width={800}
              height={600}
              priority
            />
          </div>
        </div>

        {/* Right - Content */}
        <div className="space-y-2  flex items-center  md:relative md:order-2 order-1 h-full">
          {/* Heading */}
          <div className=" container mx-auto px-6 lg:px-12">
            <div>
            <div className="">
              <h2 className="text-4xl sm:text-6xl text-center font-semibold tracking-tight text-gray-900">
                Pacific Patient Meet
              </h2>
              <p className="heading-lg my-2 text-center font-medium">
                Nov 18 – 26, 2025
              </p>
            </div>

            {/* Schedule Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 h-full justify-between pt-4">
              {[
                { flag: "/icon/flag/png.png", country: "Papua New Guinea", city: "Port Moresby", date: "Nov 18–19" },
                { flag: "/icon/flag/solomon-flag.png", country: "Solomon Islands", city: "Honiara", date: "Nov 20–21" },
                { flag: "/icon/flag/vanuatu.png", country: "Vanuatu", city: "Port Vila", date: "Nov 23–24" },
                { flag: "/icon/flag/fiji.png", country: "Fiji", city: "Lautoka & Suva", date: "Nov 25–26" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col col-span-1 items-center justify-center">
                  <Image
                    src={item.flag}
                    alt={`${item.country} Flag`}
                    className="w-full h-auto mb-0"
                    width={100}
                    height={60}
                  />
                  <p className="font-semibold text-gray-800 text-lg md:text-sm mt-3 text-center">
                    {item.country}
                  </p>
                  <p className="font-semibold text-gray-800 text-lg md:text-sm text-center">
                    ({item.city})
                  </p>
                  <p className="text-lg text-gray-800 md:text-sm mt-0">{item.date}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#74c044] z-[9] absolute bottom-0 md:-left-1/2 border border-white rounded-xs p-3 shadow-xs">
            <h3 className="text-xl font-bold text-gray-100">Mr. Kumar Sushant</h3>
            <p className="text-gray-100 text-sm">Director, Medivisor India Treatment</p>
          </div>

          {/* Link to Main Content */}
          <div className="pt-6 relative flex justify-center z-10">
            <Link href="/pacific-patient#schedule">
              <Button size="lg" className="bg-[#E22026] hover:bg-[#E22026]/90 text-white font-semibold px-8 py-3 rounded-md text-lg">
                View Full Schedule & Register
              </Button>
            </Link>
          </div>
          </div>
        </div>
      </div>

      {/* Decorative Gradient Circles */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-red-100 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 right-0 w-56 h-56 bg-green-100 rounded-full blur-3xl opacity-50"></div>
    </div>
  );
}