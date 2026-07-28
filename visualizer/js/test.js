// Node-runnable tests for the pure modules. Run: node visualizer/js/test.js
import { EPS, sgn, cross, dist2, byXThenY, segmentsProperlyIntersect } from "./geom.js";

let passed = 0, failed = 0;
function check(name, cond) {
  if (cond) passed++;
  else { failed++; console.error("FAIL:", name); }
}
// Deterministic LCG so tests are reproducible
function lcg(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}
// Drain a generator, return its return value
function runToEnd(gen) {
  let r = gen.next();
  while (!r.done) r = gen.next();
  return r.value;
}

// --- geom.js ---
const O = { x: 0, y: 0 }, A = { x: 1, y: 0 }, B = { x: 0, y: 1 };
check("cross left turn positive", cross(O, A, B) > 0);
check("cross right turn negative", cross(O, B, A) < 0);
check("cross collinear zero", cross(O, A, { x: 2, y: 0 }) === 0);
check("sgn positive", sgn(5) === 1);
check("sgn negative", sgn(-5) === -1);
check("sgn near zero", sgn(EPS / 2) === 0);
check("dist2", dist2(O, { x: 3, y: 4 }) === 25);
check("byXThenY x first", byXThenY({ x: 1, y: 9 }, { x: 2, y: 0 }) < 0);
check("byXThenY tie on y", byXThenY({ x: 1, y: 1 }, { x: 1, y: 2 }) < 0);
check("segments crossing", segmentsProperlyIntersect(
  { x: 0, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }, { x: 2, y: 0 }));
check("segments sharing endpoint not proper", !segmentsProperlyIntersect(
  { x: 0, y: 0 }, { x: 2, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 0 }));
check("segments disjoint", !segmentsProperlyIntersect(
  { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }));

// --- generators.js ---
import { PAD, GENERATORS } from "./generators.js";

const W = 800, H = 800;
function inBounds(p) {
  return p.x >= PAD - EPS && p.x <= W - PAD + EPS && p.y >= PAD - EPS && p.y <= H - PAD + EPS;
}
for (const name of ["uniform", "circle", "grid", "clusters"]) {
  const pts = GENERATORS[name](25, W, H, lcg(42));
  check(`${name} count`, pts.length === 25);
  check(`${name} in bounds`, pts.every(inBounds));
}
check("grid deterministic", JSON.stringify(GENERATORS.grid(9, W, H)) === JSON.stringify(GENERATORS.grid(9, W, H)));

// --- convex-hull.js ---
import { convexHull } from "./algos/convex-hull.js";

{
  // Square corners + center: hull is the 4 corners
  const sq = [
    { x: 100, y: 100 }, { x: 700, y: 100 }, { x: 700, y: 700 },
    { x: 100, y: 700 }, { x: 400, y: 400 },
  ];
  const hull = runToEnd(convexHull(sq));
  check("hull of square has 4 points", hull.length === 4);
  check("hull excludes center", !hull.includes(sq[4]));

  // Single point: hull is the point itself
  const one = [{ x: 200, y: 200 }];
  const oneHull = runToEnd(convexHull(one));
  check("single point hull", oneHull.length === 1 && oneHull[0] === one[0]);

  // All collinear: hull degenerates to the 2 endpoints
  const line = [0, 1, 2, 3, 4].map(i => ({ x: 100 + 100 * i, y: 300 }));
  const lineHull = runToEnd(convexHull(line));
  check("collinear hull has 2 points", lineHull.length === 2);

  // Random set: hull is convex (no right turns walking the boundary)
  const rnd = lcg(7);
  const pts = GENERATORS.uniform(50, W, H, rnd);
  const h2 = runToEnd(convexHull(pts));
  let convex = true;
  for (let i = 0; i < h2.length; i++) {
    const a = h2[i], b = h2[(i + 1) % h2.length], c = h2[(i + 2) % h2.length];
    if (sgn(cross(a, b, c)) < 0) convex = false;
  }
  check("hull is convex", convex);

  // Frames are well-formed
  const frames = [...convexHull(sq)];
  check("hull yields frames", frames.length > 0);
  check("frames well-formed", frames.every(f =>
    Array.isArray(f.points) && Array.isArray(f.segments) && typeof f.caption === "string"));
}

// --- simple-polygon.js ---
import { simplePolygon } from "./algos/simple-polygon.js";

function polygonIsSimple(order) {
  const m = order.length;
  for (let i = 0; i < m; i++) {
    const a1 = order[i], a2 = order[(i + 1) % m];
    for (let j = i + 1; j < m; j++) {
      const b1 = order[j], b2 = order[(j + 1) % m];
      if (segmentsProperlyIntersect(a1, a2, b1, b2)) return false;
    }
  }
  return true;
}

for (const seed of [1, 2, 3]) {
  const pts = GENERATORS.uniform(30, W, H, lcg(seed));
  const order = runToEnd(simplePolygon(pts));
  check(`polygon(seed ${seed}) visits all points`, order.length === 30 && new Set(order).size === 30);
  check(`polygon(seed ${seed}) is simple`, polygonIsSimple(order));
}
for (const name of ["circle", "grid"]) {
  const pts = GENERATORS[name](16, W, H, lcg(9));
  const order = runToEnd(simplePolygon(pts));
  check(`polygon on ${name} is simple`, polygonIsSimple(order));
}

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
