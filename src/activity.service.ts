import { Injectable } from "@nestjs/common";
import { GitHubClient, type RepositoryActivity } from "./github.client.js";
import { ServiceError } from "./errors.js";

export interface ActivityData {
  repositories: RepositoryActivity[];
  fetchedAt: string;
}
export const CACHE_TTL_MS = 300000;

@Injectable()
export class ActivityService {
  private snapshot?: { data: ActivityData; expires: number };
  private pending?: Promise<ActivityData>;
  private failure?: { error: ServiceError; until: number };

  constructor(private readonly github: GitHubClient) {}

  get(): Promise<ActivityData> {
    if (this.snapshot && this.snapshot.expires > Date.now())
      return Promise.resolve(this.snapshot.data);
    if (this.failure && this.failure.until > Date.now())
      return Promise.reject(this.failure.error);
    if (!this.pending) {
      this.pending = this.github
        .activity()
        .then((repositories) => {
          const data: ActivityData = {
            repositories: [...repositories].sort(
              (a, b) =>
                (b.lastCommitAt ?? "").localeCompare(a.lastCommitAt ?? "") ||
                a.repository.localeCompare(b.repository, "en"),
            ),
            fetchedAt: new Date().toISOString(),
          };
          this.snapshot = { data, expires: Date.now() + CACHE_TTL_MS };
          this.failure = undefined;
          return data;
        })
        .catch((error: unknown) => {
          const safe =
            error instanceof ServiceError
              ? error
              : new ServiceError("GITHUB_UNAVAILABLE", 502);
          this.failure = {
            error: safe,
            until: Date.now() + (safe.retryAfter ?? 10) * 1000,
          };
          throw safe;
        })
        .finally(() => {
          this.pending = undefined;
        });
    }
    return this.pending;
  }
}
