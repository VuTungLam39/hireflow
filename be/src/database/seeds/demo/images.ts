import { deflateSync } from 'node:zlib';

// Seed hồ sơ công ty: ảnh tự vẽ (không dùng ảnh có bản quyền), PNG thuần không thêm thư viện

type Rgb = readonly [number, number, number];
type Sdf = (x: number, y: number) => number;

const hex = (value: string): Rgb => [
  parseInt(value.slice(1, 3), 16),
  parseInt(value.slice(3, 5), 16),
  parseInt(value.slice(5, 7), 16),
];

const PALETTE = {
  brand: hex('#1e5b4f'),
  brandDeep: hex('#174a40'),
  brandSoft: hex('#e6f0ec'),
  canvas: hex('#f7f6f2'),
  sunken: hex('#efece5'),
  marker: hex('#f5d84a'),
  ink: hex('#1c1b18'),
  moss: hex('#dfe5d3'),
  clay: hex('#f0dccf'),
  sand: hex('#efe4c8'),
  sea: hex('#d8e5e6'),
  plum: hex('#eadbe2'),
  stone: hex('#e2e0da'),
  white: hex('#ffffff'),
};

class Canvas {
  readonly px: Float32Array;

  constructor(
    readonly width: number,
    readonly height: number,
    background: Rgb,
  ) {
    this.px = new Float32Array(width * height * 3);
    for (let i = 0; i < width * height; i++) this.px.set(background, i * 3);
  }

  /** Dải màu dọc từ trên xuống */
  gradient(top: Rgb, bottom: Rgb) {
    for (let y = 0; y < this.height; y++) {
      const t = y / Math.max(1, this.height - 1);
      const c = top.map((v, i) => v + (bottom[i] - v) * t);
      for (let x = 0; x < this.width; x++) this.px.set(c, (y * this.width + x) * 3);
    }
  }

  /** Tô hình theo hàm khoảng cách có dấu, khử răng cưa 1 px */
  paint(
    sdf: Sdf,
    color: Rgb,
    box: [number, number, number, number] = [0, 0, this.width, this.height],
    alpha = 1,
  ) {
    const [x0, y0, x1, y1] = box.map(Math.round);
    for (let y = Math.max(0, y0 - 1); y < Math.min(this.height, y1 + 1); y++) {
      for (let x = Math.max(0, x0 - 1); x < Math.min(this.width, x1 + 1); x++) {
        const cover = Math.min(1, Math.max(0, 0.5 - sdf(x + 0.5, y + 0.5))) * alpha;
        if (cover <= 0) continue;
        const i = (y * this.width + x) * 3;
        for (let k = 0; k < 3; k++) this.px[i + k] += (color[k] - this.px[i + k]) * cover;
      }
    }
  }

  rect(x: number, y: number, w: number, h: number, r: number, color: Rgb, alpha = 1) {
    this.paint(roundRect(x, y, w, h, r), color, [x, y, x + w, y + h], alpha);
  }

  circle(cx: number, cy: number, r: number, color: Rgb, alpha = 1) {
    this.paint(
      (x, y) => Math.hypot(x - cx, y - cy) - r,
      color,
      [cx - r, cy - r, cx + r, cy + r],
      alpha,
    );
  }

  png(): Buffer {
    const stride = this.width * 3;
    const raw = Buffer.alloc((stride + 1) * this.height);
    const prev = new Uint8Array(stride);
    const row = new Uint8Array(stride);
    for (let y = 0; y < this.height; y++) {
      for (let i = 0; i < stride; i++) row[i] = Math.round(this.px[y * stride + i]);
      const out = (stride + 1) * y;
      raw[out] = 4;
      for (let i = 0; i < stride; i++) {
        const a = i >= 3 ? row[i - 3] : 0;
        const b = prev[i];
        const c = i >= 3 ? prev[i - 3] : 0;
        raw[out + 1 + i] = (row[i] - paeth(a, b, c)) & 0xff;
      }
      prev.set(row);
    }
    const header = Buffer.alloc(13);
    header.writeUInt32BE(this.width, 0);
    header.writeUInt32BE(this.height, 4);
    header.set([8, 2, 0, 0, 0], 8);
    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', header),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]);
  }
}

const roundRect =
  (x: number, y: number, w: number, h: number, r: number): Sdf =>
  (px, py) => {
    const qx = Math.abs(px - (x + w / 2)) - (w / 2 - r);
    const qy = Math.abs(py - (y + h / 2)) - (h / 2 - r);
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
  };

function paeth(a: number, b: number, c: number) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf: Buffer) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** Logo: ô vuông bo góc màu brand, chữ H dựng bằng khối và dấu marker */
function logo(): Buffer {
  const s = 256;
  const c = new Canvas(s, s, PALETTE.white);
  c.rect(0, 0, s, s, 56, PALETTE.brand);
  c.rect(70, 64, 30, 128, 8, PALETTE.white);
  c.rect(156, 64, 30, 128, 8, PALETTE.white);
  c.rect(70, 113, 116, 30, 8, PALETTE.white);
  c.circle(196, 196, 18, PALETTE.marker);
  return c.png();
}

