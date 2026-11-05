import { describe, expect, it } from 'vitest';
import { ApplicationSource } from '../../common/enums/application-source.enum.js';
import { ApplicationStatus } from '../../common/enums/application-status.enum.js';
import { csvCell, csvRow, formatPhone, formatVnDateTime } from './application-export.js';

// E6 · BR-APP-11
describe('application CSV export', () => {
  it('quotes every cell and doubles inner quotes', () => {
    expect(csvCell('Nguyễn Văn "Bình"')).toBe('"Nguyễn Văn ""Bình"""');
    expect(csvCell('a, b\nc')).toBe('"a, b\nc"');
    expect(csvCell(null)).toBe('""');
    expect(csvCell(87)).toBe('"87"');
  });

  it('neutralises cells Excel would run as a formula (CSV injection)', () => {
    for (const evil of ['=HYPERLINK("http://x")', '+1+1', '-2+3', '@SUM(A1)', '\tx', '\rx']) {
      expect(csvCell(evil).startsWith(`"'`)).toBe(true);
    }
    expect(csvCell(-5)).toBe('"-5"');
  });

  it('keeps the leading zero of phone numbers by grouping digits', () => {
    expect(formatPhone('0912345678')).toBe('0912 345 678');
    expect(formatPhone('09123456789')).toBe('0912 345 6789');
    expect(formatPhone('+84 912 345 678')).toBe('+84 912 345 678');
    expect(formatPhone(null)).toBeNull();
  });

  it('writes Vietnamese labels and Vietnam time, one CRLF-terminated line per row', () => {
    const line = csvRow({
      fullName: 'Trần Thị B',
      email: 'b@example.com',
      phone: '0912345678',
      jobTitle: 'Backend Developer',
      department: 'Kỹ thuật',
      status: ApplicationStatus.Interview,
      score: 82,
      source: ApplicationSource.HrUpload,
      createdAt: new Date('2026-11-04T17:30:00.000Z'),
    });
    expect(line).toBe(
      '"Trần Thị B","b@example.com","0912 345 678","Backend Developer","Kỹ thuật","Phỏng vấn","82","HR tải hộ","05/11/2026 00:30"\r\n',
    );
    expect(formatVnDateTime(new Date('2026-01-01T00:00:00.000Z'))).toBe('01/01/2026 07:00');
  });
});
