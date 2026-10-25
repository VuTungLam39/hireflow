import { HttpStatus } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import { CV_MAX_BYTES, CV_MIME_TYPES } from './entities/cv-file.entity.js';

export interface UploadedCv {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface CheckedCv {
  mime: (typeof CV_MIME_TYPES)[number];
  ext: 'pdf' | 'docx';
  sha256: string;
  size: number;
  originalName: string;
  buffer: Buffer;
}

const PDF = Buffer.from('%PDF-');
const ZIP = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

const typeError = () =>
  new BusinessException(
    ErrorCode.FileTypeNotAllowed,
    'Only PDF or DOCX files are allowed',
    HttpStatus.BAD_REQUEST,
    [{ field: 'cv', messages: ['Chỉ nhận file PDF hoặc DOCX'] }],
  );

// BR-FILE-01
export function checkCv(file: UploadedCv | undefined): CheckedCv {
  if (!file) {
    throw new BusinessException(
      ErrorCode.ValidationFailed,
      'CV file is required',
      HttpStatus.BAD_REQUEST,
      [{ field: 'cv', messages: ['Vui lòng chọn file CV'] }],
    );
  }
  if (file.size > CV_MAX_BYTES) {
    throw new BusinessException(
      ErrorCode.FileTooLarge,
      'File is larger than 5MB',
      HttpStatus.PAYLOAD_TOO_LARGE,
      [{ field: 'cv', messages: ['File lớn hơn 5MB'] }],
    );
  }
  if (file.size === 0) throw typeError();

  const [pdf, docx] = CV_MIME_TYPES;
  const head = file.buffer.subarray(0, 5);
  let checked: Pick<CheckedCv, 'mime' | 'ext'>;
  if (file.mimetype === pdf && head.subarray(0, PDF.length).equals(PDF)) {
    checked = { mime: pdf, ext: 'pdf' };
  } else if (file.mimetype === docx && head.subarray(0, ZIP.length).equals(ZIP)) {
    checked = { mime: docx, ext: 'docx' };
  } else {
    throw typeError();
  }

  return {
    ...checked,
    sha256: createHash('sha256').update(file.buffer).digest('hex'),
    size: file.size,
    originalName: file.originalname.slice(0, 255),
    buffer: file.buffer,
  };
}
