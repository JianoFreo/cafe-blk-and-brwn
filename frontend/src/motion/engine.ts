/* ==========================================================================
   MOTION ENGINE (no libraries) — the same behaviour as the original motion.js and scenes.js,
   organised as a module for React.

   - Declarative attributes are picked up by a MutationObserver, so elements that React mounts
     later (new page, new menu tab) animate without any extra wiring:
       data-reveal, data-stagger, data-tilt, data-parallax, .cup-host, [data-split]
   - Scroll scenes register through useScene() (see hooks.ts).
   - Text splitting and marquees are real React components (React owns the DOM), so this file
     never rewrites text nodes.
   ========================================================================== */

type Frame = (dt: number, y: number) => void;

const root = document.documentElement;
export const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export const BB = {
  ready: false,
  vel: 0,
  y: 0,
  started: false,
};

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const frames = new Set<Frame>();
const resizers = new Set<() => void>();
let queue: Array<() => void> = [];

export function onFrame(fn: Frame) {
  frames.add(fn);
  return () => { frames.delete(fn); };
}
export function onResize(fn: () => void) {
  resizers.add(fn);
  return () => { resizers.delete(fn); };
}
export function whenReady(fn: () => void) {
  if (BB.ready) fn();
  else queue.push(fn);
}
export function setReady(value: boolean) {
  BB.ready = value;
  root.classList.toggle("is-ready", value);
  if (value) {
    const q = queue;
    queue = [];
    q.forEach((fn) => fn());
  }
}
export const fireResize = () => resizers.forEach((fn) => fn());

/* ------------------------------------------------------------------ scenes */
export interface Scene {
  el: HTMLElement;
  kind: "pin" | "view";
  range: [number, number];
  onProgress?: (p: number) => void;
  p: number;
  t: number;
  start: number;
  len: number;
  last: number;
}
const scenes = new Set<Scene>();

export function measureScene(s: Scene) {
  if (s.kind !== "pin") return;
  const r = s.el.getBoundingClientRect();
  s.start = r.top + window.scrollY;
  s.len = Math.max(1, s.el.offsetHeight - window.innerHeight);
  s.last = -1;
}

export function registerScene(el: HTMLElement, opts: { kind: "pin" | "view"; range?: [number, number]; onProgress?: (p: number) => void }) {
  const s: Scene = { el, kind: opts.kind, range: opts.range || [0, 1], onProgress: opts.onProgress, p: 0, t: 0, start: 0, len: 1, last: -1 };
  measureScene(s);
  scenes.add(s);
  return {
    scene: s,
    remeasure: () => measureScene(s),
    unregister: () => scenes.delete(s),
  };
}

/* --------------------------------------------------------- reveal on scroll */
const registered = new WeakSet<Element>();
const waiting = new Set<Element>();
const clipped = new Set<Element>();
let io: IntersectionObserver | null = null;

function show(el: Element) {
  el.classList.add("is-in");
  const v = el.getAttribute("data-reveal");
  if (v === "clip" || v === "wipe") {
    const done = (e: Event) => {
      if ((e as TransitionEvent).propertyName === "clip-path") {
        el.classList.add("is-done");
        el.removeEventListener("transitionend", done);
      }
    };
    el.addEventListener("transitionend", done);
    setTimeout(() => el.classList.add("is-done"), 3200);
  }
  if (el.classList.contains("cup-host")) el.classList.add("cup-play");
}

function registerStagger(parent: Element) {
  if (registered.has(parent)) return;
  registered.add(parent);
  const variant = parent.getAttribute("data-stagger") || "rise";
  const cols = +(parent.getAttribute("data-cols") || 6);
  const step = +(parent.getAttribute("data-step") || 90);
  Array.from(parent.children).forEach((c, i) => {
    if (!c.hasAttribute("data-reveal")) c.setAttribute("data-reveal", variant);
    (c as HTMLElement).style.setProperty("--d", String((i % cols) * step));
  });
}

function registerReveal(el: Element) {
  if (registered.has(el)) return;
  registered.add(el);
  const v = el.getAttribute("data-reveal");
  if (v === "clip" || v === "wipe") clipped.add(el);
  else {
    io?.observe(el);
    waiting.add(el);
  }
}

const REVEAL_SELECTOR = "[data-reveal], [data-split], .cup-host";

