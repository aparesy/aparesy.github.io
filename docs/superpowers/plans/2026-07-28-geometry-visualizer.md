# Geometry Visualizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static multi-page webapp under `visualizer/` on aparesy.github.io that animates the Simple Polygon and Convex Hull algorithms on generated point sets.

**Architecture:** Each algorithm is a JS generator function that yields self-contained drawable frames (points with roles, segments with styles, a caption) and returns its final result. A shared player pulls frames and renders them on a Canvas 2D; shared generators produce point sets. Pure modules (geom, generators, algos) are DOM-free and tested under Node.

**Tech Stack:** Vanilla JavaScript ES modules, Canvas 2D API, Node (for tests only). No dependencies, no build step.

## Global Constraints

- No frameworks, no libraries, no build step. Plain ES modules loaded with `<script type="module">`.
- App lives entirely in `visualizer/`; no Jekyll front matter or Liquid in its files.
- Prose/UI copy: never use em or en dashes; reword instead.
- **Do NOT run `git commit` or `git add`. The user commits manually.** Where a normal plan would commit, just stop.
- Point count is clamped to [3, 500].
- Canvas logical resolution is 800x800; generated points stay at least 40px from the edges.
- Frame object shape (produced by algos, consumed by player):
  `{ points: [{x, y, role}], segments: [{a: {x,y}, b: {x,y}, style}], caption: string }`
  with `role` in `"default" | "active" | "hull" | "base" | "done"` and `style` in `"hull" | "candidate" | "rejected"`.

---

### Task 1: Geometry helpers (`geom.js`) and test harness

**Files:**
- Create: `visualizer/js/geom.js`
- Create: `visualizer/js/test.js`

**Interfaces:**
- Produces: `EPS`, `sgn(x)`, `cross(o, a, b)`, `dist2(a, b)`, `byXThenY(a, b)`, `segmentsProperlyIntersect(p1, p2, p3, p4)`; test helpers `check(name, cond)`, `lcg(seed)`, `runToEnd(gen)` inside `test.js`.

- [ ] **Step 1: Write the failing tests**

Create `visualizer/js/test.js`:

```js
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

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node visualizer/js/test.js`
Expected: error, `Cannot find module .../geom.js`

- [ ] **Step 3: Implement `visualizer/js/geom.js`**

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node visualizer/js/test.js`
Expected: `12 passed, 0 failed`, exit code 0

---

### Task 2: Point-set generators (`generators.js`)

**Files:**
- Create: `visualizer/js/generators.js`
- Modify: `visualizer/js/test.js` (append tests before the final `console.log`)

**Interfaces:**
- Consumes: nothing from other modules.
- Produces: `PAD` (number, 40), `GENERATORS` object with keys `uniform`, `circle`, `grid`, `clusters`; each value is `(n, w, h, rnd = Math.random) => [{x, y}]` returning exactly `n` points with `PAD <= x <= w - PAD` and `PAD <= y <= h - PAD`.

- [ ] **Step 1: Append failing tests to `test.js`**

Insert before the final `console.log` line:

```js
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
```

(`import` statements are hoisted, so appending the import mid-file is fine in an ES module.)

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `node visualizer/js/test.js`
Expected: error, `Cannot find module .../generators.js`

- [ ] **Step 3: Implement `visualizer/js/generators.js`**

```js
// Point-set presets. Each returns n points inside [PAD, w-PAD] x [PAD, h-PAD].
export const PAD = 40;

function clampCoord(v, size) {
  return Math.min(Math.max(v, PAD), size - PAD);
}

function uniform(n, w, h, rnd = Math.random) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    pts.push({ x: PAD + rnd() * (w - 2 * PAD), y: PAD + rnd() * (h - 2 * PAD) });
  }
  return pts;
}

function circle(n, w, h, rnd = Math.random) {
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - PAD;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return pts;
}

