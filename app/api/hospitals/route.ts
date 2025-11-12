// app/api/hospitals/route.ts
// This is the unchanged route.ts file as provided, assuming no updates are needed beyond what's already there.

import { NextResponse } from "next/server"
import { wixClient } from "@/lib/wixClient"

const COLLECTIONS = {
  BRANCHES: "BranchesMaster",
  DOCTORS: "DoctorMaster",
  CITIES: "CityMaster",
  HOSPITALS: "HospitalMaster",
  ACCREDITATIONS: "Accreditation",
  SPECIALTIES: "SpecialistsMaster",
  DEPARTMENTS: "Department",
  TREATMENTS: "TreatmentMaster",
}

// RICH TEXT EXTRACTOR - BULLETPROOF
function extractRichText(richContent: any): string {
  if (!richContent) return ""
  if (typeof richContent === "string") return richContent.trim()

  if (richContent.data && richContent.data.aboutDoctor !== undefined) {
    richContent = richContent.data
  }

  try {
    if (richContent.nodes && Array.isArray(richContent.nodes)) {
      return richContent.nodes
        .map((node: any) => {
          if (node.nodes && Array.isArray(node.nodes)) {
            return node.nodes.map((child: any) => child.textData?.text || child.text || "").join("")
          }
          return node.textData?.text || node.text || ""
        })
        .filter(Boolean)
        .join("\n")
        .trim()
    }
  } catch (e) {
    console.warn("Rich text parse failed:", e)
  }

  return String(richContent).trim() || ""
}

function extractRichTextHTML(richContent: any): string {
  if (!richContent) return ""
  if (typeof richContent === "string") return richContent

  if (richContent.data) richContent = richContent.data

  let html = ""
  try {
    if (richContent.nodes && Array.isArray(richContent.nodes)) {
      richContent.nodes.forEach((node: any) => {
        const text =
          node.nodes?.map((n: any) => n.textData?.text || n.text || "").join("") ||
          node.textData?.text ||
          node.text ||
          ""

        switch (node.type) {
          case "PARAGRAPH":
            html += `<p>${text}</p>`
            break
          case "HEADING_ONE":
            html += `<h1>${text}</h1>`
            break
          case "HEADING_TWO":
            html += `<h2>${text}</h2>`
            break
          case "HEADING_THREE":
            html += `<h3>${text}</h3>`
            break
          case "BULLETED_LIST":
            html += "<ul>"
            node.nodes?.forEach((li: any) => {
              const liText = li.nodes?.map((n: any) => n.textData?.text || n.text || "").join("") || ""
              html += `<li>${liText}</li>`
            })
            html += "</ul>"
            break
          case "ORDERED_LIST":
            html += "<ol>"
            node.nodes?.forEach((li: any) => {
              const liText = li.nodes?.map((n: any) => n.textData?.text || n.text || "").join("") || ""
              html += `<li>${liText}</li>`
            })
            html += "</ol>"
            break
          default:
            if (text) html += `<p>${text}</p>`
        }
      })
      return html || extractRichText(richContent)
    }
  } catch (e) {
    console.warn("HTML parse failed:", e)
  }

  return extractRichText(richContent)
}

function getValue(item: any, ...keys: string[]): string | null {
  for (const key of keys) {
    const val = item?.[key] ?? item?.data?.[key]
    if (val !== undefined && val !== null && val !== "") {
      return String(val).trim()
    }
  }
  return null
}

