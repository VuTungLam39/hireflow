// Public API của feature company (Mở rộng MVP 2 – E3)
export { companyApi, mediaSrc } from './api/company.api'
export { companyKeys, useCompany, usePublicCompany } from './hooks/use-company'
export { COMPANY_SIZE, GALLERY_MAX } from './types'
export type {
  Company,
  CompanyInput,
  CompanyMedia,
  CompanySize,
  MediaKind,
  PublicCompany,
} from './types'
