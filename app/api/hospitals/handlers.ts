// app/api/hospitals/handlers.ts
// Main business logic handlers for hospitals API

import { wixClient } from "@/lib/wixClient"
import { COLLECTIONS } from './collections'
import { DataMappers, ReferenceMapper } from './mappers'
import { fetchAllBranches, fetchDoctors, fetchCitiesWithStateAndCountry, fetchByIds, cachedFetchByIds, fetchTreatmentsWithFullData, fetchSpecialistsWithDeptAndTreatments } from './fetchers'
import { shouldShowHospital, shouldShowHospitalForHospital, isStandaloneBranch, accreditationsCache } from './utils'
import { generateSlug } from './shared-utils'
import type { FilterIds, HospitalData } from './types'

/**
 * Enriches hospitals with branch, doctor, and treatment data
 */
export async function enrichHospitals(
  hospitals: HospitalData[],
  filterIds: FilterIds,
) {
  const hospitalIds = hospitals.map((h) => h._id).filter(Boolean)

  // STEP 1 & 2: Fetch branches for grouped and standalone hospitals in parallel
  const [groupedBranchesRes, standaloneBranchesRes] = await Promise.all([
    wixClient.items
      .query(COLLECTIONS.BRANCHES)
      .include(
        "hospital",
        "HospitalMaster_branches",
        "city",
        "doctor",
        "specialty",
        "accreditation",
        "treatment",
        "specialist",
        "ShowHospital",
      )
      .hasSome("HospitalMaster_branches", hospitalIds)
      .limit(1000)
      .find(),
    wixClient.items
      .query(COLLECTIONS.BRANCHES)
      .include(
        "hospital",
        "HospitalMaster_branches",
        "city",
        "doctor",
        "specialty",
        "accreditation",
        "treatment",
        "specialist",
        "ShowHospital",
      )
      .hasSome("hospital", hospitalIds)
      .limit(1000)
      .find()
  ])

  // Combine both branch results and filter to only include ShowHospital=true branches
  let allBranches = [...groupedBranchesRes.items, ...standaloneBranchesRes.items]
  allBranches = allBranches.filter((b: any) => shouldShowHospital(b))

  // Create a map to deduplicate branches by ID
  const uniqueBranchesMap = new Map<string, any>()
  allBranches.forEach((b: any) => {
    if (b._id) {
      uniqueBranchesMap.set(b._id, b)
    }
  })

  const uniqueBranches = Array.from(uniqueBranchesMap.values())

  const branchesByHospital: Record<string, any[]> = {}
  const doctorIds = new Set<string>()
  const cityIds = new Set<string>()
  const specialtyIds = new Set<string>()
  const accreditationIds = new Set<string>()
  const treatmentIds = new Set<string>()
  const specialistIds = new Set<string>()

  // Process all branches (both grouped and standalone)
  uniqueBranches.forEach((b: any) => {
    // Get hospital IDs from both grouping and direct references
    const hIds = new Set<string>()

    // Add hospital IDs from group reference (existing logic)
    ReferenceMapper.extractHospitalIds(b).forEach((id) => hIds.add(id))

    // Add hospital IDs from direct hospital reference (new logic)
    const directHospitalRefs = ReferenceMapper.multiReference(
      b.hospital || b.data?.hospital,
      "hospitalName", "Hospital Name"
    )
    directHospitalRefs.forEach((h: any) => {
      if (h._id) hIds.add(h._id)
    })

    // Add branch to all relevant hospitals
    hIds.forEach((hid) => {
      if (hospitalIds.includes(hid)) {
        if (!branchesByHospital[hid]) branchesByHospital[hid] = []
        const mapped = DataMappers.branch(b)
        branchesByHospital[hid].push(mapped)

        // Collect IDs for enrichment
        ReferenceMapper.extractIds(mapped.doctors).forEach((id) => doctorIds.add(id))
        ReferenceMapper.extractIds(mapped.city).forEach((id) => cityIds.add(id))
        ReferenceMapper.extractIds(mapped.accreditation).forEach((id) => accreditationIds.add(id))
        ReferenceMapper.extractIds(mapped.specialists).forEach((id) => specialistIds.add(id))
        ReferenceMapper.extractIds(mapped.treatments).forEach((id) => treatmentIds.add(id))

        mapped.specialization.forEach((s: any) => {
          if (s.isTreatment) {
            treatmentIds.add(s._id)
          } else {
            specialtyIds.add(s._id)
          }
        })
      }
    })
  })

  const [doctors, cities, accreditations, treatments, enrichedSpecialists] = await Promise.all([
    fetchDoctors(Array.from(doctorIds)),
    fetchCitiesWithStateAndCountry(Array.from(cityIds)),
    cachedFetchByIds(COLLECTIONS.ACCREDITATIONS, Array.from(accreditationIds), DataMappers.accreditation, accreditationsCache),
    fetchTreatmentsWithFullData(Array.from(treatmentIds)),
    fetchSpecialistsWithDeptAndTreatments(Array.from(new Set([...specialtyIds, ...specialistIds]))),
  ])

  return hospitals.map((hospital) => {
    const rawBranches = branchesByHospital[hospital._id] || []
    const filteredBranches = rawBranches.filter((b) => {
      // Always check ShowHospital for visibility control
      if (!shouldShowHospital(b)) {
        return false
      }

      const matchBranch = !filterIds.branch.length || filterIds.branch.includes(b._id)
      const matchCity = !filterIds.city.length || b.city.some((c: any) => filterIds.city.includes(c._id))
      const matchDoctor = !filterIds.doctor.length || b.doctors.some((d: any) => filterIds.doctor.includes(d._id))
      const matchSpecialty =
        !filterIds.specialty.length ||
        b.specialization.some((s: any) => !s.isTreatment && filterIds.specialty.includes(s._id))
      const matchTreatment =
        !filterIds.treatment.length || b.treatments.some((t: any) => filterIds.treatment.includes(t._id))
      const matchSpecialist =
        !filterIds.specialist.length || b.specialists.some((s: any) => filterIds.specialist.includes(s._id))
      const matchDepartment =
        !filterIds.department.length ||
        b.specialists.some((s: any) => s.department.some((d: any) => filterIds.department.includes(d._id)))
      const matchAccred =
        !filterIds.accreditation.length || b.accreditation.some((a: any) => filterIds.accreditation.includes(a._id))
      return (
        matchBranch &&
        matchCity &&
        matchDoctor &&
        matchSpecialty &&
        matchTreatment &&
        matchSpecialist &&
        matchDepartment &&
        matchAccred
      )
    })

    const enrichedBranches = filteredBranches.map((b) => {
      let enrichedCities = b.city.map((c: any) => cities[c._id] || c)

      if (enrichedCities.length === 0) {
        enrichedCities = [{
          _id: `fallback-${b._id}`,
          cityName: "Unknown City",
          state: "Unknown State",
          country: "Unknown Country",
        }]
      }

      return {
        ...b,
        doctors: b.doctors.map((d: any) => doctors[d._id] || d),
        city: enrichedCities,
        accreditation: b.accreditation.map((a: any) => accreditations[a._id] || a),
        specialists: b.specialists.map((s: any) => enrichedSpecialists[s._id] || s),
        treatments: b.treatments.map((t: any) => treatments[t._id] || t),
        specialization: b.specialization.map((s: any) => {
          if (s.isTreatment) {
            return treatments[s._id] || s
          } else {
            return enrichedSpecialists[s._id] || s
          }
        }),
      }
    })

    const uniqueDoctors = new Map()
    const uniqueSpecialists = new Map()
    const uniqueTreatments = new Map()

    enrichedBranches.forEach((b) => {
      b.doctors.forEach((d: any) => d._id && uniqueDoctors.set(d._id, d))
      b.specialists.forEach((s: any) => s._id && uniqueSpecialists.set(s._id, s))
      b.treatments.forEach((t: any) => t._id && uniqueTreatments.set(t._id, t))
    })

    return {
      ...hospital,
      branches: enrichedBranches,
      doctors: Array.from(uniqueDoctors.values()),
      specialists: Array.from(uniqueSpecialists.values()),
      treatments: Array.from(uniqueTreatments.values()),
      accreditations: enrichedBranches.flatMap((b) => b.accreditation),
    }
  })
}

