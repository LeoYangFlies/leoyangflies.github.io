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
  /** Which of the eight spots around the dot it uses (kept so redraws can stay put). */
  spot: number;
}

export interface LabelOptions {
  /** Enlarges codes on small globes so they stay readable. */
  scale?: number;
  /** Points along the drawn routes; codes prefer not to sit on top of the lines. */
  routes?: { x: number; y: number }[];
  /** The previous layout: codes keep their spot unless another is clearly better, so they don't jump while the globe turns. */
  previous?: Map<string, LabelPlacement>;
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
const LABEL_GAP = 7; // minimum space between two codes
const DOT_GAP = 4; // minimum space between a code and another airport's dot
// Airports closer than this are one group: either every code in it shows, or none does,
// so a lone code can't be mistaken for its unlabelled neighbour's.
const GROUP_PX = 22;
// Upper bound on placement attempts per crowded area, so redraws while dragging stay quick.
const SEARCH_LIMIT = 1500;
// Areas with more airports than this are laid out greedily rather than searched exhaustively.
const GREEDY_ABOVE = 14;

/*
 * How a code's spot is scored (lower is better). The aim is a light, airy map rather
 * than columns of codes stacked over each other:
 * - Like a printed atlas, codes favour the upper right of their dot, then the right,
 *   and sit straight above or below only when nothing else works.
 * - In a cluster, codes point away from the cluster's middle, so it opens out like a
 *   flower instead of piling up.
 * - Codes keep a little distance from other codes and from other airports' dots.
 * - Codes avoid sitting on the route lines.
 */
const SPOT_COST = [0, 0.18, 0.5, 0.65, 0.75, 0.95, 1.25, 1.45]; // by spot, in the order below
const OUTWARD_WEIGHT = 1.1;
const LINE_COST = 0.09; // per route sample under the code
const LINE_COST_MAX = 1.2;
const NEAR_LABEL_PX = 14; // codes closer than this to each other cost extra
const NEAR_LABEL_COST = 0.9;
const NEAR_DOT_PX = 9; // and likewise codes crowding someone else's dot
const NEAR_DOT_COST = 0.8;
const STAY_BONUS = 0.35; // keep last frame's spot unless a move is clearly better
const NEIGHBOUR_PX = 90; // how far a cluster reaches when working out "outward"

interface Spot extends Omit<LabelPlacement, 'spot'> {
  dir: [number, number]; // unit vector from the dot towards the code
  box: (x: number, y: number) => Box;
}

/** The eight spots a code can take around its dot, in atlas order of preference. */
function spotsFor(scale: number): Spot[] {
  const w = CODE_W * scale;
  const h = CAP_H * scale;
  const g = (DOT_R + 2.5) * scale; // gap between the dot's centre and the code
  const d = g * 0.75; // the same gap on the diagonals
  const r = Math.SQRT1_2;
  const at = (dx: number, dy: number, anchor: Spot['anchor'], dir: [number, number]): Spot => {
    const left = anchor === 'start' ? dx : anchor === 'end' ? dx - w : dx - w / 2;
    return {
      dx,
      dy,
      anchor,
      dir,
      box: (x, y) => ({ x0: x + left, y0: y + dy - h, x1: x + left + w, y1: y + dy }),
    };
  };
  return [
    at(d, -d, 'start', [r, -r]), // upper right
    at(g, h / 2, 'start', [1, 0]), // right
    at(d, d + h, 'start', [r, r]), // lower right
    at(-d, -d, 'end', [-r, -r]), // upper left
    at(-g, h / 2, 'end', [-1, 0]), // left
    at(-d, d + h, 'end', [-r, r]), // lower left
    at(0, -g, 'middle', [0, -1]), // above
    at(0, g + h, 'middle', [0, 1]), // below
  ];
}

const overlaps = (a: Box, b: Box, pad: number) =>
  a.x0 < b.x1 + pad && b.x0 < a.x1 + pad && a.y0 < b.y1 + pad && b.y0 < a.y1 + pad;

/** Distance between two boxes (0 when they touch or overlap). */
const gapBetween = (a: Box, b: Box) => {
  const x = Math.max(0, a.x0 - b.x1, b.x0 - a.x1);
  const y = Math.max(0, a.y0 - b.y1, b.y0 - a.y1);
  return Math.sqrt(x * x + y * y);
};
const dist = (a: LabelPoint, b: LabelPoint) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

/**
 * Where each on-screen airport's code goes. A code can sit on any side of its dot; the
 * layout is chosen to look calm and readable (see the scoring notes above). Airports in
 * the same city are labelled as soon as their codes fit without covering each other or
 * another dot; dots that overlap stay unlabelled, and very close airports are labelled
 * together or not at all. Returns code -> placement; airports left out show no code.
 */
export function labelsThatFit(
  points: LabelPoint[],
  size: number,
  { scale = 1, routes = [], previous }: LabelOptions = {},
): Map<string, LabelPlacement> {
  const pts = points.filter((p) => p.x >= 0 && p.x <= size && p.y >= 0 && p.y <= size);
  const spots = spotsFor(scale);
  const pad = HALO * scale;
  const labelPad = LABEL_GAP * scale; // codes never come closer to each other than this
  const dotClear = DOT_GAP * scale; // nor this close to another airport's dot
  const dotR = (DOT_R + HALO) * scale;
  const minGap = (DOT_R * 2 + 3) * scale;
  const dotBox = (p: LabelPoint): Box => ({ x0: p.x - dotR, y0: p.y - dotR, x1: p.x + dotR, y1: p.y + dotR });
  const inside = (b: Box) => b.x0 >= 2 && b.y0 >= 2 && b.x1 <= size - 2 && b.y1 <= size - 2;

  // Route samples counted on a 3px raster, so the number under a code's box is a quick sum.
  const CELL = 3;
  const cols = Math.ceil(size / CELL);
  const raster = new Uint16Array(cols * cols);
  for (const r of routes)
    if (r.x >= 0 && r.y >= 0 && r.x < size && r.y < size) raster[Math.floor(r.y / CELL) * cols + Math.floor(r.x / CELL)]++;
  const linesUnder = (b: Box) => {
    if (!routes.length) return 0;
    const x0 = Math.max(0, Math.floor(b.x0 / CELL));
    const x1 = Math.min(cols - 1, Math.floor(b.x1 / CELL));
    const y1 = Math.min(cols - 1, Math.floor(b.y1 / CELL));
    let n = 0;
    for (let y = Math.max(0, Math.floor(b.y0 / CELL)); y <= y1; y++)
      for (let x = x0, row = y * cols; x <= x1; x++) n += raster[row + x];
    return n;
  };

  // Which way is "out of the cluster" for each airport, and how strongly it matters.
  const outward = pts.map((p) => {
    let vx = 0;
    let vy = 0;
    let weight = 0;
    for (const q of pts) {
      if (q === p) continue;
      const d = dist(p, q);
      if (d >= NEIGHBOUR_PX * scale || d === 0) continue;
      const w = 1 - d / (NEIGHBOUR_PX * scale);
      vx += ((p.x - q.x) / d) * w;
      vy += ((p.y - q.y) / d) * w;
      weight += w;
    }
    const len = Math.hypot(vx, vy);
    return { x: len ? vx / len : 0, y: len ? vy / len : 0, strength: Math.min(1, weight) };
  });

  // Every spot that is on screen and clear of all other dots, with its own cost.
  type Option = { i: number; box: Box; cost: number };
  // A code's spots stay within this distance of its dot (plus the margins that matter).
  const spotReach = (CODE_W + DOT_R + 2.5 + NEAR_DOT_PX + DOT_R + HALO) * scale;
  const options: Option[][] = pts.map((p, n) => {
    const nearby = pts.filter((q) => q !== p && Math.abs(q.x - p.x) < spotReach && Math.abs(q.y - p.y) < spotReach);
    if (nearby.some((q) => dist(p, q) < minGap)) return [];
    const was = previous?.get(p.code)?.spot;
    const out = outward[n];
    const list = spots.flatMap((s, i) => {
      const box = s.box(p.x, p.y);
      if (!inside(box)) return [];
      let cost = SPOT_COST[i];
      for (const q of nearby) {
        const qb = dotBox(q);
        if (overlaps(box, qb, dotClear)) return []; // never right up against another airport
        const gap = gapBetween(box, qb);
        if (gap < NEAR_DOT_PX * scale) cost += NEAR_DOT_COST * (1 - gap / (NEAR_DOT_PX * scale));
      }
      // 0 when pointing straight out of the cluster, up to 1 when pointing into it.
      cost += OUTWARD_WEIGHT * out.strength * ((1 - (s.dir[0] * out.x + s.dir[1] * out.y)) / 2);
      cost += Math.min(LINE_COST_MAX, LINE_COST * linesUnder(box));
      if (i === was) cost -= STAY_BONUS;
      return [{ i, box, cost }];
    });
    return list.sort((x, y) => x.cost - y.cost);
  });

  const nearLabel = NEAR_LABEL_PX * scale;
  const pairCost = (a: Box, b: Box) => {
    const gap = gapBetween(a, b);
    return gap < nearLabel ? NEAR_LABEL_COST * (1 - gap / nearLabel) : 0;
  };

  // Airports whose codes could touch are solved together.
  const reach = (CODE_W + (DOT_R + 2.5)) * scale + pad + nearLabel;
  const parent = pts.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++)
      if (Math.abs(pts[i].x - pts[j].x) < reach * 2 && Math.abs(pts[i].y - pts[j].y) < (CAP_H * scale + reach) * 1.2)
        parent[find(i)] = find(j);
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
      active = active.filter((j) => j !== i && dist(pts[j], pts[i]) >= groupPx);
    };
    for (const i of members) if (options[i].length === 0) drop(i);

    while (active.length) {
      // 1. Find a layout where every code fits, trying each airport's cheapest spots first
      //    and the most constrained airports first.
      const order = [...active].sort((a, b) => options[a].length - options[b].length || a - b);
      const chosen = new Map<number, Option>();
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
            if (overlaps(opt.box, other.box, labelPad)) {
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
      if (order.length > GREEDY_ABOVE) {
        // Big, busy areas (the zoomed-out globe): place codes one by one, skipping any with no room.
        for (const idx of order) {
          const opt = options[idx].find((o) => [...chosen.values()].every((c) => !overlaps(o.box, c.box, labelPad)));
          if (opt) chosen.set(idx, opt);
        }
        active = [...chosen.keys()];
      } else if (!place(0)) {
        // No room for everyone: give up on the airport the search kept failing at, and its group.
        drop(stuckAt);
        continue;
      }

      // 2. Polish it: move codes one at a time to whichever free spot lowers the total cost
      //    (their own cost plus crowding with the codes around them).
      // Only codes whose spots could come near each other interact.
      const around = new Map(
        active.map((i) => [
          i,
          active.filter(
            (j) => j !== i && Math.abs(pts[i].x - pts[j].x) < reach * 2 && Math.abs(pts[i].y - pts[j].y) < reach * 2,
          ),
        ]),
      );
      for (let pass = 0; pass < 6; pass++) {
        let moved = false;
        for (const idx of active) {
          const current = chosen.get(idx)!;
          let best = current;
          let bestCost = Infinity;
          for (const opt of options[idx]) {
            let cost = opt.cost;
            let clear = true;
            for (const j of around.get(idx)!) {
              const other = chosen.get(j);
              if (!other) continue;
              if (overlaps(opt.box, other.box, labelPad)) {
                clear = false;
                break;
              }
              cost += pairCost(opt.box, other.box);
            }
            if (!clear) continue;
            if (cost < bestCost - 1e-9 || (opt === current && cost <= bestCost + 1e-9)) {
              best = opt;
              bestCost = cost;
            }
          }
          if (best !== current) {
            chosen.set(idx, best);
            moved = true;
          }
        }
        if (!moved) break;
      }

      for (const [idx, opt] of chosen) {
        const s = spots[opt.i];
        result.set(pts[idx].code, { dx: s.dx, dy: s.dy, anchor: s.anchor, spot: opt.i });
      }
      break;
    }
  }

  // Never label one airport of a close group while another stays blank.
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of pts)
      if (!result.has(p.code))
        for (const q of pts)
          if (q !== p && result.has(q.code) && dist(q, p) < groupPx) {
            result.delete(q.code);
            changed = true;
          }
  }
  return result;
}

