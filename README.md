# tamdev.cloud

Website thương hiệu cá nhân của **Tam Nguyen** — AI Engineer & Automations Business.
Song ngữ **Tiếng Việt** (`/`) và **Tiếng Anh** (`/en`), xây dựng bằng [Astro](https://astro.build).

## Chạy local

Yêu cầu: Node.js ≥ 20.19 hoặc ≥ 22.

```bash
npm install
npm run dev      # dev server tại http://localhost:4321
```

## Build & kiểm tra

```bash
npm run build    # xuất ra thư mục dist/
npm run preview  # preview bản build
npm run check    # type-check (astro check)
npm run og       # sinh ảnh OG (1200x630) cho social share
```

## Cấu trúc

```
src/
├── components/
│   ├── pages/          # trang chính dùng chung cho 2 ngôn ngữ
│   ├── Header.astro
│   ├── Footer.astro
│   └── StickyContact.astro  # nút liên hệ nổi (phone/Zalo/Messenger)
├── config/
│   └── contact.ts      # số điện thoại, Zalo, Messenger
├── content/
│   └── blog/
│       ├── vi/*.md     # bài viết tiếng Việt
│       └── en/*.md     # bài viết tiếng Anh (cặp dịch chung `id`)
├── i18n/               # từ điển giao diện vi.ts / en.ts
├── layouts/            # Layout.astro, PostLayout.astro
├── pages/              # route: /, /about, /services, /blog, /contact, /en/...
└── styles/global.css   # design system (dark, hiện đại)
```

## SEO & Social

- **Ảnh OG**: `scripts/generate-og.mjs` sinh `public/og.png` và ảnh riêng từng bài blog. Ảnh được tạo tự động trong Docker build và bị gitignore (sinh lại bằng `npm run og`).
- **Meta**: Open Graph + Twitter Card (`summary_large_image`) + JSON-LD (WebSite/Person/BlogPosting) trong `src/layouts/`.
- **RSS**: `/rss/vi.xml` và `/rss/en.xml`.
- **Sitemap**: tự động bởi `@astrojs/sitemap`.

## Tùy chỉnh nội dung

- **Thông tin cá nhân, dịch vụ, giá, liên hệ** → `src/i18n/vi.ts` và `src/i18n/en.ts`.
- **Số điện thoại / Zalo / Messenger** (nút liên hệ nổi + trang Liên hệ) → `src/config/contact.ts`.
- **Bài viết blog** → thêm file `.md` vào `src/content/blog/vi/` và `src/content/blog/en/` (hai bài cùng `id` để liên kết bản dịch).
- **Email nhận form liên hệ** → đổi `hello@tamdev.cloud` trong `src/components/pages/ContactPage.astro`.
- **Màu sắc / font** → biến CSS trong `src/styles/global.css`.

## MCP quản trị nội dung

Repository có MCP server chạy qua **stdio**:

```bash
npm run mcp
```

Các tool: `get_site_profile`, `list_services`, `list_blog_posts`, `get_blog_post`, `create_blog_post`.

## Deploy

Hạ tầng: container nginx (Docker) + reverse proxy **Traefik** với Let's Encrypt.

```bash
npm run deploy           # build image + restart container
npm run watch:deploy     # auto build + deploy khi sửa file
```

Auto-deploy từ GitHub qua webhook trên port `8777` (container `tamdev-deploy-hook`, HMAC sha256).

## Phục hồi / sửa lỗi

```bash
docker compose logs -f tamdev-cloud        # log container web
docker compose -f docker-compose.hook.yml logs -f   # log webhook
```
