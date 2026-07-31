import { OVERVIEW_CARD_VERSION } from "@/config/cards";
import type { OverviewCardOptions } from "@/server/cards/overview/overview.types";
export function overviewCacheKey(options: OverviewCardOptions): string {
  return ["repopulse", OVERVIEW_CARD_VERSION, options.username.toLowerCase(), options.theme, options.width, Number(options.showAvatar), Number(options.showIcons), Number(options.hideBorder), [...options.hidden].sort().join(","), options.locale].join(":");
}
export function cardCacheKey(card: string, version: string, values: Record<string, string | number | boolean | string[]>): string {
  const normalized = Object.entries(values).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${Array.isArray(value) ? [...value].map(String).sort().join(",").toLowerCase() : String(value).toLowerCase()}`);
  return ["repopulse", card, version, ...normalized].join(":");
}
