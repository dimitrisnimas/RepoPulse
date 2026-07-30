import type { HIDEABLE_METRICS } from "@/config/cards";
export type HiddenMetric = (typeof HIDEABLE_METRICS)[number];
export interface OverviewCardOptions {
  username: string;
  theme: string;
  width: number;
  showAvatar: boolean;
  showIcons: boolean;
  hideBorder: boolean;
  hidden: HiddenMetric[];
  locale: string;
}
