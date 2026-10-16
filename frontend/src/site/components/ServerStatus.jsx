import { useEffect, useState } from "react";
import { retry } from "../../lib/boot";
import { useBoot } from "../SiteContext";

/**
 * Plain loading screen for visitors who do not get the animated intro
 * (a page other than the home page, a returning visitor, or "reduce motion").
 * It appears only if the backend is slow, so a warm server never shows it.
 */
export function ServerStatus() {
  const { phase, startedAt } = useBoot();
  const [late, setLate] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const show = setTimeout(() => setLate(true), 700);
    const tick = setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    return () => {
      clearTimeout(show);
      clearInterval(tick);
    };
  }, [startedAt]);

  if (!late && phase !== "failed") return null;
  const failed = phase === "failed";
  return (
    <div className="server-status" role="status" aria-live="polite">
      {!failed && <i className="server-status__spin" aria-hidden="true" />}
      <p className="server-status__title">{failed ? "We couldn’t reach the server." : elapsed < 25000 ? "Waking up the server…" : "Still waking up…"}</p>
      <p className="server-status__text">
        {failed
          ? "Please check your connection and try again."
          : "It naps when nobody is around, so the first visit can take up to a minute. Thank you for waiting."}
      </p>
      {failed && (
        <button type="button" className="btn btn--primary btn--sm" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
