// Shared by the globe's build-time rendering and its in-browser redraws.
import { geoDistance, geoInterpolate } from 'd3-geo';

type LonLat = [number, number];

export interface LabelPoint {
  code: string;
  x: number;
  y: number;
}

// How close two airports can be on screen before their codes would overlap
// (a code is about 3 characters wide and sits just above its dot).
const MIN_DX = 32;
const MIN_DY = 20;

/**
 * Which on-screen airports can show their code without overlapping a neighbour's code
 * or dot. Airports in a crowded cluster stay unlabelled until the view is zoomed in far
 * enough that every airport in that cluster has room. Returns code -> label y offset.
 * `scale` enlarges codes on small globes so they stay readable.
 */
export function labelsThatFit(points: LabelPoint[], size: number, scale = 1): Map<string, number> {
  const onScreen = points.filter((p) => p.x >= 0 && p.x <= size && p.y >= 0 && p.y <= size);
  const fit = new Map<string, number>();
  for (const p of onScreen) {
    const crowded = onScreen.some(
      (q) => q !== p && Math.abs(q.x - p.x) < MIN_DX * scale && Math.abs(q.y - p.y) < MIN_DY * scale,
    );
    // Codes sit above the dot, or below it near the top edge.
    if (!crowded) fit.set(p.code, p.y < 22 * scale ? 19 * scale : -9 * scale);
  }
  return fit;
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
