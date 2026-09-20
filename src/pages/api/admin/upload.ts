import type { APIRoute } from 'astro';
import { writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import sharp from 'sharp';
import { isAuthenticated } from '../../../utils/admin-auth';

export const prerender = false;

const publicDir = resolve(process.cwd(), 'public');
const distClientDir = resolve(process.cwd(), 'dist/client');
const uploadsDir = resolve(publicDir, 'uploads');
const distUploadsDir = resolve(distClientDir, 'uploads');

async function safeWrite(dirPath: string, fileName: string, content: Buffer | string) {
  try {
    await mkdir(dirPath, { recursive: true });
    await writeFile(join(dirPath, fileName), content as any);
  } catch (err) {
    // Ignore if dir doesn't exist
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

    // Nếu người dùng chọn Tải lên Logo web (type === 'logo')
    if (type === 'logo') {
      const pngBuffer = await sharp(buffer).toFormat('png').toBuffer();
      const base64Img = pngBuffer.toString('base64');

      await safeWrite(publicDir, 'logo.png', pngBuffer);
      await safeWrite(distClientDir, 'logo.png', pngBuffer);

      const isSvg = file.name.endsWith('.svg') || file.type === 'image/svg+xml';
      let svgContent = '';
      if (isSvg) {
        svgContent = buffer.toString('utf8');
      } else {
        svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024" role="img" aria-label="tamdev logo">
  <title>tamdev logo</title>
  <image href="data:image/png;base64,${base64Img}" x="0" y="0" width="1024" height="1024" />
</svg>`;
      }

      await safeWrite(publicDir, 'logo.svg', svgContent);
      await safeWrite(distClientDir, 'logo.svg', svgContent);

      return new Response(JSON.stringify({ success: true, url: `/logo.svg?v=${Date.now()}` }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Nếu người dùng chọn Tải lên Favicon (type === 'favicon')
    if (type === 'favicon') {
      const isSvg = file.name.endsWith('.svg') || file.type === 'image/svg+xml';

      if (isSvg) {
        const svgString = buffer.toString('utf8');
        await safeWrite(publicDir, 'favicon.svg', svgString);
        await safeWrite(distClientDir, 'favicon.svg', svgString);

        try {
          const png32 = await sharp(buffer).resize(32, 32).toFormat('png').toBuffer();
          await safeWrite(publicDir, 'favicon-32x32.png', png32);
          await safeWrite(distClientDir, 'favicon-32x32.png', png32);

          const touchIcon = await sharp(buffer).resize(180, 180).toFormat('png').toBuffer();
          await safeWrite(publicDir, 'apple-touch-icon.png', touchIcon);
          await safeWrite(distClientDir, 'apple-touch-icon.png', touchIcon);
        } catch {
          // Fallback if SVG parsing in sharp fails
        }
      } else {
        const pngBuffer = await sharp(buffer).toFormat('png').toBuffer();
        const base64Img = pngBuffer.toString('base64');

        const favIcon32 = await sharp(pngBuffer).resize(32, 32).toBuffer();
        await safeWrite(publicDir, 'favicon-32x32.png', favIcon32);
        await safeWrite(distClientDir, 'favicon-32x32.png', favIcon32);

        const touchIcon = await sharp(pngBuffer).resize(180, 180).toBuffer();
        await safeWrite(publicDir, 'apple-touch-icon.png', touchIcon);
        await safeWrite(distClientDir, 'apple-touch-icon.png', touchIcon);

        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024" role="img" aria-label="tamdev favicon">
  <title>tamdev favicon</title>
  <image href="data:image/png;base64,${base64Img}" x="0" y="0" width="1024" height="1024" />
</svg>`;

        await safeWrite(publicDir, 'favicon.svg', svgContent);
        await safeWrite(distClientDir, 'favicon.svg', svgContent);
      }

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
