// Shared by the globe's build-time rendering and its in-browser redraws.
import { geoDistance, geoInterpolate } from 'd3-geo';

type LonLat = [number, number];

export interface LabelPoint {
  code: string;
  x: number;
  y: number;
}

export interface LabelPlacement {
  /** Text position relative to the airport's dot. */
  dx: number;
  dy: number;
  anchor: 'start' | 'middle' | 'end';
}

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

// Label geometry, in globe pixels at scale 1 (codes are 13px bold, three capitals).
const CODE_W = 27; // width of a three-letter code
const CAP_H = 9.5; // height of its capitals
const DOT_R = 3.5; // airport dot radius
const HALO = 1.5; // breathing room kept around labels and dots
// Airports closer than this are one group: either every code in it shows, or none does,
// so a lone code can't be mistaken for its unlabelled neighbour's.
const GROUP_PX = 22;
// Upper bound on placement attempts per crowded area, so redraws while dragging stay quick.
const SEARCH_LIMIT = 4000;

/** The eight spots a code can take around its dot, in order of preference. */
function candidates(scale: number): (LabelPlacement & { box: (x: number, y: number) => Box })[] {
  const w = CODE_W * scale;
  const h = CAP_H * scale;
  const g = (DOT_R + 2.5) * scale; // gap between the dot's centre and the label
  const d = g * 0.75; // the same gap on the diagonals
  const at = (dx: number, dy: number, anchor: LabelPlacement['anchor']) => {
    const left = anchor === 'start' ? dx : anchor === 'end' ? dx - w : dx - w / 2;
    return {
      dx,
      dy,
      anchor,
      box: (x: number, y: number): Box => ({ x0: x + left, y0: y + dy - h, x1: x + left + w, y1: y + dy }),
    };
  };
  return [
    at(0, -g, 'middle'), // above
    at(0, g + h, 'middle'), // below
    at(g, h / 2, 'start'), // right
    at(-g, h / 2, 'end'), // left
    at(d, -d, 'start'), // above right
    at(-d, -d, 'end'), // above left
    at(d, d + h, 'start'), // below right
    at(-d, d + h, 'end'), // below left
  ];
}

const overlaps = (a: Box, b: Box, pad: number) =>
  a.x0 < b.x1 + pad && b.x0 < a.x1 + pad && a.y0 < b.y1 + pad && b.y0 < a.y1 + pad;

/**
 * Where each on-screen airport's code goes. A code can sit on any side of its dot, so
 * airports in the same city get labelled as soon as their codes can sit apart without
 * covering each other or another dot. Airports very close together are labelled together
 * or not at all. Returns code -> placement; airports left out show no code.
 * `scale` enlarges codes on small globes so they stay readable.
 */
