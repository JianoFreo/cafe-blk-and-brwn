export interface Img {
  url: string;
  public_id: string;
}

/** Free-form JSON the admin edits for each page (see admin/contentSchema.ts for the fields). */
export type Content = Record<string, any>;
export type AllContent = Record<string, Content>;

export interface MenuItem {
  item_id: string;
  category_id: string;
  name: string;
  price: number;
  note: string | null;
  badge: string | null;
  image_url: string | null;
  featured: boolean;
  feature_order: number;
}
export interface MenuCategory {
  category_id: string;
  slug: string;
  label: string;
  items: MenuItem[];
}
export interface HoursRow {
  label: string;
  value: string;
}
export interface Branch {
  branch_id: string;
  name: string;
  short_name: string | null;
  area: string | null;
  region: string | null;
  description: string | null;
  badge: string | null;
  glance: string | null;
  image_url: string | null;
  hours: HoursRow[];
  note: string | null;
  facebook_url: string | null;
  directions_url: string | null;
  latitude: number | null;
  longitude: number | null;
}
export interface GalleryItem {
  item_id: string;
  category: string;
  caption: string | null;
  alt: string | null;
  image_url: string;
  featured: boolean;
}
