import {
  ChangeKindTag,
  QueryPanel,
  useWorkingTree,
} from "@/features/repository";
import { type Column, EmptyState, PathText, Table, textColumn } from "@/hud";
import type { DiffTarget } from "@/ipc";

import { type ChangeRow, changeRows, selectedRowKey } from "./changeRows";
import styles from "./ChangesPanel.module.css";

const COLUMNS: readonly Column<ChangeRow>[] = [
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

interface ChangesPanelProps {
  title: string;
  repoPath: string;
  /** The file that the diff viewer shows. */
  selected?: DiffTarget;
  onSelect(target: DiffTarget): void;
  delay?: number;
}

/** The files that are not committed. A click on a file opens its diff. Conflicts show in red. */
export function ChangesPanel(props: ChangesPanelProps) {
  const { title, repoPath, selected, onSelect, delay } = props;
  const tree = useWorkingTree(repoPath);
  const rows = tree.data ? changeRows(tree.data) : [];
  const select = (key: string) => {
    const row = rows.find((candidate) => candidate.key === key);
    if (row) onSelect({ kind: row.area, path: row.path });
  };

  return (
    <QueryPanel
      title={title}
      query={tree}
      meta={() => `${rows.length} files`}
      flush
      delay={delay}
    >
      {() =>
        rows.length === 0 ? (
          <EmptyState
            title="Working tree clean"
            message="There are no changes to commit."
          />
        ) : (
          <Table
            label="Working tree changes"
            columns={COLUMNS}
            minWidth="32rem"
            rows={rows}
            getRowKey={(row) => row.key}
            selectedKey={selectedRowKey(selected)}
            onSelect={select}
            getRowTone={(row) =>
              row.kind === "conflicted" ? "alert" : undefined
            }
          />
        )
      }
    </QueryPanel>
  );
}
