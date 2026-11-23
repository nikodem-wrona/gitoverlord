import { ChangeKindTag, formatTime, shortHash } from "@/features/repository";
import {
  type Column,
  DecodeText,
  Readout,
  ReadoutList,
  PathText,
  Table,
  textColumn,
} from "@/hud";
import type { CommitDetail, FileDelta } from "@/ipc";

import styles from "./CommitInspector.module.css";

const FILE_COLUMNS: readonly Column<FileDelta>[] = [
  {
    id: "kind",
    header: "",
    width: "1.75rem",
    render: (file) => <ChangeKindTag kind={file.kind} short />,
  },
  {
    id: "path",
    header: "File",
    render: (file) => <PathText path={file.path} />,
  },
  textColumn<FileDelta>("additions", "+", { width: "3rem", align: "end" }),
  textColumn<FileDelta>("deletions", "−", { width: "3rem", align: "end" }),
];

interface CommitReportProps {
  detail: CommitDetail;
  selectedPath?: string;
  onSelectFile(path: string): void;
}

/** The message, the readouts, and the changed files of one commit. */
export function CommitReport(props: CommitReportProps) {
  const { detail, selectedPath, onSelectFile } = props;
  const { commit, files } = detail;
  const added = sum(files.map((file) => file.additions));
  const removed = sum(files.map((file) => file.deletions));

  return (
    <div className={styles.report}>
      <h3 className={styles.subject}>
        <DecodeText key={commit.hash} text={commit.subject} />
      </h3>
      <div className={styles.byline}>
        <span title={detail.email}>{commit.author}</span>
        <span className={styles.hash}>{shortHash(commit.hash)}</span>
      </div>
      {detail.body && <p className={styles.body}>{detail.body}</p>}
      <ReadoutList>
        <Readout label="Refs" value={commit.refs.join(", ") || "None"} />
        <Readout label="Time" value={formatTime(commit.time)} />
        <Readout
          label="Parents"
          value={commit.parents.map(shortHash).join(" ") || "None"}
        />
        <Readout label="Files" value={files.length} />
        <Readout label="Added" value={`+${added}`} tone="ok" />
        <Readout label="Removed" value={`−${removed}`} tone="fail" />
      </ReadoutList>
      <div className={styles.files}>
        <Table
          label="Changed files"
          columns={FILE_COLUMNS}
          rows={files}
          getRowKey={(file) => file.path}
          selectedKey={selectedPath}
          onSelect={onSelectFile}
        />
      </div>
    </div>
  );
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
