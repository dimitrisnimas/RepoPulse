import { createBlock } from "./studio.model";
import type { StudioLayout } from "./studio.types";

const base = (name: string): StudioLayout => ({ version: 1, name, username: "dimitrisnimas", theme: "github-dark", layout: "single", gap: 16, centered: false, blocks: [] });
function profile(name: string, focus: string, cards: string[], extras: string[] = []): StudioLayout {
  return { ...base(name), centered: true, blocks: [createBlock("heading", { content: `Hi, I'm {username} 👋`, align: "center" }), createBlock("paragraph", { title: "About me", content: focus, align: "center" }), ...extras.map((x) => createBlock("badge", { title: x, content: x, url: `https://img.shields.io/badge/${encodeURIComponent(x)}-18181b?style=flat-square`, align: "center" })), ...cards.map((cardType) => createBlock("card", { title: cardType[0].toUpperCase() + cardType.slice(1), cardType, align: "center" })), createBlock("social", { align: "center" })] };
}
export const studioTemplates: StudioLayout[] = [
  profile("Minimal", "Developer, maker, lifelong learner.", ["overview"]),
  profile("Professional", "Software engineer focused on reliable products and thoughtful engineering.", ["profile", "overview", "languages"], ["Available for work"]),
  profile("Open Source", "Building in public and contributing to the open-source ecosystem.", ["contributions", "pinned", "overview"], ["Open Source"]),
  profile("Student", "Computer science student exploring software, systems, and the web.", ["overview", "languages"], ["Learning"]),
  profile("Full Stack", "Full-stack developer shipping polished products end to end.", ["developer-dna", "overview", "languages"], ["React", "Node.js"]),
  profile("Backend", "Backend engineer working on APIs, data, and distributed systems.", ["overview", "languages", "repository"], ["APIs", "Databases"]),
  profile("Frontend", "Frontend engineer crafting accessible and delightful interfaces.", ["developer-dna", "languages", "pinned"], ["React", "TypeScript"]),
  profile("Maintainer", "Maintaining tools developers depend on.", ["contributions", "pinned", "repository"], ["Maintainer"]),
  profile("Indie Hacker", "Designing, building, and launching independent products.", ["pulse", "overview", "pinned"], ["Building in public"]),
  { ...profile("Dark", "Welcome to my corner of GitHub.", ["galaxy", "developer-dna", "contributions"]), theme: "midnight" },
  { ...profile("Creative", "Code is my medium. Ideas are the raw material.", ["passport", "river", "journey"]), gap: 24 },
];
export const defaultStudioLayout = studioTemplates[1];
