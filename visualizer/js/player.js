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
