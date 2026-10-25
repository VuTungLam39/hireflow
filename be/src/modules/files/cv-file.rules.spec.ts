import { BusinessException } from '../../common/exceptions/index.js';
import { checkCv, type UploadedCv } from './cv-file.rules.js';

const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const file = (content: Buffer | string, mimetype: string, size?: number): UploadedCv => {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
  return { originalname: 'cv.pdf', mimetype, size: size ?? buffer.length, buffer };
};

const codeOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as BusinessException).code;
  }
  return 'OK';
};

describe('checkCv (BR-FILE-01)', () => {
  it('accepts a real PDF and hashes it', () => {
    const result = checkCv(file('%PDF-1.7 hello', PDF_MIME));
    expect(result).toMatchObject({ mime: PDF_MIME, ext: 'pdf', size: 14 });
    expect(result.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('accepts a DOCX (zip) file', () => {
    const zip = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('rest')]);
    expect(checkCv(file(zip, DOCX_MIME)).ext).toBe('docx');
  });

  it.each([
    ['a missing file', undefined, 'VALIDATION_FAILED'],
    ['a fake PDF (wrong magic bytes)', file('MZ executable', PDF_MIME), 'FILE_TYPE_NOT_ALLOWED'],
    ['a PDF sent as DOCX', file('%PDF-1.7', DOCX_MIME), 'FILE_TYPE_NOT_ALLOWED'],
    ['an image', file('\x89PNG', 'image/png'), 'FILE_TYPE_NOT_ALLOWED'],
    ['an empty file', file('', PDF_MIME), 'FILE_TYPE_NOT_ALLOWED'],
    ['a file over 5MB', file('%PDF-', PDF_MIME, 5 * 1024 * 1024 + 1), 'FILE_TOO_LARGE'],
  ])('rejects %s', (_name, input, code) => {
    expect(codeOf(() => checkCv(input))).toBe(code);
  });
});
