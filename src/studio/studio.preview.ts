export type MarkdownNode = { type: "heading" | "paragraph" | "list" | "code" | "table"; content: string; rows?: string[][] };

export function parseMarkdownPreview(source: string): MarkdownNode[] {
  const lines = source.replaceAll("\r\n", "\n").split("\n");
  const nodes: MarkdownNode[] = [];
  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }
    if (line.startsWith("```")) { const code: string[] = []; index += 1; while (index < lines.length && !lines[index].startsWith("```")) code.push(lines[index++]); index += 1; nodes.push({ type: "code", content: code.join("\n") }); continue; }
    if (/^#{1,6}\s/.test(line)) { nodes.push({ type: "heading", content: line.replace(/^#{1,6}\s+/, "") }); index += 1; continue; }
    if (/^[-*]\s/.test(line)) { const items: string[] = []; while (index < lines.length && /^[-*]\s/.test(lines[index])) items.push(lines[index++].replace(/^[-*]\s+/, "")); nodes.push({ type: "list", content: items.join("\n") }); continue; }
    if (line.includes("|") && lines[index + 1]?.match(/^\s*\|?\s*:?-+/)) { const rows: string[][] = []; rows.push(splitRow(line)); index += 2; while (index < lines.length && lines[index].includes("|")) rows.push(splitRow(lines[index++])); nodes.push({ type: "table", content: "", rows }); continue; }
    const paragraph = [line]; index += 1; while (index < lines.length && lines[index].trim() && !/^(#{1,6}\s|[-*]\s|```)/.test(lines[index])) paragraph.push(lines[index++]); nodes.push({ type: "paragraph", content: paragraph.join(" ") });
  }
  return nodes;
}
function splitRow(line: string) { return line.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()); }
