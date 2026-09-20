import type { APIRoute } from 'astro';
import { readdir, readFile, writeFile, unlink, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { isAuthenticated } from '../../../utils/admin-auth';

export const prerender = false;

const blogDir = resolve(process.cwd(), 'src/content/blog');

function parseMarkdown(content: string) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const frontmatter: Record<string, any> = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^([A-Za-z]+):\s*(.*)$/);
    if (kv) {
      let val: any = kv[2].trim();
      if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
        val = val.slice(1, -1);
      } else if (val.startsWith('[') && val.endsWith(']')) {
        try {
          val = JSON.parse(val.replace(/'/g, '"'));
        } catch {
          val = val.slice(1, -1).split(',').map((s: string) => s.trim().replace(/^['"]|['"]$/g, ''));
        }
      }
      frontmatter[kv[1]] = val;
    }
  }
  return { frontmatter, body: match[2].trim() };
}

function serializeMarkdown(frontmatter: Record<string, any>, body: string) {
  let fm = '---\n';
  fm += `title: ${JSON.stringify(frontmatter.title || '')}\n`;
  fm += `description: ${JSON.stringify(frontmatter.description || '')}\n`;
  fm += `pubDate: ${frontmatter.pubDate || new Date().toISOString().split('T')[0]}\n`;
  fm += `lang: ${JSON.stringify(frontmatter.lang || 'vi')}\n`;
  fm += `id: ${JSON.stringify(frontmatter.id || '')}\n`;
  const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
  fm += `tags: [${tags.map((t) => JSON.stringify(t)).join(', ')}]\n`;
  fm += '---\n\n';
  return fm + body.trim() + '\n';
}

export const GET: APIRoute = async ({ request }) => {
  if (!isAuthenticated(request)) {
    return new Response(JSON.stringify({ error: 'Không có quyền truy cập' }), { status: 401 });
  }

  try {
    const posts: any[] = [];
    for (const locale of ['vi', 'en']) {
      const dir = join(blogDir, locale);
      try {
        const files = await readdir(dir);
        for (const file of files) {
          if (file.endsWith('.md')) {
            const filePath = join(dir, file);
            const content = await readFile(filePath, 'utf8');
            const parsed = parseMarkdown(content);
            posts.push({
              slug: file.replace(/\.md$/, ''),
              file,
              locale,
              ...parsed.frontmatter,
              body: parsed.body,
            });
          }
        }
      } catch {
        // Thư mục chưa tồn tại thì bỏ qua
      }
    }

    return new Response(JSON.stringify({ posts }), {
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
    const { slug, locale, title, description, pubDate, id, tags, markdownBody, oldSlug, oldLocale } = body;

    if (!slug || !locale || !title) {
      return new Response(JSON.stringify({ error: 'Thiếu các thông tin bắt buộc (slug, locale, title)' }), {
        status: 400,
      });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    const targetDir = join(blogDir, locale);
    await mkdir(targetDir, { recursive: true });

    // Nếu sửa slug hoặc đổi locale, xóa file cũ
    if (oldSlug && oldLocale && (oldSlug !== cleanSlug || oldLocale !== locale)) {
      const oldFilePath = join(blogDir, oldLocale, `${oldSlug}.md`);
      try {
        await unlink(oldFilePath);
      } catch {
        // bỏ qua nếu file cũ không tồn tại
      }
    }

    const filePath = join(targetDir, `${cleanSlug}.md`);
    const fileContent = serializeMarkdown(
      {
        title,
        description,
        pubDate: pubDate || new Date().toISOString().split('T')[0],
        lang: locale,
        id: id || cleanSlug,
        tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : [],
      },
      markdownBody || ''
    );

    await writeFile(filePath, fileContent, 'utf8');

    return new Response(JSON.stringify({ success: true, slug: cleanSlug }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  if (!isAuthenticated(request)) {
    return new Response(JSON.stringify({ error: 'Không có quyền truy cập' }), { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');
    const locale = url.searchParams.get('locale');

    if (!slug || !locale) {
      return new Response(JSON.stringify({ error: 'Thiếu slug hoặc locale' }), { status: 400 });
    }

    const filePath = join(blogDir, locale, `${slug}.md`);
    await unlink(filePath);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