// DATA MAPPERS
const DataMappers = {
  hospital: (item: any) => ({
    _id: item._id || item.ID,
    hospitalName: getValue(item, "hospitalName", "Hospital Name") || "Unknown Hospital",
    description: extractRichText(item.description || item.data?.description || item.Description),
    specialty: ReferenceMapper.multiReference(item.specialty, "specialty", "Specialty Name", "title", "name"),
    yearEstablished: getValue(item, "yearEstablished", "Year Established"),
    hospitalImage: item.hospitalImage || item.data?.hospitalImage || item["hospitalImage"],
    logo: item.logo || item.data?.logo || item.Logo,
  }),

  branch: (item: any) => ({
    _id: item._id || item.ID,
    branchName: getValue(item, "branchName", "Branch Name") || "Unknown Branch",
    address: getValue(item, "address", "Address"),
    city: ReferenceMapper.multiReference(item.city, "cityName", "city name", "name"),
    specialty: ReferenceMapper.multiReference(item.specialty, "specialization", "Specialty Name", "title", "name"),
    accreditation: ReferenceMapper.multiReference(item.accreditation, "title", "Title"),
    description: extractRichText(item.description || item.data?.description || item.Description),
    totalBeds: getValue(item, "totalBeds", "Total Beds"),
    noOfDoctors: getValue(item, "noOfDoctors", "No of Doctors"),
    yearEstablished: getValue(item, "yearEstablished"),
    branchImage: item.branchImage || item.data?.branchImage || item["Branch Image"],
    doctors: ReferenceMapper.multiReference(item.doctor, "doctorName", "Doctor Name"),
    specialists: ReferenceMapper.multiReference(item.specialist, "specialty", "Specialty Name", "title", "name"),
    treatments: ReferenceMapper.multiReference(
      item.treatment || item["treatment"],
      "treatmentName",
      "Treatment Name",
      "title",
      "name",
    ),
    specialization: [
      ...ReferenceMapper.multiReference(item.specialty, "specialty", "Specialty Name", "title", "name"),
      ...ReferenceMapper.multiReference(
        item.treatment || item["treatment"],
        "treatmentName",
        "Treatment Name",
        "title",
        "name",
      ).map((t) => ({
        ...t,
        name: t.name + " (Treatment)",
        isTreatment: true,
      })),
    ],
    popular: getValue(item, "popular") === "true",
  }),

  doctor: (item: any) => {
    const aboutField = item.aboutDoctor || item["aboutDoctor"] || item.data?.aboutDoctor || item.data?.["aboutDoctor"]
    const specialization = ReferenceMapper.multiReference(
      item.specialization || item["specialization"],
      "specialty",
      "Specialty Name",
      "title",
      "name",
    )

    return {
      _id: item._id || item.ID,
      doctorName: getValue(item, "doctorName", "Doctor Name") || "Unknown Doctor",
      specialization,
      qualification: getValue(item, "qualification", "Qualification"),
      experienceYears: getValue(item, "experienceYears", "Experience (Years)"),
      designation: getValue(item, "designation", "Designation"),
      aboutDoctor: extractRichText(aboutField),
      aboutDoctorHtml: extractRichTextHTML(aboutField),
      profileImage: item["profileImage"] || item["profile Image"] || item.profileImage || item.data?.profileImage,
      popular: getValue(item, "popular") === "true",
    }
  },

  city: (item: any) => ({
    _id: item._id,
    cityName: getValue(item, "cityName", "city name", "name") || "Unknown City",
    state: getValue(item, "state", "State"),
    country: getValue(item, "country", "Country") || "India",
  }),

  accreditation: (item: any) => ({
    _id: item._id,
    title: getValue(item, "title", "Title") || "Unknown Accreditation",
    image: item.image || item.data?.image || item.Image,
  }),

  specialty: (item: any) => ({
    _id: item._id,
    specialty: getValue(item, "specialty", "Specialty Name", "title", "name") || "Unknown Specialty",
  }),

  department: (item: any) => ({
    _id: item._id || item.ID,
    name: getValue(item, "department", "Name") || "Unknown Department",
  }),

  specialist: (item: any) => ({
    _id: item._id || item.ID,
    name: getValue(item, "specialty", "Specialty Name", "title", "name") || "Unknown Specialist",
    department: ReferenceMapper.multiReference(item.department, "department", "Name"),
    treatments: ReferenceMapper.multiReference(
      item.treatment || item["treatment"],
      "treatmentName",
      "Treatment Name",
      "title",
      "name",
    ),
  }),

  treatment: (item: any) => ({
    _id: item._id || item.ID,
    name: getValue(item, "treatmentName", "Treatment Name", "title", "name") || "Unknown Treatment",
    description: extractRichText(item.Description || item.description),
    startingCost: getValue(item, "averageCost", "Starting Cost"),
    treatmentImage: item["treatmentImage"] || item.treatmentImage || item.data?.["treatment image"],
    popular: getValue(item, "popular") === "true",
    category: getValue(item, "category", "Category"),
    duration: getValue(item, "duration", "Duration"),
    cost: getValue(item, "cost", "Cost", "averageCost"),
  }),
}

