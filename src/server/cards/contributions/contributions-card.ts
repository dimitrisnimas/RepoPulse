import { resolveTheme } from "@/config/themes";
import { svgDocument } from "@/server/cards/card-renderer";
import { escapeXml, formatNumber } from "@/server/cards/card-utils";
import { monthPositions } from "./contributions.mapper";
import type { ContributionsCardData, ContributionsOptions } from "./contributions.types";

export function renderContributionsCard(data: ContributionsCardData, options: ContributionsOptions): string {
  const { theme } = resolveTheme(options.theme);
  const width = options.width;
  const left = options.showWeekdays ? 48 : 24;
  const right = 24;
  const gap = 2;
  const cell = Math.max(5, Math.min(13, (width - left - right - gap * (data.weeks.length - 1)) / Math.max(1, data.weeks.length)));
  const gridWidth = data.weeks.length * (cell + gap) - gap;
  const top = 91;
  const gridBottom = top + 6 * (cell + gap) + cell;
  const footerY = gridBottom + 22;
  const height = Math.ceil(options.showLegend ? footerY + 22 : gridBottom + 24);
  const colors = [theme.contributions.empty, theme.contributions.level1, theme.contributions.level2, theme.contributions.level3, theme.contributions.level4];

  let content = `<text x="24" y="30" class="title" font-size="16">Contribution Calendar</text><text x="24" y="51" class="muted" font-size="11">@${escapeXml(data.username)} · ${data.year}</text>${options.showTotal ? `<text x="${width - 24}" y="31" text-anchor="end" class="title" font-size="14">${escapeXml(formatNumber(data.totalContributions, options.locale))}</text><text x="${width - 24}" y="49" text-anchor="end" class="muted" font-size="9">contributions</text>` : ""}`;
  content += monthPositions(data).map((item) => `<text x="${left + item.week * (cell + gap)}" y="${top - 12}" class="muted" font-size="9">${item.label}</text>`).join("");
  if (options.showWeekdays) content += `<text x="24" y="${top + cell * 2 + gap + 3}" class="muted" font-size="8">Mon</text><text x="24" y="${top + cell * 4 + gap * 3 + 3}" class="muted" font-size="8">Wed</text><text x="24" y="${top + cell * 6 + gap * 5 + 3}" class="muted" font-size="8">Fri</text>`;
  content += data.weeks.map((week, x) => week.days.map((day) => `<rect x="${left + x * (cell + gap)}" y="${top + day.weekday * (cell + gap)}" width="${cell}" height="${cell}" rx="${Math.min(2, cell * .2)}" fill="${colors[day.level]}"><title>${day.date}: ${day.count} contributions</title></rect>`).join("")).join("");
  if (options.showLegend) content += `<text x="${left}" y="${footerY + 4}" class="muted" font-size="9">Less</text>${colors.map((color, index) => `<rect x="${left + 29 + index * 15}" y="${footerY - 6}" width="10" height="10" rx="2" fill="${color}"/>`).join("")}<text x="${left + 108}" y="${footerY + 4}" class="muted" font-size="9">More</text><text x="${left + gridWidth}" y="${footerY + 4}" text-anchor="end" class="muted" font-size="9">${data.from} &#8212; ${data.to}</text>`;

  return svgDocument({ width, height, theme, hideBorder: options.hideBorder, title: `${data.username}'s ${data.year} contribution calendar`, description: `${data.totalContributions} contributions from ${data.from} to ${data.to}`, content });
}
