import { z } from "zod";
import { sharedCardQuery, queryBoolean } from "@/server/cards/shared/query-schema";
export const privateActivityQuerySchema = z.object({ theme: sharedCardQuery.theme, width: sharedCardQuery.width.default(680), hide_border: queryBoolean.default(false), locale: sharedCardQuery.locale }).strict();
export function parsePrivateActivityQuery(parameters: URLSearchParams) { return privateActivityQuerySchema.safeParse(Object.fromEntries(parameters.entries())); }
