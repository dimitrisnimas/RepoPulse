import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: "RepoPulse — Beautiful GitHub metrics", template: "%s · RepoPulse" },
  description: siteConfig.description,
  openGraph: { title: "RepoPulse", description: siteConfig.description, url: siteConfig.url, siteName: "RepoPulse", type: "website" },
  twitter: { card: "summary_large_image", title: "RepoPulse", description: siteConfig.description },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="antialiased">{children}</body></html>;
}
