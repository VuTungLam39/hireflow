import { RotateCw } from 'lucide-react'
import { isRouteErrorResponse, useRouteError } from 'react-router'
import { Button } from '@/components/ui'
import { getErrorRef } from '@/lib/errors'
import NotFoundPage from './NotFoundPage'
import { SystemMessage } from './SystemMessage'

export default function ErrorPage() {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />
  const noNetwork = typeof navigator !== 'undefined' && navigator.onLine === false
  const offline = noNetwork || (isRouteErrorResponse(error) && error.status === 503)

  const ref = getErrorRef(error)
  return (
    <SystemMessage
      standalone
      code="Lỗi"
      title={offline ? 'Chưa kết nối được máy chủ' : 'Có trục trặc khi tải trang'}
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
      {noNetwork
        ? 'Thiết bị đang mất kết nối mạng. Kiểm tra mạng rồi tải lại trang.'
        : offline
          ? 'Phiên đăng nhập của bạn vẫn còn. Máy chủ đang khởi động hoặc tạm gián đoạn, tải lại sau ít giây.'
          : 'Trang chưa hiển thị được. Tải lại thường sẽ khắc phục; nếu vẫn lỗi, hãy gửi mã tham chiếu cho quản trị viên.'}
    </SystemMessage>
  )
}
