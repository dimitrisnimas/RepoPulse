export function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character] ?? character);
}

export function truncateText(value: string, maximum: number): string {
  if (value.length <= maximum) return value;
  return `${value.slice(0, Math.max(0, maximum - 1)).trimEnd()}…`;
}

export function formatNumber(value: number, locale = "en"): string {
  return new Intl.NumberFormat(locale, { notation: value >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

export function safeAvatarUrl(value: string): string | null {
  if (value.length <= 410_000 && /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "avatars.githubusercontent.com" || url.hostname.endsWith(".githubusercontent.com")) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function safeColor(value: string | null | undefined, fallback = "#8b5cf6"): string {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : fallback;
}
