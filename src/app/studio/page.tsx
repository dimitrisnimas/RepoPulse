import type { Metadata } from "next";
import { ProfileStudio } from "@/components/studio/profile-studio";

export const metadata: Metadata = { title: "GitHub Profile Studio", description: "Build and export a complete GitHub profile README visually." };
export default function StudioPage() { return <ProfileStudio />; }
