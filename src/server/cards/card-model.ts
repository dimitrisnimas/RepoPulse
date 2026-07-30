export interface OverviewCardData {
  username: string;
  displayName: string | null;
  avatarUrl: string;
  bio: string | null;
  followers: number;
  following: number;
  publicRepositories: number;
  gists: number;
  totalStars: number;
  totalForks: number;
  totalContributions: number;
  commits: number;
  pullRequests: number;
  issues: number;
  reviews: number;
  topLanguages: Array<{ name: string; percentage: number; color: string | null }>;
  generatedAt: string;
}
