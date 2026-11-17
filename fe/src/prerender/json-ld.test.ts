import type { PublicCompanyPage, PublicJob } from '@/features/public-jobs'
import { jobPostingJsonLd, organizationJsonLd } from './json-ld'

const LOGO = `/public/media/${'a'.repeat(64)}.png`

const job: PublicJob = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Backend Developer (NestJS)',
  location: 'Hà Nội',
  department: { name: 'Kỹ thuật' },
  publishedAt: '2026-10-20T02:00:00.000Z',
  salary: { mode: 'RANGE', min: 25_000_000, max: 40_000_000 },
  level: 'MIDDLE',
  employmentType: 'CONTRACT',
  workMode: 'HYBRID',
  headcount: 2,
  deadline: '2026-11-30',
  expired: false,
  benefits: 'Lương tháng 13',
  jdText: 'Xây dựng API bằng NestJS.',
  requirements: [
    { label: 'NestJS', type: 'MUST' },
    { label: 'Docker', type: 'NICE' },
  ],
  company: { name: 'Công ty Cổ phần HireFlow', slug: 'hireflow-demo', logoUrl: LOGO, tagline: '' },
  otherJobs: [],
}

const company: PublicCompanyPage = {
  slug: 'hireflow-demo',
  jobs: [],
  name: 'Công ty Cổ phần HireFlow',
  tagline: '',
  about: 'Phần mềm tuyển dụng.',
  sizeRange: '201-500',
  industries: [],
  foundedYear: 2016,
  website: 'https://hireflow.example.com',
  socials: { linkedin: 'https://linkedin.example/hireflow', facebook: null },
  benefits: [],
  offices: [{ name: 'Hà Nội', address: '18 Duy Tân, Cầu Giấy', mapUrl: null }],
  milestones: [],
  logo: { id: 'm1', kind: 'LOGO', url: LOGO, width: 256, height: 256, alt: 'Logo', position: 0 },
  cover: null,
  gallery: [],
  openJobs: 3,
}

const SITE = 'https://careers.example'

// Mở rộng MVP 2 – E4 · MVP 3 · US-24
describe('JobPosting JSON-LD', () => {
  it('carries deadline, type, location, salary and the company that posted the job', () => {
    const ld = jobPostingJsonLd(job, SITE)
    expect(ld).toMatchObject({
      '@type': 'JobPosting',
      validThrough: '2026-11-30T23:59:59+07:00',
      employmentType: 'CONTRACTOR',
      jobLocation: { address: { addressLocality: 'Hà Nội', addressCountry: 'VN' } },
      baseSalary: {
        currency: 'VND',
        value: { minValue: 25_000_000, maxValue: 40_000_000, unitText: 'MONTH' },
      },
      totalJobOpenings: 2,
      hiringOrganization: {
        name: 'Công ty Cổ phần HireFlow',
        url: `${SITE}/companies/hireflow-demo`,
        logo: `${SITE}/api/v1${LOGO}`,
      },
    })
    expect(ld.description).toContain('Yêu cầu: NestJS.')
    expect(ld.description).toContain('Quyền lợi:\nLương tháng 13')
  })

  it('BR-JOB-08: no salary numbers unless the job shows a range', () => {
    expect(jobPostingJsonLd({ ...job, salary: { mode: 'NEGOTIABLE' } })).not.toHaveProperty(
      'baseSalary',
    )
    expect(jobPostingJsonLd({ ...job, salary: null })).not.toHaveProperty('baseSalary')
  })

  it('marks remote jobs as telecommute instead of a place', () => {
    const ld = jobPostingJsonLd({ ...job, workMode: 'REMOTE' })
    expect(ld).toMatchObject({ jobLocationType: 'TELECOMMUTE' })
    expect(ld).not.toHaveProperty('jobLocation')
  })

  it('works for a company without a logo and without a site URL', () => {
    const ld = jobPostingJsonLd({
      ...job,
      deadline: null,
      company: { ...job.company, logoUrl: null },
    })
    expect(ld.hiringOrganization).toEqual({
      '@type': 'Organization',
      name: 'Công ty Cổ phần HireFlow',
    })
    expect(ld).not.toHaveProperty('validThrough')
    expect(jobPostingJsonLd(job).hiringOrganization).not.toHaveProperty('logo')
  })
})

describe('Organization JSON-LD', () => {
  it('describes the company for /companies/:slug', () => {
    expect(organizationJsonLd(company, SITE)).toMatchObject({
      '@type': 'Organization',
      name: 'Công ty Cổ phần HireFlow',
      url: `${SITE}/companies/hireflow-demo`,
      logo: `${SITE}/api/v1${LOGO}`,
      foundingDate: '2016',
      numberOfEmployees: { minValue: 201, maxValue: 500 },
      sameAs: ['https://hireflow.example.com', 'https://linkedin.example/hireflow'],
      address: [{ name: 'Hà Nội', streetAddress: '18 Duy Tân, Cầu Giấy' }],
    })
  })
})
