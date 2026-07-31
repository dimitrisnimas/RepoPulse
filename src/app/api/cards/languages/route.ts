import { cardCacheKey } from "@/server/cache/cache-keys";
import { handleCardRoute } from "@/server/cards/card-route";
import { renderLanguagesCard } from "@/server/cards/languages/languages-card";
import { mapLanguagesData } from "@/server/cards/languages/languages.mapper";
import { languagesQuerySchema, parseLanguagesQuery } from "@/server/cards/languages/languages.schema";
import { getPublicGitHubProfile } from "@/server/github/github-service";
export const runtime = "nodejs";
type Input = ReturnType<typeof languagesQuerySchema.parse>;
export function GET(request: Request) { return handleCardRoute<Input>({ request,parse:parseLanguagesQuery,freshSeconds:21600,width:(i)=>i.width,theme:(i)=>i.theme,cacheKey:(i)=>cardCacheKey("languages","v1",{...i,username:i.username.toLowerCase()}),generate:async(i)=>{const source=await getPublicGitHubProfile(i.username);const data=mapLanguagesData(source,i.exclude,i.langs_count);return renderLanguagesCard(data,{username:i.username,theme:i.theme,width:i.width,layout:i.layout,langsCount:i.langs_count,exclude:i.exclude,hideProgress:i.hide_progress,hideBorder:i.hide_border,locale:i.locale});} }); }
