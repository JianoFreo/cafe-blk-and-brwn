import { useEffect, useRef } from "react";
import { onFrame, reduceMotion, registerScene } from "./engine";

/** Registers an element as a scroll scene: the engine writes a smoothed --p (0..1) onto it. */
export function useScene<T extends HTMLElement>(
  opts: { kind: "pin" | "view"; range?: [number, number]; onProgress?: (p: number) => void },
  deps: unknown[] = []
) {
  const ref = useRef<T>(null);
  const handle = useRef<ReturnType<typeof registerScene> | null>(null);
  const cb = useRef(opts.onProgress);
  cb.current = opts.onProgress;

  useEffect(() => {
    if (!ref.current || reduceMotion) return;
    const h = registerScene(ref.current, { kind: opts.kind, range: opts.range, onProgress: (p) => cb.current?.(p) });
    handle.current = h;
    return () => {
      h.unregister();
      handle.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ref, remeasure: () => handle.current?.remeasure(), getScene: () => handle.current?.scene };
}

/** Runs a function every animation frame while mounted. */
export function useFrame(fn: (dt: number, y: number) => void, deps: unknown[] = []) {
  const saved = useRef(fn);
  saved.current = fn;
  useEffect(() => {
    if (reduceMotion) return;
    return onFrame((dt, y) => saved.current(dt, y));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
