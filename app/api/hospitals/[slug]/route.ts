// app/api/hospitals/route.ts - UPDATED: Department Data Fix
import { NextResponse } from "next/server";
import { wixClient } from "@/lib/wixClient";

const COLLECTIONS = {
  BRANCHES: "BranchesMaster",
  DOCTORS: "DoctorMaster",
  CITIES: "CityMaster",
  HOSPITALS: "HospitalMaster",
  ACCREDITATIONS: "Accreditation",
  SPECIALTIES: "SpecialistsMaster",
  DEPARTMENTS: "DepartmentsMaster",
  TREATMENTS: "TreatmentMaster",
};

// RICH TEXT EXTRACTOR - BULLETPROOF
function extractRichText(richContent: any): string {
  if (!richContent) return "";
  if (typeof richContent === "string") return richContent.trim();

  if (richContent.data && richContent.data.aboutDoctor !== undefined) {
    richContent = richContent.data;
  }

  try {
    if (richContent.nodes && Array.isArray(richContent.nodes)) {
      return richContent.nodes
        .map((node: any) => {
          if (node.nodes && Array.isArray(node.nodes)) {
            return node.nodes
              .map((child: any) => child.textData?.text || child.text || "")
              .join("");
          }
          return node.textData?.text || node.text || "";
        })
        .filter(Boolean)
        .join("\n")
        .trim();
    }
  } catch (e) {
    console.warn("Rich text parse failed:", e);
  }

  return String(richContent).trim() || "";
}

function extractRichTextHTML(richContent: any): string {
  if (!richContent) return "";
  if (typeof richContent === "string") return richContent;

  if (richContent.data) richContent = richContent.data;

  let html = "";
  try {
    if (richContent.nodes && Array.isArray(richContent.nodes)) {
      richContent.nodes.forEach((node: any) => {
        const text = node.nodes?.map((n: any) => n.textData?.text || n.text || "").join("") || node.textData?.text || node.text || "";

        switch (node.type) {
          case "PARAGRAPH":
            html += `<p>${text}</p>`;
            break;
          case "HEADING_ONE":
            html += `<h1>${text}</h1>`;
            break;
          case "HEADING_TWO":
            html += `<h2>${text}</h2>`;
            break;
          case "HEADING_THREE":
            html += `<h3>${text}</h3>`;
            break;
          case "BULLETED_LIST":
            html += "<ul>";
            node.nodes?.forEach((li: any) => {
              const liText = li.nodes?.map((n: any) => n.textData?.text || n.text || "").join("") || "";
              html += `<li>${liText}</li>`;
            });
            html += "</ul>";
            break;
          case "ORDERED_LIST":
            html += "<ol>";
            node.nodes?.forEach((li: any) => {
              const liText = li.nodes?.map((n: any) => n.textData?.text || n.text || "").join("") || "";
              html += `<li>${liText}</li>`;
            });
            html += "</ol>";
            break;
          default:
            if (text) html += `<p>${text}</p>`;
        }
      });
      return html || extractRichText(richContent);
    }
  } catch (e) {
    console.warn("HTML parse failed:", e);
  }

  return extractRichText(richContent);
}

function getValue(item: any, ...keys: string[]): string | null {
  for (const key of keys) {
    const val = item?.[key] ?? item?.data?.[key];
    if (val !== undefined && val !== null && val !== "") {
      return String(val).trim();
    }
  }
  return null;
}

