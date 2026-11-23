import type { Commit, CommitFile } from "./types";

type FileSpec = readonly [path: string, additions: number, deletions: number];

/** Makes a sample commit from its fields in a compact form. */
function commit(
  hash: string,
  subject: string,
  author: string,
  lane: string,
  time: string,
  parents: readonly string[],
  files: readonly FileSpec[],
): Commit {
  const commitFiles: CommitFile[] = files.map(
    ([path, additions, deletions]) => ({
      path,
      additions,
      deletions,
    }),
  );
  return { hash, subject, author, lane, time, parents, files: commitFiles };
}

const MAIN = "main";
const HUD = "feat/hud-kit";
const FIX = "fix/windows-ci";
const SPIKE = "spike/radar";

/** Sample history. The newest commit is first. */
export const SAMPLE_COMMITS: readonly Commit[] = [
  commit(
    "b7e41c9",
    "feat: add the star map",
    "cipher",
    HUD,
    "11-23 12:04",
    ["a91f3d2"],
    [
      ["src/features/history/StarMap.tsx", 96, 0],
      ["src/features/history/layoutStarMap.ts", 88, 0],
    ],
  ),
  commit(
    "6c02f8e",
    "wip: sweep the radar",
    "nova",
    SPIKE,
    "11-23 11:52",
    ["d4a8b17"],
    [["src/features/radar/Sweep.tsx", 41, 7]],
  ),
  commit(
    "a91f3d2",
    "feat: decode the panel titles",
    "nova",
    HUD,
    "11-23 11:20",
    ["5e7d0b4"],
    [
      ["src/hud/motion/scramble.ts", 27, 0],
      ["src/hud/motion/DecodeText.tsx", 31, 0],
    ],
  ),
  commit(
    "f3b9e60",
    "chore: update tauri to 2.12",
    "operator",
    MAIN,
    "11-23 10:41",
    ["e2c71aa"],
    [
      ["Cargo.lock", 212, 198],
      ["package.json", 2, 2],
    ],
  ),
  commit(
    "d4a8b17",
    "wip: plot the remotes",
    "nova",
    SPIKE,
    "11-23 10:02",
    ["e2c71aa"],
    [["src/features/radar/plot.ts", 64, 0]],
  ),
  commit(
    "5e7d0b4",
    "feat: add the toast system",
    "cipher",
    HUD,
    "11-22 22:47",
    ["3a6f9c1"],
    [
      ["src/hud/toast/ToastProvider.tsx", 44, 0],
      ["src/hud/toast/Toast.module.css", 97, 0],
    ],
  ),
  commit(
    "e2c71aa",
    "merge: fix/windows-ci",
    "operator",
    MAIN,
    "11-22 21:15",
    ["c81d5e3", "9f0a2b7"],
    [["src-tauri/build.rs", 34, 2]],
  ),
  commit(
    "9f0a2b7",
    "fix: embed the windows manifest",
    "ghost",
    FIX,
    "11-22 20:58",
    ["c81d5e3"],
    [
      ["src-tauri/build.rs", 34, 2],
      ["src-tauri/windows-app-manifest.xml", 14, 0],
    ],
  ),
  commit(
    "3a6f9c1",
    "feat: add the module tabs",
    "cipher",
    HUD,
    "11-22 19:33",
    ["7b2e4d8"],
    [["src/hud/Tabs.tsx", 92, 0]],
  ),
  commit(
    "c81d5e3",
    "merge: feat/hud-kit tokens",
    "operator",
    MAIN,
    "11-22 17:40",
    ["40de913", "7b2e4d8"],
    [["src/hud/tokens.css", 88, 12]],
  ),
  commit(
    "7b2e4d8",
    "feat: add the data table",
    "nova",
    HUD,
    "11-22 16:12",
    ["1d9c6f0"],
    [
      ["src/hud/table/Table.tsx", 112, 0],
      ["src/hud/table/columns.ts", 21, 0],
    ],
  ),
  commit(
    "40de913",
    "ci: check three systems",
    "ghost",
    MAIN,
    "11-22 14:05",
    ["8e3b2a5"],
    [[".github/workflows/ci.yml", 66, 0]],
  ),
  commit(
    "1d9c6f0",
    "feat: add the design tokens",
    "cipher",
    HUD,
    "11-22 12:30",
    ["8e3b2a5"],
    [["src/hud/tokens.css", 76, 9]],
  ),
  commit(
    "8e3b2a5",
    "build: add the cargo workspace",
    "operator",
    MAIN,
    "11-22 10:15",
    ["2c4f7e9"],
    [
      ["Cargo.toml", 37, 0],
      ["crates/git-core/src/lib.rs", 11, 0],
    ],
  ),
  commit(
    "2c4f7e9",
    "docs: add the roadmap",
    "operator",
    MAIN,
    "11-22 09:48",
    ["0a1b2c3"],
    [["docs/ROADMAP.md", 151, 0]],
  ),
  commit(
    "0a1b2c3",
    "chore: initial commit",
    "operator",
    MAIN,
    "11-22 09:00",
    [],
    [
      ["README.md", 1, 0],
      ["LICENSE", 21, 0],
    ],
  ),
];
