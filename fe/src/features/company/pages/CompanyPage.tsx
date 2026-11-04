import { CircleCheck, CircleDashed } from 'lucide-react'
import type { ReactNode } from 'react'
import { ErrorState, PageHeader } from '@/components/shared'
import { Skeleton } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { formatDateTime } from '@/lib/utils'
import { BrandImages } from '../components/BrandImages'
import { CompanyInfoForm } from '../components/CompanyInfoForm'
import { GallerySection } from '../components/GallerySection'
import { BenefitsForm, MilestonesForm, OfficesForm } from '../components/ListForms'
import { useCompany } from '../hooks/use-company'
import { GALLERY_MAX, type Company } from '../types'

function Block({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section
      aria-labelledby={id}
      className="border-line bg-surface space-y-4 rounded-md border px-5 py-5 sm:px-6"
    >
      <div>
        <h2 id={id} className="type-heading">
          {title}
        </h2>
        {description && <p className="type-caption mt-0.5">{description}</p>}
      </div>
      {children}
    </section>
  )
}

// BR-ORG-01: trang công khai chỉ hiện khi đủ tên, logo, giới thiệu
function Readiness({ company }: { company: Company }) {
  const checks = [
    ['Tên công ty', !!company.name],
    ['Logo', !!company.logo],
    ['Giới thiệu', !!company.about],
  ] as const
  return (
    <div role="status" className="border-line bg-canvas rounded-md border px-5 py-4">
      <p className="type-subheading">
        {company.complete
          ? 'Trang công ty đang hiện công khai trên trang tuyển dụng'
          : 'Trang công ty chưa hiện công khai'}
      </p>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
        {checks.map(([label, ok]) => (
          <li key={label} className="type-body flex items-center gap-1.5">
            {ok ? (
              <CircleCheck aria-hidden className="text-good size-4" />
            ) : (
              <CircleDashed aria-hidden className="text-ink-muted size-4" />
            )}
            {label}
            <span className="sr-only">{ok ? ': đã có' : ': còn thiếu'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// F-ORG-01 · Design Spec 11.1: một trang nhiều khối, lưu từng khối
export default function CompanyPage() {
  useDocumentTitle('Hồ sơ công ty')
  const { data: company, isPending, isError, error, refetch } = useCompany()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Hồ sơ công ty"
        description={
          company?.updatedAt && company.name
            ? `Hiện trên trang tuyển dụng và mọi tin đang tuyển · cập nhật ${formatDateTime(company.updatedAt)}`
            : 'Hiện trên trang tuyển dụng và mọi tin đang tuyển'
        }
      />
      {isPending ? (
        <div aria-busy aria-label="Đang tải hồ sơ công ty" className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState title="Chưa tải được hồ sơ công ty" error={error} onRetry={refetch} />
      ) : (
        <>
          <Readiness company={company} />
          <Block id="co-info" title="Thông tin chung">
            <CompanyInfoForm company={company} />
          </Block>
          <Block id="co-brand" title="Logo và ảnh bìa" description="Ảnh lưu ngay khi chọn">
            <BrandImages company={company} />
          </Block>
          <Block
            id="co-gallery"
            title="Thư viện ảnh"
            description={`Tối đa ${GALLERY_MAX} ảnh văn phòng, sự kiện. Mô tả ảnh lưu khi rời ô nhập.`}
          >
            <GallerySection gallery={company.gallery} />
          </Block>
          <Block
            id="co-benefits"
            title="Phúc lợi"
            description="Hiện trên trang công ty; mỗi tin có thêm ô Quyền lợi riêng"
          >
            <BenefitsForm company={company} />
          </Block>
          <Block id="co-offices" title="Văn phòng">
            <OfficesForm company={company} />
          </Block>
          <Block id="co-milestones" title="Lịch sử phát triển">
            <MilestonesForm company={company} />
          </Block>
        </>
      )}
    </div>
  )
}