/**
 * Points every few pixels along the visible part of each route, for keeping codes off
 * the lines. Each route is projected at a coarse resolution and the on-screen stretches
 * are filled in on screen, which keeps this cheap enough to redo on every frame of a drag.
 */
export function routeSamples(
  project: (p: LonLat) => [number, number] | null,
  center: LonLat,
  routes: [LonLat, LonLat][],
  size: number,
  step = 5,
): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const lo = -30;
  const hi = size + 30;
  const COARSE = 24;
  // Which side of the globe a point is on, by dot product with the view centre (faster than geoDistance).
  const rad = Math.PI / 180;
  const cx = Math.cos(center[1] * rad) * Math.cos(center[0] * rad);
  const cy = Math.cos(center[1] * rad) * Math.sin(center[0] * rad);
  const cz = Math.sin(center[1] * rad);
  const facing = (p: LonLat) => {
    const cl = Math.cos(p[1] * rad);
    return cl * Math.cos(p[0] * rad) * cx + cl * Math.sin(p[0] * rad) * cy + Math.sin(p[1] * rad) * cz > 0;
  };
  for (const [a, b] of routes) {
    if (a[0] === b[0] && a[1] === b[1]) continue;
    const between = geoInterpolate(a, b);
    let prev: [number, number] | null = null;
    for (let i = 0; i <= COARSE; i++) {
      const p = between(i / COARSE) as LonLat;
      const xy = facing(p) ? project(p) : null;
      if (xy && prev) {
        // Clip the stretch to the screen (Liang–Barsky), then sample it.
        let t0 = 0;
        let t1 = 1;
        const dx = xy[0] - prev[0];
        const dy = xy[1] - prev[1];
        const clip = (q: number, r: number) => {
          if (q === 0) return r >= 0;
          const t = r / q;
          if (q < 0) {
            if (t > t1) return false;
            if (t > t0) t0 = t;
          } else {
            if (t < t0) return false;
            if (t < t1) t1 = t;
          }
          return true;
        };
        if (clip(-dx, prev[0] - lo) && clip(dx, hi - prev[0]) && clip(-dy, prev[1] - lo) && clip(dy, hi - prev[1])) {
          const len = Math.hypot(dx, dy) * (t1 - t0);
          const n = Math.max(1, Math.ceil(len / step));
          for (let k = 0; k <= n; k++) {
            const t = t0 + ((t1 - t0) * k) / n;
            out.push({ x: prev[0] + dx * t, y: prev[1] + dy * t });
          }
        }
      }
      prev = xy;
    }
  }
  return out;
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
