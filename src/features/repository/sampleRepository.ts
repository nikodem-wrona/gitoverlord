import { SAMPLE_COMMITS } from "./sampleCommits";
import type { Repository } from "./types";

/** A sample repository for the HUD. Phase 2 replaces it with real data. */
export const SAMPLE_REPOSITORY: Repository = {
  name: "gitoverlord",
  path: "~/dev/gitoverlord",
  head: "feat/hud-kit",
  ahead: 3,
  behind: 1,
  commits: SAMPLE_COMMITS,
  changes: [
    {
      path: "src/app/AppShell.tsx",
      status: "staged",
      additions: 64,
      deletions: 0,
    },
    {
      path: "src/app/TopBar.tsx",
      status: "staged",
      additions: 48,
      deletions: 0,
    },
    {
      path: "src/hud/Panel.tsx",
      status: "modified",
      additions: 22,
      deletions: 9,
    },
    {
      path: "src/hud/tokens.css",
      status: "conflict",
      additions: 14,
      deletions: 6,
    },
    { path: "src/hud/Meter.tsx", status: "added", additions: 40, deletions: 0 },
    {
      path: "src/features/system/SystemStatus.tsx",
      status: "deleted",
      additions: 0,
      deletions: 24,
    },
    { path: "docs/ROADMAP.md", status: "modified", additions: 3, deletions: 3 },
    {
      path: "notes/radar-ideas.md",
      status: "untracked",
      additions: 12,
      deletions: 0,
    },
  ],
  branches: [
    branch("feat/hud-kit", 3, 1, "11-23 12:04", true),
    branch("main", 0, 0, "11-23 10:41"),
    branch("spike/radar", 2, 4, "11-23 11:52"),
    branch("fix/windows-ci", 0, 3, "11-22 20:58"),
  ],
  remotes: ["origin", "upstream"],
  tags: ["v0.1.0", "v0.0.1"],
  activity: [
    0, 1, 0, 2, 3, 1, 0, 0, 4, 6, 3, 2, 5, 1, 0, 2, 7, 9, 4, 3, 6, 8, 5, 2, 4,
    11, 7, 9, 12, 8,
  ],
};

function branch(
  name: string,
  ahead: number,
  behind: number,
  updated: string,
  current = false,
) {
  return { name, upstream: `origin/${name}`, ahead, behind, updated, current };
}
