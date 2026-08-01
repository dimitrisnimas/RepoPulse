import { z } from "zod";
import { CARD_WIDTH_DEFAULT, CARD_WIDTH_MAX, CARD_WIDTH_MIN, HIDEABLE_METRICS, SUPPORTED_LOCALES } from "@/config/cards";
import { themes } from "@/config/themes";

export const githubUsernameSchema = z.string().min(1, "Username is required").max(39).regex(/^(?!-)(?!.*--)[A-Za-z0-9-]+(?<!-)$/, "Invalid GitHub username");
const booleanParam = z.enum(["true", "false", "1", "0"]).optional().transform((value) => value === "true" || value === "1");

export const overviewQuerySchema = z.object({
  username: githubUsernameSchema,
  theme: z.enum(Object.keys(themes) as [keyof typeof themes, ...(keyof typeof themes)[]]).optional().default("dark"),
  width: z.coerce.number().int().min(CARD_WIDTH_MIN).max(CARD_WIDTH_MAX).optional().default(CARD_WIDTH_DEFAULT),
  show_avatar: booleanParam.default(false),
  show_icons: booleanParam.default(true),
  hide_border: booleanParam.default(false),
  hide: z.string().optional().default("").transform((value, context) => {
    const values = value ? [...new Set(value.split(",").filter(Boolean))] : [];
    const invalid = values.filter((item) => !HIDEABLE_METRICS.includes(item as (typeof HIDEABLE_METRICS)[number]));
    if (invalid.length) context.addIssue({ code: "custom", message: `Unsupported hidden metric: ${invalid.join(", ")}` });
    return values as Array<(typeof HIDEABLE_METRICS)[number]>;
  }),
  locale: z.enum(SUPPORTED_LOCALES).optional().default("en"),
}).strict();

export function parseOverviewQuery(parameters: URLSearchParams) {
  return overviewQuerySchema.safeParse(Object.fromEntries(parameters.entries()));
}
