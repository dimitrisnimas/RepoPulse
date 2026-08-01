import { z } from "zod";
import type { StudioBlock, StudioLayout } from "./studio.types";

const blockSchema = z.object({ id: z.string().min(1), kind: z.enum(["heading","paragraph","divider","image","badge","spacer","card","visitors","social","markdown"]), title: z.string(), content: z.string().optional(), url: z.string().optional(), cardType: z.string().optional(), width: z.number().min(1).max(1200), align: z.enum(["left","center","right"]), spacing: z.number().min(0).max(96), visible: z.boolean(), group: z.string().optional() });
export const studioLayoutSchema = z.object({ version: z.literal(1), name: z.string().min(1), username: z.string().min(1), theme: z.string().min(1), layout: z.enum(["single","two-column","grid","rows"]), gap: z.number().min(0).max(96), centered: z.boolean(), blocks: z.array(blockSchema).max(500) });
const value = (text: string | undefined, layout: StudioLayout) => (text ?? "").replaceAll("{username}", layout.username);
export function cardUrl(block: StudioBlock, layout: StudioLayout) {
  const type = block.cardType ?? "overview";
  const classics = ["overview","languages","contributions","repository","profile","pinned","streak"];
  if (!classics.includes(type)) return `https://repopulse.kubik.gr/originals/${type}.svg?username=${encodeURIComponent(layout.username)}&theme=${encodeURIComponent(layout.theme)}`;
  const params = new URLSearchParams({ username: layout.username, theme: layout.theme, width: String(block.width) });
  return `https://repopulse.kubik.gr/api/cards/${type}?${params}`;
}
function line(block: StudioBlock, layout: StudioLayout): string {
  if (!block.visible) return "";
  if (block.kind === "heading") return `## ${value(block.content, layout)}`;
  if (block.kind === "paragraph" || block.kind === "markdown" || block.kind === "social") return value(block.content, layout);
  if (block.kind === "divider") return "---";
  if (block.kind === "spacer") return "<br />";
  const url = block.kind === "card" ? cardUrl(block, layout) : value(block.url, layout);
  const image = `![${block.title}](${url})`;
  return block.align === "left" ? image : `<p align="${block.align}">\n  <img src="${url}" alt="${block.title}"${block.width > 100 ? ` width="${block.width}"` : ""} />\n</p>`;
}
export function generateMarkdown(layout: StudioLayout) { return layout.blocks.map((b) => line(b, layout).trim()).filter(Boolean).join("\n\n") + "\n"; }
export function generateHtml(layout: StudioLayout) {
  const escape = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const body = layout.blocks.filter((b) => b.visible).map((b) => {
    if (b.kind === "heading") return `<h2>${escape(value(b.content, layout))}</h2>`;
    if (["paragraph","social","markdown"].includes(b.kind)) return `<p>${escape(value(b.content, layout))}</p>`;
    if (b.kind === "divider") return "<hr />"; if (b.kind === "spacer") return "<br />";
    const url = b.kind === "card" ? cardUrl(b, layout) : value(b.url, layout);
    return `<p style="text-align:${b.align}"><img src="${escape(url)}" alt="${escape(b.title)}"${b.width > 100 ? ` width="${b.width}"` : ""} /></p>`;
  }).join("\n");
  return `<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(layout.name)}</title></head>\n<body>\n${body}\n</body>\n</html>\n`;
}
export function exportJson(layout: StudioLayout) { return JSON.stringify(layout, null, 2) + "\n"; }
export function importJson(source: string): StudioLayout { return studioLayoutSchema.parse(JSON.parse(source)); }
