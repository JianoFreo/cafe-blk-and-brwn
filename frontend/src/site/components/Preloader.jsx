import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { bootProgress, retry } from "../../lib/boot";
import { setReady } from "../../motion/engine";
import { useBoot } from "../SiteContext";
import { Cup } from "./Cup";

const MIN_MS = 1800; // even on a warm server the intro shows long enough to be seen

/** Words under the counter while the backend wakes up (nothing is shown on a fast, warm start). */
function message(phase, elapsed) {
  if (phase === "failed") return "We couldn’t reach the server. Please check your connection and try again.";
  if (phase !== "waking") return "";
  if (elapsed < 3500) return "";
  if (elapsed < 25000) return "Waking up the server… it naps when nobody is around, so the first visit can take up to a minute.";
  return "Still waking up… almost there. Thank you for waiting.";
}

/**
 * Intro screen: a cup draws and fills while the site loads.
 * The counter and the cup follow the real startup (see lib/boot.js):
 *   server awake  →  content downloaded  →  fonts + hero photo ready  →  100%
 * While the server is still waking up the counter creeps slowly but never passes the step it is waiting for.
 */
export function Preloader({ assetsReady, brand, heroSrc, onDone }) {
  const box = useRef(null);
  const counter = useRef(null);
  const [done, setDone] = useState(false);
  const [text, setText] = useState("");
  const boot = useBoot();
  const bootRef = useRef(boot);
  bootRef.current = boot;
  const readyRef = useRef(false);
  const assets = useRef(false);

  useLayoutEffect(() => {
    document.documentElement.classList.add("is-loading");
  }, []);

  // once the content is here: wait for the fonts and the hero photo too
  useEffect(() => {
    if (!assetsReady) return;
    const img = heroSrc
      ? new Promise((r) => {
          const i = new Image();
          i.onload = i.onerror = () => r();
          i.src = heroSrc;
          setTimeout(r, 3500);
        })
      : Promise.resolve();
    Promise.all([document.fonts ? document.fonts.ready : Promise.resolve(), img]).then(() => {
      assets.current = true;
    });
  }, [assetsReady, heroSrc]);

  useEffect(() => {
    const t0 = performance.now();
    let raf = 0,
      last = t0,
      shown = 0,
      shownText = "";
    const step = (now) => {
      const dt = Math.min(64, now - last) / 16.67; // frames since the last tick
      last = now;
      const b = bootRef.current;
      const { real, ceil } = bootProgress(b, assets.current);

      if (shown < real) shown += (real - shown) * Math.min(1, 0.12 * dt); // catch up quickly when a step really finishes
      else shown += (Math.min(ceil, 0.99) - shown) * Math.min(1, 0.004 * dt); // otherwise creep slowly towards the ceiling

      const e = Math.min(1, shown);
      if (counter.current) counter.current.textContent = String(Math.round(e * 100));
      box.current?.style.setProperty("--pl", e.toFixed(3));

      const t = message(b.phase, Date.now() - b.startedAt);
      if (t !== shownText) {
        shownText = t;
        setText(t);
      }

      if (b.phase === "ready" && assets.current && now - t0 >= MIN_MS && shown > 0.985) {
        finish();
        return;
      }
      raf = requestAnimationFrame(step);
    };
    const finish = () => {
      if (readyRef.current) return;
      readyRef.current = true;
      if (counter.current) counter.current.textContent = "100";
      box.current?.style.setProperty("--pl", "1");
      box.current?.classList.add("is-done");
      setText("");
      setTimeout(() => setReady(true), 520);
      setTimeout(() => {
        document.documentElement.classList.remove("is-loading");
        try {
          sessionStorage.setItem("bb-pre", "1");
        } catch {
          /* private mode */
        }
        setDone(true);
        onDone();
      }, 1300);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done) return null;
  const letters = brand.replace(/\s+/g, "").toUpperCase().split("");
  return (
    <div className="preloader" ref={box}>
      <div className="preloader__panel preloader__panel--top" aria-hidden="true" />
      <div className="preloader__panel preloader__panel--bot" aria-hidden="true" />
      <div className="preloader__inner">
        <div aria-hidden="true">
          <Cup k="p" />
        </div>
        <p className="preloader__word" aria-hidden="true">
          {assetsReady &&
            letters.map((c, i) => (
              <span key={i} style={{ "--i": i }}>
                {c}
              </span>
            ))}
        </p>
        <div className="preloader__count" ref={counter} aria-hidden="true">
          0
        </div>
        <div className="preloader__bar" aria-hidden="true">
          <i />
        </div>
        <p className={`preloader__msg${text ? " is-on" : ""}`} role="status" aria-live="polite">
          {text}
        </p>
        {boot.phase === "failed" && (
          <button type="button" className="btn btn--primary btn--sm" onClick={retry}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
