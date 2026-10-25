import { CvParseError, extractCvText, MAX_DOCX_UNZIPPED_BYTES, unzippedSize } from './cv-parser.js';
import { makeDocx, makePdf, SAMPLE_CV } from './testing/cv-fixtures.js';

const PDF = 'application/pdf';
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const reasonOf = (promise: Promise<unknown>) =>
  promise.then(
    () => 'ok',
    (e: unknown) => (e instanceof CvParseError ? e.reason : String(e)),
  );

describe('extractCvText', () => {
  it('reads text from a PDF', async () => {
    const text = await extractCvText(
      makePdf([
        'Nguyen Van A - Backend Developer',
        '3 years building REST APIs with NestJS and PostgreSQL',
      ]),
      PDF,
    );
    expect(text).toContain('Nguyen Van A - Backend Developer');
    expect(text).toContain('3 years building REST APIs with NestJS and PostgreSQL');
  });

  it('reads Vietnamese text from a DOCX, one paragraph per line', async () => {
    const text = await extractCvText(await makeDocx(SAMPLE_CV), DOCX);
    expect(text.split('\n')).toEqual(expect.arrayContaining(SAMPLE_CV));
  });

  it('marks a PDF without text as NO_TEXT (BR-FILE-04)', async () => {
    expect(await reasonOf(extractCvText(makePdf([]), PDF))).toBe('NO_TEXT');
  });

  it('marks broken files as UNREADABLE', async () => {
    expect(await reasonOf(extractCvText(Buffer.from('%PDF-1.7 broken'), PDF))).toBe('UNREADABLE');
    expect(await reasonOf(extractCvText(Buffer.from('PK\u0003\u0004junk'), DOCX))).toBe(
      'UNREADABLE',
    );
  });

  it('rejects other types', async () => {
    expect(await reasonOf(extractCvText(Buffer.from('x'), 'text/plain'))).toBe('UNSUPPORTED');
  });

  it('refuses a DOCX that expands beyond the limit (zip bomb)', async () => {
    const bomb = await makeDocx(SAMPLE_CV, {
      'word/media/pad.bin': '0'.repeat(MAX_DOCX_UNZIPPED_BYTES),
    });
    expect(bomb.length).toBeLessThan(1024 * 1024);
    expect(await reasonOf(extractCvText(bomb, DOCX))).toBe('TOO_LARGE');
  });
});

describe('unzippedSize', () => {
  it('sums uncompressed sizes from the central directory', async () => {
    const docx = await makeDocx(['abc'], { 'x.txt': 'y'.repeat(1000) });
    expect(unzippedSize(docx)).toBeGreaterThan(1000);
  });
});
