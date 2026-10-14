import { useEffect } from "react";
import { imgUrl } from "../../lib/format";
import { useSite } from "../SiteContext";

/** Sets the browser tab title, description and icon from what the admin entered. */
export function usePageMeta(pageTitle?: string) {
  const { site, brand, logo } = useSite();
  const description = site.meta_description as string | undefined;
  const icon = imgUrl(logo, 96);

  useEffect(() => {
    document.title = [pageTitle, brand].filter(Boolean).join(" | ") || brand || "";
  }, [pageTitle, brand]);

  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
    meta.content = description || "";
  }, [description]);

  useEffect(() => {
    if (!icon) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
    link.href = icon;
  }, [icon]);
}
