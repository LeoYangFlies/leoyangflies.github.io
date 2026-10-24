import { getCollection, type CollectionEntry } from 'astro:content';
import { CATEGORIES, type Category } from '../consts';

export type Review = CollectionEntry<'reviews'>;

/** All published reviews, newest first. Drafts show while previewing locally only. */
export async function getReviews(): Promise<Review[]> {
  const all = await getCollection('reviews', ({ data }) => import.meta.env.DEV || !data.draft);
  return all.sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf());
}

export function categoryLabel(category: Category): string {
  return CATEGORIES[category];
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function reviewUrl(review: Review): string {
  return `/reviews/${review.id}/`;
}

/** Reviews grouped by country, countries sorted by name. */
export function groupByCountry(reviews: Review[]): { country: string; slug: string; reviews: Review[] }[] {
  const map = new Map<string, Review[]>();
  for (const r of reviews) {
    const list = map.get(r.data.country) ?? [];
    list.push(r);
    map.set(r.data.country, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([country, list]) => ({ country, slug: slugify(country), reviews: list }));
}
