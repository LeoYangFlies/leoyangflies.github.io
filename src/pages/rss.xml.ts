import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE_TITLE, SITE_DESCRIPTION, TIPS_TITLE } from '../consts';
import { getReviews, reviewUrl, categoryLabel, whereShort } from '../lib/reviews';
import { getTips, tipUrl, topicLabel } from '../lib/tips';

export async function GET(context: APIContext) {
  const reviews = await getReviews();
  const tips = await getTips();
  const items = [
    ...reviews.map((r) => ({
      title: r.data.title,
      description: r.data.description,
      pubDate: r.data.published,
      link: reviewUrl(r),
      categories: [categoryLabel(r.data.category), whereShort(r)].filter(Boolean),
    })),
    ...tips.map((t) => ({
      title: t.data.title,
      description: t.data.description,
      pubDate: t.data.published,
      link: tipUrl(t),
      categories: [TIPS_TITLE, topicLabel(t.data.topic)],
    })),
  ].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site!,
    items,
  });
}