// REFERENCE MAPPER
const ReferenceMapper = {
  multiReference: (field: any, ...nameKeys: string[]): any[] => {
    if (!field) return []
    if (!Array.isArray(field)) field = [field].filter(Boolean)

    return field
      .map((ref: any) => {
        if (typeof ref === "string") return { _id: ref }
        const name = getValue(ref, ...nameKeys) || "Unknown"
        const id = ref._id || ref.ID || ref.data?._id
        return name && id ? { _id: id, name } : null
      })
      .filter(Boolean)
  },

  extractIds: (refs: any[]): string[] =>
    refs.map((r) => (typeof r === "string" ? r : r?._id || r?.ID || r?.data?._id)).filter(Boolean) as string[],

  extractHospitalIds: (branch: any): string[] => {
    const set = new Set<string>()
    const keys = ["hospital", "HospitalMaster_branches", "hospitalGroup", "Hospital Group Master"]
    keys.forEach((k) => {
      const val = branch[k] || branch.data?.[k]
      if (!val) return
      if (typeof val === "string") set.add(val)
      else if (Array.isArray(val)) {
        val.forEach((i: any) => {
          const id = typeof i === "string" ? i : i?._id || i?.ID || i?.data?._id
          id && set.add(id)
        })
      } else if (val?._id || val?.ID || val?.data?._id) {
        set.add(val._id || val.ID || val.data._id)
      }
    })
    return Array.from(set)
  },
}

// DATA FETCHER
const DataFetcher = {
  async searchIds(collection: string, fields: string[], query: string): Promise<string[]> {
    const ids = new Set<string>()
    for (const field of fields) {
      try {
        const res = await wixClient.items
          .query(collection)
          .contains(field as any, query)
          .limit(500)
          .find()
        res.items.forEach((i: any) => i._id && ids.add(i._id))
      } catch (e) {
        console.warn(`Search failed on ${collection}.${field}:`, e)
      }
    }
    return Array.from(ids)
  },

  async fetchByIds(collection: string, ids: string[], mapper: (i: any) => any) {
    if (!ids.length) return {}
    const res = await wixClient.items.query(collection).hasSome("_id", ids).find()
    return res.items.reduce(
      (acc, item) => {
        acc[item._id!] = mapper(item)
        return acc
      },
      {} as Record<string, any>,
    )
  },

  async fetchDoctors(ids: string[]) {
    if (!ids.length) return {}
    const res = await wixClient.items.query(COLLECTIONS.DOCTORS).hasSome("_id", ids).include("specialization").find()

    const specialistIds = new Set<string>()
    res.items.forEach((d) => {
      const specs = d.specialization || d.data?.specialization || []
      ;(Array.isArray(specs) ? specs : [specs]).forEach((s: any) => {
        const id = s?._id || s?.ID || s
        id && specialistIds.add(id)
      })
    })

    const enrichedSpecialists = await DataFetcher.fetchSpecialistsWithDeptAndTreatments(Array.from(specialistIds))

    return res.items.reduce(
      (acc, d) => {
        const doctor = DataMappers.doctor(d)
        doctor.specialization = doctor.specialization.map((spec: any) => enrichedSpecialists[spec._id] || spec)
        acc[d._id!] = doctor
        return acc
      },
      {} as Record<string, any>,
    )
  },

  async fetchSpecialistsWithDeptAndTreatments(specialistIds: string[]) {
    if (!specialistIds.length) return {}

    const res = await wixClient.items
      .query(COLLECTIONS.SPECIALTIES)
      .hasSome("_id", specialistIds)
      .include("department", "treatment")
      .find()

    const treatmentIds = new Set<string>()
    const departmentIds = new Set<string>()

    res.items.forEach((s) => {
      const treatments = s.treatment || s.data?.treatment || []
      ;(Array.isArray(treatments) ? treatments : [treatments]).forEach((t: any) => {
        const id = t?._id || t?.ID || t
        id && treatmentIds.add(id)
      })

      const dept = s.department || s.data?.department
      if (dept) {
        const id = typeof dept === "string" ? dept : dept?._id || dept?.ID
        id && departmentIds.add(id)
      }
    })

    const [treatments, departments] = await Promise.all([
      DataFetcher.fetchByIds(COLLECTIONS.TREATMENTS, Array.from(treatmentIds), DataMappers.treatment),
      DataFetcher.fetchByIds(COLLECTIONS.DEPARTMENTS, Array.from(departmentIds), DataMappers.department),
    ])

    return res.items.reduce(
      (acc, item) => {
        const spec = DataMappers.specialist(item)
        acc[item._id!] = {
          ...spec,
          department: spec.department.map((d) => departments[d._id] || d),
          treatments: spec.treatments.map((t) => treatments[t._id] || t),
        }
        return acc
      },
      {} as Record<string, any>,
    )
  },

  async fetchTreatmentsWithFullData(treatmentIds: string[]) {
    if (!treatmentIds.length) return {}

    const res = await wixClient.items.query(COLLECTIONS.TREATMENTS).hasSome("_id", treatmentIds).find()

    return res.items.reduce(
      (acc, item) => {
        acc[item._id!] = DataMappers.treatment(item)
        return acc
      },
      {} as Record<string, any>,
    )
  },
}

