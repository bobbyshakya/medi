// Updated route.ts
import { NextResponse } from "next/server";
import { wixClient } from "@/lib/wixClient";
import type {
  Hospital,
  HospitalWithFullBranches,
  HospitalWithBranchPreview,
  Branch,
  Doctor,
  City,
  Treatment,
  PopulatedBranch
} from "@/types/hospital";

const HOSPITAL_COLLECTION_ID = "HospitalMaster";
const BRANCHES_COLLECTION = "BranchesMaster";
const DOCTOR_COLLECTION_ID = "DoctorMaster";
const CITY_COLLECTION_ID = "CityMaster";
const TREATMENT_COLLECTION_ID = "TreatmentMaster";
const BRANCHES_FIELD = "branches";
const DOCTOR_FIELD_IN_BRANCHES = "doctor";
const TREATMENT_FIELD_IN_BRANCHES = "treatment";
const CITY_FIELD_IN_BRANCHES = "city";
const HOSPITAL_FIELD_IN_BRANCHES = "hospital"; // field name for hospital ref in branches

/**
 * Utility function to safely extract a value from an object using fallback keys.
 * @param item - The source object.
 * @param keys - Array of possible keys to extract from.
 * @returns The extracted value or undefined if none found.
 */
function val(item: any, ...keys: string[]): string | null | undefined {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return undefined;
}

/**
 * Maps a raw doctor item to the Doctor type, handling rich content for profile image.
 * @param item - Raw doctor data from Wix.
 * @returns Mapped Doctor object.
 */
function mapDoctor(item: any): Doctor {
  // Handle rich content for profile image
  let profileImage = null;
  const rawImage = item["profileImage"] || item["profile Image"];
  if (rawImage) {
    if (typeof rawImage === "string") {
      profileImage = rawImage;
    } else if (rawImage.url) {
      profileImage = rawImage.url;
    } else if (rawImage.image && rawImage.image.url) {
      profileImage = rawImage.image.url;
    }
  }


  return {
    _id: item._id || item.ID || item.id,
    name: val(item, "doctorName", "Doctor Name") ?? "Doctor",
    specialization: val(item, "specialization", "Specialization") ?? "",
    qualification: val(item, "qualification", "Qualification") ?? "",
    experienceYears: val(item, "experienceYears", "Experience (Years)") ?? "",
    designation: val(item, "designation", "Designation") ?? "",
    languagesSpoken: val(item, "languagesSpoken", "Languages Spoken") ?? "",
    about: val(item, "aboutDoctor", "About Doctor") ?? "",
    profileImage: profileImage ?? null,
  };
}

/**
 * Maps a raw hospital item to the Hospital type.
 * @param item - Raw hospital data from Wix.
 * @returns Mapped Hospital object.
 */
function mapHospital(item: any): Hospital {
  return {
    _id: item._id || item.ID,
    slug: val(item, "slug", "Slug") ?? null,
    name: val(item, "Hospital Name", "hospitalName", "name") ?? "Hospital",
    image: val(item, "Hospital Image", "hospitalImage", "image") ?? null,
    logo: val(item, "Logo", "logo") ?? null,
    yearEstablished: val(item, "Year Established", "yearEstablished") ?? null,
    accreditation: val(item, "Accreditation", "accreditation") ?? null,
    beds: val(item, "No. of Beds", "noOfBeds", "beds") ?? null,
    emergencyServices: val(item, "Emergency Services", "emergencyServices") ?? null,
    description: val(item, "Description", "description") ?? null,
    website: val(item, "Website", "website") ?? null,
    email: val(item, "Email", "email") ?? null,
    contactNumber: val(item, "Contact Number", "contactNumber") ?? null,


  };
}

/**
 * Maps a raw city item to the City type.
 * @param item - Raw city data from Wix.
 * @returns Mapped City object.
 */
function mapCity(item: any): City {
  return {
    _id: item._id,
    name: item["cityName"] || item["City Name"] || item.cityName || "Unknown",
    state: val(item, "State", "state") ?? null,
    stateId: val(item, "State (ID)", "stateId") ?? null,
    countryId: val(item, "Country (ID)", "countryId") ?? null,
    createdDate: val(item, "_createdDate") ?? null,
  };
}

/**
 * Maps a raw treatment item to the Treatment type.
 * @param item - Raw treatment data from Wix.
 * @returns Mapped Treatment object.
 */
function mapTreatment(item: any): Treatment {
  return {
    _id: item._id || item.ID,
    name: val(item, "Treatment Name", "treatmentName", "name") ?? "Treatment",
    slug: val(item, "slug", "Slug") ?? null,
    description: val(item, "Description", "description") ?? null,
  };
}

/**
 * Maps a raw branch item to the PopulatedBranch type, populating doctors, treatments, city, and hospital.
 * @param branch - Raw branch data from Wix.
 * @param doctorList - List of all mapped doctors.
 * @param cityList - List of all mapped cities.
 * @param treatmentList - List of all mapped treatments.
 * @param currentHospital - The current hospital for this branch.
 * @returns Mapped PopulatedBranch object.
 */
