// lib/cms/index.ts
// Central export for CMS module

export * from './types'
export * from './cache'
export {
  getAllCMSData,
  getCachedCMSData,
  getHospitalBySlug,
  searchHospitals,
  generateSlug,
} from './data-service'