function scan(node: Node) {
  if (node.nodeType !== 1) return;
  const el = node as Element;
  if (el.hasAttribute("data-stagger")) registerStagger(el);
  el.querySelectorAll("[data-stagger]").forEach(registerStagger);
  if (el.matches(REVEAL_SELECTOR)) registerReveal(el);
  el.querySelectorAll(REVEAL_SELECTOR).forEach(registerReveal);
}

/* ------------------------------------------------------------- tilt / magnet */
interface Tilt { el: HTMLElement; rx: number; ry: number; trx: number; tryy: number; h: number; th: number }
interface Mag { el: HTMLElement; x: number; y: number; tx: number; ty: number }
const tilts = new Map<HTMLElement, Tilt>();
const mags = new Map<HTMLElement, Mag>();
let currentTilt: HTMLElement | null = null;
let currentMag: HTMLElement | null = null;
let mx = 0, my = 0, cx = 0, cy = 0;

function tiltFor(el: HTMLElement) {
  let t = tilts.get(el);
  if (!t) { t = { el, rx: 0, ry: 0, trx: 0, tryy: 0, h: 0, th: 0 }; tilts.set(el, t); }
  return t;
}
function magFor(el: HTMLElement) {
  let m = mags.get(el);
  if (!m) { m = { el, x: 0, y: 0, tx: 0, ty: 0 }; mags.set(el, m); }
  return m;
}

function onPointerMove(e: PointerEvent) {
  mx = e.clientX / window.innerWidth - 0.5;
  my = e.clientY / window.innerHeight - 0.5;
  if (e.pointerType && e.pointerType !== "mouse") return;
  const target = e.target as Element | null;

  const tEl = (target?.closest?.("[data-tilt]") as HTMLElement | null) || null;
  if (currentTilt && currentTilt !== tEl) { const t = tiltFor(currentTilt); t.trx = 0; t.tryy = 0; t.th = 0; }
  currentTilt = tEl;
  if (tEl) {
    const r = tEl.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    const amp = r.width > 520 ? 0.4 : 1;
    const t = tiltFor(tEl);
    t.tryy = (px - 0.5) * 12 * amp;
    t.trx = -(py - 0.5) * 10 * amp;
    t.th = 1;
    tEl.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
    tEl.style.setProperty("--my", (py * 100).toFixed(1) + "%");
  }

  const mEl = (target?.closest?.(".btn--lg, .btn--primary, [data-magnet]") as HTMLElement | null) || null;
  if (currentMag && currentMag !== mEl) { const m = magFor(currentMag); m.tx = 0; m.ty = 0; }
  currentMag = mEl;
  if (mEl) {
    const r = mEl.getBoundingClientRect();
    const m = magFor(mEl);
    m.tx = (e.clientX - (r.left + r.width / 2)) * 0.28;
    m.ty = (e.clientY - (r.top + r.height / 2)) * 0.4;
  }
}
function onPointerLeave() {
  if (currentTilt) { const t = tiltFor(currentTilt); t.trx = 0; t.tryy = 0; t.th = 0; currentTilt = null; }
  if (currentMag) { const m = magFor(currentMag); m.tx = 0; m.ty = 0; currentMag = null; }
}

