export interface CardTheme {
  background: string;
  border: string;
  title: string;
  text: string;
  muted: string;
  accent: string;
  icon: string;
  progressBackground: string;
  contributions: { empty: string; level1: string; level2: string; level3: string; level4: string };
}

export const themes = {
  dark: { background: "#0d0d10", border: "#27272a", title: "#fafafa", text: "#d4d4d8", muted: "#71717a", accent: "#a78bfa", icon: "#a78bfa", progressBackground: "#27272a", contributions: { empty:"#202024",level1:"#4c1d95",level2:"#6d28d9",level3:"#8b5cf6",level4:"#c4b5fd" } },
  light: { background: "#ffffff", border: "#e4e4e7", title: "#18181b", text: "#3f3f46", muted: "#71717a", accent: "#7c3aed", icon: "#7c3aed", progressBackground: "#e4e4e7", contributions: { empty:"#eeeeef",level1:"#ddd6fe",level2:"#a78bfa",level3:"#7c3aed",level4:"#4c1d95" } },
  "github-dark": { background: "#0d1117", border: "#30363d", title: "#f0f6fc", text: "#c9d1d9", muted: "#8b949e", accent: "#58a6ff", icon: "#58a6ff", progressBackground: "#21262d", contributions: { empty:"#21262d",level1:"#0e4429",level2:"#006d32",level3:"#26a641",level4:"#39d353" } },
  "github-light": { background: "#ffffff", border: "#d0d7de", title: "#1f2328", text: "#424a53", muted: "#656d76", accent: "#0969da", icon: "#0969da", progressBackground: "#d8dee4", contributions: { empty:"#ebedf0",level1:"#9be9a8",level2:"#40c463",level3:"#30a14e",level4:"#216e39" } },
  midnight: { background: "#090914", border: "#29274a", title: "#f5f3ff", text: "#ddd6fe", muted: "#7c7898", accent: "#8b5cf6", icon: "#a78bfa", progressBackground: "#26233f", contributions: { empty:"#201e34",level1:"#3b2a68",level2:"#5b3aa8",level3:"#8b5cf6",level4:"#c4b5fd" } },
} satisfies Record<string, CardTheme>;

export type ThemeName = keyof typeof themes;
export const DEFAULT_THEME: ThemeName = "dark";
export function resolveTheme(name?: string): { name: ThemeName; theme: CardTheme } {
  const valid = name && Object.prototype.hasOwnProperty.call(themes, name) ? (name as ThemeName) : DEFAULT_THEME;
  return { name: valid, theme: themes[valid] };
}
