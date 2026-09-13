import { z } from "zod";

const owner = z
  .string()
  .max(39)
  .regex(/^(?!-)(?!.*--)[a-zA-Z0-9-]+(?<!-)$/);
const token = z.string().min(20).max(1024).regex(/^\S+$/);
const text = (max: number) =>
  z
    .string()
    .max(max)
    .regex(/^[^\u0000-\u001f\u007f]*$/u);
const schema = z.object({
  REPOPULSE_API_KEY: z
    .string()
    .min(43)
    .max(256)
    .regex(/^[A-Za-z0-9_-]+$/),
  GITHUB_PERSONAL_OWNER: owner,
  GITHUB_PERSONAL_TOKEN: token,
  GITHUB_ORG_OWNER: owner.optional(),
  GITHUB_ORG_TOKEN: token.optional(),
  REPOPULSE_REPOSITORIES: z.string().min(1).max(12000),
  REPOPULSE_PUBLISH_ACTIVITY: z.enum(["true", "false"]).default("false"),
  REPOPULSE_TITLE: text(48).default("Private activity"),
  REPOPULSE_ABOUT: text(140).default(
    "A snapshot of the projects I am building.",
  ),
  REPOPULSE_THEME: z.enum(["dark", "light"]).default("dark"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
});
const repositoriesSchema = z
  .array(
    z
      .object({
        repository: z.string().max(140),
        description: text(90).default(""),
      })
      .strict(),
  )
  .min(1)
  .max(12);

export interface RepositoryRef {
  owner: string;
  name: string;
  description: string;
}
export interface Config {
  apiKey: string;
  credentials: ReadonlyMap<string, string>;
  repositories: readonly RepositoryRef[];
  publishActivity: boolean;
  title: string;
  about: string;
  theme: "dark" | "light";
  port: number;
}
export const CONFIG = Symbol("CONFIG");

export function readConfig(
  environment: NodeJS.ProcessEnv = process.env,
): Config {
  const parsed = schema.safeParse(
    Object.fromEntries(
      Object.entries(environment).map(([key, value]) => [
        key,
        value === "" ? undefined : value,
      ]),
    ),
  );
  if (!parsed.success) {
    const fields = [
      ...new Set(parsed.error.issues.map((issue) => issue.path[0])),
    ];
    throw new Error(`Invalid configuration: ${fields.join(", ")}`);
  }
  const values = parsed.data;
  if (Boolean(values.GITHUB_ORG_OWNER) !== Boolean(values.GITHUB_ORG_TOKEN)) {
    throw new Error("Configure both GITHUB_ORG_OWNER and GITHUB_ORG_TOKEN");
  }
  const personalOwner = values.GITHUB_PERSONAL_OWNER.toLowerCase();
  const credentials = new Map([[personalOwner, values.GITHUB_PERSONAL_TOKEN]]);
  if (values.GITHUB_ORG_OWNER && values.GITHUB_ORG_TOKEN) {
    const org = values.GITHUB_ORG_OWNER.toLowerCase();
    if (org === personalOwner)
      throw new Error("GitHub owners must be distinct");
    credentials.set(org, values.GITHUB_ORG_TOKEN);
  }
  if ([...credentials.values()].includes(values.REPOPULSE_API_KEY)) {
    throw new Error(
      "The operator key must be separate from GitHub credentials",
    );
  }
  let entries: z.infer<typeof repositoriesSchema>;
  try {
    entries = repositoriesSchema.parse(
      JSON.parse(values.REPOPULSE_REPOSITORIES),
    );
  } catch {
    throw new Error(
      "Invalid REPOPULSE_REPOSITORIES: expected 1–12 repository entries",
    );
  }
  const seen = new Set<string>();
  const repositories = entries.map((entry): RepositoryRef => {
    const parts = entry.repository.split("/");
    const [login, name] = parts;
    if (
      parts.length !== 2 ||
      !login ||
      !owner.safeParse(login).success ||
      !name ||
      !/^[A-Za-z0-9._-]{1,100}$/.test(name) ||
      name === "." ||
      name === ".." ||
      !credentials.has(login.toLowerCase()) ||
      seen.has(entry.repository.toLowerCase())
    ) {
      throw new Error(
        "Invalid, duplicate, or unconfigured owner in REPOPULSE_REPOSITORIES",
      );
    }
    seen.add(entry.repository.toLowerCase());
    return Object.freeze({
      owner: login.toLowerCase(),
      name,
      description: entry.description,
    });
  });
  return Object.freeze({
    apiKey: values.REPOPULSE_API_KEY,
    credentials,
    repositories: Object.freeze(repositories),
    publishActivity: values.REPOPULSE_PUBLISH_ACTIVITY === "true",
    title: values.REPOPULSE_TITLE,
    about: values.REPOPULSE_ABOUT,
    theme: values.REPOPULSE_THEME,
    port: values.PORT,
  });
}
