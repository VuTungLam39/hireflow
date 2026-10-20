import { Link } from 'react-router'
import { paths } from '@/routes/paths'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-primary text-5xl font-bold">404</p>
      <h1 className="text-xl font-semibold">Không tìm thấy trang</h1>
      <Link to={paths.home} className="text-primary text-sm hover:underline">
        Về trang chủ
      </Link>
    </div>
  )
}
