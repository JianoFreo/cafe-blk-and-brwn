import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/axios";
import type { AllContent, Branch, Content, GalleryItem, Img, MenuCategory } from "../lib/types";

interface SiteData {
  loaded: boolean;
  content: AllContent;
  menu: MenuCategory[];
  branches: Branch[];
  gallery: GalleryItem[];
}

const empty: SiteData = { loaded: false, content: {}, menu: [], branches: [], gallery: [] };
const Ctx = createContext<SiteData>(empty);

/** Loads everything the public website shows from the backend (/api/public/*) once, at start. */
export function SiteProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SiteData>(empty);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([api.get("/public/content"), api.get("/public/menu"), api.get("/public/branches"), api.get("/public/gallery")]).then(
      ([content, menu, branches, gallery]) => {
        if (!alive) return;
        // if the server is unreachable the site simply shows as empty
        setData({
          loaded: true,
          content: content.status === "fulfilled" ? content.value.data.content : {},
          menu: menu.status === "fulfilled" ? menu.value.data.categories : [],
          branches: branches.status === "fulfilled" ? branches.value.data.branches : [],
          gallery: gallery.status === "fulfilled" ? gallery.value.data.items : [],
        });
      }
    );
    return () => {
      alive = false;
    };
  }, []);

  return <Ctx.Provider value={data}>{children}</Ctx.Provider>;
}

export const useSiteData = () => useContext(Ctx);

/** Content of one page ("home", "about", ...). Missing fields are simply undefined. */
export function usePage(key: string): Content {
  const { content } = useSiteData();
  return useMemo(() => content[key] || {}, [content, key]);
}

export function useSite() {
  const site = usePage("site");
  return {
    site,
    brand: (site.brand_name as string) || "",
    logo: site.logo as Img | undefined,
  };
}
