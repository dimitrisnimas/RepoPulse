import { resolveTheme, type CardTheme } from "@/config/themes";
import type { OverviewCardData } from "@/server/cards/card-model";
import { svgDocument } from "@/server/cards/card-renderer";
import { escapeXml, formatNumber, safeAvatarUrl, safeColor, truncateText } from "@/server/cards/card-utils";
import type { OverviewCardOptions } from "./overview.types";

const icons: Record<string, string> = {
  contributions: "M2 8h3l2-5 3 10 2-5h4", repositories: "M3 2h9a2 2 0 012 2v10H5a2 2 0 01-2-2V2zm3 3h5M6 8h5",
  stars: "M8 1.8l1.8 3.7 4.1.6-3 2.9.7 4.1L8 11.2 4.4 13l.7-4.1-3-2.9 4.1-.6L8 1.8z",
  forks: "M5 3a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM3 5v2a3 3 0 003 3h4a3 3 0 003-3V5M10 13a2 2 0 11-4 0 2 2 0 014 0z",
  pull_requests: "M4 2v12M12 2v4a2 2 0 01-2 2H7m3-3l3 3-3 3", commits: "M1 8h4m6 0h4M8 5a3 3 0 100 6 3 3 0 000-6z", followers: "M8 8a3 3 0 100-6 3 3 0 000 6zm-6 7a6 6 0 0112 0",
};
function icon(name: string, x: number, y: number, color: string) { return `<svg x="${x}" y="${y}" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${icons[name]}"/></svg>`; }

export function renderOverviewCard(data: OverviewCardData, options: OverviewCardOptions): string {
  const { theme } = resolveTheme(options.theme);
  const width = options.width;
  const compact = width < 430;
  const avatar = options.showAvatar ? safeAvatarUrl(data.avatarUrl) : null;
  const headerX = avatar ? 78 : 24;
  const metrics = [
    ["contributions", "Contributions", data.totalContributions], ["repositories", "Repositories", data.publicRepositories],
    ["stars", "Stars", data.totalStars], ["forks", "Forks", data.totalForks],
    ["pull_requests", "Pull requests", data.pullRequests], ["commits", "Commits", data.commits],
    ["followers", "Followers", data.followers],
  ].filter(([key]) => !options.hidden.includes(key as OverviewCardOptions["hidden"][number]));
  const columns = compact ? 2 : 3;
  const metricRows = Math.ceil(metrics.length / columns);
  const showLanguages = !options.hidden.includes("languages");
  const height = 106 + metricRows * 55 + (showLanguages ? 64 : 12);
  const cellWidth = (width - 48) / columns;
  const header = `${avatar ? `<defs><clipPath id="avatar"><circle cx="48" cy="45" r="24"/></clipPath></defs><image href="${escapeXml(avatar)}" x="24" y="21" width="48" height="48" clip-path="url(#avatar)" preserveAspectRatio="xMidYMid slice"/>` : ""}
  <text x="${headerX}" y="37" class="title" font-size="${compact ? 16 : 18}">${escapeXml(truncateText(data.displayName || data.username, compact ? 23 : 32))}</text>
  <text x="${headerX}" y="57" class="muted" font-size="12">@${escapeXml(truncateText(data.username, 39))}</text>
  <circle cx="${width - 28}" cy="29" r="4" fill="${theme.accent}"/><text x="${width - 40}" y="52" text-anchor="end" class="muted" font-size="9">PUBLIC PROFILE</text>`;
  const metricContent = metrics.map(([key, label, value], index) => {
    const x = 24 + (index % columns) * cellWidth; const y = 105 + Math.floor(index / columns) * 55;
    return `${options.showIcons ? icon(String(key), x, y - 15, theme.icon) : ""}<text x="${x + (options.showIcons ? 20 : 0)}" y="${y - 4}" class="muted label">${escapeXml(String(label))}</text><text x="${x}" y="${y + 20}" class="text value">${escapeXml(formatNumber(Number(value), options.locale))}</text>`;
  }).join("");
  const languageY = 105 + metricRows * 55;
  const languageContent = showLanguages ? renderLanguages(data, languageY, width, theme) : "";
  return svgDocument({ width, height, theme, hideBorder: options.hideBorder, title: `${data.username}'s GitHub overview`, description: `GitHub statistics for ${data.username}`, content: header + metricContent + languageContent });
}

function renderLanguages(data: OverviewCardData, y: number, width: number, theme: CardTheme): string {
  if (!data.topLanguages.length) return `<text x="24" y="${y + 18}" class="muted label">No public language data</text>`;
  let offset = 24;
  const available = width - 48;
  const bars = data.topLanguages.map((language) => {
    const barWidth = available * language.percentage / 100;
    const result = `<rect x="${offset}" y="${y}" width="${barWidth}" height="7" fill="${safeColor(language.color, theme.accent)}"/>`;
    offset += barWidth; return result;
  }).join("");
  const labels = data.topLanguages.slice(0, width < 430 ? 3 : 5).map((language, index) => `<circle cx="${24 + index * ((width - 48) / Math.min(data.topLanguages.length, width < 430 ? 3 : 5))}" cy="${y + 30}" r="3" fill="${safeColor(language.color, theme.accent)}"/><text x="${31 + index * ((width - 48) / Math.min(data.topLanguages.length, width < 430 ? 3 : 5))}" y="${y + 34}" class="muted" font-size="10">${escapeXml(truncateText(language.name, 12))} ${language.percentage}%</text>`).join("");
  return `<clipPath id="lang"><rect x="24" y="${y}" width="${available}" height="7" rx="3.5"/></clipPath><g clip-path="url(#lang)">${bars}</g>${labels}`;
}

export function renderErrorCard(message: string, width = 480, themeName = "dark"): string {
  const { theme } = resolveTheme(themeName);
  return svgDocument({ width, height: 128, theme, title: "RepoPulse card error", description: message, content: `<circle cx="36" cy="43" r="12" fill="${theme.progressBackground}"/><text x="36" y="48" text-anchor="middle" class="accent" font-size="16" font-weight="600">!</text><text x="58" y="39" class="title" font-size="15">Unable to generate card</text><text x="58" y="60" class="muted" font-size="12">${escapeXml(truncateText(message, 58))}</text><text x="24" y="102" class="muted" font-size="10">RepoPulse · Public GitHub metrics</text>` });
}
