import { describe, expect, it } from "vitest";
import { cardUrl, exportJson, generateHtml, generateMarkdown, importJson } from "./studio.export";
import { createBlock, studioReducer } from "./studio.model";
import { defaultStudioLayout, studioTemplates } from "./studio.templates";
import type { StudioHistory, StudioLayout } from "./studio.types";

const layout = (): StudioLayout => ({ version: 1, name: "Test", username: "octocat", theme: "github-dark", layout: "single", gap: 16, centered: false, blocks: [createBlock("heading", { id: "one", content: "Hi {username}" }), createBlock("card", { id: "two", cardType: "overview", title: "Stats" })] });
const history = (): StudioHistory => ({ past: [], present: layout(), future: [] });

describe("Profile Studio", () => {
  it("models drag and drop reordering deterministically", () => { const next = studioReducer(history(), { type: "move", id: "two", to: 0 }); expect(next.present.blocks.map((b) => b.id)).toEqual(["two", "one"]); });
  it("adds, duplicates and deletes blocks", () => { let state = history(); const block = createBlock("divider", { id: "three" }); state = studioReducer(state, { type: "add", block }); state = studioReducer(state, { type: "duplicate", id: "three", newId: "four" }); state = studioReducer(state, { type: "remove", id: "one" }); expect(state.present.blocks.map((b) => b.id)).toEqual(["two", "three", "four"]); });
  it("supports undo and redo", () => { const start = history(); const changed = studioReducer(start, { type: "remove", id: "one" }); const undone = studioReducer(changed, { type: "undo" }); expect(undone.present.blocks).toHaveLength(2); expect(studioReducer(undone, { type: "redo" }).present.blocks).toHaveLength(1); });
  it("updates inspector properties without changing other blocks", () => { const next = studioReducer(history(), { type: "update", id: "two", patch: { width: 720, align: "center", visible: false } }); expect(next.present.blocks[1]).toMatchObject({ width: 720, align: "center", visible: false }); expect(next.present.blocks[0].id).toBe("one"); });
  it("generates clean deterministic Markdown", () => { const first = generateMarkdown(layout()); expect(first).toBe(generateMarkdown(layout())); expect(first).toContain("## Hi octocat\n\n![Stats]"); expect(first).not.toContain("\n\n\n"); });
  it("exports standalone HTML preview markup", () => { const html = generateHtml(layout()); expect(html).toContain("<!doctype html>"); expect(html).toContain("<h2>Hi octocat</h2>"); expect(html).toContain("/api/cards/overview?"); });
  it("round-trips the JSON layout", () => { const source = layout(); expect(importJson(exportJson(source))).toEqual(source); });
  it("rejects invalid imports", () => { expect(() => importJson('{"version":2,"blocks":[]}')).toThrow(); });
  it("loads every starter template with unique names and valid exports", () => { expect(new Set(studioTemplates.map((t) => t.name)).size).toBe(11); for (const template of studioTemplates) expect(importJson(exportJson(template))).toEqual(template); });
  it("supports layout engine settings", () => { const next = studioReducer(history(), { type: "settings", patch: { layout: "grid", gap: 24, centered: true } }); expect(next.present).toMatchObject({ layout: "grid", gap: 24, centered: true }); });
  it("creates card URLs from username, theme, type, and width", () => { const block = defaultStudioLayout.blocks.find((b) => b.kind === "card")!; const url = cardUrl(block, defaultStudioLayout); expect(url).toContain(`/${block.cardType}?`); expect(url).toContain("username=dimitrisnimas"); });
});
