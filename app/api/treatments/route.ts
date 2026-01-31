// app/api/treatments/route.ts
// API endpoint to fetch all treatments directly from TreatmentMaster collection
// Includes branchesAvailableAt mapping for treatment-to-hospital-branch relationships

import { NextResponse } from "next/server"
import { wixClient } from "@/lib/wixClient"
import { COLLECTIONS } from '@/app/api/hospitals/collections'
import { DataMappers, ReferenceMapper } from '@/app/api/hospitals/mappers'
import type { ExtendedTreatmentType } from '@/types/search'

// Cache for all treatments to avoid multiple expensive fetches
let treatmentsCache: ExtendedTreatmentType[] | null = null
let treatmentsCacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// GET /api/treatments
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const searchQuery = url.searchParams.get("q")?.trim().toLowerCase() || ""
    const category = url.searchParams.get("category")?.trim() || ""
    const popular = url.searchParams.get("popular") === "true"
    const page = Math.max(0, Number(url.searchParams.get("page") || 0))
    const pageSize = Math.min(500, Number(url.searchParams.get("pageSize") || 500)) // Increased limit for 200+ treatments

    const now = Date.now()

    // Check cache first
    if (treatmentsCache && (now - treatmentsCacheTime) < CACHE_DURATION) {
      let filteredTreatments = treatmentsCache

      // Apply filters from cache
      if (searchQuery) {
        filteredTreatments = filteredTreatments.filter(t => 
          (t.name ?? '').toLowerCase().includes(searchQuery) ||
          (t.category ?? '').toLowerCase().includes(searchQuery)
        )
      }

      if (category) {
        filteredTreatments = filteredTreatments.filter(t => t.category === category)
      }

      if (popular) {
        filteredTreatments = filteredTreatments.filter(t => t.popular)
      }

      // Apply pagination
      const total = filteredTreatments.length
      const startIndex = page * pageSize
      const endIndex = startIndex + pageSize
      const paginatedTreatments = filteredTreatments.slice(startIndex, endIndex)

      return NextResponse.json({
        items: paginatedTreatments,
        total,
        page,
        pageSize,
        filteredCount: total,
      })
    }

    // Fetch all treatments from TreatmentMaster collection with branch/hospital references
    const res = await wixClient.items
      .query(COLLECTIONS.TREATMENTS)
      .include("branches", "hospital", "city", "department")
      .limit(1000) // Get all treatments
      .find()

    // Fetch all branches to resolve hospital references and filter ShowHospital=true
    const branchesRes = await wixClient.items
      .query(COLLECTIONS.BRANCHES)
      .include("hospital", "HospitalMaster_branches", "city", "ShowHospital")
      .limit(1000) // Wix API limit
      .find()

    // Create a map of valid branches (ShowHospital=true)
    const validBranchesMap = new Map<string, any>()
    branchesRes.items.forEach((branch: any) => {
      const showHospital = branch?.ShowHospital ?? branch?.data?.ShowHospital ?? branch?.showHospital ?? branch?.data?.showHospital
      const shouldShow = showHospital === true || showHospital === "true" || showHospital === 1 || showHospital === "1" || showHospital === "yes"
      if (shouldShow && branch._id) {
        validBranchesMap.set(branch._id, branch)
      }
    })

    // Fetch all cities for city mapping
    const cityIds = new Set<string>()
    branchesRes.items.forEach((branch: any) => {
      const cities = branch.city || branch.data?.city || []
      const cityArray = Array.isArray(cities) ? cities : [cities]
      cityArray.forEach((c: any) => {
        const cityId = c?._id || c?.ID || c
        if (cityId) cityIds.add(cityId)
      })
    })

    // Fetch city data
    const citiesMap = new Map<string, any>()
    if (cityIds.size > 0) {
      const cityRes = await wixClient.items
        .query(COLLECTIONS.CITIES)
        .hasSome("_id", Array.from(cityIds))
        .limit(500)
        .find()
      
      cityRes.items.forEach((city: any) => {
        if (city._id) {
          citiesMap.set(city._id, {
            _id: city._id,
            cityName: city.cityName || city["City Name"] || city.name || "Unknown City",
            state: city.state || "Unknown State",
            country: city.country || "India",
          })
        }
      })
    }

    // Build treatment-to-branch mapping
    const treatmentBranchesMap = new Map<string, Map<string, any>>()
    
    res.items.forEach((treatment: any) => {
      const treatmentId = treatment._id || treatment.ID
      if (!treatmentId) return

      // Get branch references from treatment
      const branchRefs = treatment.branches || treatment.data?.branches || []
      const branchArray = Array.isArray(branchRefs) ? branchRefs : [branchRefs].filter(Boolean)

      branchArray.forEach((branchRef: any) => {
        const branchId = branchRef?._id || branchRef?._id || branchRef
        if (!branchId) return

        // Only include if branch has ShowHospital=true
        const validBranch = validBranchesMap.get(branchId)
        if (!validBranch) return

        // Get hospital info for this branch
        const hospitalRefs = validBranch.hospital || validBranch.HospitalMaster_branches || validBranch.data?.hospital || []
        const hospitalArray = Array.isArray(hospitalRefs) ? hospitalRefs : [hospitalRefs].filter(Boolean)
        const hospitalId = hospitalArray[0]?._id || hospitalArray[0]?.ID || hospitalArray[0] || validBranch._id
        const hospitalName = validBranch.branchName || validBranch["Branch Name"] || "Unknown Hospital"

        // Get cities for this branch
        const branchCities = validBranch.city || validBranch.data?.city || []
        const cityArray = Array.isArray(branchCities) ? branchCities : [branchCities].filter(Boolean)
        const cities = cityArray.map((c: any) => {
          const cityId = c?._id || c
          return citiesMap.get(cityId) || {
            _id: cityId,
            cityName: c?.cityName || c?.name || "Unknown City",
            state: c?.state || "Unknown State",
            country: "India",
          }
        })

        // Add to treatment's branch mapping
        if (!treatmentBranchesMap.has(treatmentId)) {
          treatmentBranchesMap.set(treatmentId, new Map())
        }
        
        const branchMap = treatmentBranchesMap.get(treatmentId)!
        if (!branchMap.has(branchId)) {
          branchMap.set(branchId, {
            branchId,
            branchName: validBranch.branchName || validBranch["Branch Name"] || "Unknown Branch",
            hospitalId: typeof hospitalId === 'string' ? hospitalId : validBranch._id,
            hospitalName,
            cities,
            departments: [],
            cost: treatment.cost || treatment.averageCost || null,
          })
        }
      })
    })

    // Map treatments to ExtendedTreatmentType format with branchesAvailableAt
    const allTreatments: ExtendedTreatmentType[] = res.items.map((item: any) => {
      const treatment = DataMappers.treatment(item)
      const treatmentId = item._id || item.ID
      
      // Get branchesAvailableAt from our mapping
      const branchesMap = treatmentBranchesMap.get(treatmentId)
      const branchesAvailableAt = branchesMap ? Array.from(branchesMap.values()) : []

      // Get departments from treatment
      const deptRefs = item.department || item.data?.department || []
      const deptArray = Array.isArray(deptRefs) ? deptRefs : [deptRefs].filter(Boolean)
      const departments = deptArray.map((d: any) => ({
        _id: d?._id || d,
        name: d?.name || d?.department || "Unknown Department",
      }))

      return {
        ...treatment,
        branchesAvailableAt,
        departments,
      } as ExtendedTreatmentType
    })

    // Cache the results
    treatmentsCache = allTreatments
    treatmentsCacheTime = now

    // Apply filters
    let filteredTreatments = allTreatments

    if (searchQuery) {
      filteredTreatments = filteredTreatments.filter(t => 
        (t.name ?? '').toLowerCase().includes(searchQuery) ||
        (t.category ?? '').toLowerCase().includes(searchQuery)
      )
    }

    if (category) {
      filteredTreatments = filteredTreatments.filter(t => t.category === category)
    }

    if (popular) {
      filteredTreatments = filteredTreatments.filter(t => t.popular)
    }

    // Sort alphabetically
    filteredTreatments.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))

    // Apply pagination
    const total = filteredTreatments.length
    const startIndex = page * pageSize
    const endIndex = startIndex + pageSize
    const paginatedTreatments = filteredTreatments.slice(startIndex, endIndex)

    return NextResponse.json({
      items: paginatedTreatments,
      total,
      page,
      pageSize,
      filteredCount: total,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error: any) {
    console.error("API Error:", error)
    const errorMessage = error.message || "An unknown error occurred on the server."
    return NextResponse.json({ error: "Failed to fetch treatments", details: errorMessage }, { status: 500 })
  }
}
