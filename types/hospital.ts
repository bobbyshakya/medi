// Updated hospital.ts
// Hospital types
export interface Hospital {
  _id: string
  slug?: string | null
  name: string
  image?: string | null // Wix image url (wix:image://...)
  logo?: string | null // Wix image url (wix:image://...)
  yearEstablished?: string | number | null
  accreditation?: string | null
  beds?: number | string | null
  emergencyServices?: boolean | string | null
  description?: string | null
  website?: string | null
  noOfBeds?: number | string | null
  email?: string | null
  contactNumber?: string | null
  countryId?: string | null
  city?: string | null
  branches?: string[] | number[] | null // list of branch IDs
  branchesCount?: number | null
}

export interface Treatment {
  _id: string
  name: string
  slug?: string | null
  description?: string | null
}

export interface City {
  _id: string
  name: string
  state?: string | null
  stateId?: string | null
  countryId?: string | null
  createdDate?: string | null
  updatedDate?: string | null
  owner?: string | null
  hospitalMasterCity?: string[] | null // reference to hospitals
}

export type PopulatedBranch = Omit<Branch, 'city' | 'hospital' | 'doctors'> & {
  doctors: Doctor[];
  treatments: Treatment[];
  city: City | null;
  hospital: Hospital | null;
};

export interface HospitalWithBranchPreview extends Hospital {
  branchesPreview?: PopulatedBranch[] | null
}

export interface HospitalWithFullBranches extends Omit<Hospital, 'branches'> {
  branches: PopulatedBranch[];
}

// Branch types
export interface Branch {
  _id: string
  slug?: string | null
  name?: string | null
  image?: string | null
  emergencyContact?: string | null
  address?: string | null
  city?: string | number | null // single reference based on CMS
  state?: string | null
  country?: string | null
  phone?: string | null
  email?: string | null
  totalBeds?: number | string | null
  icuBeds?: number | string | null
  doctorIds?: string[] | null // list of doctor IDs
  doctors?: Doctor[] | null
  hospital?: string | null
}

// Doctor types
export interface Doctor {
  _id: string
  slug?: string | null
  name: string
  profileImage?: string 
  specialization?: string | null
  qualification?: string | null
  experienceYears?: number | string | null
  designation?: string | null
  languagesSpoken?: string | null
  about?: string | null
  cityId?: string | null
  stateId?: string | null
  countryId?: string | null
  BranchesMaster_doctor?: string[] | null
  BranchesMaster_doctorCount?: number | null
}

// API responses
export interface DoctorsApiResponse {
  items: Doctor[]
}

export interface CitiesApiResponse {
  items: City[]
}