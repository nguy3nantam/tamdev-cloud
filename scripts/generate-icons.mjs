/**
 * Sinh các file PNG (logo, favicon) từ `public/logo.svg`.
 * Chạy: node scripts/generate-icons.mjs
 *
 * Sinh ra:
 *   - public/logo.png              (512x512, dùng cho admin preview & OG)
 *   - public/favicon-32x32.png     (32x32, favicon cho trình duyệt cũ)
 *   - public/apple-touch-icon.png  (180x180, icon khi thêm vào màn hình iOS)
 *
 * Các file này bị gitignore và được tạo tự động trong Docker build,
 * vì PNG nhị phân không thể truyền qua API văn bản.
 */
import { readFile, writeFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = resolve(root, 'public');
const source = resolve(publicDir, 'logo.svg');

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/** Rasterize SVG thành PNG vuông với kích thước cho trước. */
async function renderIcon(svg, size) {
  return sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: TRANSPARENT })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function main() {
  try {
    await access(source);
  } catch {
    console.warn('⚠ Không tìm thấy public/logo.svg — bỏ qua sinh icon.');
    return;
  }

  const svg = await readFile(source);

  const targets = [
    ['logo.png', 512],
    ['favicon-32x32.png', 32],
    ['apple-touch-icon.png', 180],
  ];

  for (const [name, size] of targets) {
    const buffer = await renderIcon(svg, size);
    await writeFile(resolve(publicDir, name), buffer);
    console.log(`✔ ${name} (${size}x${size}, ${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  console.log('Done.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
