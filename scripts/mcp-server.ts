import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import { ui } from '../src/i18n/index.js';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const blogRoot = resolve(root, 'src/content/blog');

type BlogPost = {
  slug: string;
  locale: 'vi' | 'en';
  title: string;
  description: string;
  pubDate: string;
  id: string;
  tags: string[];
  body: string;
};

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function parseFrontmatter(source: string, filePath: string): BlogPost {
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`Invalid frontmatter: ${filePath}`);

  const values = new Map<string, string>();
  for (const line of match[1].split('\n')) {
    const item = line.match(/^([A-Za-z]+):\s*['"]?(.*?)['"]?\s*$/);
    if (item) values.set(item[1], item[2]);
  }

  const locale = values.get('lang');
  if (locale !== 'vi' && locale !== 'en') throw new Error(`Invalid lang in ${filePath}`);
  const id = text(values.get('id'), 'id');
  const tags = (values.get('tags') ?? '')
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((tag) => tag.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);

  return {
    slug: basename(filePath, '.md'),
    locale,
    title: text(values.get('title'), 'title'),
    description: text(values.get('description'), 'description'),
    pubDate: text(values.get('pubDate'), 'pubDate'),
    id,
    tags,
    body: match[2].trim(),
  };
}

async function listPosts(): Promise<BlogPost[]> {
  const posts: BlogPost[] = [];
  for (const locale of ['vi', 'en'] as const) {
    const directory = resolve(blogRoot, locale);
    for (const file of (await readdir(directory)).filter((entry) => entry.endsWith('.md'))) {
      posts.push(parseFrontmatter(await readFile(resolve(directory, file), 'utf8'), resolve(directory, file)));
    }
  }
  return posts.sort((a, b) => b.pubDate.localeCompare(a.pubDate));
}

function result(data: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

const server = new Server(
  { name: 'tamdev-content', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_site_profile',
      description: 'Get the public tamdev profile and contact information.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
      name: 'list_services',
      description: 'List services and reference pricing in Vietnamese or English.',
      inputSchema: {
        type: 'object',
        properties: { locale: { type: 'string', enum: ['vi', 'en'], default: 'vi' } },
        additionalProperties: false,
      },
    },
    {
      name: 'list_blog_posts',
      description: 'List published blog posts, optionally filtered by locale.',
      inputSchema: {
        type: 'object',
        properties: { locale: { type: 'string', enum: ['vi', 'en'] } },
        additionalProperties: false,
      },
    },
    {
      name: 'get_blog_post',
      description: 'Read a blog post by its shared id and locale.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          locale: { type: 'string', enum: ['vi', 'en'], default: 'vi' },
        },
        required: ['id'],
        additionalProperties: false,
      },
    },
    {
      name: 'create_blog_post',
      description: 'Create a validated Markdown blog post. This only writes content; it does not deploy.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
          locale: { type: 'string', enum: ['vi', 'en'] },
          title: { type: 'string' },
          description: { type: 'string' },
          pubDate: { type: 'string', description: 'ISO date YYYY-MM-DD' },
          tags: { type: 'array', items: { type: 'string' } },
          body: { type: 'string' },
        },
        required: ['id', 'locale', 'title', 'description', 'pubDate', 'body'],
        additionalProperties: false,
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const args = (request.params.arguments ?? {}) as Record<string, unknown>;
    switch (request.params.name) {
      case 'get_site_profile':
        return result({
          brand: 'tamdev',
          name: 'Tam Nguyen',
          role: 'AI Engineer',
          location: 'Hà Nội, Việt Nam (làm việc từ xa toàn cầu)',
          email: 'hello@tamdev.cloud',
          website: 'https://tamdev.cloud',
        });
      case 'list_services': {
        const locale = args.locale === 'en' ? 'en' : 'vi';
        return result({ locale, services: ui[locale].services.items, pricing: ui[locale].pricing.plans });
      }
      case 'list_blog_posts': {
        const posts = await listPosts();
        return result(posts.filter((post) => !args.locale || post.locale === args.locale).map(({ body, ...post }) => post));
      }
      case 'get_blog_post': {
        const posts = await listPosts();
        const post = posts.find((item) => item.id === text(args.id, 'id') && item.locale === (args.locale === 'en' ? 'en' : 'vi'));
        if (!post) throw new Error('Blog post not found');
        return result(post);
      }
      case 'create_blog_post': {
        const id = text(args.id, 'id');
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error('id must use lowercase kebab-case');
        const locale = args.locale === 'en' ? 'en' : args.locale === 'vi' ? 'vi' : (() => { throw new Error('locale must be vi or en'); })();
        const pubDate = text(args.pubDate, 'pubDate');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(pubDate) || Number.isNaN(Date.parse(pubDate))) throw new Error('pubDate must be YYYY-MM-DD');
        const filePath = resolve(blogRoot, locale, `${id}.md`);
        const tags = Array.isArray(args.tags) ? args.tags.map((tag) => text(tag, 'tags[]')) : [];
        const content = `---\ntitle: '${text(args.title, 'title').replaceAll("'", "''")}'\ndescription: '${text(args.description, 'description').replaceAll("'", "''")}'\npubDate: ${pubDate}\nlang: '${locale}'\nid: '${id}'\ntags: [${tags.map((tag) => `'${tag.replaceAll("'", "''")}'`).join(', ')}]\n---\n\n${text(args.body, 'body')}\n`;
        try {
          await readFile(filePath);
          throw new Error(`Blog post already exists: ${id}/${locale}`);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        }
        await writeFile(filePath, content, 'utf8');
        return result({ created: true, path: `src/content/blog/${locale}/${id}.md` });
      }
      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    return { isError: true, content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }] };
  }
});

await server.connect(new StdioServerTransport());
