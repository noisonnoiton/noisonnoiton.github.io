import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const docs = await getCollection('docs');
  const items = docs
    .filter((doc) => doc.data.title && doc.id !== 'index.mdx')
    .map((doc) => ({
      title: doc.data.title,
      description: doc.data.description || '',
      link: `/${doc.id.replace(/\/index\.mdx?$/, '/').replace(/\.mdx?$/, '/')}/`,
      pubDate: doc.data.date ? new Date(doc.data.date) : new Date('2021-01-01'),
    }));

  return rss({
    title: 'noisonnoiton',
    description: '춘돌이의 기술·문화·일상 블로그',
    site: context.site,
    items,
    customData: '<language>ko</language>',
  });
}
