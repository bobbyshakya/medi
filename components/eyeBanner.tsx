// components/Banner.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Banner() {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Container */}
      <div className="relative z-10   grid md:grid-cols-2 items-center md:gap-4 md:gap-12">
        <div className="relative flex justify-center md:justify-center">
          <div className="relative w-full  md:h-[calc(100vh-100px)]">
            <Image
              src="/eye-banner.png"
              alt="Medivisor Eye Test - Fiji Banner"
              className="w-full h-full object-cover"
              width={800}
              height={600}
              priority
            />
          </div>
        </div>
        {/* Left: Text Content */}
        <div className="md:space-y-8 px-4 md:px-20 md:px-0 space-y-4 text-center md:text-left">
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

          {/* Link to Main Content */}
          <div className="pt-6">
            <Link href="/fiji-eye-test/#schedule">
              <Button size="lg" className="bg-[#E22026] hover:bg-[#E22026]/90 text-white font-semibold px-8 py-3 rounded-md text-lg">
                View Full Schedule & Register
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}