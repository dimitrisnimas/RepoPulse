import type { HTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-white/10 bg-white/[0.025]", className)} {...props} />;
}
export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 text-xs text-violet-200", className)}>{children}</span>;
}
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="h-11 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/60" {...props} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="h-11 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-violet-400/60" {...props} />;
}
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-white/[0.07]", className)} />;
}
export function Tabs({ items, active = 0 }: { items: string[]; active?: number }) {
  return <div className="flex gap-1 rounded-lg border border-white/10 bg-black/30 p-1">{items.map((item, index) => <button key={item} className={cn("rounded-md px-3 py-1.5 text-xs", index === active ? "bg-white/10 text-white" : "text-zinc-500")}>{item}</button>)}</div>;
}