export function labelsThatFit(points: LabelPoint[], size: number, scale = 1): Map<string, LabelPlacement> {
  const pts = points.filter((p) => p.x >= 0 && p.x <= size && p.y >= 0 && p.y <= size);
  const spots = candidates(scale);
  const pad = HALO * scale;
  const dotR = (DOT_R + HALO) * scale;
  const dotBox = (p: LabelPoint): Box => ({ x0: p.x - dotR, y0: p.y - dotR, x1: p.x + dotR, y1: p.y + dotR });
  const minGap = (DOT_R * 2 + 3) * scale;
  const inside = (b: Box) => b.x0 >= 2 && b.y0 >= 2 && b.x1 <= size - 2 && b.y1 <= size - 2;

  // Every spot that is on screen and clear of all other dots, per airport.
  const options = pts.map((p) =>
    spots.flatMap((s, i) => {
      const box = s.box(p.x, p.y);
      if (!inside(box)) return [];
      // Dots that sit on top of each other can't be told apart, whatever their codes say.
      if (pts.some((q) => q !== p && Math.hypot(q.x - p.x, q.y - p.y) < minGap)) return [];
      if (pts.some((q) => q !== p && overlaps(box, dotBox(q), 0))) return [];
      return [{ i, box }];
    }),
  );

  // Airports whose labels could touch are solved together.
  const reach = (CODE_W + (DOT_R + 2.5)) * scale + pad;
  const near = (a: LabelPoint, b: LabelPoint, dx: number, dy: number) =>
    Math.abs(a.x - b.x) < dx && Math.abs(a.y - b.y) < dy;
  const parent = pts.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++)
      if (near(pts[i], pts[j], reach * 2, (CAP_H * scale + reach) * 1.2)) parent[find(i)] = find(j);
  const areas = new Map<number, number[]>();
  pts.forEach((_, i) => {
    const r = find(i);
    areas.set(r, [...(areas.get(r) ?? []), i]);
  });

  const groupPx = GROUP_PX * scale;
  const result = new Map<string, LabelPlacement>();

  for (const members of areas.values()) {
    let active = members.filter((i) => options[i].length > 0);
    // An airport with nowhere to go takes its close neighbours' codes with it.
    const drop = (i: number) => {
      active = active.filter((j) => j !== i && Math.hypot(pts[j].x - pts[i].x, pts[j].y - pts[i].y) >= groupPx);
    };
    for (const i of members) if (options[i].length === 0) drop(i);

    while (active.length) {
      // Most constrained airports first.
      const order = [...active].sort((a, b) => options[a].length - options[b].length || a - b);
      const chosen = new Map<number, { i: number; box: Box }>();
      let steps = 0;
      let stuckAt = order[0];
      let deepest = -1;
      const place = (k: number): boolean => {
        if (k === order.length) return true;
        if (++steps > SEARCH_LIMIT) return false;
        const idx = order[k];
        if (k > deepest) {
          deepest = k;
          stuckAt = idx;
        }
        for (const opt of options[idx]) {
          let clear = true;
          for (const other of chosen.values())
            if (overlaps(opt.box, other.box, pad)) {
              clear = false;
              break;
            }
          if (!clear) continue;
          chosen.set(idx, opt);
          if (place(k + 1)) return true;
          chosen.delete(idx);
        }
        return false;
      };
      if (place(0)) {
        for (const [k, v] of chosen) {
          const s = spots[v.i];
          result.set(pts[k].code, { dx: s.dx, dy: s.dy, anchor: s.anchor });
        }
        break;
      }
      // No room for everyone: give up on the airport the search kept failing at, and its group.
      drop(stuckAt);
    }
  }

  // Never label one airport of a close group while another stays blank.
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of pts)
      if (!result.has(p.code))
        for (const q of pts)
          if (q !== p && result.has(q.code) && Math.hypot(q.x - p.x, q.y - p.y) < groupPx) {
            result.delete(q.code);
            changed = true;
          }
  }
  return result;
}

export interface ArrowMark {
  x: number;
  y: number;
  angle: number; // degrees, 0 = pointing right
  size: number; // 1 = full size; smaller on very short routes
}

/**
 * Where to draw direction arrows on a route: one at the middle pointing from `a` to `b`,
 * or, for a route flown both ways, a pair pointing apart. Arrows are skipped on the far
 * side of the globe and on routes too short on screen to fit them (zooming in reveals them).
 * With `shrink`, short routes get a smaller arrow instead of none.
 */
export function arrowMarks(
  project: (p: LonLat) => [number, number] | null,
  center: LonLat,
  a: LonLat,
  b: LonLat,
  twoWay: boolean,
  minLength: number,
  shrink = false,
): ArrowMark[] {
  if (a[0] === b[0] && a[1] === b[1]) return [];
  const between = geoInterpolate(a, b);
  const visible = (p: LonLat) => geoDistance(center, p) < Math.PI / 2 - 0.03;

  // Length of the visible part of the route on screen.
  let length = 0;
  let prev: [number, number] | null = null;
  for (let i = 0; i <= 16; i++) {
    const p = between(i / 16) as LonLat;
    const xy = visible(p) ? project(p) : null;
    if (xy && prev) length += Math.hypot(xy[0] - prev[0], xy[1] - prev[1]);
    prev = xy;
  }
  let size = 1;
  if (length < minLength) {
    if (!shrink || length < minLength * 0.35) return [];
    size = Math.max(0.5, length / minLength);
  }

  const spots: [number, 1 | -1][] = twoWay
    ? [
        [0.42, -1],
        [0.58, 1],
      ]
    : [[0.5, 1]];
  const marks: ArrowMark[] = [];
  for (const [t, dir] of spots) {
    const p = between(t) as LonLat;
    const q = between(t + 0.01 * dir) as LonLat;
    if (!visible(p)) continue;
    const xy = project(p);
    const xy2 = project(q);
    if (!xy || !xy2) continue;
    marks.push({ x: xy[0], y: xy[1], angle: (Math.atan2(xy2[1] - xy[1], xy2[0] - xy[0]) * 180) / Math.PI, size });
  }
  return marks;
}

/** The arrowhead, pointing right, centred on its tip-to-tail midpoint. */
export const ARROW_PATH = 'M -4.5 -3.8 L 4.5 0 L -4.5 3.8 Z';
