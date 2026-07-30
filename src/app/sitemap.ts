import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/docs", "/playground", "/pricing"].map((path) => ({ url: `${siteConfig.url}${path}`, lastModified: new Date(), changeFrequency: "weekly", priority: path === "" ? 1 : 0.8 }));
}
