import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { getState, loadSiteData, subscribe } from "../lib/boot";

const empty = { loaded: false, content: {}, menu: [], branches: [], gallery: [] };
const Ctx = createContext(empty);

/** State of the startup (waking / loading / ready / failed). Used by the loading screens. */
export const useBoot = () => useSyncExternalStore(subscribe, getState);

/** Loads everything the public website shows from the backend (/api/public/*) once, at start. */
export function SiteProvider({ children }) {
  const boot = useBoot();
  useEffect(() => {
    loadSiteData();
  }, []);

  const value = useMemo(() => (boot.phase === "ready" ? { loaded: true, ...boot.data } : empty), [boot]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSiteData = () => useContext(Ctx);

/** Content of one page ("home", "about", ...). Missing fields are simply undefined. */
export function usePage(key) {
  const { content } = useSiteData();
  return useMemo(() => content[key] || {}, [content, key]);
}

export function useSite() {
  const site = usePage("site");
  return {
    site,
    brand: site.brand_name || "",
    logo: site.logo,
  };
}
