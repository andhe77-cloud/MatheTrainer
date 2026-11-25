import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const combined = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function fillRoundedRect(rgba, size, x0, y0, w, h, r, color) {
  const [cr, cg, cb, ca] = color;
  const x1 = x0 + w;
  const y1 = y0 + h;
  const minX = Math.max(0, Math.floor(x0));
  const maxX = Math.min(size - 1, Math.ceil(x1));
  const minY = Math.max(0, Math.floor(y0));
  const maxY = Math.min(size - 1, Math.ceil(y1));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const cx = Math.max(x0 + r, Math.min(px, x1 - r));
      const cy = Math.max(y0 + r, Math.min(py, y1 - r));
      const dx = px - cx;
      const dy = py - cy;
      if (dx * dx + dy * dy <= r * r) {
        const idx = (y * size + x) * 4;
        rgba[idx] = cr;
        rgba[idx + 1] = cg;
        rgba[idx + 2] = cb;
        rgba[idx + 3] = ca;
      }
    }
  }
}

function renderIcon(size, maskable) {
  const rgba = Buffer.alloc(size * size * 4);
  const bg = [37, 99, 235, 255]; // #2563EB
  if (maskable) {
    for (let i = 0; i < size * size; i++) {
      rgba[i * 4] = bg[0];
      rgba[i * 4 + 1] = bg[1];
      rgba[i * 4 + 2] = bg[2];
      rgba[i * 4 + 3] = bg[3];
    }
  } else {
    fillRoundedRect(rgba, size, 0, 0, size, size, size * 0.21, bg);
  }

  const s = maskable ? size * 0.72 : size * 0.88;
  const ox = (size - s) / 2;
  const oy = (size - s) / 2;

  // White card block
  fillRoundedRect(rgba, size, ox + s * 0.08, oy + s * 0.16, s * 0.84, s * 0.76, s * 0.11, [255, 255, 255, 255]);
  // Studs on top
  fillRoundedRect(rgba, size, ox + s * 0.18, oy + s * 0.08, s * 0.24, s * 0.11, s * 0.04, [96, 165, 250, 255]);
  fillRoundedRect(rgba, size, ox + s * 0.58, oy + s * 0.08, s * 0.24, s * 0.11, s * 0.04, [96, 165, 250, 255]);

  // Tens blue rod
  fillRoundedRect(rgba, size, ox + s * 0.18, oy + s * 0.28, s * 0.22, s * 0.52, s * 0.05, [37, 99, 235, 255]);
  // Ones red cube
  fillRoundedRect(rgba, size, ox + s * 0.50, oy + s * 0.52, s * 0.30, s * 0.28, s * 0.05, [225, 29, 72, 255]);
  // Friendly dark eyes
  fillRoundedRect(rgba, size, ox + s * 0.54, oy + s * 0.32, s * 0.08, s * 0.10, s * 0.04, [30, 41, 59, 255]);
  fillRoundedRect(rgba, size, ox + s * 0.70, oy + s * 0.32, s * 0.08, s * 0.10, s * 0.04, [30, 41, 59, 255]);

  return encodePNG(size, size, rgba);
}

const outDir = path.resolve(process.cwd(), 'public');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), renderIcon(192, false));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), renderIcon(512, false));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), renderIcon(512, true));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), renderIcon(180, true));
console.log('Generated PWA PNG icons in public/');