function mapBranch(
  branch: any,
  doctorList: Doctor[],
  cityList: City[],
  treatmentList: Treatment[],
  currentHospital: Hospital | null
): PopulatedBranch {
  // Resolve doctors (multi-ref)
  const doctorRefs = Array.isArray(branch?.[DOCTOR_FIELD_IN_BRANCHES]) ? branch[DOCTOR_FIELD_IN_BRANCHES] : [];
  const doctors = doctorRefs
    .map((d: any) =>
      typeof d === "string"
        ? doctorList.find((dd) => dd._id === d)
        : doctorList.find((dd) => dd._id === d?._id)
    )
    .filter(Boolean) as Doctor[];

  // Resolve treatments (multi-ref)
  const treatmentRefs = Array.isArray(branch?.[TREATMENT_FIELD_IN_BRANCHES]) ? branch[TREATMENT_FIELD_IN_BRANCHES] : [];
  const treatments = treatmentRefs
    .map((t: any) =>
      typeof t === "string"
        ? treatmentList.find((tt) => tt._id === t)
        : treatmentList.find((tt) => tt._id === t?._id)
    )
    .filter(Boolean) as Treatment[];

  // Resolve city (single ref)
  let city: City | null = null;
  const cityRef = branch?.[CITY_FIELD_IN_BRANCHES];
  if (cityRef) {
    if (typeof cityRef === "string") {
      city = cityList.find((c) => c._id === cityRef) || null;
    } else if (cityRef._id) {
      city = cityList.find((c) => c._id === cityRef._id) || null;
    }
  }

  // Hospital is the current one, but prefer branch's direct reference if present
  let hospital: Hospital | null = currentHospital;
  const branchHospitalRef = branch?.[HOSPITAL_FIELD_IN_BRANCHES];
  if (branchHospitalRef) {
    if (typeof branchHospitalRef === "string") {
      hospital = { _id: branchHospitalRef, name: "" } as unknown as Hospital;
    } else if (branchHospitalRef._id) {
      hospital = { ...(currentHospital || {} as Hospital), _id: branchHospitalRef._id } as Hospital;
    }
  }

  return {
    _id: branch._id,
    slug: branch.slug ?? null,
    name: val(branch, "Branch Name", "branchName", "name"),
    image: val(branch, "Branch Image", "branchImage", "image"),
    address: val(branch, "address", "Address"),
    phone: val(branch, "phone", "Phone"),
    email: val(branch, "email", "Email"),
    totalBeds: val(branch, "totalBeds", "Total Beds"),
    icuBeds: val(branch, "icuBeds", "ICU Beds"),
    emergencyContact: val(branch, "emergencyContact", "Emergency Contact"),
    doctors,
    treatments,
    city,

  } as PopulatedBranch;
}

/**
 * Fetches all doctors from the DoctorMaster collection.
 * @returns Array of mapped Doctor objects.
 */
async function getAllDoctors(): Promise<Doctor[]> {
  const client = wixClient;
  const res = await client.items
    .query(DOCTOR_COLLECTION_ID)
    .limit(1000)
    .find({ consistentRead: true });
  return (res?.items || []).map(mapDoctor);
}

/**
 * Fetches all cities from the CityMaster collection.
 * @returns Array of mapped City objects.
 */
async function getAllCities(): Promise<City[]> {
  const client = wixClient;
  const res = await client.items
    .query(CITY_COLLECTION_ID)
    .limit(1000)
    .find({ consistentRead: true });
  return (res?.items || []).map(mapCity);
}

/**
 * Fetches all treatments from the TreatmentMaster collection.
 * @returns Array of mapped Treatment objects.
 */
async function getAllTreatments(): Promise<Treatment[]> {
  const client = wixClient;
  const res = await client.items
    .query(TREATMENT_COLLECTION_ID)
    .limit(1000)
    .find({ consistentRead: true });
  return (res?.items || []).map(mapTreatment);
}

/**
 * Fetches branches for a list of hospitals, populating doctors, treatments, city.
 * @param hospitals - List of mapped hospitals.
 * @param doctorList - List of all mapped doctors.
 * @param cityList - List of all mapped cities.
 * @param treatmentList - List of all mapped treatments.
 * @returns A record mapping hospital IDs to their populated branches.
 */
async function getBranchesForHospitals(
  hospitals: Hospital[],
  doctorList: Doctor[],
  cityList: City[],
  treatmentList: Treatment[]
): Promise<Record<string, PopulatedBranch[]>> {
  const client = wixClient;
  const branchesByHospital: Record<string, PopulatedBranch[]> = {};

  for (const hospital of hospitals) {
    const res = await client.items.queryReferenced(
      HOSPITAL_COLLECTION_ID,
      hospital._id,
      BRANCHES_FIELD,
      { limit: 1000 }
    );

    const items = res?.items || [];
    branchesByHospital[hospital._id] = items.map((b: any) =>
      mapBranch(b, doctorList, cityList, treatmentList, hospital)
    );
  }

  return branchesByHospital;
}

