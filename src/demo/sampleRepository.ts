import type {
  Branch,
  ChangeKind,
  FileDelta,
  RecentRepo,
  Remote,
  RepoSummary,
  WorkingTree,
} from "@/ipc";

import { SAMPLE_COMMITS } from "./sampleCommits";

export const SAMPLE_SUMMARY: RepoSummary = {
  name: "gitoverlord",
  path: "~/dev/gitoverlord",
  head: { branch: "feat/hud-kit", hash: "b7e41c9" },
  remotes: ["origin", "upstream"],
  tags: ["v0.1.0", "v0.0.1"],
  // One minute ago, so that the background fetch waits.
  fetched: Math.floor(Date.now() / 1000) - 60,
  operation: null,
};

export const SAMPLE_RECENT: RecentRepo[] = [
  { name: "gitoverlord", path: "~/dev/gitoverlord" },
  { name: "star-charts", path: "~/dev/star-charts" },
  { name: "dotfiles", path: "~/dotfiles" },
];

function change(
  path: string,
  kind: ChangeKind,
  additions: number,
  deletions: number,
): FileDelta {
  return { path, oldPath: null, kind, additions, deletions };
}

export const SAMPLE_WORKING_TREE: WorkingTree = {
  staged: [
    change("src/app/AppShell.tsx", "modified", 64, 12),
    change("src/app/TopBar.tsx", "modified", 48, 5),
    change("src/hud/Meter.tsx", "added", 40, 0),
  ],
  unstaged: [
    change("src/hud/Panel.tsx", "modified", 22, 9),
    change("src/hud/tokens.css", "conflicted", 14, 6),
    change("src/features/system/SystemStatus.tsx", "deleted", 0, 24),
    change("docs/ROADMAP.md", "modified", 3, 3),
    change("notes/radar-ideas.md", "untracked", 12, 0),
  ],
};

function branch(name: string, ahead: number, behind: number): Branch {
  const tip = SAMPLE_COMMITS.find((commit) => commit.refs.includes(name));
  return {
    name,
    current: name === SAMPLE_SUMMARY.head.branch,
    upstream: `origin/${name}`,
    ahead,
    behind,
    tip: tip?.hash ?? "",
    updated: tip?.time ?? 0,
  };
}

export const SAMPLE_BRANCHES: Branch[] = [
  branch("feat/hud-kit", 3, 1),
  branch("spike/radar", 2, 4),
  branch("main", 0, 0),
  branch("fix/windows-ci", 0, 3),
];

export const SAMPLE_REMOTES: Remote[] = [
  {
    name: "origin",
    url: "https://github.com/gitoverlord/gitoverlord.git",
    branches: SAMPLE_BRANCHES.map(({ name }) => `origin/${name}`).sort(),
  },
  {
    name: "upstream",
    url: "git@github.com:overlord-labs/gitoverlord.git",
    branches: ["upstream/main"],
  },
];

/** The number of commits on each of the last 30 days. The oldest day is first. */
export const SAMPLE_ACTIVITY: number[] = [
  0, 1, 0, 2, 3, 1, 0, 0, 4, 6, 3, 2, 5, 1, 0, 2, 7, 9, 4, 3, 6, 8, 5, 2, 4, 11,
  7, 9, 12, 8,
];
