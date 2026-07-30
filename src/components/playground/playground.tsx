"use client";

import { useMemo, useState } from "react";
import { Code2, LoaderCircle, RotateCcw } from "lucide-react";
import { StatsCard } from "@/components/marketing/stats-card";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Input, Select, Tabs } from "@/components/ui/primitives";
import { Switch } from "@/components/ui/switch";

export function Playground() {
  const [username, setUsername] = useState("kubikgr");
  const [showIcons, setShowIcons] = useState(true);
  const [border, setBorder] = useState(true);
  const [animation, setAnimation] = useState(false);
  const [loading, setLoading] = useState(false);
  const url = useMemo(() => `https://repopulse.kubik.gr/api/card?username=${encodeURIComponent(username || "username")}&theme=midnight&icons=${showIcons}`, [username, showIcons]);
  function refresh() { setLoading(true); window.setTimeout(() => setLoading(false), 650); }
  return <div className="grid min-h-[calc(100vh-65px)] lg:grid-cols-[360px_1fr]"><aside className="border-r border-white/[.08] p-5 lg:p-7"><div className="flex items-center justify-between"><div><p className="text-xs text-violet-300">CONFIGURATION</p><h1 className="mt-2 text-xl font-semibold">Card playground</h1></div><Button variant="ghost" aria-label="Reset settings"><RotateCcw size={15} /></Button></div><div className="mt-8 space-y-6"><Field label="GitHub username"><Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="octocat" /></Field><Field label="Card type"><Select defaultValue="stats"><option value="stats">Profile statistics</option><option value="languages">Top languages</option><option value="streak">Contribution streak</option></Select></Field><Field label="Theme"><Select defaultValue="midnight"><option value="midnight">Midnight</option><option value="graphite">Graphite</option><option value="paper">Paper</option></Select></Field><Toggle label="Show icons" value={showIcons} setValue={setShowIcons} /><Toggle label="Show border" value={border} setValue={setBorder} /><Toggle label="Animate graph" value={animation} setValue={setAnimation} /><Field label="Width"><div className="relative"><Input type="number" defaultValue={480} min={320} max={800} /><span className="absolute right-3 top-3 text-xs text-zinc-600">px</span></div></Field></div></aside><main className="bg-[radial-gradient(circle_at_50%_20%,rgba(124,58,237,.08),transparent_40%)] p-5 lg:p-10"><div className="mx-auto max-w-3xl"><div className="flex items-center justify-between"><div><p className="text-xs text-zinc-600">LIVE PREVIEW</p><p className="mt-1 text-sm text-zinc-400">Mock data · API connection coming soon</p></div><Button variant="secondary" onClick={refresh}><RotateCcw size={14} /> Refresh</Button></div><div className="mt-8 grid min-h-96 place-items-center rounded-2xl border border-dashed border-white/10 bg-black/20 p-6">{loading ? <div className="text-center text-sm text-zinc-500"><LoaderCircle className="mx-auto mb-3 animate-spin" />Generating preview...</div> : <div className={!border ? "[&>div]:border-transparent" : ""}><StatsCard compact /></div>}</div><div className="mt-8"><div className="flex items-center justify-between"><Tabs items={["Markdown","HTML","Direct URL"]} /><span className="hidden items-center gap-2 text-xs text-zinc-600 sm:flex"><Code2 size={13} /> Ready to embed</span></div><div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-3"><code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-xs text-violet-200">{`![${username} GitHub stats](${url})`}</code><CopyButton value={`![${username} GitHub stats](${url})`} /></div></div></div></main></div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-medium text-zinc-500">{label}</span>{children}</label>; }
function Toggle({ label, value, setValue }: { label: string; value: boolean; setValue: (value: boolean) => void }) { return <div className="flex items-center justify-between"><span className="text-sm text-zinc-400">{label}</span><Switch checked={value} onChange={setValue} label={label} /></div>; }
