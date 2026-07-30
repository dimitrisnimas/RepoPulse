"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="grid min-h-screen place-items-center px-5 text-center"><div><p className="font-mono text-sm text-red-300">SYSTEM ERROR</p><h1 className="mt-4 text-4xl font-semibold">Something went quiet.</h1><p className="mt-3 text-zinc-500">The request could not be completed.</p><Button onClick={reset} className="mt-8">Try again</Button></div></main>; }
