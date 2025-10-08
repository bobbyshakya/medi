// types/hospital.ts
export interface Hospital {
  _id: string
  name: string
  hospitalName: string
  logo: string
  description: string
  branches: HospitalBranch[]
  specialtiesTags: string[] | null
  slug: string
  establishedDate: string | null
  bannerImage: string
  gallery: string[] | null
  branchCount: number
  createdDate: string
  updatedDate: string
}

export interface HospitalBranch {
  HospitalList_branches: never[]
  _id: string
  branchName: string
  address: string
  phone: string
  pinCode: string
  email: string
  branchImageUrl: string
  slug: string
  mapEmbedUrl: string
  primaryLocation: | primaryLocation[]
  doctors: Doctor[]
  createdDate: string
  updatedDate: string
}

export interface primaryLocation {
  _id: string
  CityName: string
  state?: {
    _id: string
    name: string
  }
  country?: {
    _id: string
    name: string
  }
}

export interface Doctor {
  _id: string
  name: string
  specialization: string
  experience: string | null
  imageUrl: string
  slug: string
  designation: string
  contactPhone: string
  contactEmail: string
  doctorPageUrl: string
  createdDate: string
  updatedDate: string
}

export interface FilterOption {
  _id: string
  name: string
  type: 'city' | 'state' | 'country'
}