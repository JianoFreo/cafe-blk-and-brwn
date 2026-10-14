import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { setReady } from "../../motion/engine";
import { Cup } from "./Cup";

/** First visit of the session, on the home page: a cup draws and fills while the site loads. */
export function Preloader({ assetsReady, brand, heroSrc, onDone }: { assetsReady: boolean; brand: string; heroSrc: string; onDone: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const readyRef = useRef(false);
  const assets = useRef(false);

  useLayoutEffect(() => {
    document.documentElement.classList.add("is-loading");
  }, []);

  // wait for the data, the fonts and the hero photo
  useEffect(() => {
    if (!assetsReady) return;
    const img = heroSrc ? new Promise<void>((r) => { const i = new Image(); i.onload = i.onerror = () => r(); i.src = heroSrc; setTimeout(r, 3500); }) : Promise.resolve();
    Promise.all([document.fonts ? document.fonts.ready : Promise.resolve(), img]).then(() => { assets.current = true; });
  }, [assetsReady, heroSrc]);

  useEffect(() => {
    const t0 = performance.now(), MIN = 2400;
    let raf = 0;
    const step = (now: number) => {
      const base = Math.min(1, (now - t0) / MIN);
      const shown = assets.current ? base : Math.min(base, 0.92);
      const e = 1 - Math.pow(1 - shown, 3);
      if (counter.current) counter.current.textContent = String(Math.round(e * 100));
      box.current?.style.setProperty("--pl", e.toFixed(3));
      if (shown >= 1 && assets.current) { finish(); return; }
      raf = requestAnimationFrame(step);
    };
    const finish = () => {
      if (readyRef.current) return;
      readyRef.current = true;
      if (counter.current) counter.current.textContent = "100";
      box.current?.style.setProperty("--pl", "1");
      box.current?.classList.add("is-done");
      setTimeout(() => setReady(true), 520);
      setTimeout(() => {
        document.documentElement.classList.remove("is-loading");
        try { sessionStorage.setItem("bb-pre", "1"); } catch { /* private mode */ }
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
    <div className="preloader" ref={box} aria-hidden="true">
      <div className="preloader__panel preloader__panel--top" />
      <div className="preloader__panel preloader__panel--bot" />
      <div className="preloader__inner">
        <Cup k="p" />
        <p className="preloader__word">
          {assetsReady && letters.map((c, i) => <span key={i} style={{ "--i": i } as React.CSSProperties}>{c}</span>)}
        </p>
        <div className="preloader__count" ref={counter}>0</div>
        <div className="preloader__bar"><i /></div>
      </div>
    </div>
  );
}
