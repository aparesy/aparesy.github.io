import { cross, sgn, dist2 } from "../geom.js";
import { chainSegments } from "./convex-hull.js";

export function* simplePolygon(input) {
  const pts = input.slice();

  // Base point: leftmost; on ties the lowest on screen (largest y)
  let base = pts[0];
  for (const p of pts) {
    if (p.x < base.x || (p.x === base.x && p.y > base.y)) base = p;
  }

  const roleOf = (p, active, placed) =>
    p === base ? "base" : p === active ? "active" : placed.has(p) ? "done" : "default";
  const snap = (active, placed, order, caption, close) => ({
    points: pts.map(p => ({ x: p.x, y: p.y, role: roleOf(p, active, placed) })),
    segments: [
      ...chainSegments(order, "hull"),
      ...(close && order.length > 2 ? [{ a: order[order.length - 1], b: order[0], style: "hull" }] : []),
    ],
    caption,
  });

  const none = new Set();
  yield snap(null, none, [base], "Pick the leftmost point as the base");

  // Sort by angle around base; equal angles: closest first
  const rest = pts.filter(p => p !== base);
  rest.sort((a, b) => {
    const c = cross(base, a, b);
    if (sgn(c) !== 0) return -c; // negative cross = smaller screen angle first
    return dist2(base, a) - dist2(base, b);
  });

  // Reverse the last collinear group so the closing edge does not overlap it
  const m = rest.length;
  let k = m - 1;
  while (k > 0 && sgn(cross(base, rest[k - 1], rest[m - 1])) === 0) k--;
  if (k < m - 1) {
    const tail = rest.splice(k).reverse();
    rest.push(...tail);
  }

  const placed = new Set([base]);
  const order = [base];
  for (const p of rest) {
    placed.add(p);
    order.push(p);
    yield snap(p, placed, order, "Link the next point in angular order");
  }
  yield snap(null, placed, order, "Close the polygon: done!", true);

  return order;
}