// QUERY BUILDER
const QueryBuilder = {
  async getHospitalIds(filters: {
    branchIds?: string[]
    cityIds?: string[]
    doctorIds?: string[]
    specialtyIds?: string[]
    accreditationIds?: string[]
    treatmentIds?: string[]
    specialistIds?: string[]
    departmentIds?: string[]
  }): Promise<string[]> {
    let { branchIds, cityIds, doctorIds, specialtyIds, accreditationIds, treatmentIds, specialistIds, departmentIds } =
      filters
    if (
      !branchIds?.length &&
      !cityIds?.length &&
      !doctorIds?.length &&
      !specialtyIds?.length &&
      !accreditationIds?.length &&
      !treatmentIds?.length &&
      !specialistIds?.length &&
      !departmentIds?.length
    )
      return []

    // Handle department filtering by finding matching specialists
    if (departmentIds?.length) {
      const res = await wixClient.items
        .query(COLLECTIONS.SPECIALTIES)
        .hasSome("department", departmentIds)
        .limit(500)
        .find()
      const addIds = res.items.map((i) => i._id).filter(Boolean)
      specialistIds = [...(specialistIds || []), ...addIds]
    }

    const query = wixClient.items
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
      )

    if (branchIds?.length) query.hasSome("_id", branchIds)
    if (cityIds?.length) query.hasSome("city", cityIds)
    if (doctorIds?.length) query.hasSome("doctor", doctorIds)
    if (specialtyIds?.length) query.hasSome("specialty", specialtyIds)
    if (accreditationIds?.length) query.hasSome("accreditation", accreditationIds)
    if (treatmentIds?.length) query.hasSome("treatment", treatmentIds)
    if (specialistIds?.length) query.hasSome("specialist", specialistIds)

    const result = await query.limit(1000).find()
    const hospitalIds = new Set<string>()
    result.items.forEach((b: any) => ReferenceMapper.extractHospitalIds(b).forEach((id) => hospitalIds.add(id)))
    return Array.from(hospitalIds)
  },
}

