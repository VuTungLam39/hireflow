import { Link } from 'react-router'
import { buttonVariants } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { paths } from '@/routes/paths'

// F-10, RR-11: khách gõ URL lạ thấy 404 công khai, không bị đẩy về trang đăng nhập
export default function PublicNotFoundPage() {
  useDocumentTitle('Không tìm thấy trang này')
  return (
    <section className="space-y-4">
      <h1 className="type-display">Không tìm thấy trang này</h1>
      <p className="text-ink-2">Trang có thể đã bị gỡ hoặc việc làm đã hết hạn quá 30 ngày.</p>
      <Link to={paths.publicJobs} className={buttonVariants()}>
        Xem việc làm đang tuyển
      </Link>
    </section>
  )
}
