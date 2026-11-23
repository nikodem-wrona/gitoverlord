import { useState } from "react";

import type { ChangeStatus, WorkingChange } from "@/features/repository";
import { type Column, Table, textColumn, type Tone } from "@/hud";

import styles from "./ChangesTable.module.css";

const STATUS_TONES: Record<ChangeStatus, Tone> = {
  staged: "ok",
  added: "ok",
  modified: "warn",
  deleted: "fail",
  conflict: "fail",
  untracked: "dim",
};

const COLUMNS: readonly Column<WorkingChange>[] = [
  {
    id: "status",
    header: "Status",
    width: "6.5rem",
    render: (change) => (
      <span className={styles.status} data-tone={STATUS_TONES[change.status]}>
        {change.status}
      </span>
    ),
  },
  textColumn<WorkingChange>("path", "File"),
  {
    id: "additions",
    header: "+",
    width: "3.5rem",
    align: "end",
    render: (change) => change.additions,
  },
  {
    id: "deletions",
    header: "−",
    width: "3.5rem",
    align: "end",
    render: (change) => change.deletions,
  },
];

/** The changed files in the working tree. Conflicts show in red. */
export function ChangesTable({
  changes,
}: {
  changes: readonly WorkingChange[];
}) {
  const [selectedPath, setSelectedPath] = useState(changes[0]?.path);

  return (
    <Table
      label="Working tree changes"
      columns={COLUMNS}
      rows={changes}
      getRowKey={(change) => change.path}
      selectedKey={selectedPath}
      onSelect={setSelectedPath}
      getRowTone={(change) =>
        change.status === "conflict" ? "alert" : undefined
      }
    />
  );
}
