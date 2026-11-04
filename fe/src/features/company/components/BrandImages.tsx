import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui'
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
}: {
  title: string
  hint: string
  media: CompanyMedia | null
  kind: 'LOGO' | 'COVER'
  frame: string
}) {
  const upload = useUploadMedia()
  const remove = useRemoveMedia()
  return (
    <div className="space-y-3">
      <div>
        <p className="type-subheading">{title}</p>
        <p className="type-caption">{hint}</p>
      </div>
      <div
        className={`border-line bg-canvas flex items-center justify-center overflow-hidden rounded-md border ${frame}`}
      >
        {media ? (
          <img
            src={mediaSrc(media)}
            alt={title}
            width={media.width}
            height={media.height}
            className="size-full object-cover"
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
          <Button
            type="button"
            variant="quiet"
            size="sm"
            loading={remove.isPending}
            onClick={() => remove.mutate(media.id)}
          >
            <Trash2 />
            Gỡ ảnh
          </Button>
        )}
      </div>
    </div>
  )
}

// F-ORG-01 · Design Spec 11.2: logo vuông, ảnh bìa 3:1
export function BrandImages({ company }: { company: Company }) {
  return (
    <div className="grid gap-6 sm:grid-cols-[160px_minmax(0,1fr)]">
      <Slot
        title="Logo"
        hint="Vuông, từ 256 × 256 px, tối đa 1 MB"
        media={company.logo}
        kind="LOGO"
        frame="aspect-square w-40"
      />
      <Slot
        title="Ảnh bìa"
        hint="Tỉ lệ 3:1, từ 1500 × 500 px, tối đa 3 MB"
        media={company.cover}
        kind="COVER"
        frame="aspect-[3/1] w-full"
      />
    </div>
  )
}
