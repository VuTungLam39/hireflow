import { safeUrl } from './safe-url.js';

describe('safeUrl (BR-DATA-01)', () => {
  it('masks search terms that may contain a candidate email or phone', () => {
    expect(safeUrl('/api/v1/candidates?search=nguyen.van.a%40gmail.com&limit=20')).toBe(
      '/api/v1/candidates?search=***&limit=20',
    );
    expect(safeUrl('/api/v1/applications?page=2&q=0912345678')).toBe(
      '/api/v1/applications?page=2&q=***',
    );
  });

  // SG-05 · R5
  it('masks a tracking or reset token passed in the query string', () => {
    expect(safeUrl('/api/v1/public/applications/track?t=abcdefghijklmnopqrstu')).toBe(
      '/api/v1/public/applications/track?t=***',
    );
    expect(safeUrl('/x?token=secret&page=1')).toBe('/x?token=***&page=1');
  });

  it('keeps URLs without sensitive params unchanged', () => {
    expect(safeUrl('/api/v1/jobs?page=1&status=OPEN')).toBe('/api/v1/jobs?page=1&status=OPEN');
    expect(safeUrl('/api/health')).toBe('/api/health');
  });
});
