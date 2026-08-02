import { cardCacheKey } from "@/server/cache/cache-keys";
import { handleCardRoute } from "@/server/cards/card-route";
import { renderPrivateActivityCard } from "@/server/cards/private-activity/private-activity-card";
import { privateActivityQuerySchema, parsePrivateActivityQuery } from "@/server/cards/private-activity/private-activity.schema";
import { getPrivateActivity, selectedPrivateRepositories } from "@/server/cards/private-activity/private-activity-service";
export const runtime="nodejs";
type Input=ReturnType<typeof privateActivityQuerySchema.parse>;
export function GET(request:Request){return handleCardRoute<Input>({request,parse:parsePrivateActivityQuery,identityParameter:null,freshSeconds:10800,width:(input)=>input.width,theme:(input)=>input.theme,cacheKey:(input)=>cardCacheKey("private-activity","v7",{...input,repositories:selectedPrivateRepositories(),about:process.env.REPOPULSE_PRIVATE_ABOUT_TEXT??"default",descriptions:process.env.REPOPULSE_PRIVATE_REPOSITORY_DESCRIPTIONS??""}),generate:async(input)=>renderPrivateActivityCard(await getPrivateActivity(),{theme:input.theme,width:input.width,hideBorder:input.hide_border,locale:input.locale})})}
