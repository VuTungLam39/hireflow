import mammoth from 'mammoth';
import { extractText } from 'unpdf';
import { cleanCvText, hasReadableText } from './cv-text.js';

export type CvParseFailure = 'UNSUPPORTED' | 'UNREADABLE' | 'NO_TEXT' | 'TOO_LARGE';

export class CvParseError extends Error {
  constructor(
    readonly reason: CvParseFailure,
    message: string,
  ) {
    super(message);
    this.name = 'CvParseError';
  }
}

// Kickoff 13
export const MAX_DOCX_UNZIPPED_BYTES = 30 * 1024 * 1024;

const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const EOCD = 0x06054b50;
const CENTRAL_HEADER = 0x02014b50;

export function unzippedSize(zip: Buffer): number {
  let eocd = -1;
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 22 - 0xffff); i--) {
    if (zip.readUInt32LE(i) === EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new CvParseError('UNREADABLE', 'DOCX is not a valid zip file');

  const entries = zip.readUInt16LE(eocd + 10);
  let offset = zip.readUInt32LE(eocd + 16);
  let total = 0;
  for (let n = 0; n < entries; n++) {
    if (offset + 46 > zip.length || zip.readUInt32LE(offset) !== CENTRAL_HEADER) {
      throw new CvParseError('UNREADABLE', 'DOCX central directory is broken');
    }
    const size = zip.readUInt32LE(offset + 24);
    if (size === 0xffffffff) return Number.POSITIVE_INFINITY;
    total += size;
    offset +=
      46 +
      zip.readUInt16LE(offset + 28) +
      zip.readUInt16LE(offset + 30) +
      zip.readUInt16LE(offset + 32);
  }
  return total;
}

async function pdfText(file: Buffer): Promise<string> {
  try {
    const { text } = await extractText(new Uint8Array(file), { mergePages: true });
    return text;
  } catch (error) {
    throw new CvParseError('UNREADABLE', `Cannot read PDF: ${(error as Error).message}`);
  }
}

async function docxText(file: Buffer): Promise<string> {
  if (unzippedSize(file) > MAX_DOCX_UNZIPPED_BYTES) {
    throw new CvParseError('TOO_LARGE', 'DOCX is too large after decompression');
  }
  try {
    return (await mammoth.extractRawText({ buffer: file })).value;
  } catch (error) {
    throw new CvParseError('UNREADABLE', `Cannot read DOCX: ${(error as Error).message}`);
  }
}

// BR-FILE-04
export async function extractCvText(file: Buffer, mime: string): Promise<string> {
  const raw =
    mime === PDF_MIME
      ? await pdfText(file)
      : mime === DOCX_MIME
        ? await docxText(file)
        : (() => {
            throw new CvParseError('UNSUPPORTED', `Unsupported CV type ${mime}`);
          })();
  const text = cleanCvText(raw);
  if (!hasReadableText(text)) {
    throw new CvParseError('NO_TEXT', 'CV has no readable text (scanned image?)');
  }
  return text;
}