/* ------------------------------------------------------------- the engine */
export function startEngine() {
  if (BB.started) return;
  BB.started = true;

  if (reduceMotion) {
    root.classList.add("no-motion", "is-ready");
    root.classList.remove("is-loading");
    BB.ready = true;
    return;
  }

  io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io!.unobserve(en.target);
        waiting.delete(en.target);
        whenReady(() => show(en.target));
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );

  // React mounts and unmounts elements all the time; watch for them.
  const mo = new MutationObserver((records) => {
    records.forEach((r) => r.addedNodes.forEach(scan));
  });
  mo.observe(document.body, { childList: true, subtree: true });
  scan(document.body);

  /* frame loop */
  let last = performance.now();
  let prevY = window.scrollY;
  let tick = 0;
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000) || 0.016;
    last = now;
    const y = window.scrollY;
    BB.vel += (((y - prevY) / dt) - BB.vel) * 0.15;
    prevY = y;
    BB.y = y;

    frames.forEach((fn) => fn(dt, y));
    tick++;

    // clip/wipe elements are fully clipped before they show (invisible to IntersectionObserver): check by position
    if (BB.ready && clipped.size) {
      const vh = window.innerHeight;
      clipped.forEach((el) => {
        if (!el.isConnected) { clipped.delete(el); return; }
        const r = el.getBoundingClientRect();
        if (r.height && r.top < vh * 0.92) { clipped.delete(el); show(el); }
      });
    }
    // anything scrolled straight past (End key, reload mid-page) shows itself
    if (BB.ready && tick % 20 === 0) {
      waiting.forEach((el) => {
        if (!el.isConnected) { waiting.delete(el); return; }
        if (el.classList.contains("is-in")) { waiting.delete(el); return; }
        if (el.getBoundingClientRect().bottom < -40) { io!.unobserve(el); waiting.delete(el); show(el); }
      });
    }

    /* scenes: smoothed scroll progress written to --p */
    const vh = window.innerHeight;
    const k = 1 - Math.exp(-dt * 9);
    scenes.forEach((s) => {
      if (!s.el.isConnected) return;
      let raw: number;
      if (s.kind === "pin") raw = (y - s.start) / s.len;
      else {
        const r = s.el.getBoundingClientRect();
        raw = (vh - r.top) / (vh + r.height);
      }
      raw = clamp(raw, 0, 1);
      s.t = clamp((raw - s.range[0]) / (s.range[1] - s.range[0]), 0, 1);
      if (s.p !== s.t) {
        s.p += (s.t - s.p) * k;
        if (Math.abs(s.t - s.p) < 0.0005) s.p = s.t;
      }
      if (s.p !== s.last) {
        s.last = s.p;
        s.el.style.setProperty("--p", s.p.toFixed(4));
        s.onProgress?.(s.p);
      }
    });

    /* tilt + spotlight, magnetic buttons */
    const tk = 1 - Math.exp(-dt * 12);
    tilts.forEach((t, el) => {
      if (!el.isConnected) { tilts.delete(el); return; }
      t.rx += (t.trx - t.rx) * tk; t.ry += (t.tryy - t.ry) * tk; t.h += (t.th - t.h) * tk;
      el.style.setProperty("--rx", t.rx.toFixed(2) + "deg");
      el.style.setProperty("--ry", t.ry.toFixed(2) + "deg");
      el.style.setProperty("--hover", t.h.toFixed(3));
      if (!t.th && Math.abs(t.rx) < 0.01 && Math.abs(t.ry) < 0.01 && t.h < 0.01) {
        el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); el.style.setProperty("--hover", "0");
        tilts.delete(el);
      }
    });
    const mk = 1 - Math.exp(-dt * 10);
    mags.forEach((m, el) => {
      if (!el.isConnected) { mags.delete(el); return; }
      m.x += (m.tx - m.x) * mk; m.y += (m.ty - m.y) * mk;
      el.style.translate = m.x.toFixed(2) + "px " + m.y.toFixed(2) + "px";
      if (!m.tx && !m.ty && Math.abs(m.x) < 0.05 && Math.abs(m.y) < 0.05) { el.style.translate = ""; mags.delete(el); }
    });

    /* parallax frames + bean depth */
    document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const img = el.querySelector("img");
      if (!img) return;
      const f = +(el.getAttribute("data-parallax") || 0.1);
      const max = r.height * 0.08;
      img.style.translate = "0 " + clamp((r.top + r.height / 2 - vh / 2) * -f, -max, max).toFixed(1) + "px";
    });
    if (finePointer) {
      const bk = 1 - Math.exp(-dt * 4);
      cx += (mx - cx) * bk; cy += (my - cy) * bk;
      document.querySelectorAll<HTMLElement>(".bean[data-depth]").forEach((b) => {
        const d = +(b.getAttribute("data-depth") || 0);
        b.style.translate = (cx * d * -70).toFixed(1) + "px " + (cy * d * -70).toFixed(1) + "px";
      });
    }

    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  /* resize + layout changes */
  let rt: number;
  const debounced = () => { clearTimeout(rt); rt = window.setTimeout(() => { scenes.forEach(measureScene); fireResize(); }, 130); };
  window.addEventListener("resize", debounced);
  window.addEventListener("load", debounced);
  if (window.ResizeObserver) new ResizeObserver(debounced).observe(document.body);

  if (finePointer) {
    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
  }

  root.classList.add("motion-ready");
}

/** Plays the entrance of a list of elements again (used when a filter changes). */
export function replay(els: Element[], step = 70) {
  els.forEach((e) => e.classList.remove("is-in", "is-done"));
  void document.body.offsetWidth;
  els.forEach((e, i) => (e as HTMLElement).style.setProperty("--d", String((i % 8) * step)));
  requestAnimationFrame(() => requestAnimationFrame(() => els.forEach((e) => e.classList.add("is-in"))));
}
