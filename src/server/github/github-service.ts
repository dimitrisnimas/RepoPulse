import { githubGraphql } from "./github-client";
import { GitHubError } from "./github-errors";
import { CONTRIBUTIONS_QUERY, PINNED_QUERY, PROFILE_QUERY, REPOSITORIES_QUERY, REPOSITORY_QUERY } from "./github-queries";
import type { GitHubContributionsResponse, GitHubPinnedResponse, GitHubProfileAggregate, GitHubProfileResponse, GitHubRepositoriesResponse, GitHubRepositoryResponse } from "./github.types";

export async function getPublicGitHubProfile(username: string): Promise<GitHubProfileAggregate> {
  const initial = await githubGraphql<GitHubProfileResponse>(PROFILE_QUERY, { login: username, after: null });
  if (!initial.user) throw new GitHubError("not_found", "GitHub user not found", 404);
  const repositories = [...initial.user.repositories.nodes];
  let pageInfo = initial.user.repositories.pageInfo;
  while (pageInfo.hasNextPage && pageInfo.endCursor) {
    const page = await githubGraphql<GitHubRepositoriesResponse>(REPOSITORIES_QUERY, { login: username, after: pageInfo.endCursor });
    if (!page.user) throw new GitHubError("not_found", "GitHub user not found", 404);
    repositories.push(...page.user.repositories.nodes);
    pageInfo = page.user.repositories.pageInfo;
  }
  return { profile: initial.user, repositories };
}
export async function getPublicRepository(owner:string,name:string){const data=await githubGraphql<GitHubRepositoryResponse>(REPOSITORY_QUERY,{owner,name});if(!data.repository||data.repository.visibility!=="PUBLIC")throw new GitHubError("not_found","Repository not found",404);return data.repository}
export async function getPinnedRepositories(username:string,limit:number){const data=await githubGraphql<GitHubPinnedResponse>(PINNED_QUERY,{login:username,first:limit});if(!data.user)throw new GitHubError("not_found","GitHub user not found",404);return data.user}

export async function getContributionCalendar(username: string, year: number): Promise<NonNullable<GitHubContributionsResponse["user"]>> {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const from = new Date(Date.UTC(year, 0, 1)).toISOString();
  const to = (year === currentYear ? now : new Date(Date.UTC(year, 11, 31, 23, 59, 59))).toISOString();
  const data = await githubGraphql<GitHubContributionsResponse>(CONTRIBUTIONS_QUERY, { login: username, from, to });
  if (!data.user) throw new GitHubError("not_found", "GitHub user not found", 404);
  return data.user;
}
