import type { Commit, FileDelta } from "@/ipc";

type FileSpec = readonly [path: string, additions: number, deletions: number];

export interface SampleCommit {
  commit: Commit;
  files: FileDelta[];
}

/** Converts a time such as `11-23 12:04` into Unix seconds. */
function at(time: string): number {
  return Date.parse(`2026-${time.replace(" ", "T")}:00`) / 1000;
}

function file([path, additions, deletions]: FileSpec): FileDelta {
  const kind = deletions === 0 ? "added" : "modified";
  return { path, oldPath: null, kind, additions, deletions };
}

/** Makes a sample commit from its fields in a compact form. */
function sample(
  hash: string,
  subject: string,
  author: string,
  time: string,
  parents: string[],
  files: readonly FileSpec[],
  refs: string[] = [],
): SampleCommit {
  return {
    commit: { hash, subject, author, time: at(time), parents, refs },
    files: files.map(file),
  };
}

/** Sample history. The newest commit is first. */
export const SAMPLE_HISTORY: readonly SampleCommit[] = [
  sample(
    "b7e41c9",
    "feat: add the star map",
    "cipher",
    "11-23 12:04",
    ["a91f3d2"],
    [
      ["src/features/history/StarMap.tsx", 96, 0],
      ["src/features/history/layoutStarMap.ts", 88, 0],
    ],
    ["feat/hud-kit"],
  ),
  sample(
    "6c02f8e",
    "wip: sweep the radar",
    "nova",
    "11-23 11:52",
    ["d4a8b17"],
    [["src/features/radar/Sweep.tsx", 41, 7]],
    ["spike/radar"],
  ),
  sample(
    "a91f3d2",
    "feat: decode the panel titles",
    "nova",
    "11-23 11:20",
    ["5e7d0b4"],
    [
      ["src/hud/motion/scramble.ts", 27, 0],
      ["src/hud/motion/DecodeText.tsx", 31, 0],
    ],
  ),
  sample(
    "f3b9e60",
    "chore: update tauri to 2.12",
    "operator",
    "11-23 10:41",
    ["e2c71aa"],
    [
      ["Cargo.lock", 212, 198],
      ["package.json", 2, 2],
    ],
    ["main", "origin/main"],
  ),
  sample(
    "d4a8b17",
    "wip: plot the remotes",
    "nova",
    "11-23 10:02",
    ["e2c71aa"],
    [["src/features/radar/plot.ts", 64, 0]],
  ),
  sample(
    "5e7d0b4",
    "feat: add the toast system",
    "cipher",
    "11-22 22:47",
    ["3a6f9c1"],
    [
      ["src/hud/toast/ToastProvider.tsx", 44, 0],
      ["src/hud/toast/Toast.module.css", 97, 0],
    ],
  ),
  sample(
    "e2c71aa",
    "merge: fix/windows-ci",
    "operator",
    "11-22 21:15",
    ["c81d5e3", "9f0a2b7"],
    [["src-tauri/build.rs", 34, 2]],
  ),
  sample(
    "9f0a2b7",
    "fix: embed the windows manifest",
    "ghost",
    "11-22 20:58",
    ["c81d5e3"],
    [
      ["src-tauri/build.rs", 34, 2],
      ["src-tauri/windows-app-manifest.xml", 14, 0],
    ],
    ["fix/windows-ci"],
  ),
  sample(
    "3a6f9c1",
    "feat: add the module tabs",
    "cipher",
    "11-22 19:33",
    ["7b2e4d8"],
    [["src/hud/Tabs.tsx", 92, 0]],
  ),
  sample(
    "c81d5e3",
    "merge: feat/hud-kit tokens",
    "operator",
    "11-22 17:40",
    ["40de913", "7b2e4d8"],
    [["src/hud/tokens.css", 88, 12]],
  ),
  sample(
    "7b2e4d8",
    "feat: add the data table",
    "nova",
    "11-22 16:12",
    ["1d9c6f0"],
    [
      ["src/hud/table/Table.tsx", 112, 0],
      ["src/hud/table/columns.ts", 21, 0],
    ],
  ),
  sample(
    "40de913",
    "ci: check three systems",
    "ghost",
    "11-22 14:05",
    ["8e3b2a5"],
    [[".github/workflows/ci.yml", 66, 0]],
  ),
  sample(
    "1d9c6f0",
    "feat: add the design tokens",
    "cipher",
    "11-22 12:30",
    ["8e3b2a5"],
    [["src/hud/tokens.css", 76, 9]],
  ),
  sample(
    "8e3b2a5",
    "build: add the cargo workspace",
    "operator",
    "11-22 10:15",
    ["2c4f7e9"],
    [
      ["Cargo.toml", 37, 0],
      ["crates/git-core/src/lib.rs", 11, 0],
    ],
  ),
  sample(
    "2c4f7e9",
    "docs: add the roadmap",
    "operator",
    "11-22 09:48",
    ["0a1b2c3"],
    [["docs/ROADMAP.md", 151, 0]],
    ["tag: v0.0.1"],
  ),
  sample(
    "0a1b2c3",
    "chore: initial commit",
    "operator",
    "11-22 09:00",
    [],
    [
      ["README.md", 1, 0],
      ["LICENSE", 21, 0],
    ],
  ),
];

export const SAMPLE_COMMITS: Commit[] = SAMPLE_HISTORY.map(
  (entry) => entry.commit,
);
