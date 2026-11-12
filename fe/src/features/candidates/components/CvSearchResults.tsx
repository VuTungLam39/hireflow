import { FileSearch } from 'lucide-react'
import { Fragment } from 'react'
import { Link } from 'react-router'
import { EmptyState, ErrorState } from '@/components/shared'
import { Avatar, Skeleton } from '@/components/ui'
import { useDetailLink } from '@/hooks/use-detail'
import { useCvSearch } from '../hooks/use-candidates'
import type { CvSearchItem, CvSection } from '../types'

const SECTION_LABEL: Record<CvSection, string> = {
  summary: 'Giới thiệu',
  experience: 'Kinh nghiệm',
  skills: 'Kỹ năng',
  projects: 'Dự án',
  education: 'Học vấn',
  other: 'Khác',
}

const NEAR_WITH_EXACT = 5
const CV_SEARCH_EXAMPLES = ['Kafka', 'Flutter', 'Playwright', 'MISA', 'Power BI']

function Highlighted({ excerpt }: { excerpt: CvSearchItem['excerpt'] }) {
  const parts: { text: string; mark: boolean }[] = []
  let at = 0
  for (const [s, e] of excerpt.highlights) {
    if (s > at) parts.push({ text: excerpt.text.slice(at, s), mark: false })
    parts.push({ text: excerpt.text.slice(s, e), mark: true })
    at = e
  }
  if (at < excerpt.text.length) parts.push({ text: excerpt.text.slice(at), mark: false })
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {p.mark ? <mark className="bg-marker text-ink rounded-xs px-0.5">{p.text}</mark> : p.text}
        </Fragment>
      ))}
    </>
  )
}

// F-SEARCH-01 · US-13 · BR-ACC-07: tìm theo kỹ năng trong CV, mỗi ứng viên một dòng
export function CvSearchResults({
  q,
  onExample,
}: {
  q: string | undefined
  onExample: (q: string) => void
}) {
  const query = useCvSearch(q)
  const term = q?.trim() ?? ''

  if (term.length < 2)
    return (
      <EmptyState
        title="Tìm ứng viên theo kỹ năng có trong CV"
        description={
          <>
            Gõ tên công nghệ, chứng chỉ hoặc mô tả công việc. Ví dụ:{' '}
            {CV_SEARCH_EXAMPLES.map((ex, i) => (
              <Fragment key={ex}>
                {i > 0 && ', '}
                <button
                  type="button"
                  onClick={() => onExample(ex)}
                  className="text-brand font-medium hover:underline"
                >
                  {ex}
                </button>
              </Fragment>
            ))}
            .
          </>
        }
      />
    )
  if (query.isPending)
    return (
      <div
        className="border-line divide-line-soft divide-y border-y"
        aria-busy
        aria-label="Đang tìm"
      >
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-2 py-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
        ))}
      </div>
    )
  if (query.isError && !query.data)
    return <ErrorState title="Chưa tìm được trong CV" error={query.error} onRetry={query.refetch} />

  const { items, degraded } = query.data
  const exact = items.filter((i) => i.match === 'keyword')
  const near = items
    .filter((i) => i.match === 'meaning')
    .slice(0, exact.length ? NEAR_WITH_EXACT : undefined)
  return (
    <div className="space-y-6" aria-busy={query.isFetching || undefined}>
      <p className="type-caption" role="status">
        {exact.length
          ? `${exact.length} ứng viên có CV nhắc tới “${term}”`
          : `Không có CV nào nhắc đúng “${term}”`}
        {near.length > 0 && ` · ${near.length} ứng viên gần nghĩa`}
        {degraded && ' · Đang chỉ tìm theo từ khoá vì dịch vụ AI tạm gián đoạn'}
      </p>
      {items.length === 0 && (
        <EmptyState
          compact
          title="Thử một từ khác"
          description="Dùng tên công nghệ cụ thể (ví dụ “PostgreSQL” thay vì “cơ sở dữ liệu”), hoặc mô tả ngắn công việc."
        />
      )}
      {exact.length > 0 && <ResultList items={exact} />}
      {near.length > 0 && (
        <section aria-labelledby="cv-search-near" className="space-y-2">
          <h2 id="cv-search-near" className="type-subheading">
            Gần nghĩa
          </h2>
          <p className="type-caption">
            CV không nhắc đúng từ bạn gõ nhưng có nội dung gần nghĩa. Đọc đoạn trích trước khi kết
            luận.
          </p>
          <ResultList items={near} />
        </section>
      )}
    </div>
  )
}

function ResultList({ items }: { items: CvSearchItem[] }) {
  const detailLink = useDetailLink()
  return (
    <ul className="border-line divide-line-soft divide-y border-y">
      {items.map((item) => (
        <li key={item.candidateId} className="flex gap-3 py-4">
          <Avatar name={item.candidateName} size="sm" className="mt-0.5" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <Link
                to={detailLink('candidate', item.candidateId)}
                className="text-ink hover:text-brand font-medium transition-colors"
              >
                {item.candidateName}
              </Link>
              <span className="type-caption inline-flex items-center gap-1">
                <FileSearch aria-hidden className="size-3.5" />
                Mục {SECTION_LABEL[item.section]}
              </span>
              <Link
                to={detailLink('application', item.applicationId)}
                className="type-caption hover:text-brand ml-auto transition-colors"
              >
                Mở hồ sơ ứng tuyển
              </Link>
            </div>
            <p className="type-body text-ink-2">
              <Highlighted excerpt={item.excerpt} />
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