// DATA MAPPERS - UPDATED: REMOVED OFFEREDBYSPECIALISTS FROM TREATMENT
const DataMappers = {
  hospital: (item: any) => ({
    _id: item._id || item.ID,
    hospitalName: getValue(item, "hospitalName", "Hospital Name") || "Hospital",
    description: extractRichText(item.description || item.data?.description || item.Description),
    specialty: ReferenceMapper.multiReference(item.specialty, "specialty", "Specialty Name", "title", "name"),
    yearEstablished: getValue(item, "yearEstablished", "Year Established"),
    hospitalImage: item.hospitalImage || item.data?.hospitalImage || item["hospitalImage"],
    logo: item.logo || item.data?.logo || item.Logo,
  }),

  branch: (item: any) => ({
    _id: item._id || item.ID,
    branchName: getValue(item, "branchName", "Branch Name") || "Branch",
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

    treatments: ReferenceMapper.multiReference(
      item.treatment || item["treatment"],
      "treatmentName",
      "Treatment Name",
      "title",
      "name",
    ),

    // ENHANCED: Combined specialties + treatments + departments
    specialization: [
      ...ReferenceMapper.multiReference(item.specialty, "specialty", "Specialty Name", "title", "name"),
      ...ReferenceMapper.multiReference(
        item.treatment || item["treatment"],
        "treatmentName",
        "Treatment Name",
        "title",
        "name"
      ).map(t => ({
        ...t,
        name: t.name + " (Treatment)",
        isTreatment: true
      })),
      ...ReferenceMapper.multiReference(
        item.department || item["department"],
        "departmentName",
        "Department Name",
        "title",
        "name"
      ).map(d => ({
        ...d,
        name: d.name + " (Department)",
        isDepartment: true
      }))
    ],
    popular: getValue(item, "popular") === "true",
  }),

  // UPDATED: Doctor mapper with proper specialization mapping based on CSV
  doctor: (item: any) => {
    const aboutField = item.aboutDoctor || item["aboutDoctor"] || item.data?.aboutDoctor || item.data?.["aboutDoctor"];
    
    return {
      _id: item._id || item.ID,
      doctorName: getValue(item, "doctorName", "Doctor Name") || "Doctor",
      specialization: ReferenceMapper.multiReference(
        item.specialization || item["specialization"], 
        "specialty", "Specialty Name", "title", "name"
      ),
      department_doctor: ReferenceMapper.multiReference(item["Department_doctor"], "department", "Name"),
      qualification: getValue(item, "qualification", "Qualification"),
      experienceYears: getValue(item, "experienceYears", "Experience (Years)"),
      designation: getValue(item, "designation", "Designation"),
      aboutDoctor: extractRichText(aboutField),
      aboutDoctorHtml: extractRichTextHTML(aboutField),
      profileImage: item["profileImage"] || item["profile Image"] || item.profileImage || item.data?.profileImage,
      popular: getValue(item, "popular") === "true",
    };
  },

  city: (item: any) => ({
    _id: item._id,
    cityName: getValue(item, "cityName", "city name", "name"),
  }),

  accreditation: (item: any) => ({
    _id: item._id,
    title: getValue(item, "title", "Title"),
    image: item.image || item.data?.image || item.Image,
  }),

  specialty: (item: any) => ({
    _id: item._id,
    specialty: getValue(item, "specialty", "Specialty Name", "title", "name"),
  }),

  // UPDATED: Specialist Mapper based on CSV format
  specialist: (item: any) => ({
    _id: item._id || item.ID,
    name: getValue(item, "Specialty", "specialty", "Specialty Name", "title", "name") || "Specialist",
    // Treatment field from CSV - multi-reference to TreatmentMaster
    treatments: ReferenceMapper.multiReference(
      item.Treatment || item.treatment || item["Treatment"],
      "treatmentName",
      "Treatment Name",
      "title",
      "name"
    ),
    // Department field from CSV - multi-reference to DepartmentsMaster
    departments: ReferenceMapper.multiReference(
      item.Department || item.department || item["Department"],
      "departmentName",
      "Department Name",
      "title",
      "name"
    ),
    // Doctor reference from CSV - reverse reference from doctors
    doctors: ReferenceMapper.multiReference(
      item.DoctorMaster_specialization || item["DoctorMaster_specialization"],
      "doctorName",
      "Doctor Name"
    ),
  }),

  // UPDATED: Treatment mapper - REMOVED offeredBySpecialists
  treatment: (item: any) => ({
    _id: item._id || item.ID,
    name: getValue(item, "treatmentName", "Treatment Name", "title", "name"),
    description: extractRichText(item.Description || item.description),
    startingCost: getValue(item, "averageCost", "Starting Cost"),
    treatmentImage: item["treatmentImage"] || item.treatmentImage || item.data?.["treatment image"],
    popular: getValue(item, "popular") === "true",
    // REMOVED: offeredBySpecialists to avoid empty arrays
  }),

  // UPDATED: Department Mapper based on Department.csv format
  department: (item: any) => ({
    _id: item._id || item.ID,
    name: getValue(item, "Name", "departmentName", "Department Name", "title", "name") || "Department",
    description: extractRichText(item.About || item.about || item.Description || item.description),
    departmentImage: item["departmentImage"] || item.departmentImage || item.data?.["department image"],
    popular: getValue(item, "popular") === "true",
    // Department relationships with specialists from SpecialistsMaster_department field
    specialists: ReferenceMapper.multiReference(
      item.SpecialistsMaster_department || item["SpecialistsMaster_department"],
      "Specialty",
      "Specialty Name",
      "title",
      "name"
    ),
  }),
};

