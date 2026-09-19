import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { ui, localizedPath, type Locale } from '../../i18n';

export async function getStaticPaths() {
  return [{ params: { lang: 'vi' } }, { params: { lang: 'en' } }];
}

export async function GET({ params }: { params: { lang: string } }) {
  const locale = params.lang as Locale;
  const t = ui[locale];

  const posts = (await getCollection('blog'))
    .filter((p) => p.data.lang === locale)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: `tamdev — ${t.blog.title}`,
    description: t.blog.subtitle,
    site: 'https://tamdev.cloud',
    items: posts.map((post) => {
      const slug = post.slug.replace(/^(vi|en)\//, '');
      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: `${localizedPath('/blog', locale)}/${slug}/`,
        categories: post.data.tags,
      };
    }),
  });
}
