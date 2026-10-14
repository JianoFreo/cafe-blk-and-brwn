import type { Branch, Img } from "./types";

/** Cloudinary images get automatic format + quality + a sensible width. Other URLs are left alone. */
export function cdn(url: string | null | undefined, width?: number): string {
  if (!url) return "";
  if (!url.includes("/upload/")) return url;
  const t = ["f_auto", "q_auto", width ? `w_${width}` : ""].filter(Boolean).join(",");
  return url.replace("/upload/", `/upload/${t}/`);
}

export const imgUrl = (img: Img | undefined | null, width?: number) => (img?.url ? cdn(img.url, width) : "");

/** Only http(s) links are ever rendered as hrefs. */
export function safeHref(url?: string | null): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
}

export const telHref = (phone?: string) => (phone ? "tel:" + phone.replace(/[^\d+]/g, "") : undefined);

export function directionsUrl(b: Branch, brand = ""): string {
  if (b.directions_url) return b.directions_url;
  if (b.latitude != null && b.longitude != null) return `https://www.google.com/maps/search/?api=1&query=${b.latitude},${b.longitude}`;
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent([brand, b.short_name || b.name, b.area].filter(Boolean).join(" "));
}

export const peso = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