// REFERENCE MAPPER
const ReferenceMapper = {
  multiReference: (field: any, ...nameKeys: string[]): any[] => {
    if (!field) return [];
    if (!Array.isArray(field)) field = [field].filter(Boolean);

    return field
      .map((ref: any) => {
        if (typeof ref === "string") return { _id: ref };
        const name = getValue(ref, ...nameKeys);
        const id = ref._id || ref.ID || ref.data?._id;
        return name && id ? { _id: id, name } : null;
      })
      .filter(Boolean);
  },

  extractIds: (refs: any[]): string[] =>
    refs
      .map((r) => (typeof r === "string" ? r : r?._id || r?.ID || r?.data?._id))
      .filter(Boolean) as string[],

  extractHospitalIds: (branch: any): string[] => {
    const set = new Set<string>();
    const keys = ["hospital", "HospitalMaster_branches", "hospitalGroup", "Hospital Group Master"];
    keys.forEach((k) => {
      const val = branch[k] || branch.data?.[k];
      if (!val) return;
      if (typeof val === "string") set.add(val);
      else if (Array.isArray(val)) {
        val.forEach((i: any) => {
          const id = typeof i === "string" ? i : i?._id || i?.ID || i?.data?._id;
          id && set.add(id);
        });
      } else if (val?._id || val?.ID || val?.data?._id) {
        set.add(val._id || val.ID || val.data._id);
      }
    });
    return Array.from(set);
  },
};

