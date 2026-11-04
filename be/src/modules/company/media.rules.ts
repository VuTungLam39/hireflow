import { createHash } from 'node:crypto';
import { HttpStatus } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import { MediaKind } from './entities/media-file.entity.js';

export const MEDIA_MAX_BYTES: Record<MediaKind, number> = {
  [MediaKind.Logo]: 1024 * 1024,
  [MediaKind.Cover]: 3 * 1024 * 1024,
  [MediaKind.Gallery]: 3 * 1024 * 1024,
};
export const MEDIA_MAX_SIDE = 4096;
export const GALLERY_MAX = 8;

export type ImageMime = 'image/jpeg' | 'image/png' | 'image/webp';
const EXT: Record<ImageMime, 'jpg' | 'png' | 'webp'> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** BR-MEDIA-02: route công khai chỉ nhận đúng mẫu khoá này */
export const MEDIA_KEY = /^media\/[0-9a-f]{64}\.(jpg|png|webp)$/;

export interface UploadedImage {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface CheckedImage {
  mime: ImageMime;
  key: string;
  sha256: string;
  width: number;
  height: number;
  size: number;
  buffer: Buffer;
}

const fail = (code: ErrorCode, message: string, detail: string) =>
  new BusinessException(code, message, HttpStatus.BAD_REQUEST, [
    { field: 'file', messages: [detail] },
  ]);

/** Nhận diện bằng magic bytes, không tin mimetype hay đuôi file */
export function sniffImage(buf: Buffer): ImageMime | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return 'image/png';
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('latin1') === 'RIFF' &&
    buf.subarray(8, 12).toString('latin1') === 'WEBP'
  )
    return 'image/webp';
  return null;
}

/** Đọc kích thước từ header; null nếu header hỏng */
export function imageSize(buf: Buffer, mime: ImageMime): { width: number; height: number } | null {
  try {
    if (mime === 'image/png') {
      if (buf.subarray(12, 16).toString('latin1') !== 'IHDR') return null;
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    if (mime === 'image/webp') {
      const chunk = buf.subarray(12, 16).toString('latin1');
      if (chunk === 'VP8 ') {
        return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
      }
      if (chunk === 'VP8L') {
        const bits = buf.readUInt32LE(21);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
      }
      if (chunk === 'VP8X') {
        return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 };
      }
      return null;
    }
    // JPEG: duyệt các marker tới SOFn
    let offset = 2;
    while (offset + 9 < buf.length) {
      if (buf[offset] !== 0xff) return null;
      const marker = buf[offset + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2;
        continue;
      }
      const length = buf.readUInt16BE(offset + 2);
      const isSof = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isSof)
        return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
      offset += 2 + length;
    }
    return null;
  } catch {
    return null;
  }
}

// BR-MEDIA-01, BR-MEDIA-02
export function checkImage(file: UploadedImage | undefined, kind: MediaKind): CheckedImage {
  if (!file?.buffer?.length) {
    throw fail(
      ErrorCode.MediaTypeNotAllowed,
      'Image is required',
      'Chọn một ảnh JPEG, PNG hoặc WebP',
    );
  }
  const mime = sniffImage(file.buffer);
  if (!mime) {
    throw fail(
      ErrorCode.MediaTypeNotAllowed,
      'Only JPEG, PNG or WebP images are allowed',
      'Chỉ nhận ảnh JPEG, PNG hoặc WebP (không nhận SVG)',
    );
  }
  if (file.buffer.length > MEDIA_MAX_BYTES[kind]) {
    throw fail(
      ErrorCode.MediaTooLarge,
      'Image is too large',
      `Ảnh tối đa ${MEDIA_MAX_BYTES[kind] / 1024 / 1024} MB`,
    );
  }
  const size = imageSize(file.buffer, mime);
  if (!size || size.width < 1 || size.height < 1) {
    throw fail(
      ErrorCode.MediaTypeNotAllowed,
      'Unreadable image',
      'Không đọc được ảnh, thử lưu lại ảnh khác',
    );
  }
  if (size.width > MEDIA_MAX_SIDE || size.height > MEDIA_MAX_SIDE) {
    throw fail(
      ErrorCode.MediaTooLarge,
      'Image dimensions are too large',
      `Ảnh tối đa ${MEDIA_MAX_SIDE} × ${MEDIA_MAX_SIDE} px`,
    );
  }
  const sha256 = createHash('sha256').update(file.buffer).digest('hex');
  return {
    mime,
    key: `media/${sha256}.${EXT[mime]}`,
    sha256,
    ...size,
    size: file.buffer.length,
    buffer: file.buffer,
  };
}
