import { ArrowLeft, ArrowRight, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button, FormField, Input } from '@/components/ui'
import { mediaSrc } from '../api/company.api'
import { useRemoveMedia, useUpdateMedia, useUploadMedia } from '../hooks/use-company'
import { GALLERY_MAX, type CompanyMedia } from '../types'
import { checkImageFile } from '../lib/check-image'

function GalleryItem({
  media,
  index,
  items,
}: {
  media: CompanyMedia
  index: number
  items: CompanyMedia[]
}) {
  const update = useUpdateMedia()
  const remove = useRemoveMedia()
  const [alt, setAlt] = useState(media.alt)
  const move = (delta: -1 | 1) => {
    const other = items[index + delta]
    update.mutate({ id: media.id, position: other.position })
    update.mutate({ id: other.id, position: media.position })
  }

  return (
    <li className="border-line bg-surface space-y-2 rounded-md border p-2">
      <img
        src={mediaSrc(media)}
        alt={media.alt}
        width={media.width}
        height={media.height}
        loading="lazy"
        className="aspect-[4/3] w-full rounded-sm object-cover"
      />
      <label className="sr-only" htmlFor={`alt-${media.id}`}>
        Mô tả ảnh {index + 1}
      </label>
      <Input
        id={`alt-${media.id}`}
        value={alt}
        maxLength={200}
        onChange={(e) => setAlt(e.target.value)}
        onBlur={() =>
          alt.trim().length >= 2 && alt !== media.alt && update.mutate({ id: media.id, alt })
        }
      />
      <div className="flex items-center justify-between">
        <span className="flex gap-1">
          <Button
            type="button"
            variant="quiet"
            size="icon-sm"
            aria-label={`Đưa ảnh ${index + 1} lên trước`}
            disabled={index === 0 || update.isPending}
            onClick={() => move(-1)}
          >
            <ArrowLeft />
          </Button>
          <Button
            type="button"
            variant="quiet"
            size="icon-sm"
            aria-label={`Đưa ảnh ${index + 1} ra sau`}
            disabled={index === items.length - 1 || update.isPending}
            onClick={() => move(1)}
          >
            <ArrowRight />
          </Button>
        </span>
        <Button
          type="button"
          variant="quiet"
          size="icon-sm"
          aria-label={`Xoá ảnh ${index + 1}`}
          loading={remove.isPending}
          onClick={() => remove.mutate(media.id)}
        >
          <Trash2 />
        </Button>
      </div>
    </li>
  )
}

// F-ORG-01 · BR-MEDIA-01: tối đa 8 ảnh, alt bắt buộc
export function GallerySection({ gallery }: { gallery: CompanyMedia[] }) {
  const upload = useUploadMedia()
  const [file, setFile] = useState<File | null>(null)
  const [alt, setAlt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const full = gallery.length >= GALLERY_MAX

  const submit = () => {
    if (!file) return setError('Chọn một ảnh')
    if (alt.trim().length < 2) return setError('Mô tả ngắn nội dung ảnh, ví dụ "Phòng họp tầng 5"')
    setError(null)
    upload.mutate(
      { file, kind: 'GALLERY', alt: alt.trim() },
      {
        onSuccess: () => {
          setFile(null)
          setAlt('')
        },
      },
    )
  }

  return (
    <div className="space-y-4">
      {gallery.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {gallery.map((m, i) => (
            <GalleryItem key={m.id} media={m} index={i} items={gallery} />
          ))}
        </ul>
      ) : (
        <p className="type-body">
          Chưa có ảnh. Ảnh văn phòng, sự kiện giúp ứng viên hình dung nơi làm việc.
        </p>
      )}

      {full ? (
        <p className="type-caption">Đã đủ {GALLERY_MAX} ảnh. Xoá bớt một ảnh để thêm ảnh mới.</p>
      ) : (
        <div className="border-line grid gap-3 rounded-md border border-dashed p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] sm:items-end">
          <FormField label="Ảnh" htmlFor="gallery-file" hint="JPEG, PNG hoặc WebP, tối đa 3 MB">
            <input
              id="gallery-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="type-body file:bg-sunken block w-full text-sm file:mr-3 file:rounded-sm file:border-0 file:px-3 file:py-1.5"
              onChange={(e) => {
                const picked = e.target.files?.[0] ?? null
                const problem = picked && checkImageFile(picked, 'GALLERY')
                setError(problem)
                setFile(problem ? null : picked)
              }}
            />
          </FormField>
          <FormField
            label="Mô tả ảnh"
            htmlFor="gallery-alt"
            hint="Cho người dùng trình đọc màn hình"
          >
            <Input
              id="gallery-alt"
              value={alt}
              maxLength={200}
              placeholder="Ví dụ: Phòng họp tầng 5"
              onChange={(e) => setAlt(e.target.value)}
            />
          </FormField>
          <Button type="button" loading={upload.isPending} onClick={submit}>
            Thêm ảnh
          </Button>
          {error && (
            <p role="alert" className="text-bad text-xs sm:col-span-3">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
