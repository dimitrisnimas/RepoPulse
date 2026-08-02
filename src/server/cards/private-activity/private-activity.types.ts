export interface PrivateRepositoryActivity { name: string; description: string | null; language: string | null; languageColor: string | null; totalCommits: number; lastCommitAt: string | null }
export interface PrivateActivityData { username: "dimitrisnimas"; about: string; repositories: PrivateRepositoryActivity[]; unavailable: number; generatedAt: string }
export interface PrivateActivityOptions { theme: string; width: number; hideBorder: boolean; locale: string }
