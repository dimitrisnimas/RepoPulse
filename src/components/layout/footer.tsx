import Link from "next/link";
import { Activity } from "lucide-react";

export function Footer() {
  return <footer className="border-t border-white/[0.07]"><div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-2 lg:px-8"><div><div className="flex items-center gap-2 font-semibold"><Activity size={17} className="text-violet-300" /> RepoPulse</div><p className="mt-3 max-w-sm text-sm text-zinc-500">Reliable GitHub metrics, designed for developers who care about every detail.</p></div><div className="flex gap-8 text-sm text-zinc-500 md:justify-end">{["Docs", "Playground", "Pricing", "Status"].map((item) => <Link key={item} href={item === "Status" ? "/api/health" : `/${item.toLowerCase()}`} className="hover:text-white">{item}</Link>)}</div></div><div className="border-t border-white/[0.06] px-5 py-5 text-center text-xs text-zinc-600">© {new Date().getFullYear()} RepoPulse · A product by KUBIK</div></footer>;
}
