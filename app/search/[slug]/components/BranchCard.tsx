"use client"

import Link from "next/link"
import { Building2, MapPin } from "lucide-react"
import ImageWithFallback from "./ImageWithFallback"
import InfiniteHoverScroll from "./InfiniteHoverScroll"
import StatBox from "./StatBox"
import AccreditationPill from "./AccreditationPill"
import { getImageUrl, generateSlug, getWixImageUrl } from "../utils"

const BranchCard = ({ branch, hospitalSlug }: { branch: any, hospitalSlug: string }) => {
  const branchImage = getImageUrl(branch.branchImage || branch.logo)
  const hospitalLogo = getImageUrl(branch.logo)
  const accImage = branch.accreditation?.[0]?.image ? getWixImageUrl(branch.accreditation[0].image) : null

  const branchSlug = generateSlug(branch.branchName)
  const branchNameDisplay = branch.isMain ? `${branch.branchName || 'Unnamed Branch'} (Main)` : (branch.branchName || 'Unnamed Branch')
  const linkHref = `/search/hospitals/${branchSlug}`

  const doctorsCount = branch.noOfDoctors || branch.doctors?.length || 'N/A'
  const firstCityName = branch.city?.[0]?.name || branch.city?.[0]?.cityName || 'N/A'
  const bedsCount = branch.totalBeds || 'N/A'
  const estdYear = branch.yearEstablished || 'N/A'

  return (
    <Link
      href={linkHref}
      aria-label={`View details for ${branchNameDisplay} in ${firstCityName}`}
      className={`group block h-full border border-gray-100 rounded-xs shadow-xs bg-white hover:shadow-sm transition-all duration-300 relative flex flex-col overflow-hidden transform hover:-translate-y-0.5`}
    >
      <div className="relative w-full h-48 bg-gray-100">
        <ImageWithFallback
          src={branchImage}
          alt={`${branchNameDisplay} facility`}
          fallbackIcon={Building2}
          className="w-full h-full object-cover object-center transition-transform duration-500"
          fallbackClassName="bg-gray-100"
        />

        {accImage && (
          <div className="absolute top-3 right-3 z-10 p-0 bg-white rounded-full shadow-lg">
            <img
              src={accImage}
              alt="Accreditation badge"
              className="w-6 h-6 object-contain rounded-full"
            />
          </div>
        )}
      </div>

      <div className={`p-4 flex-1 flex flex-col justify-between font-light`}>
        <div className="mb-3">
          <div className="mb-2">
            <InfiniteHoverScroll
              className="text-lg font-medium text-gray-900 leading-snug group-hover:text-gray-700 transition-colors"
              speed={45}
            >
              {branchNameDisplay}
            </InfiniteHoverScroll>
          </div>
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="truncate">{firstCityName}</span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatBox value={estdYear} label="Estd." showPlus={false} />
          <StatBox value={bedsCount} label="Beds" />
          <StatBox value={doctorsCount} label="Doctors" />
        </div>
      </div>
    </Link>
  )
}

export default BranchCard