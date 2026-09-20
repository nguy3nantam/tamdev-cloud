import type { APIRoute } from 'astro';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isAuthenticated } from '../../../utils/admin-auth';
import { getSiteConfig, saveSiteConfig } from '../../../utils/site-config';

export const prerender = false;

const contactFilePath = resolve(process.cwd(), 'src/config/contact.ts');
const googleTagFilePath = resolve(process.cwd(), 'src/config/google-tag.ts');
const viI18nPath = resolve(process.cwd(), 'src/i18n/vi.ts');
const enI18nPath = resolve(process.cwd(), 'src/i18n/en.ts');

export const GET: APIRoute = async ({ request }) => {
  if (!isAuthenticated(request)) {
    return new Response(JSON.stringify({ error: 'Không có quyền truy cập' }), { status: 401 });
  }

  try {
    const config = getSiteConfig();
    return new Response(JSON.stringify(config), {
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
    const body = await request.json();
    const { brandName, contact, googleTag } = body;

    // Save persistent JSON site config
    const updated = saveSiteConfig({ brandName, contact, googleTag });

    // Cập nhật các file .ts dự phòng
    const { phoneDisplay, phoneHref, zaloHref, messengerHref } = updated.contact;
    const newContactContent = `/**
 * Nguồn dữ liệu liên hệ duy nhất cho toàn site (sticky widget + trang Liên hệ).
 */
export const contact = {
  phoneDisplay: ${JSON.stringify(phoneDisplay || '')},
  phoneHref: ${JSON.stringify(phoneHref || '')},
  zaloHref: ${JSON.stringify(zaloHref || '')},
  messengerHref: ${JSON.stringify(messengerHref || '')},
} as const;
`;
    try {
      await writeFile(contactFilePath, newContactContent, 'utf8');
    } catch {}

    if (brandName) {
      for (const i18nPath of [viI18nPath, enI18nPath]) {
        try {
          let content = await readFile(i18nPath, 'utf8');
          content = content.replace(/brand:\s*['"].*?['"]/, `brand: ${JSON.stringify(brandName)}`);
          await writeFile(i18nPath, content, 'utf8');
        } catch {}
      }
    }

    if (googleTag) {
      const { head: googleTagHead, body: googleTagBody } = updated.googleTag;
      const newGoogleTagContent = `/**
 * Nguồn dữ liệu cấu hình thẻ Google Tag Manager / Google Analytics (GTM / GA4).
 */
export const googleTag = {
  head: \`${(googleTagHead || '').replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`,
  body: \`${(googleTagBody || '').replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`,
};
`;
      try {
        await writeFile(googleTagFilePath, newGoogleTagContent, 'utf8');
      } catch {}
    }

    return new Response(JSON.stringify({ success: true, config: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
