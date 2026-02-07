// app/api/hospitals/collections.ts
// Wix collection constants

export const COLLECTIONS = {
  BRANCHES: "BranchesMaster",
  DOCTORS: "DoctorMaster",
  CITIES: "CityMaster",
  HOSPITALS: "HospitalMaster",
  ACCREDITATIONS: "Accreditation",
  SPECIALTIES: "SpecialistsMaster",
  DEPARTMENTS: "Department",
  TREATMENTS: "TreatmentMaster",
  STATES: "StateMaster",
  COUNTRIES: "CountryMaster",
} as const

export type CollectionName = keyof typeof COLLECTIONS