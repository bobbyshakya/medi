"use client"

import { useState } from "react"
import Link from "next/link"
import { Hospital } from "lucide-react"
import classNames from "classnames"
import { Inter } from "next/font/google"
import MarqueeHeading from "./MarqueeHeading"
import { generateSlug, getHospitalImage, getHospitalLogo, getWixImageUrl } from "../utils"

const inter = Inter({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  variable: "--font-inter"
})

const BranchCard = ({ data }: { data: any }) => {
  const [isHovered, setIsHovered] = useState(false)
  const { branchName, city, specialization, noOfDoctors, totalBeds, hospitalName, yearEstablished, branchImage, accreditation, logo, address } = data
  const firstCity = city?.[0]?.cityName || 'N/A'
  const firstSpeciality = specialization?.[0]?.name || 'Multi Speciality'
  const fullSlug = generateSlug(branchName)
  const hospitalImg = getHospitalImage(branchImage)
  const hospitalLogo = getHospitalLogo(logo)
  const accImage = accreditation?.[0] ? getWixImageUrl(accreditation[0].image) : null

  return (
    <Link
      href={`/search/hospitals/${fullSlug}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group block h-full focus:outline-none focus:ring-2 focus:ring-gray-400/50 border border-gray-200 md:border-gray-100 rounded-xs shadow-lg md:shadow-xs bg-white hover:shadow-sm transition-shadow relative flex flex-col overflow-hidden"
    >
      <div className="relative w-full h-72 md:h-48 bg-gray-50">
        {hospitalImg ? (
          <img src={hospitalImg} alt={`${hospitalName} ${branchName} facility`} className="object-cover w-full h-full" onError={(e) => { e.currentTarget.style.display = "none" }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Hospital className="w-12 h-12 text-gray-300" /></div>
        )}
        {accImage && (
          <div className="absolute top-4 right-4 z-10">
            <img src={accImage} alt="Accreditation badge" className="w-7 h-7 object-contain rounded-full shadow-lg" onError={(e) => { e.currentTarget.style.display = "none" }} />
          </div>
        )}
        {hospitalLogo && (
          <div className="absolute bottom-2 left-2 z-10">
            <img src={hospitalLogo} alt={`${hospitalName} logo`} className="w-12 h-auto object-contain" onError={(e) => { e.currentTarget.style.display = "none" }} />
          </div>
        )}
      </div>
      <div className={`p-3 md:flex-1 flex flex-col justify-between ${inter.variable} font-light`}>
        <div className="mb-1 overflow-hidden">
          <MarqueeHeading isHovered={isHovered}>
            <h3 className="text-2xl md:text-lg font-medium text-gray-900 leading-tight">
              {branchName}
            </h3>
          </MarqueeHeading>
        </div>
        <div className="mb-2">
          <p className="text-lg md:text-sm text-gray-600 line-clamp-1">{address || firstCity}, {firstSpeciality} Speciality</p>
        </div>
        {/* <div className="mb-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={`text-sm ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
            ))}
            <span className="text-sm text-gray-600 ml-1">4.0 (120 reviews)</span>
          </div>
        </div> */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-gray-50 rounded-xs border border-gray-100">
            <p className="md:text-sm text-base font-medium text-gray-700">{yearEstablished || 'N/A'}</p>
            <p className="md:text-sm text-base text-gray-700">Estd.</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-xs border border-gray-100">
            <p className="md:text-sm text-base font-medium text-gray-700">{totalBeds || 0}+</p>
            <p className="md:text-sm text-base text-gray-700">Beds</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-xs border border-gray-100">
            <p className="md:text-sm text-base font-medium text-gray-700">{noOfDoctors || 0}+</p>
            <p className="md:text-sm text-base text-gray-700">Doctors</p>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default BranchCard