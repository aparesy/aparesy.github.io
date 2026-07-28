// Small geometry kernel, CP style. All inputs are {x, y} objects.
export const EPS = 1e-7;

export function sgn(x) {
  return x > EPS ? 1 : x < -EPS ? -1 : 0;
}

// Cross product of (a - o) x (b - o). Positive = left turn in math coords.
export function cross(o, a, b) {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

export function dist2(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function byXThenY(a, b) {
  return a.x - b.x || a.y - b.y;
}

// True only for a crossing strictly inside both segments
export function segmentsProperlyIntersect(p1, p2, p3, p4) {
  const d1 = sgn(cross(p3, p4, p1)), d2 = sgn(cross(p3, p4, p2));
  const d3 = sgn(cross(p1, p2, p3)), d4 = sgn(cross(p1, p2, p4));
  return d1 * d2 < 0 && d3 * d4 < 0;
}
