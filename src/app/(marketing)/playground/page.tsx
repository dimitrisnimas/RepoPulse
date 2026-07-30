import type { Metadata } from "next";
import { Playground } from "@/components/playground/playground";
export const metadata: Metadata = { title: "Playground", description: "Configure and preview your RepoPulse GitHub statistics card." };
export default function PlaygroundPage() { return <Playground />; }
