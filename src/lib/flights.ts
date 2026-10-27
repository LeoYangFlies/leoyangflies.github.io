import { parse } from 'yaml';
import { z } from 'astro/zod';
import raw from '../data/flights.yaml?raw';
import { CABINS } from '../consts';
import { AIRPORTS, distanceKm, getAirport } from '../data/airports';

const EARTH_CIRCUMFERENCE_KM = 40075;

const code = z
  .string()
  .transform((s) => s.toUpperCase())
  .refine((c) => c in AIRPORTS, (c) => ({
    message: `Unknown airport code "${c}". Add it to src/data/airports.ts first.`,
  }));

const flightSchema = z.object({
  date: z.coerce.date(),
  airline: z.string(),
  flight: z.string().optional(),
  from: code,
  to: code,
  aircraft: z.string().optional(),
  cabin: z.enum(CABINS).optional(),
  seat: z.coerce.string().optional(),
  duration: z.string().optional(),
  review: z.string().optional(),
  sample: z.boolean().default(false),
});

export type Flight = z.infer<typeof flightSchema> & { km: number; minutes?: number };

/** "14h 35m", "14h", "35m" or "14:35" → minutes. */
export function parseDuration(text?: string): number | undefined {
  if (!text) return undefined;
  const clock = text.match(/^\s*(\d+):(\d{2})\s*$/);
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);
  const h = text.match(/(\d+)\s*h/i);
  const m = text.match(/(\d+)\s*m/i);
  if (!h && !m) throw new Error(`Couldn't read flight duration "${text}". Write it like "14h 35m".`);
  return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

let cache: Flight[] | undefined;

/** Every flight in the log, newest first. */
export function getFlights(): Flight[] {
  if (cache) return cache;
  const list = parse(raw) ?? [];
  if (!Array.isArray(list)) throw new Error('src/data/flights.yaml should be a list of flights.');
  cache = list
    .map((entry, i) => {
      const result = flightSchema.safeParse(entry);
      if (!result.success) {
        throw new Error(`Flight #${i + 1} in src/data/flights.yaml has a problem: ${result.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ')}`);
      }
      const f = result.data;
      return { ...f, km: distanceKm(f.from, f.to), minutes: parseDuration(f.duration) };
    });
  cache = inFlownOrder(cache).reverse();
  return cache;
}

/**
 * Oldest first. The log has dates but no times, so flights on the same day are put in
 * the order they connect: each leg starts where the one before it landed.
 */
function inFlownOrder(flights: Flight[]): Flight[] {
  const byDay = new Map<number, Flight[]>();
  for (const f of flights) {
    const day = f.date.valueOf();
    byDay.set(day, [...(byDay.get(day) ?? []), f]);
  }
  const ordered: Flight[] = [];
  for (const day of [...byDay.keys()].sort((a, b) => a - b)) {
    const remaining = [...byDay.get(day)!];
    let at = ordered[ordered.length - 1]?.to;
    while (remaining.length) {
      // Prefer the leg leaving from where we are; otherwise the leg nothing else that day arrives at.
      let i = remaining.findIndex((f) => f.from === at);
      if (i < 0) i = remaining.findIndex((f) => !remaining.some((g) => g !== f && g.to === f.from));
      if (i < 0) i = 0;
      const [next] = remaining.splice(i, 1);
      ordered.push(next);
      at = next.to;
    }
  }
  return ordered;
}

function countBy<T>(items: T[], key: (item: T) => string | undefined): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    if (k) map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export interface Route {
  a: string;
  b: string;
  count: number;
}

export function getStats(flights = getFlights()) {
  const km = flights.reduce((sum, f) => sum + f.km, 0);
  const timed = flights.filter((f) => f.minutes !== undefined);
  const minutes = timed.reduce((sum, f) => sum + (f.minutes ?? 0), 0);
  const airports = new Set(flights.flatMap((f) => [f.from, f.to]));
  const countries = new Set([...airports].map((c) => getAirport(c).country));

  // Routes count both directions together: PVG–JFK and JFK–PVG are one route.
  const routeMap = new Map<string, Route>();
  for (const f of flights) {
    const [a, b] = [f.from, f.to].sort();
    const key = `${a}-${b}`;
    const r = routeMap.get(key) ?? { a, b, count: 0 };
    r.count++;
    routeMap.set(key, r);
  }
  const routes = [...routeMap.values()].sort((x, y) => y.count - x.count);

  const longest = flights.reduce<Flight | undefined>((best, f) => (!best || f.km > best.km ? f : best), undefined);
  const years = countBy(flights, (f) => String(f.date.getUTCFullYear())).sort((a, b) => Number(b.name) - Number(a.name));

  return {
    count: flights.length,
    km: Math.round(km),
    miles: Math.round(km * 0.621371),
    laps: km / EARTH_CIRCUMFERENCE_KM,
    minutes,
    allTimed: timed.length === flights.length,
    airports: [...airports],
    countries: [...countries],
    routes,
    airlines: countBy(flights, (f) => f.airline),
    aircraft: countBy(flights, (f) => f.aircraft),
    cabins: countBy(flights, (f) => f.cabin),
    years,
    longest,
    // Airports by number of visits (takeoffs plus landings), most visited first.
    topAirports: countBy(flights.flatMap((f) => [f.from, f.to]), (c) => c),
    firstYear: flights.length ? Math.min(...flights.map((f) => f.date.getUTCFullYear())) : undefined,
    hasSamples: flights.some((f) => f.sample),
  };
}

export const fmt = (n: number) => n.toLocaleString('en-US');

export interface RouteLeg {
  from: string;
  to: string;
  twoWay: boolean;
  weight: number;
  /** The flights on this route, newest first. */
  flights: Flight[];
}

/** One entry per route for the globe: both directions together, noting which way it was flown. */
export function routeLegs(flights = getFlights()): RouteLeg[] {
  const groups = new Map<string, { dirs: Set<string>; flights: Flight[] }>();
  for (const f of flights) {
    const key = [f.from, f.to].sort().join('-');
    const g = groups.get(key) ?? { dirs: new Set<string>(), flights: [] };
    g.dirs.add(`${f.from}-${f.to}`);
    g.flights.push(f);
    groups.set(key, g);
  }
  return [...groups.entries()].map(([key, g]) => {
    const twoWay = g.dirs.size > 1;
    const [from, to] = (twoWay ? key : [...g.dirs][0]).split('-');
    return { from, to, twoWay, weight: g.flights.length, flights: g.flights };
  });
}
