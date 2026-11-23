import type { Commit, CommitFile } from "@/features/repository";
import {
  type Column,
  DecodeText,
  EmptyState,
  Panel,
  Readout,
  ReadoutList,
  Table,
  textColumn,
} from "@/hud";

import styles from "./CommitInspector.module.css";

const FILE_COLUMNS: readonly Column<CommitFile>[] = [
  textColumn<CommitFile>("path", "File"),
  {
    id: "additions",
    header: "+",
    width: "3rem",
    align: "end",
    render: (file) => file.additions,
  },
  {
    id: "deletions",
    header: "−",
    width: "3rem",
    align: "end",
    render: (file) => file.deletions,
  },
];

interface CommitInspectorProps {
  commit?: Commit;
  delay?: number;
}

/** The details of the selected commit. */
export function CommitInspector({ commit, delay }: CommitInspectorProps) {
  return (
    <Panel
      title="Commit details"
      meta={commit ? "Target locked" : "No target"}
      delay={delay}
    >
      {commit ? (
        <CommitReport commit={commit} />
      ) : (
        <EmptyState
          title="No target locked"
          message="Select a commit on the star map or in the commit log."
        />
      )}
    </Panel>
  );
}

function CommitReport({ commit }: { commit: Commit }) {
  const added = sum(commit.files.map((file) => file.additions));
  const removed = sum(commit.files.map((file) => file.deletions));

  return (
    <div className={styles.report}>
      <h3 className={styles.subject}>
        <DecodeText key={commit.hash} text={commit.subject} />
      </h3>
      <div className={styles.byline}>
        <span>{commit.author}</span>
        <span className={styles.hash}>{commit.hash}</span>
      </div>
      <ReadoutList>
        <Readout label="Branch" value={commit.lane} />
        <Readout label="Time" value={commit.time} />
        <Readout label="Parents" value={commit.parents.join(" ") || "None"} />
        <Readout label="Files" value={commit.files.length} />
        <Readout label="Added" value={`+${added}`} tone="ok" />
        <Readout label="Removed" value={`−${removed}`} tone="fail" />
      </ReadoutList>
      <div className={styles.files}>
        <Table
          label="Changed files"
          columns={FILE_COLUMNS}
          rows={commit.files}
          getRowKey={(file) => file.path}
        />
      </div>
    </div>
  );
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
