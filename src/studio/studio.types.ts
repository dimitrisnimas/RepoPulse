export type BlockKind = "heading" | "paragraph" | "divider" | "image" | "badge" | "spacer" | "card" | "visitors" | "social" | "markdown";
export type Alignment = "left" | "center" | "right";
export type PreviewDevice = "desktop" | "tablet" | "mobile";
export type LayoutMode = "single" | "two-column" | "grid" | "rows";

export interface StudioBlock {
  id: string;
  kind: BlockKind;
  title: string;
  content?: string;
  url?: string;
  cardType?: string;
  width: number;
  align: Alignment;
  spacing: number;
  visible: boolean;
  group?: string;
}

export interface StudioLayout {
  version: 1;
  name: string;
  username: string;
  theme: string;
  layout: LayoutMode;
  gap: number;
  centered: boolean;
  autoSpacing: boolean;
  autoSizing: boolean;
  snapToGrid: boolean;
  blocks: StudioBlock[];
}

export interface StudioHistory { past: StudioLayout[]; present: StudioLayout; future: StudioLayout[] }
export type StudioAction =
  | { type: "set"; layout: StudioLayout }
  | { type: "update"; id: string; patch: Partial<StudioBlock> }
  | { type: "add"; block: StudioBlock; index?: number }
  | { type: "addMany"; blocks: StudioBlock[]; index?: number }
  | { type: "remove"; id: string }
  | { type: "duplicate"; id: string; newId: string }
  | { type: "move"; id: string; to: number }
  | { type: "settings"; patch: Partial<Omit<StudioLayout, "blocks" | "version">> }
  | { type: "undo" } | { type: "redo" };
