import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { links } from '@/routes/paths'
import type { PublicCompanyRef } from '../types'
import { CompanyLogo } from './CompanyLogo'

// F-PUB-11 · US-24: khối công ty trên chi tiết tin, link sang trang công ty
export function CompanyAbout({ company }: { company: PublicCompanyRef }) {
  return (
    <section aria-labelledby="ve-cong-ty" className="border-line space-y-4 rounded-md border p-5">
      <div className="flex items-center gap-3">
        <CompanyLogo name={company.name} logoUrl={company.logoUrl} size="md" />
        <div className="min-w-0">
          <h2 id="ve-cong-ty" className="type-heading">
            {`Về ${company.name}`}
          </h2>
          {company.tagline && <p className="type-caption">{company.tagline}</p>}
        </div>
      </div>
      <Link
        to={links.publicCompany(company.slug)}
        className="text-brand inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
      >
        Xem trang công ty và các vị trí khác
        <ArrowRight className="size-4" />
      </Link>
    </section>
  )
}
