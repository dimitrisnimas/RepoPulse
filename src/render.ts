import type { ActivityData } from "./activity.service";
import type { Config } from "./config";

export function escapeXml(value: string): string {
  return value
    .replace(/[\ud800-\udfff]/gu, "\ufffd")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/gu, "")
    .replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&apos;",
        })[char]!,
    );
}
function shorten(value: string, length: number): string {
  const points = Array.from(value);
  return escapeXml(
    points.length > length ? points.slice(0, length - 1).join("") + "…" : value,
  );
}
function color(value: string | null): string {
  return value && /^#[\da-f]{6}$/i.test(value) ? value : "#8b5cf6";
}
const palettes = {
  dark: {
    bg: "#101019",
    row: "#181823",
    border: "#2c2b3c",
    text: "#f4f3ff",
    muted: "#a5a2ba",
    accent: "#b6a0ff",
  },
  light: {
    bg: "#ffffff",
    row: "#f5f3fa",
    border: "#e5e0ef",
    text: "#242036",
    muted: "#696277",
    accent: "#7042cb",
  },
};
function document(
  content: string,
  height: number,
  theme: Config["theme"],
  title: string,
  description: string,
): string {
  const p = palettes[theme];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="${height}" viewBox="0 0 760 ${height}" role="img" aria-labelledby="title desc">
<title id="title">${escapeXml(title)}</title><desc id="desc">${escapeXml(description)}</desc>
<rect x="0.5" y="0.5" width="759" height="${height - 1}" rx="18" fill="${p.bg}" stroke="${p.border}"/>
<style>text{font-family:Arial,Helvetica,sans-serif;fill:${p.text}}.muted{fill:${p.muted}}.accent{fill:${p.accent}}.label{font-size:10px;letter-spacing:1.3px}.bold{font-weight:700}</style>
${content}</svg>`;
}

export function renderActivity(
  data: ActivityData,
  options: Pick<Config, "theme" | "title" | "about">,
): string {
  const p = palettes[options.theme];
  const rows = data.repositories;
  if (!rows.length || rows.length > 12)
    throw new Error("Invalid activity model");
  const total = rows.reduce((sum, row) => sum + row.commits, 0);
  if (!Number.isSafeInteger(total) || total < 0)
    throw new Error("Invalid commit total");
  const number = (value: number) =>
    escapeXml(
      new Intl.NumberFormat("en-US", {
        notation: value >= 1000000 ? "compact" : "standard",
        maximumFractionDigits: 1,
      }).format(value),
    );
  const height = 259 + rows.length * 72;
  let content = `<defs><clipPath id="heading"><rect x="107" y="18" width="623" height="35"/></clipPath><clipPath id="about"><rect x="30" y="83" width="700" height="22"/></clipPath><clipPath id="projects"><rect x="44" y="225" width="340" height="${rows.length * 72}"/></clipPath><clipPath id="languages"><rect x="414" y="225" width="111" height="${rows.length * 72}"/></clipPath></defs>
<path d="M29 49h13l7-20 10 37 9-23 5 6h16" fill="none" stroke="${p.accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<text x="107" y="44" class="bold" font-size="23" clip-path="url(#heading)">${shorten(options.title, 43)}</text>
<text x="108" y="66" class="muted label">SELECTED REPOSITORIES · DEFAULT BRANCH</text>
<text x="30" y="100" class="muted" font-size="12" clip-path="url(#about)">${shorten(options.about, 101)}</text>
<line x1="30" y1="119" x2="730" y2="119" stroke="${p.border}"/>
<text x="30" y="153" class="bold" font-size="26">${rows.length}</text><text x="30" y="173" class="muted label">REPOSITORIES</text>
<text x="224" y="153" class="bold" font-size="26">${number(total)}</text><text x="224" y="173" class="muted label">REACHABLE COMMITS</text>
<text x="730" y="150" text-anchor="end" class="muted label">SNAPSHOT · UTC</text><text x="730" y="173" text-anchor="end" font-size="12">${escapeXml(new Date(data.fetchedAt).toISOString().slice(0, 16).replace("T", " "))}</text>
<text x="44" y="211" class="muted label">PROJECT</text><text x="399" y="211" class="muted label">LANGUAGE</text><text x="596" y="211" text-anchor="end" class="muted label">COMMITS</text><text x="716" y="211" text-anchor="end" class="muted label">LAST COMMIT</text>`;
  content += rows
    .map((row, index) => {
      if (!Number.isSafeInteger(row.commits) || row.commits < 0)
        throw new Error("Invalid commit count");
      const y = 225 + index * 72;
      const date = row.lastCommitAt
        ? new Date(row.lastCommitAt).toISOString().slice(0, 10)
        : "No commits";
      return `<rect x="30" y="${y}" width="700" height="64" rx="9" fill="${p.row}"/>
<text x="44" y="${y + 25}" class="bold" font-size="12" clip-path="url(#projects)">${shorten(row.repository, 43)}</text>
<text x="44" y="${y + 45}" class="muted" font-size="10" clip-path="url(#projects)">${shorten(row.description || (row.private ? "Private repository" : "Public repository"), 54)}</text>
<circle cx="402" cy="${y + 29}" r="4" fill="${color(row.languageColor)}"/><text x="414" y="${y + 33}" class="muted" font-size="11" clip-path="url(#languages)">${shorten(row.language ?? "—", 16)}</text>
<text x="596" y="${y + 33}" text-anchor="end" font-size="12">${number(row.commits)}</text>
<text x="716" y="${y + 33}" text-anchor="end" class="muted" font-size="11">${escapeXml(date)}</text>`;
    })
    .join("");
  content += `<text x="30" y="${height - 15}" class="muted" font-size="9">Commit history totals, not personal contributions.</text><text x="730" y="${height - 15}" text-anchor="end" class="accent bold" font-size="10">REPOPULSE</text>`;
  const svg = document(
    content,
    height,
    options.theme,
    options.title,
    "Commit counts and latest commit dates for selected repositories. Counts cover each default branch's reachable history.",
  );
  if (Buffer.byteLength(svg, "utf8") > 100000)
    throw new Error("Card is too large");
  return svg;
}

export function renderError(): string {
  return document(
    '<text x="30" y="48" class="bold" font-size="19">Activity unavailable</text><text x="30" y="76" class="muted" font-size="12">Check access or try again later.</text>',
    110,
    "dark",
    "Activity unavailable",
    "The activity card could not be returned.",
  );
}
