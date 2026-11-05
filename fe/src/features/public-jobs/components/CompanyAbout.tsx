import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { COMPANY_SIZE, mediaSrc, usePublicCompany } from '@/features/company'
import { paths } from '@/routes/paths'

// F-PUB-06 · E3: khối "Về công ty" trên chi tiết tin; hồ sơ chưa công khai thì ẩn
export function CompanyAbout() {
  const { data: company } = usePublicCompany()
  if (!company) return null
  const intro = company.about.split(/\n\s*\n/)[0]
  const facts = [
    company.sizeRange && COMPANY_SIZE[company.sizeRange],
    company.industries.slice(0, 2).join(', '),
  ].filter(Boolean)

  return (
    <section aria-labelledby="ve-cong-ty" className="border-line space-y-4 rounded-md border p-5">
      <div className="flex items-center gap-3">
        {company.logo && (
          <img
            src={mediaSrc(company.logo)}
            alt=""
            width={48}
            height={48}
            loading="lazy"
            className="border-line size-12 shrink-0 rounded-sm border object-contain"
          />
        )}
        <div className="min-w-0">
          <h2 id="ve-cong-ty" className="type-heading">
            {`Về ${company.name}`}
          </h2>
          {facts.length > 0 && <p className="type-caption">{facts.join(' · ')}</p>}
        </div>
      </div>
      <p className="type-read line-clamp-3">{intro}</p>
      <Link
        to={paths.careers}
        className="text-brand inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
      >
        Tìm hiểu về công ty
        <ArrowRight className="size-4" />
      </Link>
    </section>
  )
}
