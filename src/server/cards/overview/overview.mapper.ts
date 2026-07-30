import type { OverviewCardData } from "@/server/cards/card-model";
import type { GitHubProfileAggregate, GitHubRepositoryNode } from "@/server/github/github.types";

export function calculateLanguages(repositories: GitHubRepositoryNode[]): OverviewCardData["topLanguages"] {
  const totals = new Map<string, { size: number; color: string | null }>();
  for (const repository of repositories) {
    for (const edge of repository.languages.edges) {
      const previous = totals.get(edge.node.name);
      totals.set(edge.node.name, { size: (previous?.size ?? 0) + edge.size, color: previous?.color ?? edge.node.color });
    }
  }
  const totalBytes = [...totals.values()].reduce((sum, language) => sum + language.size, 0);
  if (!totalBytes) return [];
  return [...totals.entries()]
    .map(([name, value]) => ({ name, percentage: Number(((value.size / totalBytes) * 100).toFixed(1)), color: value.color }))
    .filter((language) => language.percentage >= 1)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);
}

export function mapOverviewData({ profile, repositories }: GitHubProfileAggregate, generatedAt = new Date().toISOString()): OverviewCardData {
  return {
    username: profile.login, displayName: profile.name, avatarUrl: profile.avatarUrl, bio: profile.bio,
    followers: profile.followers.totalCount, following: profile.following.totalCount,
    publicRepositories: profile.repositories.totalCount, gists: profile.gists.totalCount,
    totalStars: repositories.reduce((sum, repository) => sum + repository.stargazerCount, 0),
    totalForks: repositories.reduce((sum, repository) => sum + repository.forkCount, 0),
    totalContributions: profile.contributionsCollection.contributionCalendar.totalContributions,
    commits: profile.contributionsCollection.totalCommitContributions,
    pullRequests: profile.contributionsCollection.totalPullRequestContributions,
    issues: profile.contributionsCollection.totalIssueContributions,
    reviews: profile.contributionsCollection.totalPullRequestReviewContributions,
    topLanguages: calculateLanguages(repositories), generatedAt,
  };
}
