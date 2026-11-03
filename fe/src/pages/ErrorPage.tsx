import { RotateCw } from 'lucide-react'
import { isRouteErrorResponse, useRouteError } from 'react-router'
import { Button } from '@/components/ui'
import { getErrorRef } from '@/lib/errors'
import NotFoundPage from './NotFoundPage'
import { SystemMessage } from './SystemMessage'

export default function ErrorPage() {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />

  const ref = getErrorRef(error)
  return (
    <SystemMessage
      standalone
      code="Lỗi"
      title="Có trục trặc khi tải trang"
      actions={
        <>
          <Button onClick={() => window.location.reload()}>
            <RotateCw />
            Tải lại
          </Button>
          {ref && <span className="type-caption type-code">Mã tham chiếu {ref}</span>}
        </>
      }
    >
      Trang chưa hiển thị được. Tải lại thường sẽ khắc phục; nếu vẫn lỗi, hãy gửi mã tham chiếu cho
      quản trị viên.
    </SystemMessage>
  )
}
