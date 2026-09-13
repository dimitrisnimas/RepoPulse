import { z } from "zod";
import type { Config, RepositoryRef } from "./config";
import { retrySeconds, ServiceError } from "./errors";

const repositorySchema = z.object({
  nameWithOwner: z.string().max(140),
  isPrivate: z.boolean(),
  primaryLanguage: z
    .object({ name: z.string().max(80), color: z.string().max(30).nullable() })
    .nullable(),
  defaultBranchRef: z
    .object({
      target: z.object({
        history: z.object({
          totalCount: z
            .number()
            .int()
            .nonnegative()
            .max(Number.MAX_SAFE_INTEGER),
          nodes: z
            .array(
              z.object({ committedDate: z.iso.datetime({ offset: true }) }),
            )
            .max(1),
        }),
      }),
    })
    .nullable(),
});
const payloadSchema = z.object({
  data: z.record(z.string(), repositorySchema.nullable()).nullish(),
  errors: z
    .array(z.object({ type: z.string().optional() }))
    .max(100)
    .optional(),
});
export interface RepositoryActivity {
  repository: string;
  description: string;
  private: boolean;
  language: string | null;
  languageColor: string | null;
  commits: number;
  lastCommitAt: string | null;
}

export const GITHUB_DEADLINE_MS = 15000;
const MAX_RESPONSE_BYTES = 128 * 1024;

async function boundedJson(response: Response): Promise<unknown> {
  if (!response.body) throw new ServiceError("GITHUB_UNAVAILABLE", 502);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES)
        throw new ServiceError("GITHUB_UNAVAILABLE", 502);
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

export class GitHubClient {
  constructor(
    private readonly config: Config,
    private readonly transport: typeof fetch = fetch,
  ) {}

  async activity(): Promise<RepositoryActivity[]> {
    const deadline = AbortSignal.timeout(GITHUB_DEADLINE_MS);
    const result: RepositoryActivity[] = [];
    // Each token is sent only for repositories belonging to its configured owner.
    for (const [owner, token] of this.config.credentials) {
      const refs = this.config.repositories.filter(
        (ref) => ref.owner === owner,
      );
      if (refs.length)
        result.push(...(await this.batch(refs, token, deadline)));
    }
    return result;
  }

  private async batch(
    refs: readonly RepositoryRef[],
    token: string,
    deadline: AbortSignal,
  ) {
    const variables: Record<string, string> = {};
    const declarations: string[] = [];
    const fields = refs.map((ref, index) => {
      variables[`owner${index}`] = ref.owner;
      variables[`name${index}`] = ref.name;
      declarations.push(`$owner${index}:String!`, `$name${index}:String!`);
      return `r${index}:repository(owner:$owner${index},name:$name${index}){
        nameWithOwner isPrivate primaryLanguage{name color}
        defaultBranchRef{target{... on Commit{history(first:1){totalCount nodes{committedDate}}}}}
      }`;
    });
    const body = JSON.stringify({
      query: `query Activity(${declarations.join(",")}){${fields.join("\n")}}`,
      variables,
    });
    for (let attempt = 0; ; attempt++) {
      try {
        deadline.throwIfAborted();
        const response = await this.transport(
          "https://api.github.com/graphql",
          {
            method: "POST",
            redirect: "error",
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "User-Agent": "RepoPulse/1.0",
            },
            body,
            signal: AbortSignal.any([deadline, AbortSignal.timeout(6000)]),
          },
        );
        if (!response.ok) {
          await response.body?.cancel();
          if (
            response.status === 429 ||
            (response.status === 403 &&
              (response.headers.get("x-ratelimit-remaining") === "0" ||
                response.headers.has("retry-after")))
          ) {
            throw new ServiceError(
              "GITHUB_RATE_LIMITED",
              503,
              retrySeconds(response.headers),
            );
          }
          if (response.status === 401)
            throw new ServiceError("GITHUB_AUTH_FAILED", 503);
          if (response.status === 403)
            throw new ServiceError("GITHUB_PERMISSION_DENIED", 503);
          throw new ServiceError("GITHUB_UNAVAILABLE", 502);
        }
        const parsed = payloadSchema.safeParse(await boundedJson(response));
        if (!parsed.success) throw new ServiceError("GITHUB_UNAVAILABLE", 502);
        const payload = parsed.data;
        if (payload.errors?.length) {
          const types = payload.errors.map((error) => error.type);
          if (types.includes("RATE_LIMITED"))
            throw new ServiceError(
              "GITHUB_RATE_LIMITED",
              503,
              retrySeconds(response.headers),
            );
          if (types.includes("NOT_FOUND"))
            throw new ServiceError("NOT_FOUND", 404);
          if (
            types.includes("FORBIDDEN") ||
            types.includes("INSUFFICIENT_SCOPES")
          )
            throw new ServiceError("GITHUB_PERMISSION_DENIED", 503);
          throw new ServiceError("GITHUB_UNAVAILABLE", 502);
        }
        return refs.map((ref, index): RepositoryActivity => {
          const repository = payload.data?.[`r${index}`];
          if (repository === null) throw new ServiceError("NOT_FOUND", 404);
          if (!repository) throw new ServiceError("GITHUB_UNAVAILABLE", 502);
          if (
            repository.nameWithOwner.toLowerCase() !==
            `${ref.owner}/${ref.name}`.toLowerCase()
          ) {
            throw new ServiceError("NOT_FOUND", 404);
          }
          const history = repository.defaultBranchRef?.target.history;
          if (history && history.totalCount > 0 !== history.nodes.length > 0)
            throw new ServiceError("GITHUB_UNAVAILABLE", 502);
          return {
            repository: repository.nameWithOwner,
            description: ref.description,
            private: repository.isPrivate,
            language: repository.primaryLanguage?.name ?? null,
            languageColor: repository.primaryLanguage?.color ?? null,
            commits: history?.totalCount ?? 0,
            lastCommitAt: history?.nodes[0]?.committedDate ?? null,
          };
        });
      } catch (error) {
        if (deadline.aborted) throw new ServiceError("UPSTREAM_TIMEOUT", 504);
        const failure =
          error instanceof ServiceError
            ? error
            : new ServiceError("GITHUB_UNAVAILABLE", 502);
        if (attempt || failure.code !== "GITHUB_UNAVAILABLE") throw failure;
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
  }
}
