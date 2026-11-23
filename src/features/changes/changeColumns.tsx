import { ChangeKindTag, type RepoWriter } from "@/features/repository";
import { type Column, PathText, textColumn } from "@/hud";

import type { ChangeRow } from "./changeRows";
import styles from "./ChangesPanel.module.css";
import { MoveButton } from "./MoveButton";

/** Makes the columns of the changes table. The first column stages or unstages the file. */
export function changeColumns(repo: RepoWriter): Column<ChangeRow>[] {
  return [
    {
      id: "move",
      header: "",
      width: "5.5rem",
      render: (row) => <MoveButton repo={repo} row={row} />,
    },
    {
      id: "area",
      header: "Stage",
      width: "5.25rem",
      render: (row) => (
        <span className={styles.area} data-area={row.area}>
          {row.area}
        </span>
      ),
    },
    {
      id: "kind",
      header: "Status",
      width: "6rem",
      render: (row) => <ChangeKindTag kind={row.kind} />,
    },
    {
      id: "path",
      header: "File",
      // A renamed file shows its two paths.
      render: (row) =>
        row.oldPath ? (
          `${row.oldPath} → ${row.path}`
        ) : (
          <PathText path={row.path} />
        ),
    },
    textColumn<ChangeRow>("additions", "+", { width: "3rem", align: "end" }),
    textColumn<ChangeRow>("deletions", "−", { width: "3rem", align: "end" }),
  ];
}