function grid(n, w, h) {
  const side = Math.ceil(Math.sqrt(n));
  const stepX = (w - 2 * PAD) / Math.max(side - 1, 1);
  const stepY = (h - 2 * PAD) / Math.max(side - 1, 1);
  const pts = [];
  for (let i = 0; i < n; i++) {
    pts.push({ x: PAD + (i % side) * stepX, y: PAD + Math.floor(i / side) * stepY });
  }
  return pts;
}

function clusters(n, w, h, rnd = Math.random) {
  const k = Math.max(2, Math.min(5, Math.floor(n / 10)));
  const centers = uniform(k, w, h, rnd);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const c = centers[i % k];
    pts.push({
      x: clampCoord(c.x + (rnd() - 0.5) * 160, w),
      y: clampCoord(c.y + (rnd() - 0.5) * 160, h),
    });
  }
  return pts;
}

export const GENERATORS = { uniform, circle, grid, clusters };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node visualizer/js/test.js`
Expected: `21 passed, 0 failed`

---

### Task 3: Convex hull algorithm (`algos/convex-hull.js`)

**Files:**
- Create: `visualizer/js/algos/convex-hull.js`
- Modify: `visualizer/js/test.js` (append tests)

**Interfaces:**
- Consumes: `cross`, `byXThenY` from `../geom.js`.
- Produces: `function* convexHull(input)` yielding frame objects (see Global Constraints) and **returning** the hull as an array of the input's point objects in boundary order (no repeated first point). Also exports `chainSegments(chain, style)` helper reused by tests and by `simple-polygon.js`.

- [ ] **Step 1: Append failing tests to `test.js`**

```js
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
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `node visualizer/js/test.js`
Expected: error, `Cannot find module .../algos/convex-hull.js`

- [ ] **Step 3: Implement `visualizer/js/algos/convex-hull.js`**

Monotone chain, written like the CP version with `yield` at each push/pop. Note: canvas y grows downward, so with `cross <= 0` popping, the walk order comes out consistent; the convexity test uses `sgn >= 0` on the returned order.

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node visualizer/js/test.js`
Expected: `27 passed, 0 failed`

---

### Task 4: Simple polygon algorithm (`algos/simple-polygon.js`)

**Files:**
- Create: `visualizer/js/algos/simple-polygon.js`
- Modify: `visualizer/js/test.js` (append tests)

**Interfaces:**
- Consumes: `cross`, `sgn`, `dist2` from `../geom.js`; `chainSegments` from `./convex-hull.js`.
- Produces: `function* simplePolygon(input)` yielding frames and **returning** all input points as an array in polygon order (closing edge implied between last and first).

- [ ] **Step 1: Append failing tests to `test.js`**

```js
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
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `node visualizer/js/test.js`
Expected: error, `Cannot find module .../algos/simple-polygon.js`

- [ ] **Step 3: Implement `visualizer/js/algos/simple-polygon.js`**

The NWERC 2009 I algorithm: pick the leftmost point (bottom-most on screen if tied) as base, sort the rest by angle around it (ties: closest first), then reverse the final collinear group so the closing edge does not overlap, and link everything in order.

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node visualizer/js/test.js`
Expected: `35 passed, 0 failed`

If a "is simple" check fails, debug with the superpowers:systematic-debugging skill; the usual suspects are the sort comparator's sign convention and the collinear tail reversal.

---

### Task 5: Player, styling, and the first page (`convex-hull.html`)

**Files:**
- Create: `visualizer/js/player.js`
- Create: `visualizer/css/style.css`
- Create: `visualizer/convex-hull.html`

**Interfaces:**
- Consumes: `GENERATORS` from `./generators.js`; an algorithm generator function passed in by the page.
- Produces: `setupVisualizer(algorithm)` which wires DOM elements with ids `canvas`, `caption`, `generate`, `shape`, `count`, `playpause`, `step`, `speed`. Every algorithm page uses exactly these ids.

- [ ] **Step 1: Implement `visualizer/js/player.js`**

```js
import { GENERATORS } from "./generators.js";

