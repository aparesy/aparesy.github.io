# Geometry Algorithm Visualizer

Design approved 2026-07-28.

## Goal

A small multi-page webapp on aparesy.github.io to visualize computational geometry algorithms, replacing the deleted p5.js polygon visualizer. Written so that algorithm code stays close to competitive programming C++ style. First version ships two algorithms: Simple Polygon (NWERC 2009 I) and Convex Hull (monotone chain).

## Constraints

- Vanilla JavaScript, Canvas 2D API, ES modules. No frameworks, no libraries, no build step.
- Lives in a `visualizer/` folder in this repo, served as static files by GitHub Pages at `/visualizer/`. No Jekyll front matter or Liquid in the app pages.
- Points come only from generators (no manual placement by clicking).
- Prose style: no em or en dashes; "École Polytechnique" spelled with accents where it appears.

## File layout

```
visualizer/
  index.html            landing page listing the algorithms
  simple-polygon.html   one page per algorithm
  convex-hull.html
  css/style.css         shared styling
  js/
    geom.js             pure helpers: cross, orientation, dist, comparators
    generators.js       point-set presets: uniform random, circle, grid, clusters
    player.js           animation engine + control bar wiring
    test.js             Node-runnable assertions, no DOM
    algos/
      simple-polygon.js
      convex-hull.js
```

## Core architecture: algorithms as generators

Each algorithm is a generator function `function* algo(points)` that yields frames at interesting moments. A frame is a plain object describing exactly what to draw:

```js
{
  points: [{x, y, role}],      // role drives color: "default" | "active" | "hull" | "base" | "done"
  segments: [{a, b, style}],   // style: "hull" | "candidate" | "rejected"
  caption: "Right turn: pop"
}
```

Frames are self-contained snapshots, not diffs. The player knows nothing about any algorithm; it pulls frames with `gen.next()` and draws them. Adding an algorithm later means one generator file plus one HTML page.

Algorithm code mirrors the C++ version as closely as JS allows: arrays for `vector`, `sort` with comparators from `geom.js`, integer-friendly cross products.

## Page anatomy

- Canvas centered, fixed internal resolution (square, about 800x800 logical pixels), scaled responsively to container width via CSS.
- Caption line under the canvas showing the current frame's description.
- Bottom control bar: Generate button, shape preset dropdown (uniform / circle / grid / clusters), point count input, Play/Pause, Step, speed slider.
- Generate resets the player and produces a fresh point set from the selected preset and count.
- Landing page `index.html` links to each algorithm page and back to the blog.

## Error handling

- Point count input clamped to a sane range (3 to 500).
- Degenerate inputs (collinear or coincident points from grid/circle presets) must not crash the algorithms; comparators and epsilon handling live in `geom.js` in one place.
- Player stops cleanly when the generator is exhausted; Step after the end is a no-op.

## Testing

`geom.js`, `generators.js`, and the algorithm generators are pure and DOM-free, so they run under Node. A small `visualizer/js/test.js` runs with `node` and asserts:

- convex hull of known point sets is correct (including collinear cases),
- simple polygon output visits all points and never self-intersects,
- generators produce the requested number of in-bounds points.

## Blog integration

A link from the Beautiful algorithms post to `/visualizer/` (plain link, no iframe). Done after the app works, not part of the app itself.

## Out of scope for v1

Closest pair, segment intersection sweep, manual point placement, mobile touch niceties, dark mode.
