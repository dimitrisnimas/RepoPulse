export interface GitHubLanguageEdge { size: number; node: { name: string; color: string | null } }
export interface GitHubRepositoryNode {
  stargazerCount: number;
  forkCount: number;
  languages: { edges: GitHubLanguageEdge[] };
}
export interface GitHubRepositoryPage {
  nodes: GitHubRepositoryNode[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}
export interface GitHubProfileResponse {
  user: null | {
    login: string;
    name: string | null;
    avatarUrl: string;
    bio: string | null;
    followers: { totalCount: number };
    following: { totalCount: number };
    repositories: GitHubRepositoryPage & { totalCount: number };
    gists: { totalCount: number };
    contributionsCollection: {
      totalCommitContributions: number;
      totalIssueContributions: number;
      totalPullRequestContributions: number;
      totalPullRequestReviewContributions: number;
      contributionCalendar: { totalContributions: number };
    };
  };
}
export interface GitHubRepositoriesResponse { user: null | { repositories: GitHubRepositoryPage } }
export interface GitHubProfileAggregate {
  profile: NonNullable<GitHubProfileResponse["user"]>;
  repositories: GitHubRepositoryNode[];
}
