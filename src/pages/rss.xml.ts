import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';
import { getReviews, reviewUrl } from '../lib/reviews';

export async function GET(context: APIContext) {
  const reviews = await getReviews();
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site!,
    items: reviews.map((r) => ({
      title: r.data.title,
      description: r.data.description,
      pubDate: r.data.published,
      link: reviewUrl(r),
      categories: [r.data.country, r.data.category],
    })),
  });
}
