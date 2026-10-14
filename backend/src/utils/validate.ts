/* Small hand-written validators (no schema library, same spirit as TechCare). */

export function str(value: unknown, max = 500): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export function optStr(value: unknown, max = 500): string | null {
  const s = str(value, max);
  return s === "" ? null : s;
}

export function bool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1 || value === "1") return true;
  if (value === "false" || value === 0 || value === "0") return false;
  return fallback;
}

export function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Only http(s) links are allowed, so a "javascript:" URL can never be saved. */
export function safeUrl(value: unknown): string | null {
  const s = str(value, 600);
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:" ? s : null;
  } catch {
    return null;
  }
}

/** Branch hours: [{ label, value }] */
export function hoursList(value: unknown): { label: string; value: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((r) => ({ label: str((r as any)?.label, 80), value: str((r as any)?.value, 160) }))
    .filter((r) => r.label || r.value)
    .slice(0, 12);
}
