import { cross, byXThenY } from "../geom.js";

// Polyline chain -> frame segments
export function chainSegments(chain, style) {
  const segs = [];
  for (let i = 1; i < chain.length; i++) {
    segs.push({ a: chain[i - 1], b: chain[i], style });
  }
  return segs;
}

export function* convexHull(input) {
  const pts = input.slice().sort(byXThenY);
  const n = pts.length;
  if (n < 2) {
    yield {
      points: pts.map(p => ({ x: p.x, y: p.y, role: "hull" })),
      segments: [],
      caption: "Done! Hull is trivial",
    };
    return pts.slice();
  }
  const lower = [], upper = [];

  const snap = (active, caption) => {
    const inHull = new Set([...lower, ...upper]);
    return {
      points: pts.map(p => ({
        x: p.x, y: p.y,
        role: p === active ? "active" : inHull.has(p) ? "hull" : "default",
      })),
      segments: [...chainSegments(lower, "hull"), ...chainSegments(upper, "hull")],
      caption,
    };
  };

  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
      yield snap(p, "Bad turn: pop from the lower hull");
    }
    lower.push(p);
    yield snap(p, "Push onto the lower hull");
  }
  for (let i = n - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
      yield snap(p, "Bad turn: pop from the upper hull");
    }
    upper.push(p);
    yield snap(p, "Push onto the upper hull");
  }
  yield snap(null, "Done! The two chains form the convex hull");

  return lower.slice(0, -1).concat(upper.slice(0, -1));
}
