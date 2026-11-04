import { MEDIA_ACCEPT, MEDIA_LIMIT_MB, type MediaKind } from '../types'

/** Kiểm sớm ở trình duyệt; BE vẫn kiểm lại bằng magic bytes (BR-MEDIA-01) */
export function checkImageFile(file: File, kind: MediaKind): string | null {
  if (!(MEDIA_ACCEPT as readonly string[]).includes(file.type)) {
    return `“${file.name}” không phải ảnh JPEG, PNG hoặc WebP`
  }
  if (file.size > MEDIA_LIMIT_MB[kind] * 1024 * 1024) {
    return `Ảnh tối đa ${MEDIA_LIMIT_MB[kind]} MB`
  }
  return null
}
