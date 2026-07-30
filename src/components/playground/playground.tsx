"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { AlertCircle, Code2, LoaderCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Input, Select } from "@/components/ui/primitives";
import { Switch } from "@/components/ui/switch";

const hiddenOptions = [{ key: "followers", label: "Followers" }, { key: "forks", label: "Forks" }, { key: "stars", label: "Stars" }, { key: "commits", label: "Commits" }, { key: "pull_requests", label: "Pull requests" }, { key: "languages", label: "Languages" }] as const;
type OutputFormat = "Markdown" | "HTML" | "Direct URL";

export function Playground() {
  const [username, setUsername] = useState("dimitrisnimas");
  const [debouncedUsername, setDebouncedUsername] = useState(username);
  const [theme, setTheme] = useState("midnight");
  const [width, setWidth] = useState(480);
  const [showAvatar, setShowAvatar] = useState(true);
  const [showIcons, setShowIcons] = useState(true);
  const [showBorder, setShowBorder] = useState(true);
  const [hidden, setHidden] = useState<string[]>([]);
  const [format, setFormat] = useState<OutputFormat>("Markdown");
  const [loadedUrl, setLoadedUrl] = useState("");
  const [errorUrl, setErrorUrl] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const deferredWidth = useDeferredValue(width);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedUsername(username.trim()), 500);
    return () => window.clearTimeout(timer);
  }, [username]);

  const query = useMemo(() => {
    const parameters = new URLSearchParams({
      username: debouncedUsername || "dimitrisnimas", theme, width: String(deferredWidth),
      show_avatar: String(showAvatar), show_icons: String(showIcons), hide_border: String(!showBorder),
    });
    if (hidden.length) parameters.set("hide", [...hidden].sort().join(","));
    return parameters.toString();
  }, [debouncedUsername, theme, deferredWidth, showAvatar, showIcons, showBorder, hidden]);
  const previewUrl = `/api/cards/overview?${query}${refreshKey ? `&refresh=${refreshKey}` : ""}`;
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://repopulse.kubik.gr"}/api/cards/overview?${query}`;
  const outputs: Record<OutputFormat, string> = {
    Markdown: `![RepoPulse GitHub Stats](${publicUrl})`,
    HTML: `<img src="${publicUrl}" alt="RepoPulse GitHub Stats" />`,
    "Direct URL": publicUrl,
  };

  const previewState = errorUrl === previewUrl ? "error" : loadedUrl === previewUrl ? "ready" : "loading";
  function toggleHidden(key: string) { setHidden((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]); }
  function reset() { setUsername("dimitrisnimas"); setTheme("midnight"); setWidth(480); setShowAvatar(true); setShowIcons(true); setShowBorder(true); setHidden([]); }

  return <div className="grid min-h-[calc(100vh-65px)] lg:grid-cols-[380px_1fr]">
    <aside className="border-r border-white/[.08] p-5 lg:p-7">
      <div className="flex items-center justify-between"><div><p className="text-xs text-violet-300">CONFIGURATION</p><h1 className="mt-2 text-xl font-semibold">Overview card</h1></div><Button variant="ghost" aria-label="Reset settings" onClick={reset}><RotateCcw size={15} /></Button></div>
      <div className="mt-8 space-y-6">
        <Field label="GitHub username"><Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="dimitrisnimas" maxLength={39} /></Field>
        <Field label="Card type"><Select value="overview" disabled><option value="overview">Overview</option></Select></Field>
        <Field label="Theme"><Select value={theme} onChange={(event) => setTheme(event.target.value)}><option value="dark">Dark</option><option value="light">Light</option><option value="github-dark">GitHub Dark</option><option value="github-light">GitHub Light</option><option value="midnight">Midnight</option></Select></Field>
        <Toggle label="Show avatar" value={showAvatar} setValue={setShowAvatar} /><Toggle label="Show icons" value={showIcons} setValue={setShowIcons} /><Toggle label="Show border" value={showBorder} setValue={setShowBorder} />
        <Field label="Width"><div className="relative"><Input type="number" value={width} min={320} max={900} onChange={(event) => setWidth(Math.max(320, Math.min(900, Number(event.target.value) || 320)))} /><span className="absolute right-3 top-3 text-xs text-zinc-600">px</span></div></Field>
        <fieldset><legend className="mb-3 text-xs font-medium text-zinc-500">Hide metrics</legend><div className="grid grid-cols-2 gap-2">{hiddenOptions.map((item) => <label key={item.key} className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/[.07] px-3 py-2 text-xs text-zinc-500 hover:text-white"><input type="checkbox" checked={hidden.includes(item.key)} onChange={() => toggleHidden(item.key)} className="accent-violet-500" />{item.label}</label>)}</div></fieldset>
      </div>
    </aside>
    <main className="bg-[radial-gradient(circle_at_50%_20%,rgba(124,58,237,.08),transparent_40%)] p-5 lg:p-10">
      <div className="mx-auto max-w-4xl"><div className="flex items-center justify-between"><div><p className="text-xs text-zinc-600">LIVE PREVIEW</p><p className="mt-1 text-sm text-zinc-400">Live public GitHub data</p></div><Button variant="secondary" onClick={() => setRefreshKey(Date.now())}><RotateCcw size={14} /> Refresh</Button></div>
        <div className="relative mt-8 grid min-h-96 place-items-center overflow-auto rounded-2xl border border-dashed border-white/10 bg-black/20 p-6">
          {previewState === "loading" && <div className="absolute inset-0 z-10 grid place-items-center bg-black/55 text-center text-sm text-zinc-500"><div><LoaderCircle className="mx-auto mb-3 animate-spin" />Fetching GitHub data...</div></div>}
          {previewState === "error" && <div className="text-center text-sm text-zinc-500"><AlertCircle className="mx-auto mb-3 text-red-300" />The preview could not be loaded.</div>}
          {/* SVG cards intentionally bypass Next image optimization so response headers and live errors remain visible. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {debouncedUsername && <img key={previewUrl} src={previewUrl} width={deferredWidth} alt={`GitHub overview card for ${debouncedUsername}`} onLoad={() => setLoadedUrl(previewUrl)} onError={() => setErrorUrl(previewUrl)} className={previewState === "error" ? "hidden" : "max-w-none"} />}
        </div>
        <div className="mt-8"><div className="flex items-center justify-between"><div className="flex gap-1 rounded-lg border border-white/10 bg-black/30 p-1">{(["Markdown","HTML","Direct URL"] as OutputFormat[]).map((item) => <button key={item} onClick={() => setFormat(item)} className={`rounded-md px-3 py-1.5 text-xs ${format === item ? "bg-white/10 text-white" : "text-zinc-500"}`}>{item}</button>)}</div><span className="hidden items-center gap-2 text-xs text-zinc-600 sm:flex"><Code2 size={13} /> Ready to embed</span></div><div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-3"><code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-xs text-violet-200">{outputs[format]}</code><CopyButton value={outputs[format]} /></div></div>
      </div>
    </main>
  </div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-medium text-zinc-500">{label}</span>{children}</label>; }
function Toggle({ label, value, setValue }: { label: string; value: boolean; setValue: (value: boolean) => void }) { return <div className="flex items-center justify-between"><span className="text-sm text-zinc-400">{label}</span><Switch checked={value} onChange={setValue} label={label} /></div>; }
