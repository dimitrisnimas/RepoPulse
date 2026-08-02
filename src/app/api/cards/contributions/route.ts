import { cardCacheKey } from "@/server/cache/cache-keys";
import { handleCardRoute } from "@/server/cards/card-route";
import { renderContributionsCard } from "@/server/cards/contributions/contributions-card";
import { contributionsQuerySchema,parseContributionsQuery } from "@/server/cards/contributions/contributions.schema";
import { getNormalizedContributions } from "@/server/cards/contributions/contributions-service";
export const runtime="nodejs";type Input=ReturnType<typeof contributionsQuerySchema.parse>;
export function GET(request:Request){return handleCardRoute<Input>({request,parse:parseContributionsQuery,freshSeconds:3600,width:(i)=>i.width,theme:(i)=>i.theme,cacheKey:(i)=>cardCacheKey("contributions","v2",{...i,username:i.username.toLowerCase()}),generate:async(i)=>renderContributionsCard(await getNormalizedContributions(i.username,i.year),{username:i.username,theme:i.theme,width:i.width,year:i.year,showTotal:i.show_total,showLegend:i.show_legend,showWeekdays:i.show_weekdays,hideBorder:i.hide_border,locale:i.locale})});}
