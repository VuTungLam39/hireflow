// F-ORG-01 · API Contract 9 (Mở rộng MVP 2)
export const COMPANY_SIZE = {
  '1-50': '1 – 50 người',
  '51-200': '51 – 200 người',
  '201-500': '201 – 500 người',
  '501-1000': '501 – 1.000 người',
  '1000+': 'Trên 1.000 người',
} as const
export type CompanySize = keyof typeof COMPANY_SIZE

export type MediaKind = 'LOGO' | 'COVER' | 'GALLERY'

export interface CompanyMedia {
  id: string
  kind: MediaKind
  /** Đường dẫn sau apiUrl, ví dụ /public/media/<sha256>.png */
  url: string
  width: number
  height: number
  alt: string
  position: number
}

export interface CompanyBenefit {
  title: string
  description: string
}

export interface CompanyOffice {
  name: string
  address: string
  mapUrl: string | null
}

export interface CompanyMilestone {
  year: number
  title: string
  description: string
}

export interface CompanySocials {
  linkedin?: string | null
  facebook?: string | null
  youtube?: string | null
  tiktok?: string | null
}

export interface CompanyContent {
  name: string
  tagline: string
  about: string
  sizeRange: CompanySize | null
  industries: string[]
  foundedYear: number | null
  website: string | null
  socials: CompanySocials
  benefits: CompanyBenefit[]
  offices: CompanyOffice[]
  milestones: CompanyMilestone[]
  logo: CompanyMedia | null
  cover: CompanyMedia | null
  gallery: CompanyMedia[]
}

export interface Company extends CompanyContent {
  /** BR-ORG-01: đủ tên, logo, giới thiệu thì trang /careers mới hiện */
  complete: boolean
  updatedAt: string
}

export interface PublicCompany extends CompanyContent {
  openJobs: number
}

export type CompanyInput = Partial<
  Pick<
    CompanyContent,
    | 'name'
    | 'tagline'
    | 'about'
    | 'sizeRange'
    | 'industries'
    | 'foundedYear'
    | 'website'
    | 'socials'
    | 'benefits'
    | 'offices'
    | 'milestones'
  >
>

export const GALLERY_MAX = 8
export const MEDIA_LIMIT_MB: Record<MediaKind, number> = { LOGO: 1, COVER: 3, GALLERY: 3 }
export const MEDIA_ACCEPT = ['image/jpeg', 'image/png', 'image/webp'] as const