const POINT_COLORS = {
  default: "#555b6e",
  active: "#ff8800",
  hull: "#0088ff",
  base: "#e03131",
  done: "#2f9e44",
};
const SEGMENT_STYLES = {
  hull: { stroke: "#0088ff", width: 2.5 },
  candidate: { stroke: "#ff8800", width: 1.5 },
  rejected: { stroke: "#ced4da", width: 1 },
};

export function setupVisualizer(algorithm) {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const captionEl = document.getElementById("caption");
  const el = id => document.getElementById(id);

  let frames = [];
  let idx = -1;
  let timer = null;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (idx < 0 || idx >= frames.length) return;
    const f = frames[idx];
    for (const s of f.segments) {
      const st = SEGMENT_STYLES[s.style] || SEGMENT_STYLES.hull;
      ctx.strokeStyle = st.stroke;
      ctx.lineWidth = st.width;
      ctx.beginPath();
      ctx.moveTo(s.a.x, s.a.y);
      ctx.lineTo(s.b.x, s.b.y);
      ctx.stroke();
    }
    for (const p of f.points) {
      ctx.fillStyle = POINT_COLORS[p.role] || POINT_COLORS.default;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    captionEl.textContent = f.caption;
  }

  function stepForward() {
    if (idx < frames.length - 1) {
      idx++;
      draw();
    } else {
      pause();
    }
  }

  function delayMs() {
    return 1050 - Number(el("speed").value) * 100; // speed 1..10 -> 950..50ms
  }

  function play() {
    if (timer || frames.length === 0) return;
    timer = setInterval(stepForward, delayMs());
    el("playpause").textContent = "Pause";
  }

  function pause() {
    clearInterval(timer);
    timer = null;
    el("playpause").textContent = "Play";
  }

  function generate() {
    pause();
    const count = Math.min(500, Math.max(3, Number(el("count").value) || 30));
    el("count").value = count;
    const points = GENERATORS[el("shape").value](count, canvas.width, canvas.height);
    frames = [
      {
        points: points.map(p => ({ x: p.x, y: p.y, role: "default" })),
        segments: [],
        caption: "Points ready. Press Play or Step!",
      },
      ...algorithm(points),
    ];
    idx = 0;
    draw();
  }

  el("generate").addEventListener("click", generate);
  el("playpause").addEventListener("click", () => (timer ? pause() : play()));
  el("step").addEventListener("click", () => { pause(); stepForward(); });
  el("speed").addEventListener("input", () => {
    if (timer) { pause(); play(); }
  });

  generate();
}
```

- [ ] **Step 2: Implement `visualizer/css/style.css`**

```css
* { box-sizing: border-box; }
body {
  margin: 0;
  background: #f6f7fb;
  font-family: Georgia, "Times New Roman", serif;
  color: #222;
}
main {
  max-width: 860px;
  margin: 24px auto;
  padding: 20px 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
h1 { text-align: center; font-size: 1.5rem; }
.nav { text-align: center; font-size: 0.95rem; }
canvas {
  display: block;
  width: 100%;
  height: auto;
  border: 1px solid #e0e2ea;
  border-radius: 8px;
  background: #fcfcfe;
}
#caption {
  text-align: center;
  min-height: 1.4em;
  font-style: italic;
  color: #444;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid #eee;
}
.controls button {
  background: #1976d2;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 1rem;
  cursor: pointer;
}
.controls button:hover { background: #1565c0; }
.controls input[type="number"] { width: 4.5em; }
.algo-list { line-height: 1.9; font-size: 1.1rem; }
```

- [ ] **Step 3: Implement `visualizer/convex-hull.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Convex Hull - Geometry Visualizer</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <main>
    <h1>Convex Hull (monotone chain)</h1>
    <p class="nav"><a href="index.html">All algorithms</a> | <a href="/">Back to the blog</a></p>
    <canvas id="canvas" width="800" height="800"></canvas>
    <p id="caption"></p>
    <div class="controls">
      <button id="generate">Generate</button>
      <select id="shape">
        <option value="uniform">Uniform random</option>
        <option value="circle">Circle</option>
        <option value="grid">Grid</option>
        <option value="clusters">Clusters</option>
      </select>
      <label>Points: <input id="count" type="number" min="3" max="500" value="30"></label>
      <button id="playpause">Play</button>
      <button id="step">Step</button>
      <label>Speed: <input id="speed" type="range" min="1" max="10" value="5"></label>
    </div>
  </main>
  <script type="module">
    import { setupVisualizer } from "./js/player.js";
    import { convexHull } from "./js/algos/convex-hull.js";
    setupVisualizer(convexHull);
  </script>
</body>
</html>
```

- [ ] **Step 4: Manual browser verification**

ES modules do not load over `file://`, so serve locally:

Run: `python3 -m http.server 8000` (from the repo root, in background)
Open: `http://localhost:8000/visualizer/convex-hull.html`

Checklist:
- Page loads with 30 points already drawn, no console errors.
- Play animates pushes and pops; hull closes at the end; Play button reads Pause while running.
- Step advances one frame; Generate with "Circle" and 12 points works; count 99999 clamps to 500.
- Speed slider changes the pace while playing.

---

### Task 6: Second page, landing page, final check

**Files:**
- Create: `visualizer/simple-polygon.html`
- Create: `visualizer/index.html`

**Interfaces:**
- Consumes: `setupVisualizer` from `js/player.js`, `simplePolygon` from `js/algos/simple-polygon.js`.

- [ ] **Step 1: Implement `visualizer/simple-polygon.html`**

Identical to `convex-hull.html` except title, heading, and the script block:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Simple Polygon - Geometry Visualizer</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <main>
    <h1>Simple Polygon (NWERC 2009 I)</h1>
    <p class="nav"><a href="index.html">All algorithms</a> | <a href="/">Back to the blog</a></p>
    <canvas id="canvas" width="800" height="800"></canvas>
    <p id="caption"></p>
    <div class="controls">
      <button id="generate">Generate</button>
      <select id="shape">
        <option value="uniform">Uniform random</option>
        <option value="circle">Circle</option>
        <option value="grid">Grid</option>
        <option value="clusters">Clusters</option>
      </select>
      <label>Points: <input id="count" type="number" min="3" max="500" value="30"></label>
      <button id="playpause">Play</button>
      <button id="step">Step</button>
      <label>Speed: <input id="speed" type="range" min="1" max="10" value="5"></label>
    </div>
  </main>
  <script type="module">
    import { setupVisualizer } from "./js/player.js";
    import { simplePolygon } from "./js/algos/simple-polygon.js";
    setupVisualizer(simplePolygon);
  </script>
</body>
</html>
```

- [ ] **Step 2: Implement `visualizer/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Geometry Visualizer</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <main>
    <h1>Geometry Algorithm Visualizer</h1>
    <p class="nav"><a href="/">Back to the blog</a></p>
    <p>Step-by-step animations of computational geometry algorithms. Generate a point set, press Play, and watch.</p>
    <ul class="algo-list">
      <li><a href="simple-polygon.html">Simple Polygon</a>: order points into a non-self-intersecting polygon (NWERC 2009 I)</li>
      <li><a href="convex-hull.html">Convex Hull</a>: monotone chain, the classic left-to-right sweep</li>
    </ul>
  </main>
</body>
</html>
```

- [ ] **Step 3: Run the full test suite one last time**

Run: `node visualizer/js/test.js`
Expected: `35 passed, 0 failed`

- [ ] **Step 4: Manual browser verification of all three pages**

With `python3 -m http.server 8000` still running, open `http://localhost:8000/visualizer/`:
- Landing page links reach both algorithm pages; "All algorithms" links back.
- Simple Polygon page: base point shows red, points turn green as they are linked, polygon closes without crossing edges; try Grid preset with 16 points (the collinear stress case).
- No console errors on any page.

Then stop the server. Do not commit; the user commits manually.
