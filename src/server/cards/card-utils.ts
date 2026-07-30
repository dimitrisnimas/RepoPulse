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
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "avatars.githubusercontent.com" || url.hostname.endsWith(".githubusercontent.com")) ? url.toString() : null;
  } catch {
    return null;
  }
}