/**
 * Builds the base query for hospitals with optional filters, handling multi-reference for doctor and city filtering via branches.
 * @param q - Search query for hospital name.
 * @param slug - Specific hospital slug.
 * @param cityId - Filter by branch city ID.
 * @param doctorId - Filter by doctor ID (via branches).
 * @returns Configured Wix query builder.
 */
async function buildHospitalQuery(
  q?: string,
  slug?: string,
  cityId?: string,
  doctorId?: string
) {
  const client = wixClient;
  let query = client.items
    .query(HOSPITAL_COLLECTION_ID)
    .descending("_createdDate");

  if (slug) {
    query = query.eq("Slug" as any, slug);
  } else {
    if (q) {
      query = query.contains("Hospital Name" as any, q);
    }

    // For cityId filter: find hospitals with branches in that city
    if (cityId) {
      const branchesInCity = await client.items
        .query(BRANCHES_COLLECTION)
        .eq(CITY_FIELD_IN_BRANCHES as any, cityId)
        .find();

      const hospitalIds = Array.from(
        new Set(
          branchesInCity.items.flatMap((b: any) => {
            const hospRef = b[HOSPITAL_FIELD_IN_BRANCHES];
            if (Array.isArray(hospRef)) {
              return hospRef.map((h: any) => h?._id || h).filter(Boolean);
            } else if (hospRef?._id) {
              return [hospRef._id];
            } else if (typeof hospRef === "string") {
              return [hospRef];
            }
            return [];
          })
        )
      );

      if (hospitalIds.length > 0) {
        query = query.hasSome("_id", hospitalIds);
      } else {
        // Ensure no results by using impossible ID
        query = query.eq("_id" as any, "__none__");
      }
    }

    // Filter hospitals by doctor ID via multi-reference in branches
    if (doctorId) {
      const branchesWithDoctor = await client.items
        .query(BRANCHES_COLLECTION)
        .hasSome(DOCTOR_FIELD_IN_BRANCHES as any, [doctorId])
        .find();

      const hospitalIds = Array.from(
        new Set(
          branchesWithDoctor.items.flatMap((b: any) => {
            const hospRef = b[HOSPITAL_FIELD_IN_BRANCHES];
            if (Array.isArray(hospRef)) {
              return hospRef.map((h: any) => h?._id || h).filter(Boolean);
            } else if (hospRef?._id) {
              return [hospRef._id];
            } else if (typeof hospRef === "string") {
              return [hospRef];
            }
            return [];
          })
        )
      );

      if (hospitalIds.length > 0) {
        query = query.hasSome("_id", hospitalIds);
      } else {
        // Ensure no results by using impossible ID
        query = query.eq("_id" as any, "__none__");
      }
    }
  }

  return query;
}

/**
 * Main API handler for GET requests to fetch hospitals with populated branches (doctors, treatments, city).
 */
export async function GET(req: Request) {
  const client = wixClient;
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const slug = url.searchParams.get("slug")?.trim();
  const cityId = url.searchParams.get("cityId")?.trim();
  const doctorId = url.searchParams.get("doctorId")?.trim();
  const page = Number(url.searchParams.get("page") || "0");
  const pageSize = slug ? 1 : Math.min(50, Number(url.searchParams.get("pageSize") || "20"));

  // Fetch all reference data upfront
  const [doctorList, cityList, treatmentList] = await Promise.all([
    getAllDoctors(),
    getAllCities(),
    getAllTreatments(),
  ]);

  // Build and execute hospital query
  const query = await buildHospitalQuery(q, slug, cityId, doctorId);
  const res = await query
    .skip(slug ? 0 : page * pageSize)
    .limit(pageSize)
    .find({ consistentRead: true });

  const hospitals = (res?.items || []).map(mapHospital);

  // Fetch associated branches with populated data
  const branchesByHospital = await getBranchesForHospitals(hospitals, doctorList, cityList, treatmentList);

  // Map hospitals with branch data
  const output: (HospitalWithBranchPreview | HospitalWithFullBranches)[] = hospitals.map((hospital: Hospital) => {
    const branches = branchesByHospital[hospital._id] || [];
    if (slug) {
      // For single hospital, return full branches
      return {
        ...hospital,
        branches,
      } as HospitalWithFullBranches;
    }
    // For list, return preview with all branches (or slice if too many, but full for now)
    return {
      ...hospital,
      branchesCount: branches.length,
      branchesPreview: branches, // Full for simplicity
    } as HospitalWithBranchPreview;
  });

  // Response formatting
  if (slug) {
    return NextResponse.json({
      item: output[0] || null,
    });
  }

  return NextResponse.json({
    items: output,
    totalCount: res?.totalCount ?? output.length,
    page,
    pageSize,
  });
}