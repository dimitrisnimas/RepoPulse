"use client";

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-violet-500" : "bg-zinc-700"}`}><span className={`absolute top-1 size-4 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`} /></button>;
}
