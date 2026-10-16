import { useEffect, useRef, useState } from "react";
import { bootProgress, retry } from "../../lib/boot";
import { useBoot } from "../SiteContext";

/**
 * Plain loading screen for visitors who do not get the animated intro
 * (a page other than the home page, a returning visitor, or "reduce motion").
 * It shows the same real percentage and appears only if the server is slow, so a fast start never shows it.
 */
export function ServerStatus() {
  const boot = useBoot();
  const bootRef = useRef(boot);
  bootRef.current = boot;
  const [late, setLate] = useState(false);
  const counter = useRef(null);

  useEffect(() => {
    const show = setTimeout(() => setLate(true), 700);
    return () => clearTimeout(show);
  }, []);

  useEffect(() => {
    let raf = 0,
      last = performance.now(),
      shown = 0;
    const step = (now) => {
      const dt = Math.min(64, now - last) / 16.67;
      last = now;
      const { real, ceil } = bootProgress(bootRef.current, true);
      if (shown < real) shown += (real - shown) * Math.min(1, 0.12 * dt);
      else shown += (Math.min(ceil, 0.99) - shown) * Math.min(1, 0.004 * dt);
      if (counter.current) counter.current.textContent = String(Math.round(Math.min(1, shown) * 100));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const failed = boot.phase === "failed";
  if (!late && !failed) return null;
  return (
    <div className="server-status" role="status" aria-live="polite">
      {failed ? (
        <>
          <p className="server-status__title">Server error</p>
          <button type="button" className="btn btn--primary btn--sm" onClick={retry}>
            Try again
          </button>
        </>
      ) : (
        <p className="server-status__count" aria-label="Loading">
          <span ref={counter}>0</span>
        </p>
      )}
    </div>
  );
}