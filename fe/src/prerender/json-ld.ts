import type { CompanySize, PublicCompany } from '@/features/company'
import { mediaSrc } from '@/features/company'
import type { EmploymentType } from '@/features/jobs'
import type { PublicJob } from '@/features/public-jobs'
import { SITE_NAME } from './shared'

// Mở rộng MVP 2 – E4 · F-PUB-04: dữ liệu có cấu trúc schema.org cho trang dựng sẵn

const EMPLOYMENT: Record<EmploymentType, string> = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  CONTRACT: 'CONTRACTOR',
  INTERNSHIP: 'INTERN',
}

const EMPLOYEES: Record<CompanySize, { minValue: number; maxValue?: number }> = {
  '1-50': { minValue: 1, maxValue: 50 },
  '51-200': { minValue: 51, maxValue: 200 },
  '201-500': { minValue: 201, maxValue: 500 },
  '501-1000': { minValue: 501, maxValue: 1000 },
  '1000+': { minValue: 1001 },
}

/** Trong JSON-LD, URL ảnh phải là tuyệt đối; không có siteUrl thì bỏ ảnh */
export const absoluteUrl = (url: string, siteUrl?: string) =>
  /^https?:\/\//.test(url) ? url : siteUrl ? `${siteUrl.replace(/\/$/, '')}${url}` : undefined

/** Hạn nộp là ngày giờ Việt Nam (BR-JOB-10): hết hạn sau 23:59:59 ngày đó */
const endOfVnDay = (day: string) => `${day}T23:59:59+07:00`

function organization(company: PublicCompany | null, siteUrl?: string) {
  if (!company) return { '@type': 'Organization', name: SITE_NAME }
  const logo = company.logo ? absoluteUrl(mediaSrc(company.logo), siteUrl) : undefined
  return {
    '@type': 'Organization',
    name: company.name,
    ...(company.website && { sameAs: company.website }),
    ...(logo && { logo }),
  }
}

function baseSalary(salary: PublicJob['salary']) {
  // BR-JOB-08: chỉ chế độ RANGE mới có số
  if (salary?.mode !== 'RANGE' || (salary.min === null && salary.max === null)) return undefined
  return {
    '@type': 'MonetaryAmount',
    currency: 'VND',
    value: {
      '@type': 'QuantitativeValue',
      ...(salary.min !== null && { minValue: salary.min }),
      ...(salary.max !== null && { maxValue: salary.max }),
      unitText: 'MONTH',
    },
  }
}

function description(job: PublicJob) {
  const must = job.requirements.filter((r) => r.type === 'MUST').map((r) => r.label)
  return [
    job.jdText,
    must.length ? `Yêu cầu: ${must.join(', ')}.` : '',
    job.benefits ? `Quyền lợi:\n${job.benefits}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
}

export function jobPostingJsonLd(job: PublicJob, company: PublicCompany | null, siteUrl?: string) {
  const salary = baseSalary(job.salary)
  const place = {
    '@type': 'Place',
    address: { '@type': 'PostalAddress', addressLocality: job.location, addressCountry: 'VN' },
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: description(job),
    datePosted: job.publishedAt,
    ...(job.deadline && { validThrough: endOfVnDay(job.deadline) }),
    ...(job.employmentType && { employmentType: EMPLOYMENT[job.employmentType] }),
    hiringOrganization: organization(company, siteUrl),
    ...(job.workMode === 'REMOTE'
      ? {
          jobLocationType: 'TELECOMMUTE',
          applicantLocationRequirements: { '@type': 'Country', name: 'VN' },
        }
      : { jobLocation: place }),
    ...(salary && { baseSalary: salary }),
    ...(job.headcount && { totalJobOpenings: job.headcount }),
    directApply: true,
  }
}

export function organizationJsonLd(company: PublicCompany, siteUrl?: string) {
  const sameAs = [company.website, ...Object.values(company.socials)].filter(
    (url): url is string => !!url,
  )
  return {
    '@context': 'https://schema.org',
    ...organization(company, siteUrl),
    ...(siteUrl && { url: `${siteUrl.replace(/\/$/, '')}/careers` }),
    description: company.about,
    ...(company.foundedYear && { foundingDate: String(company.foundedYear) }),
    ...(company.sizeRange && {
      numberOfEmployees: { '@type': 'QuantitativeValue', ...EMPLOYEES[company.sizeRange] },
    }),
    ...(sameAs.length && { sameAs }),
    ...(company.offices.length && {
      address: company.offices.map((o) => ({
        '@type': 'PostalAddress',
        name: o.name,
        streetAddress: o.address,
        addressCountry: 'VN',
      })),
    }),
  }
}
