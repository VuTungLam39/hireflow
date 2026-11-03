import { Link } from 'react-router'
import { buttonVariants } from '@/components/ui'
import { paths } from '@/routes/paths'
import { SystemMessage } from './SystemMessage'

export default function NotFoundPage() {
  return (
    <SystemMessage
      code="404"
      title="Không có trang này"
      actions={
        <>
          <Link to={paths.home} className={buttonVariants()}>
            Về trang Hôm nay
          </Link>
          <Link to={paths.applications} className={buttonVariants({ variant: 'quiet' })}>
            Xem hồ sơ ứng tuyển
          </Link>
        </>
      }
    >
      Đường dẫn có thể đã cũ hoặc bị gõ nhầm. Bạn có thể quay về trang chính hoặc mở danh sách hồ
      sơ.
    </SystemMessage>
  )
}
