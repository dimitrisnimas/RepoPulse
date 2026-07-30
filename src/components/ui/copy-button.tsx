"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }
  return <button onClick={copy} aria-label="Copy to clipboard" className="rounded-md p-2 text-zinc-500 transition hover:bg-white/10 hover:text-white">{copied ? <Check size={15} /> : <Copy size={15} />}</button>;
}