/** Ảnh bìa: nền brand, các khối giấy xếp lớp như bàn duyệt hồ sơ */
function cover(): Buffer {
  const w = 1600;
  const h = 480;
  const c = new Canvas(w, h, PALETTE.brand);
  c.gradient(PALETTE.brand, PALETTE.brandDeep);
  c.circle(1320, 80, 260, PALETTE.white, 0.05);
  c.circle(1480, 420, 180, PALETTE.white, 0.04);
  const sheets: [number, number, Rgb][] = [
    [880, 96, PALETTE.sand],
    [960, 136, PALETTE.canvas],
    [1080, 76, PALETTE.sea],
    [1200, 156, PALETTE.white],
  ];
  for (const [x, y, color] of sheets) {
    c.rect(x + 10, y + 14, 220, 280, 14, PALETTE.ink, 0.18);
    c.rect(x, y, 220, 280, 14, color);
    for (let line = 0; line < 6; line++) {
      c.rect(
        x + 28,
        y + 44 + line * 34,
        line === 0 ? 120 : 164 - (line % 3) * 24,
        10,
        5,
        PALETTE.ink,
        0.12,
      );
    }
  }
  c.rect(1228, 248, 120, 22, 6, PALETTE.marker, 0.85);
  c.rect(96, 360, 360, 6, 3, PALETTE.marker);
  return c.png();
}

/** Thư viện: 4 cảnh trừu tượng (không gian làm việc, họp, góc nghỉ, sự kiện) */
function gallery(scene: number): Buffer {
  const w = 1200;
  const h = 800;
  const bg = [PALETTE.canvas, PALETTE.moss, PALETTE.sand, PALETTE.sea][scene];
  const c = new Canvas(w, h, bg);
  c.rect(0, 560, w, 240, 0, PALETTE.ink, 0.06);
  if (scene === 0) {
    for (let i = 0; i < 3; i++) {
      const x = 120 + i * 340;
      c.rect(x, 420, 280, 24, 8, PALETTE.brand);
      c.rect(x + 40, 260, 200, 140, 12, PALETTE.ink, 0.85);
      c.rect(x + 54, 274, 172, 112, 6, PALETTE.brandSoft);
      c.rect(x + 120, 400, 40, 22, 4, PALETTE.ink, 0.7);
      c.circle(x + 140, 560, 48, PALETTE.clay);
    }
    c.rect(980, 80, 140, 180, 16, PALETTE.white);
    c.circle(1050, 150, 40, PALETTE.marker);
  } else if (scene === 1) {
    c.rect(240, 420, 720, 40, 20, PALETTE.brandDeep);
    const seats: [number, Rgb][] = [
      [300, PALETTE.clay],
      [460, PALETTE.white],
      [620, PALETTE.plum],
      [780, PALETTE.sand],
    ];
    for (const [x, color] of seats) {
      c.circle(x + 60, 340, 46, color);
      c.rect(x + 10, 470, 100, 120, 24, color, 0.9);
    }
    c.rect(360, 90, 480, 220, 14, PALETTE.white);
    c.rect(400, 140, 240, 14, 7, PALETTE.ink, 0.2);
    c.rect(400, 180, 340, 14, 7, PALETTE.ink, 0.12);
    c.rect(400, 220, 300, 14, 7, PALETTE.ink, 0.12);
    c.rect(400, 260, 160, 18, 6, PALETTE.marker);
  } else if (scene === 2) {
    c.rect(140, 380, 520, 180, 40, PALETTE.brand);
    c.rect(170, 330, 460, 90, 30, PALETTE.brandSoft);
    c.circle(860, 300, 150, PALETTE.moss);
    c.rect(850, 300, 20, 280, 6, PALETTE.brandDeep);
    c.circle(860, 260, 90, PALETTE.brand, 0.9);
    c.rect(700, 500, 120, 60, 12, PALETTE.clay);
    c.circle(1030, 120, 60, PALETTE.marker);
  } else {
    for (let i = 0; i < 9; i++) {
      const x = 90 + i * 120;
      const colors = [PALETTE.clay, PALETTE.plum, PALETTE.white, PALETTE.sand, PALETTE.moss];
      c.circle(x + 40, 470 - (i % 2) * 30, 42, colors[i % colors.length]);
      c.rect(x, 530 - (i % 2) * 30, 80, 200, 28, colors[i % colors.length], 0.9);
    }
    c.rect(300, 90, 600, 160, 16, PALETTE.brand);
    c.rect(360, 140, 300, 20, 10, PALETTE.white, 0.9);
    c.rect(360, 186, 200, 16, 8, PALETTE.marker);
    for (let i = 0; i < 14; i++) c.circle(80 + i * 80, 40 + (i % 3) * 18, 8, PALETTE.marker, 0.8);
  }
  return c.png();
}

export function companyImages() {
  return {
    logo: { key: 'logo', buffer: logo(), alt: 'Logo HireFlow' },
    cover: { key: 'cover', buffer: cover(), alt: 'Ảnh bìa trang tuyển dụng HireFlow' },
    gallery: [
      'Khu làm việc mở ở văn phòng Hà Nội',
      'Phòng họp nhóm sản phẩm mỗi sáng thứ Hai',
      'Góc nghỉ có cây xanh trên tầng 12',
      'Ngày hội gia đình HireFlow cuối năm',
    ].map((alt, i) => ({ key: `gallery-${i + 1}`, buffer: gallery(i), alt })),
  };
}
