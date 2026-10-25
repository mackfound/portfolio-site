// Passagework's working figure (projectplan.md §3): loop a passage of a real
// recording. At 100% the loop is an AudioBufferSourceNode loop (sample-accurate,
// no click); below 100% it's <audio> with preservesPitch, wrapped at the loop end
// each frame. Audio loads on the first Play. Without JS the figure stays a static
// waveform.
const fig = document.querySelector(".fig");
const PEAKS = fig.dataset.peaks.split(",").map(Number), N = PEAKS.length, DUR = Number(fig.dataset.duration);
const CLIP = new Audio().canPlayType('audio/mp4; codecs="mp4a.40.2"') ? fig.dataset.mp4 : fig.dataset.ogg;
const root = document.documentElement;
const css = (n) => getComputedStyle(root).getPropertyValue(n).trim();

const cv = document.createElement("canvas");
cv.tabIndex = 0;
cv.setAttribute("role", "slider");
cv.setAttribute("aria-label", "Loop region, seconds");
cv.setAttribute("aria-valuemin", "0");
cv.setAttribute("aria-valuemax", String(DUR));
fig.querySelector(".fig__stage").replaceChildren(cv);
const bar = fig.querySelector(".fig__bar");
bar.hidden = false;
const ctx = cv.getContext("2d");
const playBtn = fig.querySelector(".fig__play"), tempo = fig.querySelector(".fig__tempo");

const loop = { a: 4, b: 8 };
let edge = "b", head = 3.5, playing = false;
let ac, buf, el, src, last = 0, loading = null;

function size() {
  const r = cv.getBoundingClientRect(), d = devicePixelRatio || 1;
  cv.width = r.width * d; cv.height = r.height * d; ctx.setTransform(d, 0, 0, d, 0, 0); draw();
}
function draw() {
  const w = cv.clientWidth, h = cv.clientHeight, X = (t) => t / DUR * w;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = css("--tint"); ctx.fillRect(X(loop.a), 0, X(loop.b) - X(loop.a), h);
  ctx.font = "10px " + css("--sans"); ctx.fillStyle = css("--ink-muted");
  for (let s = 5; s < DUR; s += 5) ctx.fillText(`${s}s`, X(s) + 3, 12);
  const step = w / N;
  for (let i = 0; i < N; i++) {
    const t = i / N * DUR, v = Math.max(0.5, PEAKS[i] * (h / 2 - 14));
    ctx.fillStyle = t >= loop.a && t <= loop.b ? css("--accent") : css("--ink-muted");
    ctx.fillRect(i * step, h / 2 + 5 - v, Math.max(1, step - 0.4), v * 2);
  }
  ctx.fillStyle = css("--accent");
  for (const [k, t] of [["a", loop.a], ["b", loop.b]]) {
    ctx.fillRect(X(t) - (k === edge ? 1.5 : 1), 0, k === edge ? 3 : 2, h);
    ctx.fillRect(X(t) - 5, h - 8, 10, 8);
  }
  ctx.fillStyle = css("--ink"); ctx.fillRect(X(head) - 0.5, 0, 1.5, h);
  const f = (t) => t.toFixed(2);
  fig.querySelector(".fig__read").textContent = `loop ${f(loop.a)}–${f(loop.b)} s`;
  cv.setAttribute("aria-valuenow", f(loop[edge]));
  cv.setAttribute("aria-valuetext", `Loop from ${f(loop.a)} to ${f(loop.b)} seconds`);
}

function load() {
  return loading ??= (async () => {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    buf = await ac.decodeAudioData(await (await fetch(CLIP)).arrayBuffer());
    el = new Audio(CLIP); el.preservesPitch = true; el.preload = "auto";
  })();
}
const rate = () => tempo.value / 100;
function start() {
  if (head < loop.a - 0.5 || head >= loop.b) head = Math.max(0, loop.a - 0.5); // short pre-roll
  if (rate() === 1) {
    src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
    src.loopStart = loop.a; src.loopEnd = loop.b; src.connect(ac.destination); src.start(0, head);
    last = ac.currentTime;
  } else {
    el.playbackRate = rate(); el.currentTime = head; el.play().catch(() => {});
  }
  requestAnimationFrame(tick);
}
function stop() { if (src) { src.stop(); src.disconnect(); src = null; } if (el) el.pause(); }
function tick() {
  if (!playing) return;
  if (src) {
    const now = ac.currentTime; head += now - last; last = now;
    if (head >= loop.b) head = loop.a + (head - loop.b) % (loop.b - loop.a);
  } else {
    if (el.currentTime >= loop.b) el.currentTime = loop.a;
    head = el.currentTime;
  }
  draw(); requestAnimationFrame(tick);
}
async function toggle() {
  if (playing) { playing = false; stop(); playBtn.textContent = "Play"; draw(); return; }
  playBtn.textContent = "Loading…"; playBtn.disabled = true;
  try { await load(); await ac.resume(); } catch { playBtn.textContent = "Can’t play"; return; }
  playBtn.disabled = false; playBtn.textContent = "Pause"; playing = true; start();
}
const restart = () => { if (playing) { stop(); start(); } };
const edges = () => { if (src) { src.loopStart = loop.a; src.loopEnd = loop.b; } };
const clamp = () => {
  loop.a = Math.max(0, Math.min(loop.a, loop.b - 0.2));
  loop.b = Math.min(DUR, Math.max(loop.b, loop.a + 0.2));
  edges();
};

playBtn.addEventListener("click", toggle);
tempo.addEventListener("input", () => { fig.querySelector(".fig__tv").textContent = tempo.value + "%"; restart(); });
let drag = null;
const tAt = (e) => { const r = cv.getBoundingClientRect(); return Math.max(0, Math.min(DUR, (e.clientX - r.left) / r.width * DUR)); };
cv.addEventListener("pointerdown", (e) => {
  const t = tAt(e);
  drag = Math.abs(t - loop.a) < Math.abs(t - loop.b) ? "a" : "b";
  edge = drag; loop[drag] = t; clamp(); draw(); cv.setPointerCapture(e.pointerId);
});
cv.addEventListener("pointermove", (e) => { if (!drag) return; loop[drag] = tAt(e); clamp(); draw(); });
cv.addEventListener("pointerup", () => { drag = null; if (head < loop.a || head >= loop.b) restart(); });
cv.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (k === " ") { e.preventDefault(); toggle(); }
  else if (k === "i") { loop.a = head; edge = "a"; clamp(); draw(); }
  else if (k === "o") { loop.b = head; edge = "b"; clamp(); draw(); }
  else if (k === "arrowleft" || k === "arrowright") {
    e.preventDefault(); loop[edge] += k === "arrowright" ? 0.01 : -0.01; clamp(); draw();
  }
});
new ResizeObserver(size).observe(cv);
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", draw);
