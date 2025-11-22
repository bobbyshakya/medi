// File: data/hospitalDataService.ts

// Define the expected structure for the data consumed by BranchFilter.tsx
// This structure is based on how BranchFilter.tsx currently processes allHospitals.
interface City {
    _id: string;
    cityName: string;
}

interface Treatment {
    _id: string;
    name: string;
}

interface Specialization {
    _id: string;
    name: string;
}

interface Doctor {
    _id: string;
    doctorName: string;
    specialization: Specialization[] | string; // Can be an array of objects or a string ID/name
    // Add other doctor fields as needed
}

interface Branch {
    _id: string;
    branchName: string;
    city: City[];
    treatments: Treatment[];
    doctors: Doctor[];
    specialists?: any[]; // Keep for compatibility if used elsewhere, though not fully defined here
    // Add other branch fields as needed
}

interface Hospital {
    hospitalName: string;
    treatments?: Treatment[];
    doctors?: Doctor[];
    branches: Branch[];
    // Add other hospital fields as needed
}

// ⚠️ REPLACE THIS MOCK DATA WITH YOUR ACTUAL CMS/WIX DATA FETCHING LOGIC
const PROPER_HOSPITAL_DATA: Hospital[] = [
    {
        hospitalName: "Apollo General",
        treatments: [{ _id: "T1", name: "Cardiology" }],
        doctors: [{ _id: "D1", doctorName: "Dr. Smith", specialization: [{ _id: "S1", name: "Heart Surgery" }] }],
        branches: [
            {
                _id: "B1",
                branchName: "Main Branch - New York",
                city: [{ _id: "C1", cityName: "New York" }],
                treatments: [{ _id: "T2", name: "Neurology" }],
                doctors: [{ _id: "D2", doctorName: "Dr. Johnson", specialization: [{ _id: "S2", name: "Neurosurgeon" }] }],
            },
            {
                _id: "B2",
                branchName: "Satellite Clinic - Boston",
                city: [{ _id: "C2", cityName: "Boston" }],
                treatments: [{ _id: "T3", name: "Pediatrics" }],
                doctors: [{ _id: "D3", doctorName: "Dr. Williams", specialization: [{ _id: "S3", name: "Pediatrician" }] }],
            },
        ],
    },
    {
        hospitalName: "Global Care",
        treatments: [{ _id: "T4", name: "Oncology" }],
        doctors: [{ _id: "D4", doctorName: "Dr. Lee", specialization: [{ _id: "S4", name: "Cancer Specialist" }] }],
        branches: [
            {
                _id: "B3",
                branchName: "Primary Center - New York",
                city: [{ _id: "C1", cityName: "New York" }], // Shared City ID
                treatments: [{ _id: "T5", name: "Orthopedics" }],
                doctors: [{ _id: "D5", doctorName: "Dr. Brown", specialization: [{ _id: "S5", name: "Knee Surgeon" }] }],
            },
        ],
    },
];
// ⚠️ END OF MOCK DATA (MUST BE REPLACED)

/**
 * Fetches the master hospital data from the CMS/API.
 * This function should be implemented to connect to your actual Wix/CMS data.
 * @returns {Promise<Hospital[]>} The list of all hospitals and their associated data.
 */
export async function getMasterHospitalData(): Promise<Hospital[]> {
    console.log("Fetching master hospital data from CMS...");
    // Simulate a network delay (remove this in production)
    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    // ⛔️ Your actual fetching logic goes here, e.g.:
    // const response = await fetch('YOUR_WIX_CMS_API_ENDPOINT', { cache: 'no-store' });
    // if (!response.ok) throw new Error('Failed to fetch hospital data');
    // const data = await response.json();
    // return data;

    return PROPER_HOSPITAL_DATA; // Returning placeholder data until real fetch is implemented
}

export type { Hospital };