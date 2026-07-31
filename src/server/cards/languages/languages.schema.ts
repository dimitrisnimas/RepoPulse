import { z } from "zod";
import { sharedCardQuery, queryBoolean } from "@/server/cards/shared/query-schema";
export const languagesQuerySchema = z.object({
  ...sharedCardQuery, width: sharedCardQuery.width.default(420),
  layout: z.enum(["default","compact","donut"]).optional().default("default"),
  langs_count: z.coerce.number().int().min(1).max(10).optional().default(5),
  exclude: z.string().max(200).optional().default("").transform((value, context) => {
    const items = [...new Set(value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean))];
    if (items.length > 20) context.addIssue({ code:"custom", message:"Too many excluded languages" });
    return items;
  }),
  hide_progress: queryBoolean.default(false),
});
export function parseLanguagesQuery(parameters: URLSearchParams) { return languagesQuerySchema.safeParse(Object.fromEntries(parameters.entries())); }
