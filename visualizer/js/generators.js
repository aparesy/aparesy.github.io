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
