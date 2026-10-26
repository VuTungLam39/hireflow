import JSZip from 'jszip';

const pdfEscape = (s: string) => s.replace(/[\\()]/g, '\\$&');

/** PDF một trang, font Helvetica: chỉ dùng ký tự ASCII */
export function makePdf(lines: string[]): Buffer {
  const content = `BT /F1 11 Tf 50 800 Td 14 TL ${lines.map((l) => `(${pdfEscape(l)}) Tj T*`).join(' ')} ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];
  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(out));
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = Buffer.byteLength(out);
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// BR-FILE-02: cùng nội dung ra cùng sha256
const DOCX_DATE = new Date(Date.UTC(2026, 0, 1));

/** DOCX tối thiểu đủ để mammoth đọc; hỗ trợ tiếng Việt */
export async function makeDocx(paragraphs: string[], extra: Record<string, string> = {}) {
  const zip = new JSZip();
  const add = (name: string, body: string) =>
    zip.file(name, body, { date: DOCX_DATE, createFolders: false });
  add(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  );
  add(
    '_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  );
  add(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs
      .map((p) => `<w:p><w:r><w:t xml:space="preserve">${xmlEscape(p)}</w:t></w:r></w:p>`)
      .join('')}</w:body></w:document>`,
  );
  for (const [name, body] of Object.entries(extra)) add(name, body);
  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 1 },
  });
}

export const SAMPLE_CV = [
  'Trần Văn Bình – Backend Developer',
  'Email: binh.tran@example.com · SĐT 0912 345 678',
  'Kinh nghiệm: 3 năm phát triển REST API bằng NestJS tại Công ty ABC (2022–2025).',
  'Thiết kế cơ sở dữ liệu PostgreSQL cho hệ thống bán hàng, tối ưu truy vấn.',
  'Đóng gói và triển khai dịch vụ bằng Docker.',
  'Học vấn: Kỹ sư Công nghệ thông tin, Đại học Bách khoa Hà Nội, 2021.',
];
