import { z } from "zod";
import { sharedCardQuery, queryBoolean, yearSchema } from "@/server/cards/shared/query-schema";
export const contributionsQuerySchema=z.object({...sharedCardQuery,width:z.coerce.number().int().min(500).max(1000).optional().default(760),year:yearSchema,show_total:queryBoolean.default(true),show_legend:queryBoolean.default(true),show_weekdays:queryBoolean.default(true)});
export function parseContributionsQuery(parameters:URLSearchParams){return contributionsQuerySchema.safeParse(Object.fromEntries(parameters.entries()));}