// DATA FETCHER - UPDATED: SIMPLIFIED DEPARTMENT FETCHING
const DataFetcher = {
  async searchIds(collection: string, fields: string[], query: string): Promise<string[]> {
    const ids = new Set<string>();
    for (const field of fields) {
      try {
        const res = await wixClient.items
          .query(collection)
          .contains(field as any, query)
          .limit(500)
          .find();
        res.items.forEach((i: any) => i._id && ids.add(i._id));
      } catch (e) {
        console.warn(`Search failed on ${collection}.${field}:`, e);
      }
    }
    return Array.from(ids);
  },

  async fetchByIds(collection: string, ids: string[], mapper: (i: any) => any) {
    if (!ids.length) return {};
    const res = await wixClient.items.query(collection).hasSome("_id", ids).find();
    return res.items.reduce((acc, item) => {
      acc[item._id!] = mapper(item);
      return acc;
    }, {} as Record<string, any>);
  },

  // UPDATED: Fetch doctors with proper specialization references based on CSV
  async fetchDoctors(ids: string[]) {
    if (!ids.length) return {};
    const res = await wixClient.items
      .query(COLLECTIONS.DOCTORS)
      .hasSome("_id", ids)
      .include("specialization", "Department_doctor")
      .find();

    // Extract specialization IDs from doctors
    const specializationIds = new Set<string>();
    res.items.forEach(d => {
      const specializations = d.specialization || d.data?.specialization || [];
      (Array.isArray(specializations) ? specializations : [specializations]).forEach((s: any) => {
        const id = s?._id || s?.ID || s;
        id && specializationIds.add(id);
      });
    });

    // Fetch the actual specialization data with treatments and departments
    const specialists = await DataFetcher.fetchSpecialistsWithRelationships(Array.from(specializationIds));

    return res.items.reduce((acc, d) => {
      const doctor = DataMappers.doctor(d);
      
      // Enrich specialization with actual specialist data including treatments and departments
      doctor.specialization = doctor.specialization.map((spec: any) => 
        specialists[spec._id] || spec
      );

      acc[d._id!] = doctor;
      return acc;
    }, {} as Record<string, any>);
  },

  // UPDATED: Fetch Specialists with Treatments and Departments (based on CSV fields)
  async fetchSpecialistsWithRelationships(specialistIds: string[]) {
    if (!specialistIds.length) return {};
    
    // Query with proper CSV field names
    const res = await wixClient.items
      .query(COLLECTIONS.SPECIALTIES)
      .hasSome("_id", specialistIds)
      .include("Treatment", "Department", "DoctorMaster_specialization")
      .find();

    const treatmentIds = new Set<string>();
    const departmentIds = new Set<string>();

    res.items.forEach(s => {
      // Handle Treatment field from CSV
      const treatments = s.Treatment || s.data?.Treatment || s.treatment || s.data?.treatment || [];
      (Array.isArray(treatments) ? treatments : [treatments]).forEach((t: any) => {
        const id = t?._id || t?.ID || t;
        id && treatmentIds.add(id);
      });

      // Handle Department field from CSV
      const departments = s.Department || s.data?.Department || s.department || s.data?.department || [];
      (Array.isArray(departments) ? departments : [departments]).forEach((d: any) => {
        const id = d?._id || d?.ID || d;
        id && departmentIds.add(id);
      });
    });

    // Fetch related data in parallel
    const [treatments, departments] = await Promise.all([
      DataFetcher.fetchTreatments(Array.from(treatmentIds)),
      DataFetcher.fetchDepartmentsWithSpecialists(Array.from(departmentIds)),
    ]);

    return res.items.reduce((acc, item) => {
      const spec = DataMappers.specialist(item);
      acc[item._id!] = {
        ...spec,
        treatments: spec.treatments.map(t => treatments[t._id] || t),
        departments: spec.departments.map(d => departments[d._id] || d),
      };
      return acc;
    }, {} as Record<string, any>);
  },

  // NEW: Simplified treatment fetcher without specialist relationships
  async fetchTreatments(treatmentIds: string[]) {
    if (!treatmentIds.length) return {};
    const res = await wixClient.items
      .query(COLLECTIONS.TREATMENTS)
      .hasSome("_id", treatmentIds)
      .find();

    return res.items.reduce((acc, item) => {
      const treatment = DataMappers.treatment(item);
      acc[item._id!] = treatment;
      return acc;
    }, {} as Record<string, any>);
  },

  // UPDATED: Fetch Departments with their specialist relationships
  async fetchDepartmentsWithSpecialists(departmentIds: string[]) {
    if (!departmentIds.length) return {};
    const res = await wixClient.items
      .query(COLLECTIONS.DEPARTMENTS)
      .hasSome("_id", departmentIds)
      .include("SpecialistsMaster_department")
      .find();

    const specialistIds = new Set<string>();
    
    res.items.forEach(d => {
      const specialists = d.SpecialistsMaster_department || d.data?.SpecialistsMaster_department || [];
      (Array.isArray(specialists) ? specialists : [specialists]).forEach((s: any) => {
        const id = s?._id || s?.ID || s;
        id && specialistIds.add(id);
      });
    });

    const specialists = await DataFetcher.fetchSpecialistsWithRelationships(Array.from(specialistIds));

    return res.items.reduce((acc, item) => {
      const department = DataMappers.department(item);
      acc[item._id!] = {
        ...department,
        specialists: department.specialists.map((s: any) => specialists[s._id] || s),
      };
      return acc;
    }, {} as Record<string, any>);
  },
};

// QUERY BUILDER
const QueryBuilder = {
  async getHospitalIds(filters: {
    branchIds?: string[];
    cityIds?: string[];
    doctorIds?: string[];
    specialtyIds?: string[];
    accreditationIds?: string[];
    treatmentIds?: string[];
    departmentIds?: string[];
  }): Promise<string[]> {
    const { branchIds, cityIds, doctorIds, specialtyIds, accreditationIds, treatmentIds, departmentIds } = filters;
    if (!branchIds?.length && !cityIds?.length && !doctorIds?.length && !specialtyIds?.length && !accreditationIds?.length && !treatmentIds?.length && !departmentIds?.length)
      return [];

    const query = wixClient.items
      .query(COLLECTIONS.BRANCHES)
      .include("hospital", "HospitalMaster_branches", "city", "doctor", "specialty", "accreditation", "treatment", "department");

    if (branchIds?.length) query.hasSome("_id", branchIds);
    if (cityIds?.length) query.hasSome("city", cityIds);
    if (doctorIds?.length) query.hasSome("doctor", doctorIds);
    if (specialtyIds?.length) query.hasSome("specialty", specialtyIds);
    if (accreditationIds?.length) query.hasSome("accreditation", accreditationIds);
    if (treatmentIds?.length) query.hasSome("treatment", treatmentIds);
    if (departmentIds?.length) query.hasSome("department", departmentIds);

    const result = await query.limit(1000).find();
    const hospitalIds = new Set<string>();
    result.items.forEach((b: any) =>
      ReferenceMapper.extractHospitalIds(b).forEach((id) => hospitalIds.add(id))
    );
    return Array.from(hospitalIds);
  },
};

