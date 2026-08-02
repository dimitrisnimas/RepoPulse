import { env } from "@/config/env";
import { GitHubError } from "@/server/github/github-errors";
import { githubGraphql } from "@/server/github/github-client";
import type { PrivateActivityData, PrivateRepositoryActivity } from "./private-activity.types";

const owner = "dimitrisnimas";
const repositoryName = /^[A-Za-z0-9._-]{1,100}$/;
const query = `query PrivateRepositoryActivity($owner:String!,$name:String!){repository(owner:$owner,name:$name){name primaryLanguage{name} defaultBranchRef{target{... on Commit{history(first:1){totalCount nodes{committedDate}}}}}}}`;
interface Response { repository: null | { name: string; primaryLanguage: null | { name: string }; defaultBranchRef: null | { target: { history?: { totalCount: number; nodes: Array<{ committedDate: string }> } } } } }

export function selectedPrivateRepositories(raw = env.REPOPULSE_PRIVATE_REPOSITORIES): string[] {
  if (!raw) return [];
  const names = [...new Set(raw.split(",").map((value) => value.trim()).filter(Boolean))];
  if (names.length > 12) throw new GitHubError("unavailable", "Too many private repositories configured", 503);
  return names.map((fullName) => { const [candidateOwner, name, extra] = fullName.split("/"); if (extra || candidateOwner?.toLowerCase() !== owner || !repositoryName.test(name ?? "") || name === "." || name === "..") throw new GitHubError("unavailable", "Invalid private repository allowlist", 503); return name; });
}
async function repositoryActivity(name: string): Promise<PrivateRepositoryActivity> {
  const data = await githubGraphql<Response>(query, { owner, name }, env.REPOPULSE_PRIVATE_GITHUB_TOKEN);
  if (!data.repository) throw new GitHubError("not_found", "Selected repository is unavailable", 404);
  const history = data.repository.defaultBranchRef?.target;
  return { name: data.repository.name, language: data.repository.primaryLanguage?.name ?? null, totalCommits: history?.history?.totalCount ?? 0, lastCommitAt: history?.history?.nodes[0]?.committedDate ?? null };
}
export async function getPrivateActivity(now = new Date()): Promise<PrivateActivityData> {
  const repositories = selectedPrivateRepositories();
  if (!env.REPOPULSE_PRIVATE_GITHUB_TOKEN || !repositories.length) throw new GitHubError("unavailable", "Private activity card is not configured", 503);
  const settled = await Promise.allSettled(repositories.map((name) => repositoryActivity(name)));
  const available = settled.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
  if (!available.length) throw new GitHubError("unavailable", "Selected repositories are unavailable", 503);
  return { username: owner, repositories: available.sort((a,b)=>(b.lastCommitAt??"").localeCompare(a.lastCommitAt??"")), unavailable: settled.length-available.length, generatedAt: now.toISOString() };
}
