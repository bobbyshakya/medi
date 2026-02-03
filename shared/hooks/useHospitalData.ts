"use client"

// shared/hooks/useHospitalData.ts
// Refactored to use the new unified CMS API

import { useState, useEffect } from "react"

interface Hospital {
  _id: string
  hospitalName: string
  logo: string | null
  yearEstablished: string | null
  description: string | null
  branches: any[]
  doctors: any[]
  treatments: any[]
  departments?: any[]
}

interface Treatment {
  _id: string
  name: string
  description: string | null
  category: string | null
  duration: string | null
  cost: string | null
  treatmentImage?: string | null
  branchesAvailableAt: any[]
  departments: any[]
}

interface Doctor {
  _id: string
  doctorName: string
  specialization: any[]
  qualification: string | null
  experienceYears: string | null
  designation: string | null
  aboutDoctor: string | null
  profileImage: string | null
  popular?: boolean
  locations: any[]
  departments: any[]
  relatedTreatments?: any[]
}

interface UseHospitalDataResult {
  hospitals: Hospital[]
  treatments: Treatment[]
  doctors: Doctor[]
  loading: boolean
  error: string | null
}

export const useHospitalData = (pageSize: number = 500): UseHospitalDataResult => {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Use the new unified CMS API
        const res = await fetch(`/api/cms?action=all&pageSize=${pageSize}`)
        if (!res.ok) throw new Error("Failed to fetch CMS data")

        const data = await res.json()
        const hospitalsData: Hospital[] = data.hospitals || []
        const treatmentsData: Treatment[] = data.treatments || []

        // Extract doctors from hospitals
        const doctorsMap = new Map<string, Doctor>()
        hospitalsData.forEach((h) => {
          h.doctors?.forEach((d: any) => {
            if (d._id && !doctorsMap.has(d._id)) {
              doctorsMap.set(d._id, {
                ...d,
                locations: [{ hospitalName: h.hospitalName, hospitalId: h._id }],
                departments: [],
              })
            }
          })
          h.branches?.forEach((b: any) => {
            b.doctors?.forEach((d: any) => {
              if (d._id) {
                if (doctorsMap.has(d._id)) {
                  const existing = doctorsMap.get(d._id)!
                  existing.locations.push({
                    hospitalName: h.hospitalName,
                    hospitalId: h._id,
                    branchName: b.branchName,
                    branchId: b._id,
                  })
                } else {
                  doctorsMap.set(d._id, {
                    ...d,
                    locations: [
                      {
                        hospitalName: h.hospitalName,
                        hospitalId: h._id,
                        branchName: b.branchName,
                        branchId: b._id,
                      },
                    ],
                    departments: [],
                  })
                }
              }
            })
          })
        })

        setHospitals(hospitalsData)
        setTreatments(treatmentsData)
        setDoctors(Array.from(doctorsMap.values()))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [pageSize])

  return { hospitals, treatments, doctors, loading, error }
}
