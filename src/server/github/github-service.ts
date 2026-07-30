import { githubGraphql } from "./github-client";
import { GitHubError } from "./github-errors";
import { PROFILE_QUERY, REPOSITORIES_QUERY } from "./github-queries";
import type { GitHubProfileAggregate, GitHubProfileResponse, GitHubRepositoriesResponse } from "./github.types";

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
