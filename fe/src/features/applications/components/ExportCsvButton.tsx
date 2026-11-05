import { Download } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button, Tooltip } from '@/components/ui'
import { getErrorMessage } from '@/lib/errors'
import { applicationsApi } from '../api/applications.api'
import type { ApplicationListParams } from '../schemas/application.schema'

export const EXPORT_MAX_ROWS = 5000

function saveFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

// E6 · BR-APP-11: xuất đúng bộ lọc đang chọn; quá giới hạn thì khoá nút và nói cách thu hẹp
export function ExportCsvButton({
  params,
  total,
}: {
  params: ApplicationListParams
  total: number | undefined
}) {
  const [busy, setBusy] = useState(false)
  const tooMany = total !== undefined && total > EXPORT_MAX_ROWS
  const empty = total === 0

  const run = async () => {
    if (tooMany) {
      toast.info(
        `Bộ lọc khớp ${total.toLocaleString('vi-VN')} hồ sơ, vượt giới hạn ${EXPORT_MAX_ROWS.toLocaleString('vi-VN')}. Thu hẹp theo tin, trạng thái hoặc ngày nộp rồi xuất lại`,
      )
      return
    }
    setBusy(true)
    try {
      const { blob, fileName, total: rows } = await applicationsApi.exportCsv(params)
      saveFile(blob, fileName)
      toast.success(`Đã xuất ${rows.toLocaleString('vi-VN')} hồ sơ ra ${fileName}`)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Chưa xuất được danh sách'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Tooltip
      label={
        tooMany
          ? `Tối đa ${EXPORT_MAX_ROWS.toLocaleString('vi-VN')} hồ sơ mỗi lần`
          : 'Tải danh sách theo bộ lọc hiện tại'
      }
    >
      <Button
        variant="secondary"
        onClick={run}
        loading={busy}
        disabled={empty}
        aria-disabled={tooMany || undefined}
      >
        <Download />
        Xuất CSV
      </Button>
    </Tooltip>
  )
}
