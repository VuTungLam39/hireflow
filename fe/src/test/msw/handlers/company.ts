import { delay, http } from 'msw'
import type { Company, CompanyInput, CompanyMedia, MediaKind } from '@/features/company'
import { Permission } from '@/lib/permissions'
import { db, uid } from '../data'
import { api, authorize, fail, notFound, ok } from '../http'

const GALLERY_MAX = 8
const HTTPS = /^https:\/\//

/** Hồ sơ công ty giả (một dòng), giữ trong bộ nhớ như db */
export const companyState: {
  profile: Omit<Company, 'logo' | 'cover' | 'gallery' | 'complete'>
  media: CompanyMedia[]
} = {
  profile: {
    name: 'HireFlow',
    tagline: 'Tuyển đúng người, nhanh hơn',
    about: 'Chúng tôi xây phần mềm tuyển dụng cho doanh nghiệp Việt Nam.',
    sizeRange: '51-200',
    industries: ['Phần mềm'],
    foundedYear: 2016,
    website: 'https://hireflow.example.com',
    socials: {},
    benefits: [{ title: 'Bảo hiểm sức khoẻ', description: 'Cho cả gia đình' }],
    offices: [{ name: 'Hà Nội', address: 'Tầng 12, 54 Liễu Giai, Ba Đình', mapUrl: null }],
    milestones: [{ year: 2016, title: 'Thành lập', description: '' }],
    updatedAt: new Date().toISOString(),
  },
  media: [],
}

const pick = (kind: MediaKind) => companyState.media.find((m) => m.kind === kind) ?? null
export const toCompany = (): Company => {
  const logo = pick('LOGO')
  const { profile } = companyState
  return {
    ...profile,
    logo,
    cover: pick('COVER'),
    gallery: companyState.media
      .filter((m) => m.kind === 'GALLERY')
      .sort((a, b) => a.position - b.position),
    complete: !!profile.name && !!logo && !!profile.about,
  }
}

const urlErrors = (input: CompanyInput) => {
  const errors: { field: string; messages: string[] }[] = []
  const check = (field: string, v: unknown) =>
    typeof v === 'string' &&
    v &&
    !HTTPS.test(v) &&
    errors.push({ field, messages: ['Chỉ nhận đường dẫn bắt đầu bằng https://'] })
  check('website', input.website)
  for (const [k, v] of Object.entries(input.socials ?? {})) check(`socials.${k}`, v)
  input.offices?.forEach((o, i: number) => check(`offices.${i}.mapUrl`, o.mapUrl))
  return errors
}

// F-ORG-01 · API Contract 9 (Mở rộng MVP 2)
export const companyHandlers = [
  http.get(api('/company'), async ({ request }) => {
    await delay()
    const user = authorize(request, Permission.CompanyManage)
    if (user instanceof Response) return user
    return ok(toCompany())
  }),

  http.put(api('/company'), async ({ request }) => {
    await delay()
    const user = authorize(request, Permission.CompanyManage)
    if (user instanceof Response) return user
    const input = (await request.json()) as CompanyInput
    const errors = urlErrors(input)
    if (errors.length) return fail(400, 'VALIDATION_FAILED', 'Validation failed', errors)
    Object.assign(companyState.profile, input, { updatedAt: new Date().toISOString() })
    return ok(toCompany())
  }),

  http.post(api('/company/media'), async ({ request }) => {
    await delay()
    const user = authorize(request, Permission.CompanyManage)
    if (user instanceof Response) return user
    const form = await request.formData()
    const kind = String(form.get('kind')) as MediaKind
    const file = form.get('file')
    const alt = String(form.get('alt') ?? '').trim()
    // File của jsdom và của undici khác lớp, nên kiểm theo hình dạng thay vì instanceof
    const type = typeof file === 'object' && file && 'type' in file ? String(file.type) : ''
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(type)) {
      return fail(400, 'MEDIA_TYPE_NOT_ALLOWED', 'Only JPEG, PNG or WebP images are allowed')
    }
    if (kind === 'GALLERY') {
      if (alt.length < 2) {
        return fail(400, 'VALIDATION_FAILED', 'Validation failed', [
          { field: 'alt', messages: ['Mô tả ngắn nội dung ảnh'] },
        ])
      }
      if (companyState.media.filter((m) => m.kind === 'GALLERY').length >= GALLERY_MAX) {
        return fail(409, 'GALLERY_FULL', 'Gallery is full')
      }
    } else {
      companyState.media = companyState.media.filter((m) => m.kind !== kind)
    }
    const gallery = companyState.media.filter((m) => m.kind === 'GALLERY')
    const media: CompanyMedia = {
      id: uid('media'),
      kind,
      url: `/public/media/${'0'.repeat(56)}${String(companyState.media.length).padStart(8, '0')}.png`,
      width: kind === 'COVER' ? 1500 : 800,
      height: 500,
      alt,
      position: kind === 'GALLERY' ? gallery.length : 0,
    }
    companyState.media.push(media)
    return ok(media, { status: 201 })
  }),

  http.patch(api('/company/media/:id'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.CompanyManage)
    if (user instanceof Response) return user
    const media = companyState.media.find((m) => m.id === params.id)
    if (!media) return notFound('Media')
    Object.assign(media, (await request.json()) as Partial<CompanyMedia>)
    return ok(media)
  }),

  http.delete(api('/company/media/:id'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.CompanyManage)
    if (user instanceof Response) return user
    companyState.media = companyState.media.filter((m) => m.id !== params.id)
    return ok(null)
  }),

  http.get(api('/public/company'), async () => {
    await delay()
    const company = toCompany()
    if (!company.complete) {
      return fail(404, 'COMPANY_PROFILE_INCOMPLETE', 'Company profile is not published yet')
    }
    const { complete: _c, updatedAt: _u, ...rest } = company
    return ok({ ...rest, openJobs: db.jobs.filter((j) => j.status === 'OPEN').length })
  }),
]
