import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { links } from '@/routes/paths'
import type { PublicJobSummary } from '../types'

// Danh sách tin gọn: trang công ty, "Tin khác của công ty"
export function JobRows({ jobs }: { jobs: PublicJobSummary[] }) {
  return (
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
  )
}
