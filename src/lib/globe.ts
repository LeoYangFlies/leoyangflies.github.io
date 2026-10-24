// Shared by the globe's build-time rendering and its in-browser redraws.

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
 */
export function labelsThatFit(points: LabelPoint[], size: number): Map<string, number> {
  const onScreen = points.filter((p) => p.x >= 0 && p.x <= size && p.y >= 0 && p.y <= size);
  const fit = new Map<string, number>();
  for (const p of onScreen) {
    const crowded = onScreen.some(
      (q) => q !== p && Math.abs(q.x - p.x) < MIN_DX && Math.abs(q.y - p.y) < MIN_DY,
    );
    // Codes sit above the dot, or below it near the top edge.
    if (!crowded) fit.set(p.code, p.y < 22 ? 19 : -9);
  }
  return fit;
}
