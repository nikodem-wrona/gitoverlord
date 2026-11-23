import type { TreeIconKind } from "./treeTypes";

// Each path is drawn in a 12 × 12 box.
const PATHS: Record<TreeIconKind, { d: string; fill: boolean }> = {
  repository: { d: "M2.5 1.5h7v9h-7z M4.5 1.5v9 M6 4h2", fill: false },
  folder: { d: "M1 2.5h4l1 1.5h5v6H1z", fill: true },
  branch: {
    d: "M3.5 3v6 M3.5 7.5c0-2.5 5-1.5 5-4 M3.5 1.5a1.5 1.5 0 1 0 0 .01 M8.5 2a1.5 1.5 0 1 0 0 .01 M3.5 9.5a1.5 1.5 0 1 0 0 .01",
    fill: false,
  },
  remote: {
    d: "M6 1.5a4.5 4.5 0 1 0 0 9a4.5 4.5 0 1 0 0-9 M1.5 6h9 M6 1.5c-2.5 3-2.5 6 0 9 M6 1.5c2.5 3 2.5 6 0 9",
    fill: false,
  },
  tag: { d: "M1.5 1.5h5l4 4-5 5-4-4z M4 4h.01", fill: false },
};

/** A small line icon for a tree row. */
export function TreeIcon({ kind }: { kind: TreeIconKind }) {
  const { d, fill } = PATHS[kind];
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d={d}
        fill={fill ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={fill ? 0 : 1}
        strokeLinecap="round"
      />
    </svg>
  );
}
