import type { CardTheme } from "@/config/themes";
import { escapeXml } from "./card-utils";

export function svgDocument({ width, height, theme, hideBorder, title, description, content }: { width: number; height: number; theme: CardTheme; hideBorder?: boolean; title: string; description: string; content: string }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
<title id="title">${escapeXml(title)}</title><desc id="desc">${escapeXml(description)}</desc>
<rect width="${width}" height="${height}" rx="14" fill="${theme.background}"${hideBorder ? "" : ` stroke="${theme.border}"`}/>
<style>text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Arial,sans-serif}.title{fill:${theme.title};font-weight:600}.text{fill:${theme.text}}.muted{fill:${theme.muted}}.accent{fill:${theme.accent}}.label{font-size:11px}.value{font-size:17px;font-weight:600}</style>${content}</svg>`;
}
