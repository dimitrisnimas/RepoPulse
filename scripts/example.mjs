import { writeFileSync } from "node:fs";

import { renderActivity } from "../dist/render.js";

const rows = [
  [
    "developer/atlas",
    "A personal workspace for ideas and experiments",
    "TypeScript",
    "#3178c6",
    842,
    "2026-09-12",
  ],
  [
    "example-org/api",
    "Shared services for a small product team",
    "C#",
    "#178600",
    1268,
    "2026-09-11",
  ],
  [
    "developer/forge",
    "Tools that make everyday development easier",
    "Rust",
    "#dea584",
    326,
    "2026-09-09",
  ],
  [
    "example-org/insights",
    "Small experiments with useful data",
    "Python",
    "#3572a5",
    214,
    "2026-09-06",
  ],
];
const data = {
  fetchedAt: "2026-09-13T09:00:00Z",
  repositories: rows.map(
    ([repository, description, language, languageColor, commits, date]) => ({
      repository,
      description,
      language,
      languageColor,
      commits,
      private: true,
      lastCommitAt: `${date}T12:00:00Z`,
    }),
  ),
};
writeFileSync(
  new URL("../docs/example.svg", import.meta.url),
  renderActivity(data, {
    title: "Private activity",
    about: "Quiet progress across personal projects and team repositories.",
    theme: "dark",
  }) + "\n",
);
