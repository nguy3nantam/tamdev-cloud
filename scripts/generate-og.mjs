/**
 * Tạo ảnh OG (1200x630) cho social share.
 * Chạy: node scripts/generate-og.mjs
 *
 * Sinh ra:
 *   - public/og.png                       (ảnh mặc định cho toàn site)
 *   - public/og-blog-<lang>-<id>.png      (mỗi bài blog một ảnh)
 */
import { readFile, readdir, mkdir, writeFile, access } from 'node:fs/promises';
import { resolve, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const blogRoot = resolve(root, 'src/content/blog');
const publicDir = resolve(root, 'public');

// Ưu tiên font đóng gói trong scripts/fonts/, nếu không có thì dùng font hệ
// thống DejaVu (Alpine cài sẵn ttf-dejavu) để Docker build không cần mạng.
const BUNDLED = resolve(dirname(fileURLToPath(import.meta.url)), 'fonts');
const SYSTEM_PATHS = [
  '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
  '/usr/share/fonts/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
];

async function resolveFont(candidates) {
  for (const file of candidates) {
    try {
      await access(file);
      return file;
    } catch {
      // tiếp tục tìm ứng viên kế tiếp
    }
  }
  throw new Error(`Không tìm thấy font: ${candidates.join(', ')}`);
}

const BOLD = await resolveFont([resolve(BUNDLED, 'DejaVuSans-Bold.ttf'), ...SYSTEM_PATHS.slice(0, 2)]);
const REGULAR = await resolveFont([resolve(BUNDLED, 'DejaVuSans.ttf'), ...SYSTEM_PATHS.slice(2)]);

const W = 1200;
const H = 630;

const PALETTE = {
  bgTop: '#07080c',
  bgBottom: '#0c0e15',
  accent: '#22d3ee',
  accent2: '#a78bfa',
  text: '#eceef4',
  muted: '#9ba1b5',
};

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Bọc dòng theo độ rộng tối đa (ước lượng theo ký tự). */
function wrap(text, maxChars, maxLines) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, maxLines).map(escapeXml);
}

function svgText(lines, { x, y, size, fill, weight, lineHeight }) {
  const font = weight === 'bold' ? 'bold' : 'normal';
  const tspans = lines
    .map((line, i) => `<tspan x="${x}" y="${y + i * lineHeight}">${line}</tspan>`)
    .join('');
  return `<text fill="${fill}" font-family="DejaVu Sans" font-weight="${font}" font-size="${size}">${tspans}</text>`;
}

function buildSvg({ badge, titleLines, subtitleLines, accentBar = true }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${PALETTE.bgTop}"/>
      <stop offset="1" stop-color="${PALETTE.bgBottom}"/>
    </linearGradient>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${PALETTE.accent}"/>
      <stop offset="0.5" stop-color="#818cf8"/>
      <stop offset="1" stop-color="${PALETTE.accent2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.15" r="0.75">
      <stop offset="0" stop-color="${PALETTE.accent}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${PALETTE.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${
    accentBar
      ? '<rect x="72" y="76" width="64" height="6" rx="3" fill="url(#brand)"/>'
      : ''
  }
  ${svgText(['tamdev'], { x: 72, y: 152, size: 40, fill: PALETTE.text, weight: 'bold', lineHeight: 0 })}
  ${
    badge
      ? `<text x="72" y="264" fill="url(#brand)" font-family="DejaVu Sans" font-weight="bold" font-size="26" letter-spacing="4">${escapeXml(badge.toUpperCase())}</text>`
      : `<text x="72" y="262" fill="${PALETTE.muted}" font-family="DejaVu Sans" font-size="26">Freelance Software Engineer · tamdev.cloud</text>`
  }
  ${svgText(titleLines, { x: 72, y: 350, size: 52, fill: PALETTE.text, weight: 'bold', lineHeight: 66 })}
  ${
    subtitleLines
      ? svgText(subtitleLines, { x: 72, y: 520, size: 24, fill: PALETTE.muted, weight: 'normal', lineHeight: 34 })
      : ''
  }
</svg>`;
}

function parseFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('Invalid frontmatter');
  const values = new Map();
  for (const line of match[1].split('\n')) {
    const item = line.match(/^([A-Za-z]+):\s*['"]?(.*?)['"]?\s*$/);
    if (item) values.set(item[1], item[2]);
  }
  return values;
}

async function render(name, svg) {
  const buffer = await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toBuffer();
  const file = resolve(publicDir, name);
  await writeFile(file, buffer);
  console.log(`✔ ${name} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

async function main() {
  await mkdir(publicDir, { recursive: true });

  // Ảnh mặc định toàn site
  await render(
    'og.png',
    buildSvg({
      badge: null,
      titleLines: wrap('Xây dựng sản phẩm web nhanh, bền vững và đẹp.', 26, 2),
      subtitleLines: wrap('Freelance Software Engineer — Web App · API · Tư vấn hiệu năng.', 58, 1),
    })
  );

  // Mỗi bài blog một ảnh
  for (const locale of ['vi', 'en']) {
    const dir = resolve(blogRoot, locale);
    for (const file of (await readdir(dir)).filter((f) => f.endsWith('.md'))) {
      const source = await readFile(resolve(dir, file), 'utf8');
      const fm = parseFrontmatter(source);
      const name = `og-blog-${locale}-${basename(file, '.md')}.png`;
      await render(
        name,
        buildSvg({
          badge: locale === 'vi' ? 'Blog' : 'Blog',
          titleLines: wrap(fm.get('title') ?? 'Bài viết', 30, 2),
          subtitleLines: wrap(fm.get('description') ?? '', 78, 1),
        })
      );
    }
  }
  console.log('Done.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
