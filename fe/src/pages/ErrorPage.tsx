import { isRouteErrorResponse, useRouteError } from 'react-router'
import NotFoundPage from './NotFoundPage'

/** Hiển thị khi một route bị lỗi khi render (thay vì trắng trang) */
export default function ErrorPage() {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-4 text-center">
      <h1 className="text-xl font-semibold">Đã có lỗi xảy ra</h1>
      <p className="text-sm text-slate-500">
        {error instanceof Error ? error.message : 'Vui lòng thử lại sau.'}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="text-primary text-sm hover:underline"
      >
        Tải lại trang
      </button>
    </div>
  )
}
