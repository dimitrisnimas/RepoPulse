import { resolveTheme } from "@/config/themes";
import { svgDocument } from "@/server/cards/card-renderer";
import { escapeXml, safeColor, truncateText } from "@/server/cards/card-utils";
import { donutSegments } from "./languages.mapper";
import type { LanguagesCardData, LanguagesOptions } from "./languages.types";
export function renderLanguagesCard(data: LanguagesCardData, options: LanguagesOptions): string {
  const { theme } = resolveTheme(options.theme); const width = options.width;
  const rows = options.layout === "compact" ? Math.ceil(data.languages.length / 2) : data.languages.length;
  const height = options.layout === "donut" ? 245 : 88 + Math.max(1, rows) * (options.layout === "compact" ? 42 : options.hideProgress ? 30 : 48);
  let content = `<text x="24" y="31" class="title" font-size="16">Top Languages</text><text x="24" y="51" class="muted" font-size="11">@${escapeXml(data.username)} · ${data.totalRepositoriesAnalyzed} repositories</text>`;
  if (!data.languages.length) content += `<text x="24" y="91" class="muted" font-size="12">No public language data available</text>`;
  else if (options.layout === "donut") content += renderDonut(data, width, theme.muted);
  else if (options.layout === "compact") content += data.languages.map((language,index) => { const column = index % 2; const row = Math.floor(index / 2); const x = 24 + column * ((width - 40) / 2); const y = 83 + row * 42; return `<circle cx="${x+4}" cy="${y}" r="4" fill="${safeColor(language.color)}"/><text x="${x+14}" y="${y+4}" class="text" font-size="11">${escapeXml(truncateText(language.name,14))}</text><text x="${x+14}" y="${y+20}" class="muted" font-size="10">${language.percentage}%</text>`; }).join("");
  else content += data.languages.map((language,index) => { const y = 82 + index * (options.hideProgress ? 30 : 48); return `<circle cx="28" cy="${y}" r="4" fill="${safeColor(language.color)}"/><text x="40" y="${y+4}" class="text" font-size="11">${escapeXml(truncateText(language.name,22))}</text><text x="${width-24}" y="${y+4}" text-anchor="end" class="muted" font-size="11">${language.percentage}%</text>${options.hideProgress ? "" : `<rect x="24" y="${y+14}" width="${width-48}" height="6" rx="3" fill="${theme.progressBackground}"/><rect x="24" y="${y+14}" width="${Math.max(1,(width-48)*language.percentage/100)}" height="6" rx="3" fill="${safeColor(language.color)}"/>`}`; }).join("");
  return svgDocument({ width,height,theme,hideBorder:options.hideBorder,title:`${data.username}'s top languages`,description:`Languages calculated from ${data.totalRepositoriesAnalyzed} public repositories`,content });
}
function renderDonut(data: LanguagesCardData, width: number, muted: string) {
  const radius=52, circumference=2*Math.PI*radius, cx=Math.min(96,width*.26), cy=144;
  const arcs=donutSegments(data.languages).map((item)=>`<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${safeColor(item.color)}" stroke-width="16" stroke-dasharray="${circumference*item.percentage/100} ${circumference}" stroke-dashoffset="${-circumference*item.offset/100}" transform="rotate(-90 ${cx} ${cy})"/>`).join("");
  const legendX=Math.max(168,width*.48); const legend=data.languages.slice(0,6).map((item,index)=>`<circle cx="${legendX}" cy="${94+index*23}" r="4" fill="${safeColor(item.color)}"/><text x="${legendX+12}" y="${98+index*23}" class="text" font-size="10">${escapeXml(truncateText(item.name,15))}</text><text x="${width-24}" y="${98+index*23}" text-anchor="end" class="muted" font-size="10">${item.percentage}%</text>`).join("");
  return `${arcs}<text x="${cx}" y="${cy+4}" text-anchor="middle" class="title" font-size="15">${data.languages.length}</text><text x="${cx}" y="${cy+19}" text-anchor="middle" fill="${muted}" font-size="9">languages</text>${legend}`;
}
