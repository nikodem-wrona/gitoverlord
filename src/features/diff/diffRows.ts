import type { DiffLine, FileDiff } from "@/ipc";

/** One row of the diff viewer: a hunk header, a line, or a note for the user. */
export type DiffRow =
  | { type: "hunk"; key: string; text: string }
  | { type: "line"; key: string; line: DiffLine }
  | { type: "note"; key: string; text: string };

const TRUNCATED_NOTE = "The diff is too long. The other lines are not shown.";

/** Makes one list of rows from the hunks of a diff. */
export function diffRows(diff: FileDiff): DiffRow[] {
  const rows = diff.hunks.flatMap((hunk, hunkIndex): DiffRow[] => [
    { type: "hunk", key: `${hunkIndex}`, text: hunk.header },
    ...hunk.lines.map((line, lineIndex): DiffRow => ({
      type: "line",
      key: `${hunkIndex}:${lineIndex}`,
      line,
    })),
  ]);
  if (diff.truncated) {
    rows.push({ type: "note", key: "truncated", text: TRUNCATED_NOTE });
  }
  return rows;
}
