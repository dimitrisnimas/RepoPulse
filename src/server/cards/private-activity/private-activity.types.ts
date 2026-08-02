export interface PrivateRepositoryActivity { name: string; language: string | null; totalCommits: number; lastCommitAt: string | null }
export interface PrivateActivityData { username: "dimitrisnimas"; repositories: PrivateRepositoryActivity[]; unavailable: number; generatedAt: string }
export interface PrivateActivityOptions { theme: string; width: number; hideBorder: boolean; locale: string }
