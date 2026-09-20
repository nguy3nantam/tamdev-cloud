import { readdir, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { marked } from 'marked';

const blogDir = resolve(process.cwd(), 'src/content/blog');

export interface BlogPostData {
  title: string;
  description: string;
  pubDate: Date;
  lang: string;
  id: string;
  tags: string[];
}

export interface BlogPost {
  slug: string;
  file: string;
  locale: string;
  data: BlogPostData;
  body: string;
  html: string;
}

export function parseMarkdown(content: string) {
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

export async function getLiveBlogPosts(locale: 'vi' | 'en'): Promise<BlogPost[]> {
  const dir = join(blogDir, locale);
  const posts: BlogPost[] = [];
  try {
    const files = await readdir(dir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = join(dir, file);
        const content = await readFile(filePath, 'utf8');
        const parsed = parseMarkdown(content);
        const slug = file.replace(/\.md$/, '');
        const html = await marked.parse(parsed.body);
        posts.push({
          slug,
          file,
          locale,
          data: {
            title: parsed.frontmatter.title || '',
            description: parsed.frontmatter.description || '',
            pubDate: parsed.frontmatter.pubDate ? new Date(parsed.frontmatter.pubDate) : new Date(),
            lang: locale,
            id: parsed.frontmatter.id || slug,
            tags: Array.isArray(parsed.frontmatter.tags)
              ? parsed.frontmatter.tags
              : typeof parsed.frontmatter.tags === 'string'
              ? parsed.frontmatter.tags.split(',').map((t) => t.trim())
              : [],
          },
          body: parsed.body,
          html,
        });
      }
    }
  } catch (err) {
    // Folder not existing yet
  }
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export async function getLiveBlogPostBySlug(slug: string, locale: 'vi' | 'en'): Promise<BlogPost | null> {
  const cleanSlug = slug.replace(/^vi\//, '').replace(/^en\//, '');
  const filePath = join(blogDir, locale, `${cleanSlug}.md`);
  try {
    const content = await readFile(filePath, 'utf8');
    const parsed = parseMarkdown(content);
    const html = await marked.parse(parsed.body);
    return {
      slug: cleanSlug,
      file: `${cleanSlug}.md`,
      locale,
      data: {
        title: parsed.frontmatter.title || '',
        description: parsed.frontmatter.description || '',
        pubDate: parsed.frontmatter.pubDate ? new Date(parsed.frontmatter.pubDate) : new Date(),
        lang: locale,
        id: parsed.frontmatter.id || cleanSlug,
        tags: Array.isArray(parsed.frontmatter.tags)
          ? parsed.frontmatter.tags
          : typeof parsed.frontmatter.tags === 'string'
          ? parsed.frontmatter.tags.split(',').map((t) => t.trim())
          : [],
      },
      body: parsed.body,
      html,
    };
  } catch {
    return null;
  }
}