/**
 * Gets all hospitals (both from HospitalMaster and standalone branches)
 */
export async function getAllHospitals(
  filterIds: FilterIds,
  searchQuery?: string,
  includeStandalone: boolean = true,
  minimal: boolean = false,
  slug?: string,
  cachedBranches?: any[],
  showHospital: boolean = true
) {
  // Fetch regular hospitals from HospitalMaster
  const regularHospitalsQuery = wixClient.items
    .query(COLLECTIONS.HOSPITALS)
    .include("specialty", "ShowHospital")
    .descending("_createdDate")
    .limit(1000)
    .find()

  // Use cached branches if provided, otherwise fetch
  const allBranches = cachedBranches || await fetchAllBranches()

  // Separate branches into standalone and grouped
  const standaloneBranches: any[] = []
  const groupedBranches: any[] = []

  allBranches.forEach(branch => {
    if (isStandaloneBranch(branch)) {
      standaloneBranches.push(branch)
    } else {
      groupedBranches.push(branch)
    }
  })

  // Removed console log for production performance

  // Process regular hospitals
  const regularHospitalsResult = await regularHospitalsQuery
  let regularHospitals = regularHospitalsResult.items

  // Convert standalone branches to hospital objects
  let standaloneHospitals: any[] = []
  if (includeStandalone) {
    const doctorIds = new Set<string>()
    const cityIds = new Set<string>()
    const accreditationIds = new Set<string>()
    const treatmentIds = new Set<string>()
    const specialistIds = new Set<string>()
    const specialtyIds = new Set<string>()

    // Map standalone branches
    standaloneBranches.forEach(branch => {
      const mapped = DataMappers.branch(branch)

      // Collect IDs for enrichment
      ReferenceMapper.extractIds(mapped.doctors).forEach((id) => doctorIds.add(id))
      ReferenceMapper.extractIds(mapped.city).forEach((id) => cityIds.add(id))
      ReferenceMapper.extractIds(mapped.accreditation).forEach((id) => accreditationIds.add(id))
      ReferenceMapper.extractIds(mapped.specialists).forEach((id) => specialistIds.add(id))
      ReferenceMapper.extractIds(mapped.treatments).forEach((id) => treatmentIds.add(id))

      mapped.specialization.forEach((s: any) => {
        if (s.isTreatment) {
          treatmentIds.add(s._id)
        } else {
          specialtyIds.add(s._id)
        }
      })
    })

    // Filter standalone branches based on filterIds and always check ShowHospital for visibility
    const filteredStandaloneBranches = standaloneBranches.filter(branch => {
      // Always check ShowHospital for visibility control
      if (!shouldShowHospital(branch)) {
        return false
      }

      const mapped = DataMappers.branch(branch)

      const matchBranch = !filterIds.branch.length || filterIds.branch.includes(mapped._id)
      const matchCity = !filterIds.city.length || mapped.city.some((c: any) => filterIds.city.includes(c._id))
      const matchDoctor = !filterIds.doctor.length || mapped.doctors.some((d: any) => filterIds.doctor.includes(d._id))
      const matchSpecialty =
        !filterIds.specialty.length ||
        mapped.specialization.some((s: any) => !s.isTreatment && filterIds.specialty.includes(s._id))
      const matchTreatment =
        !filterIds.treatment.length || mapped.treatments.some((t: any) => filterIds.treatment.includes(t._id))
      const matchSpecialist =
        !filterIds.specialist.length || mapped.specialists.some((s: any) => filterIds.specialist.includes(s._id))
      const matchDepartment =
        !filterIds.department.length ||
        mapped.specialists.some((s: any) => s.department.some((d: any) => filterIds.department.includes(d._id)))
      const matchAccred =
        !filterIds.accreditation.length || mapped.accreditation.some((a: any) => filterIds.accreditation.includes(a._id))

      return (
        matchBranch &&
        matchCity &&
        matchDoctor &&
        matchSpecialty &&
        matchTreatment &&
        matchSpecialist &&
        matchDepartment &&
        matchAccred
      )
    })

    // Fetch all related data for enrichment
    const [doctors, cities, accreditations, treatments, enrichedSpecialists] = await Promise.all([
      fetchDoctors([...doctorIds]),
      fetchCitiesWithStateAndCountry([...cityIds]),
      fetchByIds(COLLECTIONS.ACCREDITATIONS, [...accreditationIds], DataMappers.accreditation),
      fetchTreatmentsWithFullData([...treatmentIds]),
      fetchSpecialistsWithDeptAndTreatments([...new Set([...specialtyIds, ...specialistIds])]),
    ])

    // Convert filtered standalone branches to hospitals
    standaloneHospitals = filteredStandaloneBranches.map(branch => {
      const mappedBranch = DataMappers.branch(branch)

      // Enrich branch data
      const enrichedBranch = {
        ...mappedBranch,
        doctors: mappedBranch.doctors.map((d: any) => doctors[d._id] || d),
        city: mappedBranch.city.map((c: any) => cities[c._id] || c),
        accreditation: mappedBranch.accreditation.map((a: any) => accreditations[a._id] || a),
        specialists: mappedBranch.specialists.map((s: any) => enrichedSpecialists[s._id] || s),
        treatments: mappedBranch.treatments.map((t: any) => treatments[t._id] || t),
        specialization: mappedBranch.specialization.map((s: any) => {
          if (s.isTreatment) {
            return treatments[s._id] || s
          } else {
            return enrichedSpecialists[s._id] || s
          }
        }),
      }

      // Create hospital from branch
      const hospital = DataMappers.hospital(branch, true)

      // Collect unique doctors, specialists, and treatments
      const uniqueDoctors = new Map()
      const uniqueSpecialists = new Map()
      const uniqueTreatments = new Map()

      enrichedBranch.doctors.forEach((d: any) => d._id && uniqueDoctors.set(d._id, d))
      enrichedBranch.specialists.forEach((s: any) => s._id && uniqueSpecialists.set(s._id, s))
      enrichedBranch.treatments.forEach((t: any) => t._id && uniqueTreatments.set(t._id, t))

      const hospitalData = minimal ? {
        _id: `standalone-${branch._id || branch.ID}`,
        hospitalName: branch.branchName || branch["Branch Name"] || "Branch",
        showHospital: shouldShowHospital(branch),
      } : {
        ...hospital,
        branches: [enrichedBranch], // Standalone hospital has exactly one branch (itself)
        doctors: [], // Exclude doctors for standalone branches
        specialists: Array.from(uniqueSpecialists.values()),
        treatments: Array.from(uniqueTreatments.values()),
        accreditations: enrichedBranch.accreditation,
        showHospital: shouldShowHospital(branch),
      }

      return hospitalData
    })
  }

  // Enrich regular hospitals
  let enrichedRegularHospitals: HospitalData[] = []
  if (regularHospitals.length > 0) {
    if (minimal) {
      enrichedRegularHospitals = regularHospitals.map(h => ({
        _id: h._id,
        hospitalName: DataMappers.hospital(h).hospitalName,
        showHospital: shouldShowHospitalForHospital(h)
      })) as any[]
    } else {
      enrichedRegularHospitals = await enrichHospitals(regularHospitals.map(h => DataMappers.hospital(h)), filterIds)
      // Add showHospital field to regular hospitals
      enrichedRegularHospitals = enrichedRegularHospitals.map((hospital, index) => ({
        ...hospital,
        showHospital: shouldShowHospitalForHospital(regularHospitals[index])
      }))
    }
  }

  // Combine all hospitals
  let allHospitals: any[] = [...enrichedRegularHospitals, ...standaloneHospitals]

  // Apply search query if provided
  if (searchQuery) {
    const searchSlug = generateSlug(searchQuery)
    allHospitals = allHospitals.filter(hospital => {
      const hospitalSlug = generateSlug(hospital.hospitalName)
      return hospitalSlug.includes(searchSlug) ||
             hospital.hospitalName.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }

  // Apply slug filter if provided
  if (slug) {
    const slugLower = generateSlug(slug)
    allHospitals = allHospitals.filter(hospital => {
      const hospitalSlug = generateSlug(hospital.hospitalName)
      return hospitalSlug === slugLower
    })
  }

  // Always apply showHospital filter to hide items where showHospital is false
  allHospitals = allHospitals.filter(hospital => hospital.showHospital === true)

  return allHospitals
}