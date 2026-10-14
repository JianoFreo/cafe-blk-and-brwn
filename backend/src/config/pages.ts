/** Pages whose text and images the admin can edit. "site" holds the shared brand, contact and footer details. */
export const PAGE_KEYS = ["site", "home", "about", "menu", "branches", "gallery", "contact", "reserve", "track", "privacy"] as const;
export type PageKey = (typeof PAGE_KEYS)[number];
export const isPageKey = (key: string): key is PageKey => (PAGE_KEYS as readonly string[]).includes(key);

export const GALLERY_CATEGORIES = ["moments", "branches", "drinks", "food"] as const;
export const RESERVATION_STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;
