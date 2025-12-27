// types/searchTypes.ts

export interface BaseItem {
  _id: string;
  name?: string;
  title?: string;
  doctorName?: string;
  popular?: boolean;
}

export interface SpecialtyType extends BaseItem {
  name: string;
  title?: string;
  department?: DepartmentType[] | null;
}

export interface DepartmentType extends BaseItem {
  name: string;
}

export interface AccreditationType extends BaseItem {
  title: string;
  image: string | null;
}

export interface CityType {
  _id: string;
  cityName: string;
  state: string | null;
  country: string | null;
}

export interface TreatmentType extends BaseItem {
  name: string;
  description: string | null;
  category: string | null;
  duration: string | null;
  cost: string | null;
  treatmentImage?: string | null;
}

export interface DoctorType extends BaseItem {
  doctorName: string;
  specialization: SpecialtyType[] | string[] | string | null;
  qualification: string | null;
  experienceYears: string | null;
  designation: string | null;
  aboutDoctor: string | null;
  profileImage: string | null;
}

export interface ExtendedDoctorType extends DoctorType {
  baseId: string;
  locations: {
    hospitalName: string;
    hospitalId: string;
    branchName?: string;
    branchId?: string;
    cities: CityType[];
  }[];
  departments: DepartmentType[];
  filteredLocations?: {
    hospitalName: string;
    hospitalId: string;
    branchName?: string;
    branchId?: string;
    cities: CityType[];
  }[];
}

export interface TreatmentLocation {
  branchId?: string;
  branchName?: string;
  hospitalName: string;
  hospitalId: string;
  cities: CityType[];
  departments: DepartmentType[];
  cost: string | null;
}

export interface ExtendedTreatmentType extends TreatmentType {
  branchesAvailableAt: TreatmentLocation[];
  departments: DepartmentType[];
  filteredBranchesAvailableAt?: TreatmentLocation[];
}

export interface BranchSpecialist {
  _id: string;
  name: string;
  department: DepartmentType[];
  treatments: TreatmentType[];
}

export interface BranchType extends BaseItem {
  branchName: string;
  address: string | null;
  city: CityType[];
  totalBeds: string | null;
  noOfDoctors: string | null;
  yearEstablished: string | null;
  branchImage: string | null;
  description: string | null;
  doctors: DoctorType[];
  treatments: TreatmentType[];
  specialists: BranchSpecialist[];
  specialization: SpecialtyType[];
  accreditation: AccreditationType[];
}

export interface HospitalType extends BaseItem {
  hospitalName: string;
  logo: string | null;
  yearEstablished: string | null;
  description: string | null;
  branches: BranchType[];
  doctors: DoctorType[];
  treatments: TreatmentType[];
  departments?: DepartmentType[];
}

export interface ApiResponse {
  items: HospitalType[];
  total: number;
}

export type FilterKey = "city" | "state" | "treatment" | "specialization" | "department" | "doctor" | "branch";

export interface FilterValue {
  id: string;
  query: string;
}

export interface FilterState {
  view: "hospitals" | "doctors" | "treatments";
  city: FilterValue;
  state: FilterValue;
  treatment: FilterValue;
  specialization: FilterValue;
  department: FilterValue;
  doctor: FilterValue;
  branch: FilterValue;
  sortBy: "all" | "popular" | "az" | "za";
}

export type OptionType = { id: string; name: string };