// ENRICH DATA - UPDATED: PROPER DEPARTMENT HANDLING
async function enrichHospitals(
  hospitals: any[],
  filterIds: { cityIds: string[]; doctorIds: string[]; specialtyIds: string[]; accreditationIds: string[]; branchIds: string[]; treatmentIds: string[]; departmentIds: string[] }
) {
  const hospitalIds = hospitals.map((h) => h._id!).filter(Boolean);

  const branchesRes = await wixClient.items
    .query(COLLECTIONS.BRANCHES)
    .include("hospital", "HospitalMaster_branches", "city", "doctor", "specialty", "accreditation", "treatment", "department")
    .hasSome("HospitalMaster_branches", hospitalIds)
    .limit(1000)
    .find();

  const branchesByHospital: Record<string, any[]> = {};
  const doctorIds = new Set<string>();
  const cityIds = new Set<string>();
  const specialtyIds = new Set<string>();
  const accreditationIds = new Set<string>();
  const treatmentIds = new Set<string>();
  const departmentIds = new Set<string>();

  branchesRes.items.forEach((b: any) => {
    const hIds = ReferenceMapper.extractHospitalIds(b);
    hIds.forEach((hid) => {
      if (hospitalIds.includes(hid)) {
        if (!branchesByHospital[hid]) branchesByHospital[hid] = [];
        const mapped = DataMappers.branch(b);
        branchesByHospital[hid].push(mapped);

        ReferenceMapper.extractIds(mapped.doctors).forEach((id) => doctorIds.add(id));
        ReferenceMapper.extractIds(mapped.city).forEach((id) => cityIds.add(id));
        ReferenceMapper.extractIds(mapped.accreditation).forEach((id) => accreditationIds.add(id));
        ReferenceMapper.extractIds(mapped.treatments).forEach((id) => treatmentIds.add(id));

        // Separate specialty IDs and department IDs
        mapped.specialization.forEach((s: any) => {
          if (s.isDepartment) {
            departmentIds.add(s._id);
          } else if (!s.isTreatment) {
            specialtyIds.add(s._id);
          }
        });
      }
    });
  });

  const [doctors, cities, specialties, accreditations, treatments, specialists, departments] = await Promise.all([
    DataFetcher.fetchDoctors(Array.from(doctorIds)),
    DataFetcher.fetchByIds(COLLECTIONS.CITIES, Array.from(cityIds), DataMappers.city),
    DataFetcher.fetchByIds(COLLECTIONS.SPECIALTIES, Array.from(specialtyIds), DataMappers.specialty),
    DataFetcher.fetchByIds(COLLECTIONS.ACCREDITATIONS, Array.from(accreditationIds), DataMappers.accreditation),
    DataFetcher.fetchTreatments(Array.from(treatmentIds)),
    DataFetcher.fetchSpecialistsWithRelationships(Array.from(specialtyIds)),
    DataFetcher.fetchDepartmentsWithSpecialists(Array.from(departmentIds)),
  ]);

  const allSpecializations = { ...specialties, ...treatments, ...specialists, ...departments };

  return hospitals.map((hospital) => {
    const rawBranches = branchesByHospital[hospital._id!] || [];
    const filteredBranches = rawBranches.filter((b) => {
      const matchBranch = !filterIds.branchIds.length || filterIds.branchIds.includes(b._id);
      const matchCity = !filterIds.cityIds.length || b.city.some((c: any) => filterIds.cityIds.includes(c._id));
      const matchDoctor = !filterIds.doctorIds.length || b.doctors.some((d: any) => filterIds.doctorIds.includes(d._id));
      const matchSpecialty = !filterIds.specialtyIds.length || b.specialization.some((s: any) => !s.isTreatment && !s.isDepartment && filterIds.specialtyIds.includes(s._id));
      const matchTreatment = !filterIds.treatmentIds.length || b.specialization.some((s: any) => s.isTreatment && filterIds.treatmentIds.includes(s._id));
      const matchDepartment = !filterIds.departmentIds.length || b.specialization.some((s: any) => s.isDepartment && filterIds.departmentIds.includes(s._id));
      const matchAccred = !filterIds.accreditationIds.length || b.accreditation.some((a: any) => filterIds.accreditationIds.includes(a._id));
      return matchBranch && matchCity && matchDoctor && matchSpecialty && matchTreatment && matchDepartment && matchAccred;
    });

    const enrichedBranches = filteredBranches.map((b) => ({
      ...b,
      doctors: b.doctors.map((d: any) => doctors[d._id] || d),
      city: b.city.map((c: any) => cities[c._id] || c),
      treatments: b.treatments.map((t: any) => treatments[t._id] || t),
      specialization: b.specialization.map((s: any) => allSpecializations[s._id] || s),
      accreditation: b.accreditation.map((a: any) => accreditations[a._id] || a),
    }));

    const uniqueDoctors = new Map();
    const uniqueSpecializations = new Map();
    const uniqueSpecialists = new Map();
    const uniqueTreatments = new Map();
    const uniqueDepartments = new Map();

    enrichedBranches.forEach((b) => {
      b.doctors.forEach((d: any) => d._id && uniqueDoctors.set(d._id, d));
      b.treatments.forEach((t: any) => t._id && uniqueTreatments.set(t._id, t));
      b.specialization.forEach((s: any) => {
        if (s.isDepartment) {
          uniqueDepartments.set(s._id, departments[s._id] || s);
        } else if (!s.isTreatment) {
          uniqueSpecialists.set(s._id, specialists[s._id] || s);
        }
      });
    });

    const mapped = DataMappers.hospital(hospital);

    return {
      ...mapped,
      branches: enrichedBranches,
      doctors: Array.from(uniqueDoctors.values()),
      specialists: Array.from(uniqueSpecialists.values()),
      treatments: Array.from(uniqueTreatments.values()),
      departments: Array.from(uniqueDepartments.values()),
      accreditations: enrichedBranches.flatMap(b => b.accreditation),
    };
  });
}

