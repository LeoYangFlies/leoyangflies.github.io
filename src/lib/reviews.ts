import { getCollection, type CollectionEntry } from 'astro:content';
import { CATEGORIES, type Category } from '../consts';
import { getAirport } from '../data/airports';
import { getFlights, type Flight } from './flights';

export type Review = CollectionEntry<'reviews'>;

/** All published reviews, newest first. Drafts show while previewing locally only. */
export async function getReviews(): Promise<Review[]> {
  const all = await getCollection('reviews', ({ data }) => import.meta.env.DEV || !data.draft);
  // Newest first; on the same day, a trip report comes before the reviews from that trip.
  const sorted = all.sort(
    (a, b) =>
      b.data.published.valueOf() - a.data.published.valueOf() ||
      Number(b.data.category === 'trip') - Number(a.data.category === 'trip'),
  );
  // Catch typos in `trip:` early, with a message that says how to fix them.
  const ids = new Set(sorted.filter((r) => r.data.category === 'trip').map((r) => r.id));
  for (const r of sorted) {
    if (r.data.trip && !ids.has(r.data.trip)) {
      throw new Error(
        `Review "${r.id}" says it belongs to trip "${r.data.trip}", but there is no trip report with that file name in src/content/reviews/.`,
      );
    }
  }
  return sorted;
}

export function categoryLabel(category: Category): string {
  return CATEGORIES[category];
}

/** Singular form for use in a sentence: "Flight review", "Lounge review". */
export function reviewKind(category: Category): string {
  return { trip: 'Trip', flight: 'Flight', lounge: 'Lounge', hotel: 'Hotel' }[category];
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

/** "August 21 – 22, 2026", "August 30 – September 2, 2026", "December 28, 2025 – January 3, 2026". */
export function formatRange(start: Date, end: Date): string {
  const opts = { timeZone: 'UTC' } as const;
  const y1 = start.getUTCFullYear();
  const y2 = end.getUTCFullYear();
  const m1 = start.toLocaleDateString('en-US', { ...opts, month: 'long' });
  const m2 = end.toLocaleDateString('en-US', { ...opts, month: 'long' });
  if (start.valueOf() === end.valueOf()) return formatDate(start);
  if (y1 !== y2) return `${formatDate(start)} – ${formatDate(end)}`;
  if (m1 !== m2) return `${m1} ${start.getUTCDate()} – ${m2} ${end.getUTCDate()}, ${y2}`;
  return `${m1} ${start.getUTCDate()} – ${end.getUTCDate()}, ${y2}`;
}

export function reviewUrl(review: Review): string {
  return `/reviews/${review.id}/`;
}

// ---------- Trips ----------

/** The Logbook flights inside a trip report's dates, in the order they were flown. */
export function tripFlights(trip: Review): Flight[] {
  const { start, end } = trip.data;
  if (!start || !end) return [];
  // getFlights is newest first, with same-day legs already in connecting order.
  return getFlights()
    .filter((f) => f.date >= start && f.date <= end)
    .reverse();
}

/** Airports in the order the trip visits them, e.g. PVG, HKG, YYZ, EWR. */
export function tripPath(flights: Flight[]): string[] {
  const path: string[] = [];
  for (const f of flights) {
    if (path[path.length - 1] !== f.from) path.push(f.from);
    path.push(f.to);
  }
  return path;
}

/** Detailed reviews that belong to a trip, in the order of the trip where possible. */
export function reviewsInTrip(trip: Review, all: Review[]): Review[] {
  return all
    .filter((r) => r.data.trip === trip.id)
    .sort((a, b) => (a.data.date?.valueOf() ?? a.data.published.valueOf()) - (b.data.date?.valueOf() ?? b.data.published.valueOf()));
}

const flightKey = (date: Date, from: string, to: string) => `${date.toISOString().slice(0, 10)}|${from}|${to}`;

/**
 * Links between Logbook flights and posts: which flight review covers a flight (matched
 * by the review's date, from and to), and which trip report covers it (by the trip's dates).
 */
export function flightLinks(all: Review[]) {
  const reviewByFlight = new Map<string, Review>();
  for (const r of all) {
    const d = r.data;
    if (d.category === 'flight' && d.date && d.from && d.to) reviewByFlight.set(flightKey(d.date, d.from, d.to), r);
  }
  const trips = all.filter((r) => r.data.category === 'trip');
  return {
    reviewFor: (f: Flight) => reviewByFlight.get(flightKey(f.date, f.from, f.to)),
    tripFor: (f: Flight) => trips.find((t) => t.data.start && t.data.end && f.date >= t.data.start && f.date <= t.data.end),
  };
}

// ---------- Labels ----------

/** A short label for where a review is: "PVG – JFK" for flights, the route for trips, the place otherwise. */
export function whereShort(review: Review): string {
  const d = review.data;
  if (d.category === 'flight' && d.from && d.to) return `${d.from} – ${d.to}`;
  if (d.category === 'trip') {
    const path = tripPath(tripFlights(review));
    if (path.length === 0) return '';
    return path.length <= 5 ? path.join(' – ') : `${path[0]} – … – ${path[path.length - 1]}`;
  }
  return d.place ?? '';
}

/** A longer label: "Shanghai to New York" for flights and trips, "Place, Country" otherwise. */
export function whereLong(review: Review): string {
  const d = review.data;
  if (d.category === 'flight' && d.from && d.to) {
    return `${getAirport(d.from).city} to ${getAirport(d.to).city}`;
  }
  if (d.category === 'trip') {
    const path = tripPath(tripFlights(review));
    if (path.length === 0) return '';
    const first = getAirport(path[0]).city;
    const last = getAirport(path[path.length - 1]).city;
    return first === last ? `Round trip from ${first}` : `${first} to ${last}`;
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
  if (d.category === 'trip') {
    const flights = tripFlights(review);
    const path = tripPath(flights);
    return {
      top: path.length ? `${path[0]} to ${path[path.length - 1]}` : 'Trip report',
      bottom: `${flights.length} ${flights.length === 1 ? 'flight' : 'flights'}`,
    };
  }
  return { top: d.place ?? '', bottom: d.country ?? '' };
}
