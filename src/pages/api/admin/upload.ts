import type { APIRoute } from 'astro';
import { writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import sharp from 'sharp';
import { isAuthenticated } from '../../../utils/admin-auth';
import { generateIconsAndFavicon } from '../../../utils/generate-icons';

export const prerender = false;

const publicDir = resolve(process.cwd(), 'public');
const distClientDir = resolve(process.cwd(), 'dist/client');
const uploadsDir = resolve(publicDir, 'uploads');
const distUploadsDir = resolve(distClientDir, 'uploads');

async function safeWrite(dirPath: string, fileName: string, content: Buffer | string) {
  try {
    await mkdir(dirPath, { recursive: true });
    await writeFile(join(dirPath, fileName), content as any);
  } catch {
    // Bỏ qua nếu thư mục không tồn tại (ví dụ dist chưa build)
  }
}

export const GET: APIRoute = async ({ request }) => {
  if (!isAuthenticated(request)) {
    return new Response(JSON.stringify({ error: 'Không có quyền truy cập' }), { status: 401 });
  }

  try {
    await mkdir(uploadsDir, { recursive: true });
    const files = await readdir(uploadsDir);
    const images = files
      .filter((f) => /\.(png|jpg|jpeg|svg|webp|gif)$/i.test(f))
      .map((f) => ({ name: f, url: `/uploads/${f}` }));

    return new Response(JSON.stringify({ images }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!isAuthenticated(request)) {
    return new Response(JSON.stringify({ error: 'Không có quyền truy cập' }), { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;

    if (!file) {
      return new Response(JSON.stringify({ error: 'Không có tệp được tải lên' }), { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Tải lên logo website
    if (type === 'logo') {
      const pngBuffer = await sharp(buffer).toFormat('png').toBuffer();
      const logoSvg = await sharp(pngBuffer)
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9 })
        .toBuffer();
      const b64 = logoSvg.toString('base64');
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-label="tamdev logo">\n  <title>tamdev logo</title>\n  <image href="data:image/png;base64,${b64}" x="0" y="0" width="512" height="512" />\n</svg>\n`;

      await safeWrite(publicDir, 'logo.svg', svgContent);
      await safeWrite(distClientDir, 'logo.svg', svgContent);

      // Sinh lại PNG icon từ logo.svg vừa lưu
      await generateIconsAndFavicon(svgContent);

      return new Response(JSON.stringify({ success: true, url: `/logo.svg?v=${Date.now()}` }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Tải lên favicon
    if (type === 'favicon') {
      const pngBuffer = await sharp(buffer).toFormat('png').toBuffer();
      const faviconPng = await sharp(pngBuffer)
        .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9 })
        .toBuffer();
      const b64 = faviconPng.toString('base64');
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-label="tamdev favicon">\n  <title>tamdev favicon</title>\n  <image href="data:image/png;base64,${b64}" x="0" y="0" width="256" height="256" />\n</svg>\n`;

      await safeWrite(publicDir, 'favicon.svg', svgContent);
      await safeWrite(distClientDir, 'favicon.svg', svgContent);

      await generateIconsAndFavicon(null);

      return new Response(JSON.stringify({ success: true, url: `/favicon.svg?v=${Date.now()}` }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Tải tệp thông thường vào /uploads/
    const ext = extname(file.name) || '.png';
    const baseName = file.name
      .replace(ext, '')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-');
    const filename = `${baseName}-${Date.now()}${ext}`;

    await safeWrite(uploadsDir, filename, buffer);
    await safeWrite(distUploadsDir, filename, buffer);

    return new Response(JSON.stringify({ success: true, url: `/uploads/${filename}` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