// ENRICH HOSPITALS
async function enrichHospitals(
  hospitals: any[],
  filterIds: {
    city: string[]
    doctor: string[]
    specialty: string[]
    accreditation: string[]
    branch: string[]
    treatment: string[]
    specialist: string[]
    department: string[]
  },
) {
  const hospitalIds = hospitals.map((h) => h._id!).filter(Boolean)

  const branchesRes = await wixClient.items
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
    )
    .hasSome("HospitalMaster_branches", hospitalIds)
    .limit(1000)
    .find()

  const branchesByHospital: Record<string, any[]> = {}
  const doctorIds = new Set<string>()
  const cityIds = new Set<string>()
  const specialtyIds = new Set<string>()
  const accreditationIds = new Set<string>()
  const treatmentIds = new Set<string>()
  const specialistIds = new Set<string>()
  const departmentIds = new Set<string>()

  branchesRes.items.forEach((b: any) => {
    const hIds = ReferenceMapper.extractHospitalIds(b)
    hIds.forEach((hid) => {
      if (hospitalIds.includes(hid)) {
        if (!branchesByHospital[hid]) branchesByHospital[hid] = []
        const mapped = DataMappers.branch(b)
        branchesByHospital[hid].push(mapped)

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
    DataFetcher.fetchDoctors(Array.from(doctorIds)),
    DataFetcher.fetchByIds(COLLECTIONS.CITIES, Array.from(cityIds), DataMappers.city),
    DataFetcher.fetchByIds(COLLECTIONS.ACCREDITATIONS, Array.from(accreditationIds), DataMappers.accreditation),
    DataFetcher.fetchTreatmentsWithFullData(Array.from(treatmentIds)),
    DataFetcher.fetchSpecialistsWithDeptAndTreatments(Array.from(new Set([...specialtyIds, ...specialistIds]))),
  ])

  return hospitals.map((hospital) => {
    const rawBranches = branchesByHospital[hospital._id!] || []
    const filteredBranches = rawBranches.filter((b) => {
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

    const enrichedBranches = filteredBranches.map((b) => ({
      ...b,
      doctors: b.doctors.map((d: any) => doctors[d._id] || d),
      city: b.city.map((c: any) => cities[c._id] || c),
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
    }))

    const uniqueDoctors = new Map()
    const uniqueSpecialists = new Map()
    const uniqueTreatments = new Map()

    enrichedBranches.forEach((b) => {
      b.doctors.forEach((d: any) => d._id && uniqueDoctors.set(d._id, d))
      b.specialists.forEach((s: any) => s._id && uniqueSpecialists.set(s._id, s))
      b.treatments.forEach((t: any) => t._id && uniqueTreatments.set(t._id, t))
    })

    const mapped = DataMappers.hospital(hospital)

    return {
      ...mapped,
      branches: enrichedBranches,
      doctors: Array.from(uniqueDoctors.values()),
      specialists: Array.from(uniqueSpecialists.values()),
      treatments: Array.from(uniqueTreatments.values()),
      accreditations: enrichedBranches.flatMap((b) => b.accreditation),
    }
  })
}

// GET /api/hospitals
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const params = {
      q: url.searchParams.get("q")?.trim() || "",
      page: Math.max(0, Number(url.searchParams.get("page") || 0)),
      pageSize: Math.min(50, Number(url.searchParams.get("pageSize") || 20)),
      hospitalId: url.searchParams.get("hospitalId")?.trim(),
      hospitalText: url.searchParams.get("hospital")?.trim(),
      branchText: url.searchParams.get("branch")?.trim(),
      cityText: url.searchParams.get("city")?.trim(),
      doctorText: url.searchParams.get("doctor")?.trim(),
      specialtyText: url.searchParams.get("specialty")?.trim(),
      accreditationText: url.searchParams.get("accreditation")?.trim(),
      treatmentText: url.searchParams.get("treatment")?.trim(),
      specialistText: url.searchParams.get("specialist")?.trim(),
      departmentText: url.searchParams.get("department")?.trim(),
      branchId: url.searchParams.get("branchId"),
      cityId: url.searchParams.get("cityId"),
      doctorId: url.searchParams.get("doctorId"),
      specialtyId: url.searchParams.get("specialtyId"),
      accreditationId: url.searchParams.get("accreditationId"),
      treatmentId: url.searchParams.get("treatmentId"),
      specialistId: url.searchParams.get("specialistId"),
      departmentId: url.searchParams.get("departmentId"),
    }

    const [
      hospitalIdsFromText,
      branchIdsFromText,
      cityIdsFromText,
      doctorIdsFromText,
      specialtyIdsFromText,
      accreditationIdsFromText,
      treatmentIdsFromText,
      specialistIdsFromText,
      departmentIdsFromText,
    ] = await Promise.all([
      params.hospitalText
        ? DataFetcher.searchIds(COLLECTIONS.HOSPITALS, ["hospitalName"], params.hospitalText)
        : Promise.resolve([]),
      params.branchText
        ? DataFetcher.searchIds(COLLECTIONS.BRANCHES, ["branchName"], params.branchText)
        : Promise.resolve([]),
      params.cityText ? DataFetcher.searchIds(COLLECTIONS.CITIES, ["cityName"], params.cityText) : Promise.resolve([]),
      params.doctorText
        ? DataFetcher.searchIds(COLLECTIONS.DOCTORS, ["doctorName"], params.doctorText)
        : Promise.resolve([]),
      params.specialtyText
        ? DataFetcher.searchIds(COLLECTIONS.SPECIALTIES, ["specialty"], params.specialtyText)
        : Promise.resolve([]),
      params.accreditationText
        ? DataFetcher.searchIds(COLLECTIONS.ACCREDITATIONS, ["title"], params.accreditationText)
        : Promise.resolve([]),
      params.treatmentText
        ? DataFetcher.searchIds(COLLECTIONS.TREATMENTS, ["treatmentName"], params.treatmentText)
        : Promise.resolve([]),
      params.specialistText
        ? DataFetcher.searchIds(COLLECTIONS.SPECIALTIES, ["specialty"], params.specialistText)
        : Promise.resolve([]),
      params.departmentText
        ? DataFetcher.searchIds(COLLECTIONS.DEPARTMENTS, ["department", "Name"], params.departmentText)
        : Promise.resolve([]),
    ])

    const filterIds = {
      branch: [...branchIdsFromText, ...(params.branchId ? [params.branchId] : [])],
      city: [...cityIdsFromText, ...(params.cityId ? [params.cityId] : [])],
      doctor: [...doctorIdsFromText, ...(params.doctorId ? [params.doctorId] : [])],
      specialty: [...specialtyIdsFromText, ...(params.specialtyId ? [params.specialtyId] : [])],
      accreditation: [...accreditationIdsFromText, ...(params.accreditationId ? [params.accreditationId] : [])],
      treatment: [...treatmentIdsFromText, ...(params.treatmentId ? [params.treatmentId] : [])],
      specialist: [...specialistIdsFromText, ...(params.specialistId ? [params.specialistId] : [])],
      department: [...departmentIdsFromText, ...(params.departmentId ? [params.departmentId] : [])],
    }

    let finalHospitalIds: string[] = []

    if (Object.values(filterIds).some((arr) => arr.length > 0)) {
      finalHospitalIds = await QueryBuilder.getHospitalIds(filterIds)
      if (finalHospitalIds.length === 0) {
        return NextResponse.json({ items: [], total: 0 })
      }
    }

    let query = wixClient.items
      .query(COLLECTIONS.HOSPITALS)
      .include("specialty")
      .descending("_createdDate")
      .limit(params.pageSize)
      .skip(params.page * params.pageSize)

    if (params.hospitalId) {
      query = query.eq("_id", params.hospitalId)
    } else if (finalHospitalIds.length > 0) {
      query = query.hasSome("_id", finalHospitalIds)
    }

    if (params.q || hospitalIdsFromText.length > 0) {
      const qIds = params.q
        ? await DataFetcher.searchIds(COLLECTIONS.HOSPITALS, ["hospitalName"], params.q)
        : hospitalIdsFromText
      if (qIds.length === 0) return NextResponse.json({ items: [], total: 0 })
      const intersection = finalHospitalIds.length > 0 ? finalHospitalIds.filter((id) => qIds.includes(id)) : qIds
      if (intersection.length === 0) return NextResponse.json({ items: [], total: 0 })
      query = query.hasSome("_id", intersection)
    }

    const result = await query.find()
    const enriched = await enrichHospitals(result.items, filterIds)

    return NextResponse.json({
      items: enriched,
      total: result.totalCount || enriched.length,
      page: params.page,
      pageSize: params.pageSize,
    })
  } catch (error: any) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Failed to fetch hospitals", details: error.message }, { status: 500 })
  }
}