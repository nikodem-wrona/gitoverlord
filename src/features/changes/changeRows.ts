import type { DiffTarget, FileDelta, WorkingTree } from "@/ipc";

export type ChangeArea = "staged" | "unstaged";

/** One row of the changes table: a file in the index or in the working tree. */
export interface ChangeRow extends FileDelta {
  area: ChangeArea;
  /** Identifies the row. A file can be in both areas. */
  key: string;
}

/** Makes the rows of the changes table. The staged files are first. */
export function changeRows(tree: WorkingTree): ChangeRow[] {
  const rows = (area: ChangeArea, files: readonly FileDelta[]) =>
    files.map((file) => ({ ...file, area, key: rowKey(area, file.path) }));
  return [...rows("staged", tree.staged), ...rows("unstaged", tree.unstaged)];
}

/** Returns the key of the row that `target` selects, if `target` is a working tree file. */
export function selectedRowKey(target?: DiffTarget): string | undefined {
  if (!target || target.kind === "commit") return undefined;
  return rowKey(target.kind, target.path);
}

function rowKey(area: ChangeArea, path: string): string {
  return `${area}:${path}`;
}