// GET /api/hospitals/[slug]
export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug;
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    // Generate slug for comparison
    const generateSlug = (name: string): string => {
      return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
    };

    // First, try to find the branch directly by slug
    let branchQuery = wixClient.items
      .query(COLLECTIONS.BRANCHES)
      .eq("showHospital", true)  // Only show hospitals
      .include(
        "hospital",
        "HospitalMaster_branches",
        "city",
        "doctor",
        "specialty",
        "accreditation",
        "treatment",
        "department"
      )
      .limit(1000);

    const branchResult = await branchQuery.find();
    let foundBranch = null;
    let foundHospital = null;

    // Search for matching branch
    for (const branch of branchResult.items) {
      const branchName = branch.branchName || branch["Branch Name"] || "";
      const expectedSlug = generateSlug(branchName);
      if (expectedSlug === slug || branchName.toLowerCase().includes(slug.replace(/-/g, ' '))) {
        foundBranch = branch;
        break;
      }
    }

    if (!foundBranch) {
      // If not found as branch, check if it's a standalone hospital
      const hospitalQuery = wixClient.items
        .query(COLLECTIONS.HOSPITALS)
        .include("specialty")
        .limit(1000);

      const hospitalResult = await hospitalQuery.find();
      for (const hospital of hospitalResult.items) {
        const hospitalName = hospital.hospitalName || hospital["Hospital Name"] || "";
        const expectedSlug = generateSlug(hospitalName);
        if (expectedSlug === slug || hospitalName.toLowerCase().includes(slug.replace(/-/g, ' '))) {
          foundHospital = hospital;
          break;
        }
      }

      if (!foundHospital) {
        return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
      }

      // For hospital slug, find its branches
      const branchesForHospital = branchResult.items.filter(b =>
        ReferenceMapper.extractHospitalIds(b).includes(foundHospital._id)
      );

      if (branchesForHospital.length === 0) {
        return NextResponse.json({ error: "No branches found for this hospital" }, { status: 404 });
      }

      // Return hospital with all its branches
      const enrichedHospital = await enrichSingleHospital(foundHospital, branchesForHospital);
      return NextResponse.json(enrichedHospital, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200', // 1 hour cache
        },
      });
    }

    // For branch slug, find the hospital it belongs to
    const hospitalIds = ReferenceMapper.extractHospitalIds(foundBranch);
    if (hospitalIds.length === 0) {
      // Standalone branch - treat as hospital
      const enrichedStandalone = await enrichStandaloneBranch(foundBranch);
      return NextResponse.json(enrichedStandalone, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      });
    }

    // Find the hospital
    const hospitalResult = await wixClient.items
      .query(COLLECTIONS.HOSPITALS)
      .hasSome("_id", hospitalIds)
      .include("specialty")
      .find();

    if (hospitalResult.items.length === 0) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }

    foundHospital = hospitalResult.items[0];

    // Get all branches for this hospital
    const allBranchesForHospital = branchResult.items.filter(b =>
      ReferenceMapper.extractHospitalIds(b).includes(foundHospital._id)
    );

    // Enrich the hospital with branches
    const enrichedHospital = await enrichSingleHospital(foundHospital, allBranchesForHospital);

    return NextResponse.json(enrichedHospital, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch hospital", details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to enrich a single hospital with its branches
async function enrichSingleHospital(hospital: any, branches: any[]) {
  const doctorIds = new Set<string>();
  const cityIds = new Set<string>();
  const specialtyIds = new Set<string>();
  const accreditationIds = new Set<string>();
  const treatmentIds = new Set<string>();
  const departmentIds = new Set<string>();

  // Collect all IDs from branches
  branches.forEach(b => {
    const mapped = DataMappers.branch(b);
    ReferenceMapper.extractIds(mapped.doctors).forEach(id => doctorIds.add(id));
    ReferenceMapper.extractIds(mapped.city).forEach(id => cityIds.add(id));
    ReferenceMapper.extractIds(mapped.accreditation).forEach(id => accreditationIds.add(id));
    ReferenceMapper.extractIds(mapped.treatments).forEach(id => treatmentIds.add(id));

    mapped.specialization.forEach((s: any) => {
      if (s.isDepartment) {
        departmentIds.add(s._id);
      } else if (!s.isTreatment) {
        specialtyIds.add(s._id);
      }
    });
  });

  // Fetch all related data in parallel
  const [doctors, cities, specialties, accreditations, treatments, specialists, departments] = await Promise.all([
    DataFetcher.fetchDoctors(Array.from(doctorIds)),
    DataFetcher.fetchByIds(COLLECTIONS.CITIES, Array.from(cityIds), DataMappers.city),
    DataFetcher.fetchByIds(COLLECTIONS.SPECIALTIES, Array.from(specialtyIds), DataMappers.specialty),
    DataFetcher.fetchByIds(COLLECTIONS.ACCREDITATIONS, Array.from(accreditationIds), DataMappers.accreditation),
    DataFetcher.fetchTreatments(Array.from(treatmentIds)),
    DataFetcher.fetchSpecialistsWithRelationships(Array.from(specialtyIds)),
    DataFetcher.fetchDepartmentsWithSpecialists(Array.from(departmentIds)),
  ]);

  const allSpecializations = { ...specialties, ...treatments, ...specialists, ...departments };

  // Enrich branches
  const enrichedBranches = branches.map(b => {
    const mapped = DataMappers.branch(b);
    return {
      ...mapped,
      doctors: mapped.doctors.map((d: any) => doctors[d._id] || d),
      city: mapped.city.map((c: any) => cities[c._id] || c),
      treatments: mapped.treatments.map((t: any) => treatments[t._id] || t),
      specialization: mapped.specialization.map((s: any) => allSpecializations[s._id] || s),
      accreditation: mapped.accreditation.map((a: any) => accreditations[a._id] || a),
    };
  });

  // Collect unique items
  const uniqueDoctors = new Map();
  const uniqueSpecialists = new Map();
  const uniqueTreatments = new Map();
  const uniqueDepartments = new Map();

  enrichedBranches.forEach(b => {
    b.doctors.forEach((d: any) => d._id && uniqueDoctors.set(d._id, d));
    b.treatments.forEach((t: any) => t._id && uniqueTreatments.set(t._id, t));
    b.specialization.forEach((s: any) => {
      if (s.isDepartment) {
        uniqueDepartments.set(s._id, departments[s._id] || s);
      } else if (!s.isTreatment) {
        uniqueSpecialists.set(s._id, specialists[s._id] || s);
      }
    });
  });

  const mappedHospital = DataMappers.hospital(hospital);

  return {
    ...mappedHospital,
    branches: enrichedBranches,
    doctors: Array.from(uniqueDoctors.values()),
    specialists: Array.from(uniqueSpecialists.values()),
    treatments: Array.from(uniqueTreatments.values()),
    departments: Array.from(uniqueDepartments.values()),
    accreditations: enrichedBranches.flatMap(b => b.accreditation),
  };
}

// Helper function to enrich a standalone branch as a hospital
async function enrichStandaloneBranch(branch: any) {
  const mappedBranch = DataMappers.branch(branch);
  const doctorIds = new Set<string>();
  const cityIds = new Set<string>();
  const accreditationIds = new Set<string>();
  const treatmentIds = new Set<string>();
  const specialtyIds = new Set<string>();
  const departmentIds = new Set<string>();

  // Collect IDs
  ReferenceMapper.extractIds(mappedBranch.doctors).forEach(id => doctorIds.add(id));
  ReferenceMapper.extractIds(mappedBranch.city).forEach(id => cityIds.add(id));
  ReferenceMapper.extractIds(mappedBranch.accreditation).forEach(id => accreditationIds.add(id));
  ReferenceMapper.extractIds(mappedBranch.treatments).forEach(id => treatmentIds.add(id));

  mappedBranch.specialization.forEach((s: any) => {
    if (s.isDepartment) {
      departmentIds.add(s._id);
    } else if (!s.isTreatment) {
      specialtyIds.add(s._id);
    }
  });

  // Fetch data
  const [doctors, cities, accreditations, treatments, enrichedSpecialists] = await Promise.all([
    DataFetcher.fetchDoctors(Array.from(doctorIds)),
    DataFetcher.fetchByIds(COLLECTIONS.CITIES, Array.from(cityIds), DataMappers.city),
    DataFetcher.fetchByIds(COLLECTIONS.ACCREDITATIONS, Array.from(accreditationIds), DataMappers.accreditation),
    DataFetcher.fetchTreatments(Array.from(treatmentIds)),
    DataFetcher.fetchSpecialistsWithRelationships(Array.from(new Set([...specialtyIds, ...Array.from(departmentIds)]))),
  ]);

  // Enrich branch
  const enrichedBranch = {
    ...mappedBranch,
    doctors: mappedBranch.doctors.map((d: any) => doctors[d._id] || d),
    city: mappedBranch.city.map((c: any) => cities[c._id] || c),
    accreditation: mappedBranch.accreditation.map((a: any) => accreditations[a._id] || a),
    specialists: mappedBranch.specialists.map((s: any) => enrichedSpecialists[s._id] || s),
    treatments: mappedBranch.treatments.map((t: any) => treatments[t._id] || t),
    specialization: mappedBranch.specialization.map((s: any) => {
      if (s.isTreatment) {
        return treatments[s._id] || s;
      } else {
        return enrichedSpecialists[s._id] || s;
      }
    }),
  };

  // Create hospital from branch
  const hospital = DataMappers.hospital(branch, true);

  // Collect unique items
  const uniqueDoctors = new Map();
  const uniqueSpecialists = new Map();
  const uniqueTreatments = new Map();

  enrichedBranch.doctors.forEach((d: any) => d._id && uniqueDoctors.set(d._id, d));
  enrichedBranch.specialists.forEach((s: any) => s._id && uniqueSpecialists.set(s._id, s));
  enrichedBranch.treatments.forEach((t: any) => t._id && uniqueTreatments.set(t._id, t));

  return {
    ...hospital,
    branches: [enrichedBranch],
    doctors: Array.from(uniqueDoctors.values()),
    specialists: Array.from(uniqueSpecialists.values()),
    treatments: Array.from(uniqueTreatments.values()),
    accreditations: enrichedBranch.accreditation,
  };
}