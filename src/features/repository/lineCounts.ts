import type { Column } from "@/hud";
import type { FileDelta } from "@/ipc";

type Counted = Pick<FileDelta, "additions" | "deletions">;

/**
 * The two columns of the added and the removed lines. A large change has no
 * line counts for its last files. Their cells are empty.
 */
export function lineCountColumns<Row extends Counted>(): Column<Row>[] {
  const column = (key: keyof Counted, header: string, shortHeader: string) => ({
    id: key,
    header,
    shortHeader,
    width: "3rem",
    align: "end" as const,
    render: (row: Row) => row[key] ?? "",
  });
  return [
    column("additions", "Added lines", "+"),
    column("deletions", "Removed lines", "−"),
  ];
}

export interface LineTotals {
  added: number;
  removed: number;
  /** The number of files with line counts. */
  counted: number;
}

/** Adds the line counts of the files that have them. */
export function lineTotals(files: readonly Counted[]): LineTotals {
  const totals = { added: 0, removed: 0, counted: 0 };
  for (const file of files) {
    if (file.additions === null) continue;
    totals.added += file.additions;
    totals.removed += file.deletions ?? 0;
    totals.counted += 1;
  }
  return totals;
}
