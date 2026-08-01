import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Profile Studio documentation", description: "Build, preview, import, and export GitHub profile READMEs." };
const schema = `{
  "version": 1,
  "name": "Professional",
  "username": "octocat",
  "theme": "github-dark",
  "layout": "single",
  "gap": 16,
  "centered": true,
  "blocks": [
    { "id": "block-1", "kind": "heading", "title": "Hero", "content": "Hi 👋", "width": 100, "align": "center", "spacing": 16, "visible": true }
  ]
}`;
export default function StudioDocs(){return <article className="mx-auto max-w-4xl px-5 py-16 lg:px-8"><p className="text-sm text-violet-300">RepoPulse Profile Studio</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Visual README Builder</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">Compose a complete GitHub profile README locally with blocks, cards, responsive layouts, templates, live preview, and deterministic exports.</p><Link href="/studio" className="mt-7 inline-flex rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black">Open Profile Studio</Link><Doc title="Profile Studio">Drag a component from the library onto the GitHub-style canvas, click it to edit its properties, and drag existing blocks to reorder them. Arrow keys move the selected block; Delete removes it; Ctrl/Cmd+Z and Ctrl/Cmd+Y control history.</Doc><Doc title="Reusable sections">Hero, About Me, Tech Stack, Stats, Projects, Pinned, Achievements, Contact, Support, and Footer presets add a complete named group in one undoable operation. Group names remain editable in the inspector.</Doc><Doc title="Templates and layouts">Starter templates include Minimal, Professional, Open Source, Student, Full Stack, Backend, Frontend, Maintainer, Indie Hacker, Dark, and Creative. Layout modes support single column, two columns, responsive grid, and rows. Auto spacing, auto sizing, center alignment, four-pixel snapping, gap, per-block spacing, width, groups, and visibility are editable.</Doc><Doc title="Local template marketplace">Marketplace entries use the same preset interface as built-in sections but remain local. This provides a forward-compatible extension point without accounts, remote storage, or network synchronization.</Doc><Doc title="Export and import">Markdown output is normalized and deterministic. HTML is standalone and JSON preserves the complete editable Studio layout. Use Export to copy or download. Import validates the document before replacing the canvas. Drafts are automatically stored only in localStorage.</Doc><Doc title="JSON schema"><p>The current schema version is <code>1</code>. Layouts contain global settings and a bounded array of typed blocks. Unknown kinds, invalid widths, and unsupported versions are rejected. Older version-one layouts receive safe defaults for auto spacing, sizing, and snapping.</p><Card className="mt-5 overflow-x-auto p-5"><pre className="text-xs leading-6 text-violet-200">{schema}</pre></Card></Doc><Doc title="README preview">Desktop, tablet, and mobile modes simulate GitHub&apos;s README width, dark surface, typography, borders, headings, lists, tables, code blocks, spacing, and images. The preview updates immediately and never uploads content.</Doc></article>}
function Doc({title,children}:{title:string;children:React.ReactNode}){return <section className="mt-14 border-t border-white/10 pt-9"><h2 className="text-2xl font-semibold">{title}</h2><div className="mt-4 leading-7 text-zinc-400">{children}</div></section>}
