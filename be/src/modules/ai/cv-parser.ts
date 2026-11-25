import mammoth from 'mammoth';
import { extractText, getDocumentProxy, getResolvedPDFJS } from 'unpdf';
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

type PdfDoc = Awaited<ReturnType<typeof getDocumentProxy>>;
type PdfPage = Awaited<ReturnType<PdfDoc['getPage']>>;
interface TextRun {
  text: string;
  hidden: boolean;
}

const MIN_VISIBLE_FONT_PT = 2;
const isNearWhite = (hex: unknown) =>
  typeof hex === 'string' &&
  /^#[0-9a-f]{6}$/i.test(hex) &&
  [1, 3, 5].every((i) => parseInt(hex.slice(i, i + 2), 16) >= 0xf0);

// SG-03
// shortcut: bỏ qua CTM, độ trong suốt (ExtGState ca) và chữ trùng màu nền không trắng, nâng cấp khi eval đối kháng bắt được ca lọt
async function textRuns(page: PdfPage): Promise<TextRun[]> {
  const { OPS } = await getResolvedPDFJS();
  const { fnArray, argsArray } = await page.getOperatorList();
  let state = { fill: '#000000' as unknown, mode: 0, size: 12, scale: 1 };
  const stack: (typeof state)[] = [];
  const runs: TextRun[] = [];
  fnArray.forEach((fn, i) => {
    const args = (argsArray[i] ?? []) as unknown[];
    if (fn === OPS.save) stack.push({ ...state });
    else if (fn === OPS.restore) state = stack.pop() ?? state;
    else if (fn === OPS.setFillRGBColor) state.fill = args[0];
    else if (fn === OPS.setTextRenderingMode) state.mode = Number(args[0]);
    else if (fn === OPS.setFont) state.size = Math.abs(Number(args[1]));
    else if (fn === OPS.beginText) state.scale = 1;
    else if (fn === OPS.setTextMatrix) {
      const m = (Array.isArray(args[0]) ? args[0] : args) as number[];
      state.scale = Math.hypot(m[2], m[3]);
    } else if (fn === OPS.showText || fn === OPS.showSpacedText) {
      const text = (args[0] as unknown[])
        .map((g) => (g && typeof g === 'object' ? ((g as { unicode?: string }).unicode ?? '') : ''))
        .join('')
        .normalize('NFKC');
      if (!text.trim()) return;
      const hidden =
        state.mode === 3 ||
        state.mode === 7 ||
        isNearWhite(state.fill) ||
        state.size * state.scale < MIN_VISIBLE_FONT_PT;
      runs.push({ text, hidden });
    }
  });
  return runs;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function stripHiddenRuns(text: string, runs: TextRun[]): string {
  let out = text;
  let cursor = 0;
  for (const run of runs) {
    const re = new RegExp([...run.text.replace(/\s+/g, '')].map(escapeRe).join('\\s*'), 'g');
    re.lastIndex = cursor;
    const found = re.exec(out);
    if (!found) continue;
    if (run.hidden) {
      let end = found.index + found[0].length;
      if ((found.index === 0 || out[found.index - 1] === '\n') && out[end] === '\n') end++;
      out = out.slice(0, found.index) + out.slice(end);
      cursor = found.index;
    } else {
      cursor = found.index + found[0].length;
    }
  }
  return out;
}

async function pdfText(file: Buffer): Promise<string> {
  let doc: PdfDoc | undefined;
  try {
    doc = await getDocumentProxy(new Uint8Array(file));
    const { text } = await extractText(doc, { mergePages: false });
    const pages: string[] = [];
    for (const [i, pageText] of text.entries()) {
      pages.push(stripHiddenRuns(pageText, await textRuns(await doc.getPage(i + 1))));
    }
    return pages.join('\n');
  } catch (error) {
    throw new CvParseError('UNREADABLE', `Cannot read PDF: ${(error as Error).message}`);
  } finally {
    await doc?.loadingTask.destroy();
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
