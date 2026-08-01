import type { StudioAction, StudioBlock, StudioHistory, StudioLayout } from "./studio.types";

let sequence = 0;
export function createId() { sequence += 1; return `block-${Date.now().toString(36)}-${sequence}`; }
export function createBlock(kind: StudioBlock["kind"], options: Partial<StudioBlock> = {}): StudioBlock {
  const defaults: Record<StudioBlock["kind"], Partial<StudioBlock>> = {
    heading: { title: "Heading", content: "Hello, I'm a developer 👋" }, paragraph: { title: "Paragraph", content: "I build useful things for the web." },
    divider: { title: "Divider" }, image: { title: "Image", url: "https://placehold.co/800x240/161b22/8b949e?text=Your+banner" },
    badge: { title: "Badge", content: "TypeScript", url: "https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" }, spacer: { title: "Spacer" },
    card: { title: "Overview", cardType: "overview" }, visitors: { title: "Visitors", url: "https://komarev.com/ghpvc/?username={username}&color=7c3aed" },
    social: { title: "Social links", content: "[GitHub](https://github.com/{username}) · [Website](https://example.com)" }, markdown: { title: "Custom Markdown", content: "- 🔭 Working on something exciting\n- 🌱 Learning every day" },
  };
  return { id: createId(), kind, title: kind, width: kind === "card" ? 480 : 100, align: "left", spacing: 16, visible: true, ...defaults[kind], ...options };
}

function commit(history: StudioHistory, present: StudioLayout): StudioHistory {
  if (JSON.stringify(present) === JSON.stringify(history.present)) return history;
  return { past: [...history.past.slice(-49), history.present], present, future: [] };
}
export function studioReducer(history: StudioHistory, action: StudioAction): StudioHistory {
  if (action.type === "undo") { const previous = history.past.at(-1); return previous ? { past: history.past.slice(0, -1), present: previous, future: [history.present, ...history.future] } : history; }
  if (action.type === "redo") { const next = history.future[0]; return next ? { past: [...history.past, history.present], present: next, future: history.future.slice(1) } : history; }
  const layout = history.present;
  if (action.type === "set") return commit(history, action.layout);
  if (action.type === "settings") return commit(history, { ...layout, ...action.patch });
  if (action.type === "update") return commit(history, { ...layout, blocks: layout.blocks.map((b) => b.id === action.id ? { ...b, ...action.patch } : b) });
  if (action.type === "add") { const blocks = [...layout.blocks]; blocks.splice(action.index ?? blocks.length, 0, action.block); return commit(history, { ...layout, blocks }); }
  if (action.type === "addMany") { const blocks = [...layout.blocks]; blocks.splice(action.index ?? blocks.length, 0, ...action.blocks); return commit(history, { ...layout, blocks }); }
  if (action.type === "remove") return commit(history, { ...layout, blocks: layout.blocks.filter((b) => b.id !== action.id) });
  if (action.type === "duplicate") { const index = layout.blocks.findIndex((b) => b.id === action.id); if (index < 0) return history; const blocks = [...layout.blocks]; blocks.splice(index + 1, 0, { ...blocks[index], id: action.newId, title: `${blocks[index].title} copy` }); return commit(history, { ...layout, blocks }); }
  const from = layout.blocks.findIndex((b) => b.id === action.id); if (from < 0) return history; const blocks = [...layout.blocks]; const [block] = blocks.splice(from, 1); blocks.splice(Math.max(0, Math.min(action.to, blocks.length)), 0, block); return commit(history, { ...layout, blocks });
}

export function applyAutoLayout(layout: StudioLayout): StudioLayout {
  const columns = layout.layout === "two-column" || layout.layout === "grid";
  return {
    ...layout,
    gap: layout.autoSpacing ? (columns ? 12 : 16) : layout.gap,
    blocks: layout.blocks.map((block) => ({
      ...block,
      spacing: layout.autoSpacing ? (block.kind === "spacer" ? 24 : block.kind === "heading" ? 20 : 12) : block.spacing,
      align: layout.centered ? "center" : block.align,
      width: layout.autoSizing && block.kind === "card" ? (columns ? 420 : 480) : block.width,
    })),
  };
}

export function snap(value: number, enabled: boolean, grid = 4) { return enabled ? Math.round(value / grid) * grid : value; }
