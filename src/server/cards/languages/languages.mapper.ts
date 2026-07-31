import type { GitHubProfileAggregate } from "@/server/github/github.types";
import type { LanguagesCardData } from "./languages.types";
const FALLBACK_COLOR = "#8b5cf6";
export function mapLanguagesData(source: GitHubProfileAggregate, exclude: string[], count: number, generatedAt = new Date().toISOString()): LanguagesCardData {
  const repositories = source.repositories.filter((repository) => !repository.isArchived && repository.languages.edges.length > 0);
  const totals = new Map<string, { bytes: number; color: string }>();
  for (const repository of repositories) for (const edge of repository.languages.edges) {
    if (exclude.includes(edge.node.name.toLowerCase())) continue;
    const prior = totals.get(edge.node.name);
    totals.set(edge.node.name, { bytes: (prior?.bytes ?? 0) + edge.size, color: edge.node.color ?? prior?.color ?? FALLBACK_COLOR });
  }
  const totalBytes = [...totals.values()].reduce((sum, item) => sum + item.bytes, 0);
  const raw = [...totals.entries()].sort((a,b) => b[1].bytes - a[1].bytes).slice(0, count);
  const languages = raw.map(([name,item]) => ({ name, color:item.color, bytes:item.bytes, percentage: totalBytes ? Number((item.bytes / totalBytes * 100).toFixed(1)) : 0 }));
  return { username: source.profile.login, totalRepositoriesAnalyzed: repositories.length, totalBytes, languages, generatedAt };
}
export function donutSegments(languages: LanguagesCardData["languages"]) {
  let offset = 0;
  return languages.map((language) => { const segment = { ...language, offset }; offset += language.percentage; return segment; });
}
