import Link from "next/link";
import { Activity, ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#070708]/80 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-7xl items-center px-5 lg:px-8"><Link href="/" className="flex items-center gap-2 font-semibold"><span className="grid size-7 place-items-center rounded-lg border border-violet-400/30 bg-violet-500/10 text-violet-300"><Activity size={15} /></span>RepoPulse</Link><nav className="ml-10 hidden gap-7 md:flex">{siteConfig.nav.map((item) => <Link key={item.href} href={item.href} className="text-sm text-zinc-400 transition hover:text-white">{item.label}</Link>)}</nav><div className="ml-auto flex items-center gap-2"><Button href="/dashboard" variant="ghost" className="hidden sm:inline-flex">Dashboard</Button><Button href="/playground">Try it <ArrowUpRight size={15} /></Button></div></div></header>;
}
