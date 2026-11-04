import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { mediaSrc } from '../api/company.api'
import { useRemoveMedia, useUploadMedia } from '../hooks/use-company'
import type { Company, CompanyMedia } from '../types'
import { ImagePicker } from './ImagePicker'

function Slot({
  title,
  hint,
  media,
  kind,
  frame,
  fit,
  removeWarning,
}: {
  title: string
  hint: string
  media: CompanyMedia | null
  kind: 'LOGO' | 'COVER'
  frame: string
  fit: 'contain' | 'cover'
  removeWarning: string
}) {
  const upload = useUploadMedia()
  const remove = useRemoveMedia()
  const [confirming, setConfirming] = useState(false)
  return (
    <div className="space-y-3">
      <div>
        <p className="type-subheading">{title}</p>
        <p className="type-caption">{hint}</p>
      </div>
      <div
        className={cn(
          'border-line bg-surface flex items-center justify-center overflow-hidden rounded-md border',
          frame,
        )}
      >
        {media ? (
          <img
            src={mediaSrc(media)}
            alt={title}
            width={media.width}
            height={media.height}
            // Logo giữ nguyên tỉ lệ (không cắt), ảnh bìa phủ kín khung 3:1
            className={cn('size-full', fit === 'contain' ? 'object-contain p-2' : 'object-cover')}
          />
        ) : (
          <span className="type-caption">Chưa có ảnh</span>
        )}
      </div>
      <div className="flex flex-wrap items-start gap-2">
        <ImagePicker
          kind={kind}
          label={media ? 'Thay ảnh' : 'Tải ảnh lên'}
          loading={upload.isPending}
          onPick={(file) => upload.mutate({ file, kind })}
        />
        {media && (
          <Button type="button" variant="quiet" size="sm" onClick={() => setConfirming(true)}>
            <Trash2 />
            Gỡ ảnh
          </Button>
        )}
      </div>
      {media && (
        <ConfirmDialog
          open={confirming}
          onClose={() => setConfirming(false)}
          title={`Gỡ ${title.toLowerCase()}?`}
          description={removeWarning}
          confirmLabel="Gỡ ảnh"
          tone="danger"
          loading={remove.isPending}
          onConfirm={() => remove.mutate(media.id, { onSettled: () => setConfirming(false) })}
        />
      )}
    </div>
  )
}

// F-ORG-01 · Design Spec 11.2: logo vuông, ảnh bìa 3:1
export function BrandImages({ company }: { company: Company }) {
  return (
    <div className="grid gap-6 sm:grid-cols-[208px_minmax(0,1fr)]">
      <Slot
        title="Logo"
        hint="Vuông, từ 256 × 256 px, tối đa 1 MB"
        media={company.logo}
        kind="LOGO"
        frame="aspect-square w-40"
        fit="contain"
        removeWarning={
          company.complete
            ? 'Trang công ty sẽ ẩn khỏi trang tuyển dụng cho tới khi có logo mới. Các tin đang tuyển vẫn hiện bình thường.'
            : 'Ảnh sẽ bị gỡ khỏi hồ sơ công ty.'
        }
      />
      <Slot
        title="Ảnh bìa"
        hint="Tỉ lệ 3:1, từ 1500 × 500 px, tối đa 3 MB"
        media={company.cover}
        kind="COVER"
        frame="aspect-[3/1] w-full"
        fit="cover"
        removeWarning="Trang công ty sẽ hiện không có ảnh bìa."
      />
    </div>
  )
}
