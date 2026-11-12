import { ArrowRight, ArrowUpRight, MapPin } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { EmptyState, ErrorState, Timeline } from '@/components/shared'
import { Skeleton, buttonVariants } from '@/components/ui'
import {
  COMPANY_SIZE,
  mediaSrc,
  usePublicCompany,
  type CompanyMedia,
  type PublicCompany,
} from '@/features/company'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { parseListParams } from '@/hooks/use-list-params'
import { getErrorCode } from '@/lib/errors'
import { cn } from '@/lib/utils'
import { SITE_NAME } from '@/prerender/shared'
import { links, paths } from '@/routes/paths'
import { GalleryLightbox } from '../components/GalleryLightbox'
import { usePublicJobs } from '../hooks/use-public-jobs'
import { publicJobsListSchema } from '../schemas'

const JOBS_SHOWN = 5
const SOCIAL_LABEL = {
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok',
} as const

// F-PUB-06 · BR-ORG-01 · Mở rộng MVP 2 – E3
export default function CareersPage() {
  const { data: company, isPending, isError, error, refetch } = usePublicCompany()
  useDocumentTitle(company ? `${company.name} – ${SITE_NAME}` : undefined)

  if (isPending)
    return (
      <div className="space-y-6" aria-busy aria-label="Đang tải trang công ty">
        <Skeleton className="aspect-[10/3] w-full rounded-md" />
        <Skeleton className="h-11 w-96 max-w-full" />
        <Skeleton className="h-24 w-full max-w-[680px]" />
      </div>
    )
  if (isError && !company) {
    return getErrorCode(error) === 'COMPANY_PROFILE_INCOMPLETE' ? (
      <EmptyState
        title="Trang giới thiệu công ty đang được cập nhật"
        description="Bạn vẫn có thể xem và ứng tuyển các vị trí đang mở."
        action={
          <Link to={paths.publicJobs} className={buttonVariants({ variant: 'secondary' })}>
            Xem vị trí đang tuyển
          </Link>
        }
      />
    ) : (
      <ErrorState title="Chưa tải được trang công ty" error={error} onRetry={refetch} />
    )
  }

  return (
    <div className="space-y-14">
      <Hero company={company} />
      {company.about && (
        <Section id="gioi-thieu" title="Giới thiệu">
          <div className="max-w-[680px] space-y-4">
            {company.about
              .split(/\n\s*\n/)
              .filter(Boolean)
              .map((p) => (
                <p key={p} className="type-read-lg whitespace-pre-wrap">
                  {p}
                </p>
              ))}
          </div>
        </Section>
      )}
      {company.benefits.length > 0 && (
        <Section id="phuc-loi" title="Phúc lợi">
          <ul className="grid gap-3 sm:grid-cols-2">
            {company.benefits.map((b) => (
              <li key={b.title} className="border-line rounded-md border px-5 py-4">
                <p className="text-ink font-medium">{b.title}</p>
                {b.description && <p className="type-body text-ink-muted mt-1">{b.description}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}
      {company.gallery.length > 0 && (
        <Section id="hinh-anh" title="Không gian làm việc">
          <Gallery images={company.gallery} />
        </Section>
      )}
      {company.milestones.length > 0 && (
        <Section id="lich-su" title="Chặng đường phát triển">
          <Timeline
            className="max-w-[680px]"
            items={company.milestones.map((m) => ({
              id: `${m.year}-${m.title}`,
              title: (
                <>
                  <span className="type-num text-brand mr-2 font-semibold">{m.year}</span>
                  <span className="font-medium">{m.title}</span>
                </>
              ),
              meta: m.description || undefined,
            }))}
          />
        </Section>
      )}
      {company.offices.length > 0 && (
        <Section id="van-phong" title="Văn phòng">
          <ul className="grid gap-3 sm:grid-cols-2">
            {company.offices.map((o) => (
              <li key={o.name} className="border-line flex gap-3 rounded-md border px-5 py-4">
                <MapPin aria-hidden className="text-ink-muted mt-0.5 size-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-ink font-medium">{o.name}</p>
                  <p className="type-body text-ink-muted">{o.address}</p>
                  {o.mapUrl && (
                    <a
                      href={o.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand mt-1 inline-flex items-center gap-1 text-sm font-medium hover:underline"
                    >
                      Xem bản đồ
                      <ArrowUpRight className="size-3.5" />
                      <span className="sr-only">(mở trong thẻ mới)</span>
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <OpenJobs total={company.openJobs} />
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-5">
      <h2 id={id} className="type-title">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Hero({ company }: { company: PublicCompany }) {
  const facts = [
    company.sizeRange && { label: 'Quy mô', value: COMPANY_SIZE[company.sizeRange] },
    company.foundedYear && { label: 'Thành lập', value: String(company.foundedYear) },
    { label: 'Đang tuyển', value: `${company.openJobs.toLocaleString('vi-VN')} vị trí` },
    company.industries.length > 0 && { label: 'Lĩnh vực', value: company.industries.join(', ') },
  ].filter((f): f is { label: string; value: string } => !!f)
  const socials = (Object.keys(SOCIAL_LABEL) as (keyof typeof SOCIAL_LABEL)[])
    .map((key) => ({ key, url: company.socials[key] }))
    .filter((s): s is { key: keyof typeof SOCIAL_LABEL; url: string } => !!s.url)

  return (
    <header className="space-y-6">
      {company.cover && (
        <img
          src={mediaSrc(company.cover)}
          alt={company.cover.alt}
          width={company.cover.width}
          height={company.cover.height}
          fetchPriority="high"
          className="border-line aspect-[10/3] w-full rounded-md border object-cover"
        />
      )}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {company.logo && (
          <img
            src={mediaSrc(company.logo)}
            alt={`Logo ${company.name}`}
            width={88}
            height={88}
            className={cn(
              'border-line bg-surface size-[72px] shrink-0 rounded-md border object-contain sm:size-[88px]',
              company.cover && 'ring-surface -mt-14 ml-4 ring-4 sm:-mt-16 sm:ml-6',
            )}
          />
        )}
        <div className="min-w-0 space-y-2">
          <h1 className="type-display">{company.name}</h1>
          {company.tagline && <p className="type-read-lg text-ink-muted">{company.tagline}</p>}
        </div>
      </div>
      <div className="border-line overflow-hidden rounded-md border">
        <dl className="-mr-px -mb-px grid grid-cols-2 sm:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="border-line-soft border-r border-b px-4 py-3">
              <dt className="type-caption">{f.label}</dt>
              <dd className="text-ink mt-0.5 text-sm font-medium">
                {f.label === 'Đang tuyển' ? (
                  <Link to={paths.publicJobs} className="text-brand hover:underline">
                    {f.value}
                  </Link>
                ) : (
                  f.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      {(company.website || socials.length > 0) && (
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {company.website && <ExternalLink href={company.website} label="Website" />}
          {socials.map((s) => (
            <ExternalLink key={s.key} href={s.url} label={SOCIAL_LABEL[s.key]} />
          ))}
        </ul>
      )}
    </header>
  )
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-ink-2 hover:text-brand inline-flex items-center gap-1 font-medium transition-colors"
      >
        {label}
        <ArrowUpRight className="size-3.5" />
        <span className="sr-only">(mở trong thẻ mới)</span>
      </a>
    </li>
  )
}

function Gallery({ images }: { images: CompanyMedia[] }) {
  const [index, setIndex] = useState<number | null>(null)
  return (
    <>
      <ul
        className={cn(
          'grid grid-cols-2 gap-3',
          images.length % 3 === 0 || images.length > 4 ? 'sm:grid-cols-3' : 'sm:grid-cols-2',
        )}
      >
        {images.map((image, i) => (
          <li
            key={image.id}
            className={cn(
              images.length === 1
                ? 'col-span-2'
                : images.length % 2 === 1 && i === 0 && 'col-span-2 sm:col-span-1',
            )}
          >
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Xem ảnh lớn: ${image.alt}`}
              className="group border-line block size-full overflow-hidden rounded-md border"
            >
              <img
                src={mediaSrc(image)}
                alt={image.alt}
                width={image.width}
                height={image.height}
                loading="lazy"
                className="aspect-[3/2] size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </button>
          </li>
        ))}
      </ul>
      <GalleryLightbox
        images={images}
        index={index}
        onIndexChange={setIndex}
        onClose={() => setIndex(null)}
      />
    </>
  )
}

function OpenJobs({ total }: { total: number }) {
  const params = parseListParams(publicJobsListSchema, new URLSearchParams())
  const { data } = usePublicJobs(params)
  const jobs = data?.items.slice(0, JOBS_SHOWN) ?? []

  return (
    <Section id="dang-tuyen" title="Vị trí đang tuyển">
      {total === 0 ? (
        <EmptyState
          compact
          title="Hiện chưa có vị trí đang tuyển"
          description="Bạn có thể quay lại sau – các vị trí mới được đăng thường xuyên."
        />
      ) : (
        <>
          <ul className="border-line divide-line-soft divide-y border-y">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link
                  to={links.publicJobDetail(job.id)}
                  className="group hover:bg-canvas -mx-4 flex items-center gap-4 px-4 py-4 transition-colors"
                >
                  <span className="min-w-0 flex-1">
                    <span className="text-ink group-hover:text-brand block font-semibold transition-colors">
                      {job.title}
                    </span>
                    <span className="type-body text-ink-muted block">
                      {job.department.name} · {job.location}
                    </span>
                  </span>
                  <ArrowRight className="text-ink-muted group-hover:text-brand size-5 shrink-0 transition-colors" />
                </Link>
              </li>
            ))}
          </ul>
          <Link to={paths.publicJobs} className={buttonVariants({ variant: 'secondary' })}>
            Xem tất cả {total.toLocaleString('vi-VN')} vị trí
          </Link>
        </>
      )}
    </Section>
  )
}
