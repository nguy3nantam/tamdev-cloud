import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const publicDir = resolve(process.cwd(), 'public');
const distClientDir = resolve(process.cwd(), 'dist/client');

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

async function safeWrite(dirPath: string, fileName: string, content: Buffer | string) {
  try {
    await writeFile(resolve(dirPath, fileName), content as any);
  } catch {
    // Bỏ qua nếu thư mục không tồn tại
  }
}

/** Rasterize SVG thành PNG vuông với kích thước cho trước. */
async function renderIcon(svg: Buffer | string, size: number): Promise<Buffer> {
  return sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: TRANSPARENT })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * Sinh lại các file PNG icon (logo, favicon 32px, apple-touch-icon) từ logo.svg/favicon.svg.
 * Gọi sau khi admin tải lên logo hoặc favicon mới.
 *
 * @param logoSvg Nội dung logo.svg mới (null nếu dùng file đang có trên đĩa)
 */
export async function generateIconsAndFavicon(logoSvg: string | null): Promise<void> {
  try {
    const svg = logoSvg ?? (await readFile(resolve(publicDir, 'logo.svg'), 'utf8'));

    const targets: Array<[string, number]> = [
      ['logo.png', 512],
      ['favicon-32x32.png', 32],
      ['apple-touch-icon.png', 180],
    ];

    for (const [name, size] of targets) {
      const buffer = await renderIcon(svg, size);
      await safeWrite(publicDir, name, buffer);
      await safeWrite(distClientDir, name, buffer);
    }
  } catch (err) {
    console.error('generateIconsAndFavicon failed:', err);
  }
}
