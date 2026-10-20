import { Link } from 'react-router'
import { paths } from '@/routes/paths'

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-5xl font-bold text-red-600">403</p>
      <h1 className="text-xl font-semibold">Bạn không có quyền truy cập trang này</h1>
      <Link to={paths.home} className="text-primary text-sm hover:underline">
        Về trang chủ
      </Link>
    </div>
  )
}
