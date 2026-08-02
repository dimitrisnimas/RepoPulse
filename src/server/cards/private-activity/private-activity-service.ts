import { z } from "zod";
import { GitHubError } from "@/server/github/github-errors";
import { githubGraphql } from "@/server/github/github-client";
import { logError } from "@/server/observability/logger";
import type { PrivateActivityData, PrivateRepositoryActivity } from "./private-activity.types";

const owner = "dimitrisnimas";
const repositoryName = /^[A-Za-z0-9._-]{1,100}$/;
const privateConfigSchema=z.object({token:z.string().min(1),repositories:z.string().min(1).max(1200),about:z.string().max(240).default("Building private products, APIs and developer tools with a focus on reliability, performance and thoughtful design."),descriptions:z.string().max(2400).default("")});
const query = `query PrivateRepositoryActivity($owner:String!,$name:String!){repository(owner:$owner,name:$name){name primaryLanguage{name color} defaultBranchRef{target{... on Commit{history(first:1){totalCount nodes{committedDate}}}}}}}`;
interface Response { repository: null | { name: string; primaryLanguage: null | { name: string; color: string | null }; defaultBranchRef: null | { target: { history?: { totalCount: number; nodes: Array<{ committedDate: string }> } } } } }

function privateConfig(){const parsed=privateConfigSchema.safeParse({token:process.env.REPOPULSE_PRIVATE_GITHUB_TOKEN,repositories:process.env.REPOPULSE_PRIVATE_REPOSITORIES,about:process.env.REPOPULSE_PRIVATE_ABOUT_TEXT||undefined,descriptions:process.env.REPOPULSE_PRIVATE_REPOSITORY_DESCRIPTIONS||undefined});if(!parsed.success)throw new GitHubError("unavailable","Private activity card is not configured",503);return parsed.data}
export function privateRepositoryDescriptions(raw=""){const descriptions=new Map<string,string>();if(!raw.trim())return descriptions;for(const entry of raw.split("|").map(value=>value.trim()).filter(Boolean)){const separator=entry.indexOf(":");if(separator<1)throw new GitHubError("unavailable","Invalid private repository descriptions",503);const name=entry.slice(0,separator).trim();const description=entry.slice(separator+1).trim();if(!repositoryName.test(name)||!description||description.length>120)throw new GitHubError("unavailable","Invalid private repository descriptions",503);descriptions.set(name.toLowerCase(),description)}return descriptions}
export function selectedPrivateRepositories(raw?: string): string[] {
  raw ??= privateConfig().repositories;
  if (!raw) return [];
  const names = [...new Set(raw.split(/[,;\n]+/).map((value) => value.trim().replace(/^["']|["']$/g,"")).filter(Boolean))];
  if (names.length > 12) throw new GitHubError("unavailable", "Too many private repositories configured", 503);
  return names.map((entry) => { const parts=entry.split("/");const candidateOwner=parts.length===2?parts[0]:owner;const name=parts.length===2?parts[1]:parts[0];if(parts.length>2||candidateOwner.toLowerCase()!==owner||!repositoryName.test(name)||name==="."||name==="..")throw new GitHubError("unavailable","Invalid private repository allowlist",503);return name; });
}
async function repositoryActivity(name: string): Promise<PrivateRepositoryActivity> {
  const data = await githubGraphql<Response>(query, { owner, name }, privateConfig().token);
  if (!data.repository) throw new GitHubError("not_found", "Selected repository is unavailable", 404);
  const history = data.repository.defaultBranchRef?.target;
  return { name: data.repository.name,description:null,language: data.repository.primaryLanguage?.name ?? null, languageColor:data.repository.primaryLanguage?.color??null,totalCommits: history?.history?.totalCount ?? 0, lastCommitAt: history?.history?.nodes[0]?.committedDate ?? null };
}
export async function getPrivateActivity(now = new Date()): Promise<PrivateActivityData> {
  const repositories = selectedPrivateRepositories();
  if (!repositories.length) throw new GitHubError("unavailable", "Private activity card is not configured", 503);
  const settled = await Promise.allSettled(repositories.map((name) => repositoryActivity(name)));
  settled.forEach((result,index)=>{if(result.status==="rejected")logError("private_repository_activity_failed",{repositoryIndex:index,errorCategory:result.reason instanceof GitHubError?result.reason.category:"unknown",errorName:result.reason instanceof Error?result.reason.name:"UnknownError",errorMessage:result.reason instanceof Error?result.reason.message.slice(0,160):"Unknown failure"})});
  const available = settled.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
  if (!available.length) throw new GitHubError("unavailable", "Selected repositories are unavailable", 503);
  const config=privateConfig();const descriptions=privateRepositoryDescriptions(config.descriptions);const enriched=available.map(repository=>({...repository,description:descriptions.get(repository.name.toLowerCase())??null}));
  return { username: owner, about:config.about,repositories: enriched.sort((a,b)=>(b.lastCommitAt??"").localeCompare(a.lastCommitAt??"")), unavailable: settled.length-available.length, generatedAt: now.toISOString() };
}
