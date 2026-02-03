"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Hospital, MapPin } from "lucide-react"
import type { BranchType } from '@/types/search'
import { getWixImageUrl, generateSlug, formatLocation } from '@/types/search'

type HospitalCardProps = {
  branch: BranchType & { hospitalName: string; hospitalLogo: string | null; hospitalId: string }
}

const ScrollableTitle = ({ text, className, isHovered }: { text: string; className?: string; isHovered: boolean }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const textRef = React.useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [animationDuration, setAnimationDuration] = useState('0s');

  React.useEffect(() => {
    const checkOverflow = () => {
      const rAF = window.requestAnimationFrame(() => {
        if (containerRef.current && textRef.current) {
          const containerWidth = containerRef.current.clientWidth;
          const textWidth = textRef.current.scrollWidth;

          if (textWidth > containerWidth) {
            setIsOverflowing(true);
            const duration = textWidth / 50;
            setAnimationDuration(`${Math.max(duration, 5)}s`);
          } else {
            setIsOverflowing(false);
            setAnimationDuration('0s');
          }
        }
      });
      return () => window.cancelAnimationFrame(rAF);
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);

    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);

  // Check if we're on mobile
  const [isMobile, setIsMobile] = useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // On mobile: show 2 lines (no hover effects)
  if (isMobile) {
    return (
      <div className={`${className} line-clamp-2`}>
        {text}
      </div>
    );
  }

  // On desktop: use original marquee logic
  const isMarqueeActive = isOverflowing && isHovered;

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden ${className}`}
    >
      <div
        className={`whitespace-nowrap inline-block ${!isMarqueeActive ? 'truncate w-full' : ''}`}
        style={{
          animation: isMarqueeActive ? `marquee ${animationDuration} linear infinite` : 'none',
          transform: 'translateX(0)',
        }}
      >
        <span ref={textRef} className="inline-block pr-8">
          {text}
        </span>

        {isMarqueeActive && (
          <span className="inline-block pr-8">
            {text}
          </span>
        )}
      </div>
    </div>
  );
};

const HospitalCard = ({ branch }: HospitalCardProps) => {
  const [isHovered, setIsHovered] = useState(false); // ADDED hover state
  const slug = generateSlug(`${branch.branchName}`)
  const imageUrl = getWixImageUrl(branch.branchImage)
  const primaryCity = branch.city?.[0] || null
  const locationDisplay = formatLocation(primaryCity) // Format: "City, State, Country"
  const hospitalLogoUrl = getWixImageUrl(branch.hospitalLogo)
  const primarySpecialty = branch.specialization?.[0]?.name || "General Care"
  const accreditationLogoUrl = getWixImageUrl(branch.accreditation?.[0]?.image)

  return (
    <Link href={`/search/hospitals/${slug}`} prefetch className="block">
      <article
        className="group bg-white rounded-xs shadow-sm md:mb-0 mb-5 md:shadow-xs transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col hover:shadow-sm border border-gray-300 md:border-gray-100"
        onMouseEnter={() => setIsHovered(true)} // ADDED handler
        onMouseLeave={() => setIsHovered(false)} // ADDED handler
      >
        <div className="relative h-72 md:h-48 overflow-hidden bg-gray-50">
          {hospitalLogoUrl && (
            <div className="absolute bottom-2 left-2 z-10">
              <img
                src={hospitalLogoUrl}
                alt={`${branch.hospitalName} logo`}
                className="w-16 md:w-12 h-auto object-cover p-0 rounded-xs shadow-sm border border-gray-50"
                onError={(e) => { e.currentTarget.style.display = "none" }}
              />
            </div>
          )}

          {accreditationLogoUrl && (
            <div className="absolute top-2 right-2 z-10">
              <img
                src={accreditationLogoUrl}
                alt={branch.accreditation?.[0]?.title || 'Accreditation'}
                className="md:w-7 w-8 h-auto object-contain bg-white p-0 rounded-full shadow-sm border border-gray-50"
                onError={(e) => { e.currentTarget.style.display = "none" }}
              />
            </div>
          )}

          {imageUrl ? (
            <img
              src={imageUrl}
              alt={branch.branchName}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { e.currentTarget.style.display = "none" }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Hospital className="w-12 h-12 text-gray-200" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent" />
        </div>

        <div className="p-3 flex-1 flex flex-col space-y-2">
          <header className="md:space-y-1">
            {/* Branch Name */}
            <h2 className="w-full md:h-6 text-2xl md:mb-0 mb-2 md:text-lg font-medium leading-snug text-gray-800 transition-colors">
              <ScrollableTitle
                text={branch.branchName}
                isHovered={isHovered}
              />
            </h2>

            {/* Specialty */}
            <div className="flex items-center gap-x-1.5 text-lg md:text-sm font-normal md:font-medium text-gray-700">
              {primarySpecialty} Speciality
            </div>

            {/* Location - Format: "City, State, Country" */}
            <div className="flex items-center gap-x-1.5 text-lg md:text-sm font-normal md:font-medium text-gray-700">
              <MapPin className="md:w-3.5 h-4 md:h-3.5 w-4 flex-shrink-0 text-[#E22026] mb-1" />
              <span className="truncate">{locationDisplay}</span>
            </div>
          </header>


          {/* <footer className="border-t border-gray-100 pt-2 mt-auto">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center rounded-xs bg-gray-50 p-2 border border-gray-50 space-y-0">
                <p className=" text-lg md:text-sm font-medium text-gray-700">{branch.yearEstablished ?? '?'}</p>
                <p className=" text-lg md:text-sm text-gray-700">Estd.</p>
              </div>
              <div className="text-center rounded-xs bg-gray-50 p-2 border border-gray-50 space-y-0">
                <p className=" text-lg md:text-sm font-medium text-gray-700">{branch.totalBeds ?? '?'}+</p>
                <p className=" text-lg md:text-sm text-gray-700">Beds</p>
              </div>
              <div className="text-center rounded-xs bg-gray-50 p-2 border border-gray-50 space-y-0">
                <p className=" text-lg md:text-sm font-medium text-gray-700">{branch.noOfDoctors ?? '?'}+</p>
                <p className=" text-lg md:text-sm text-gray-700">Doctors</p>
              </div>


            </div>
          </footer> */}
        </div>
      </article>
    </Link>
  )
}

export default HospitalCard