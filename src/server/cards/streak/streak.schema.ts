import{z}from"zod";import{queryBoolean,sharedCardQuery,yearSchema}from"@/server/cards/shared/query-schema";
export const streakQuerySchema=z.object({...sharedCardQuery,width:sharedCardQuery.width.default(520),year:yearSchema,show_ring:queryBoolean.default(true)}).strict();
export function parseStreakQuery(parameters:URLSearchParams){return streakQuerySchema.safeParse(Object.fromEntries(parameters.entries()));}
