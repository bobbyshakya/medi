// app/doctors/[slug]/page.tsx
// Server-side rendered doctor detail page with ISR

import { notFound } from "next/navigation"
import { findDoctorBySlug, getAllHospitalsData } from "./utils"
import DoctorDetailClient from "./DoctorDetailClient"

// Enable ISR with revalidation - revalidate every hour
export const revalidate = 3600

interface DoctorPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DoctorPage({ params }: DoctorPageProps) {
  // Resolve params (Next.js 15 requires awaiting params)
  const resolvedParams = await params
  const { slug } = resolvedParams

  // Fetch doctor and hospital data on the server
  const [doctor, hospitals] = await Promise.all([
    findDoctorBySlug(slug),
    getAllHospitalsData()
  ])

  // Handle doctor not found
  if (!doctor) {
    notFound()
  }

  // Pass data to client component for interactive features
  return (
    <DoctorDetailClient 
      doctor={doctor}
      allHospitals={hospitals as unknown as any}
    />
  )
}
