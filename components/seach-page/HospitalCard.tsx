"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { HospitalType as Hospital } from "@/types/hospital"
import { getWixScaledToFillImageUrl, getWixImageUrl } from "@/lib/wixMedia"
import { HospitalIcon, Phone, Globe, Mail } from "lucide-react"
import { BranchesPreview } from "@/components/seach-page/branches"
import ScrollableTitle from "@/components/ScrollableTitle"

type Props = {
  hospital: Hospital
}

function getImageUrl(h: Hospital, width = 800, height = 500): string | null {
  // Prefer main Hospital Image then fallback to Logo
  const main = h.image || h.logo
  if (!main) return null
  return getWixScaledToFillImageUrl(main, width, height) || getWixImageUrl(main)
}

export function HospitalCard({ hospital }: Props) {
  const [isHovered, setIsHovered] = useState(false)
  const cover = getImageUrl(hospital, 800, 500)

  return (
    <Card
      className="overflow-hidden border-border bg-background text-foreground"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover || "/placeholder.svg"}
          alt={hospital.name}
          className="h-48 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="h-48 w-full grid place-items-center bg-muted">
          <HospitalIcon className="h-8 w-8 text-muted-foreground" />
          <span className="sr-only">No image</span>
        </div>
      )}

      <CardHeader className="space-y-1">
        <CardTitle className="text-balance"><ScrollableTitle text={hospital.name} isHovered={isHovered} /></CardTitle>
        {hospital.city && <p className="text-sm text-muted-foreground">{hospital.city}</p>}
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        {hospital.accreditation && (
          <p>
            <span className="font-medium">Accreditation:</span>{" "}
            <span className="text-muted-foreground">{hospital.accreditation}</span>
          </p>
        )}
        {hospital.beds && (
          <p>
            <span className="font-medium">Beds:</span> <span className="text-muted-foreground">{hospital.beds}</span>
          </p>
        )}
        {hospital.emergencyServices !== undefined && hospital.emergencyServices !== null && (
          <p>
            <span className="font-medium">Emergency:</span>{" "}
            <span className="text-muted-foreground">{String(hospital.emergencyServices)}</span>
          </p>
        )}

        <div className="flex flex-wrap gap-3 pt-2 text-muted-foreground">
          {hospital.contactNumber && (
            <a href={`tel:${hospital.contactNumber}`} className="inline-flex items-center gap-1 hover:text-foreground">
              <Phone className="h-4 w-4" /> {hospital.contactNumber}
            </a>
          )}
          {hospital.email && (
            <a href={`mailto:${hospital.email}`} className="inline-flex items-center gap-1 hover:text-foreground">
              <Mail className="h-4 w-4" /> Email
            </a>
          )}
          {hospital.website && (
            <a
              href={hospital.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <Globe className="h-4 w-4" /> Website
            </a>
          )}
        </div>

        {hospital._id && <BranchesPreview hospitalId={hospital._id} hospitalSlug={hospital.slug} className="pt-2" />}
      </CardContent>
    </Card>
  )
}
