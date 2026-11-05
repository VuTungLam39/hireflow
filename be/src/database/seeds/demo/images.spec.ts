import { describe, expect, it } from 'vitest';
import { MediaKind } from '../../../modules/company/entities/media-file.entity.js';
import { checkImage, GALLERY_MAX, MEDIA_MAX_BYTES } from '../../../modules/company/media.rules.js';
import { companyImages } from './images.js';

const check = (buffer: Buffer, kind: MediaKind) =>
  checkImage(
    { originalname: 'seed.png', mimetype: 'image/png', size: buffer.length, buffer },
    kind,
  );

// F-ORG-01 · BR-MEDIA-01
describe('seed company images', () => {
  const images = companyImages();

  it('every image passes the upload rules for its kind', () => {
    const logo = check(images.logo.buffer, MediaKind.Logo);
    const cover = check(images.cover.buffer, MediaKind.Cover);
    expect(logo).toMatchObject({ mime: 'image/png', width: 256, height: 256 });
    expect(cover).toMatchObject({ mime: 'image/png', width: 1600, height: 480 });
    expect(logo.size).toBeLessThan(MEDIA_MAX_BYTES[MediaKind.Logo]);
    for (const g of images.gallery) {
      expect(check(g.buffer, MediaKind.Gallery)).toMatchObject({ width: 1200, height: 800 });
      expect(g.alt.length).toBeGreaterThanOrEqual(2);
    }
    expect(images.gallery.length).toBeLessThanOrEqual(GALLERY_MAX);
  });

  it('is deterministic, so re-seeding reuses the same content keys', () => {
    const again = companyImages();
    expect(check(again.cover.buffer, MediaKind.Cover).key).toBe(
      check(images.cover.buffer, MediaKind.Cover).key,
    );
    expect(new Set(images.gallery.map((g) => check(g.buffer, MediaKind.Gallery).key)).size).toBe(
      images.gallery.length,
    );
  });
});
