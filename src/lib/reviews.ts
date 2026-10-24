import { getCollection, type CollectionEntry } from 'astro:content';
import { CATEGORIES, type Category } from '../consts';
import { getAirport } from '../data/airports';

export type Review = CollectionEntry<'reviews'>;

/** All published reviews, newest first. Drafts show while previewing locally only. */
export async function getReviews(): Promise<Review[]> {
  const all = await getCollection('reviews', ({ data }) => import.meta.env.DEV || !data.draft);
  return all.sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf());
}

export function categoryLabel(category: Category): string {
  return CATEGORIES[category];
}

/** Singular form for use in a sentence: "Flight review", "Lounge review". */
export function reviewKind(category: Category): string {
  return { flight: 'Flight', airport: 'Airport', lounge: 'Lounge', destination: 'Destination' }[category];
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

export function reviewUrl(review: Review): string {
  return `/reviews/${review.id}/`;
}

/** A short label for where a review is: "PVG – JFK" for flights, the place otherwise. */
export function whereShort(review: Review): string {
  const d = review.data;
  if (d.category === 'flight' && d.from && d.to) return `${d.from} – ${d.to}`;
  return d.place ?? '';
}

/** A longer label: "Shanghai to New York" for flights, "Place, Country" otherwise. */
export function whereLong(review: Review): string {
  const d = review.data;
  if (d.category === 'flight' && d.from && d.to) {
    return `${getAirport(d.from).city} to ${getAirport(d.to).city}`;
  }
  return [d.place, d.country].filter(Boolean).join(', ');
}

/** Text for the two arcs of a review's postmark. */
export function postmarkText(review: Review): { top: string; bottom: string } {
  const d = review.data;
  if (d.category === 'flight' && d.from && d.to) {
    const flight = [d.airline, d.flight].filter(Boolean).join(' ');
    return { top: `${d.from} to ${d.to}`, bottom: flight.length > 22 ? (d.flight ?? d.airline ?? '') : flight };
  }
  return { top: d.place ?? '', bottom: d.country ?? '' };
}
