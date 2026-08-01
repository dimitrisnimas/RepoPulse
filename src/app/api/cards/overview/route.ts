import { env } from "@/config/env";
import { overviewCacheKey } from "@/server/cache/cache-keys";
import { handleCardRoute } from "@/server/cards/card-route";
import { renderOverviewCard } from "@/server/cards/overview/overview-card";
import { mapOverviewData } from "@/server/cards/overview/overview.mapper";
import { overviewQuerySchema, parseOverviewQuery } from "@/server/cards/overview/overview.schema";
import type { OverviewCardOptions } from "@/server/cards/overview/overview.types";
import { getPublicGitHubProfile } from "@/server/github/github-service";

export const runtime = "nodejs";
type Input = ReturnType<typeof overviewQuerySchema.parse>;
function options(input: Input): OverviewCardOptions { return { username: input.username, theme: input.theme, width: input.width, showAvatar: input.show_avatar, showIcons: input.show_icons, hideBorder: input.hide_border, hidden: input.hide, locale: input.locale }; }
export function GET(request: Request) {
  return handleCardRoute<Input>({
    request,
    parse: parseOverviewQuery,
    freshSeconds: env.REPOPULSE_CACHE_TTL_SECONDS,
    width: (input) => input.width,
    theme: (input) => input.theme,
    cacheKey: (input) => overviewCacheKey(options(input)),
    generate: async (input) => renderOverviewCard(mapOverviewData(await getPublicGitHubProfile(input.username)), options(input)),
  });
}
