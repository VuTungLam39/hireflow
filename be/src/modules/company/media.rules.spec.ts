import { MediaKind } from './entities/media-file.entity.js';
import { checkImage, imageSize, MEDIA_KEY, sniffImage } from './media.rules.js';

const png = (w: number, h: number) => {
  const buf = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buf, 0);
  buf.writeUInt32BE(13, 8);
  buf.write('IHDR', 12, 'latin1');
  buf.writeUInt32BE(w, 16);
  buf.writeUInt32BE(h, 20);
  return buf;
};

const jpeg = (w: number, h: number) =>
  Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    // APP0 dài 16 byte, cần bỏ qua
    Buffer.from([0xff, 0xe0, 0x00, 0x10]),
    Buffer.alloc(14),
    // SOF0: length 17, precision 8, height, width
    Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, h >> 8, h & 0xff, w >> 8, w & 0xff]),
    Buffer.alloc(12),
  ]);

const webpX = (w: number, h: number) => {
  const buf = Buffer.alloc(30);
  buf.write('RIFF', 0, 'latin1');
  buf.writeUInt32LE(22, 4);
  buf.write('WEBP', 8, 'latin1');
  buf.write('VP8X', 12, 'latin1');
  buf.writeUIntLE(w - 1, 24, 3);
  buf.writeUIntLE(h - 1, 27, 3);
  return buf;
};

const file = (buffer: Buffer, originalname = 'anh.png', mimetype = 'image/png') => ({
  buffer,
  originalname,
  mimetype,
  size: buffer.length,
});

describe('media rules (BR-MEDIA-01, BR-MEDIA-02)', () => {
  it.each([
    ['PNG', png(1500, 500), 'image/png', { width: 1500, height: 500 }],
    ['JPEG', jpeg(1200, 800), 'image/jpeg', { width: 1200, height: 800 }],
    ['WebP', webpX(640, 480), 'image/webp', { width: 640, height: 480 }],
  ])('reads %s by magic bytes and its size from the header', (_, buf, mime, size) => {
    expect(sniffImage(buf)).toBe(mime);
    expect(imageSize(buf, mime as never)).toEqual(size);
  });

  it('keys the file by its content so the same image always has the same public URL', () => {
    const a = checkImage(file(png(256, 256)), MediaKind.Logo);
    const b = checkImage(file(png(256, 256), 'khac.png'), MediaKind.Logo);
    expect(a.key).toBe(b.key);
    expect(a.key).toMatch(MEDIA_KEY);
    expect(a).toMatchObject({ mime: 'image/png', width: 256, height: 256 });
  });

  it.each([
    [
      'SVG (XSS risk)',
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>'),
      'MEDIA_TYPE_NOT_ALLOWED',
    ],
    ['a text file renamed to .png', Buffer.from('not really an image'), 'MEDIA_TYPE_NOT_ALLOWED'],
    [
      'a PNG with a broken header',
      Buffer.concat([png(10, 10).subarray(0, 12), Buffer.from('XXXX')]),
      'MEDIA_TYPE_NOT_ALLOWED',
    ],
    ['an image larger than 4096 px', png(5000, 100), 'MEDIA_TOO_LARGE'],
  ])('rejects %s', (_, buf, code) => {
    expect(() => checkImage(file(buf), MediaKind.Gallery)).toThrow(
      expect.objectContaining({ code }),
    );
  });

  it('allows 3 MB for a cover but only 1 MB for a logo', () => {
    const big = Buffer.concat([png(800, 600), Buffer.alloc(1.5 * 1024 * 1024)]);
    expect(() => checkImage(file(big), MediaKind.Cover)).not.toThrow();
    expect(() => checkImage(file(big), MediaKind.Logo)).toThrow(
      expect.objectContaining({ code: 'MEDIA_TOO_LARGE' }),
    );
  });

  it('only accepts the public media key pattern, never a CV key', () => {
    expect(MEDIA_KEY.test(`media/${'a'.repeat(64)}.png`)).toBe(true);
    for (const key of [
      'cv/2026/10/x.pdf',
      `media/${'a'.repeat(64)}.svg`,
      `media/../cv/${'a'.repeat(64)}.png`,
    ]) {
      expect(MEDIA_KEY.test(key)).toBe(false);
    }
  });
});
