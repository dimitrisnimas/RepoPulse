import { z } from "zod";
import { CARD_WIDTH_MAX, CARD_WIDTH_MIN, SUPPORTED_LOCALES } from "@/config/cards";
import { themes } from "@/config/themes";
import { githubUsernameSchema } from "@/server/cards/overview/overview.schema";
export const queryBoolean = z.enum(["true", "false", "1", "0"]).optional().transform((value) => value === "true" || value === "1");
export const sharedCardQuery = {
  username: githubUsernameSchema,
  theme: z.enum(Object.keys(themes) as [keyof typeof themes, ...(keyof typeof themes)[]]).optional().default("dark"),
  width: z.coerce.number().int().min(CARD_WIDTH_MIN).max(CARD_WIDTH_MAX).optional(),
  hide_border: queryBoolean.default(false),
  locale: z.enum(SUPPORTED_LOCALES).optional().default("en"),
};
export const yearSchema = z.coerce.number().int().min(2008).max(new Date().getUTCFullYear()).optional().default(new Date().getUTCFullYear());
