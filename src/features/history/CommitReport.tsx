import type { ReactNode } from "react";

import {
  ChangeKindTag,
  formatTime,
  lineCountColumns,
  lineTotals,
  shortHash,
} from "@/features/repository";
import {
  type Column,
  DecodeText,
  Readout,
  ReadoutList,
  PathText,
  Table,
} from "@/hud";
import type { CommitDetail, FileDelta } from "@/ipc";

import styles from "./CommitInspector.module.css";

const FILE_COLUMNS: readonly Column<FileDelta>[] = [
  {
    id: "kind",
    header: "Change",
    shortHeader: "",
    width: "1.75rem",
    render: (file) => <ChangeKindTag kind={file.kind} short />,
  },
  {
    id: "path",
    header: "File",
    render: (file) => <PathText path={file.path} />,
  },
  ...lineCountColumns<FileDelta>(),
];

interface CommitReportProps {
  detail: CommitDetail;
  /** The commands of the commit, under the author. */
  tools?: ReactNode;
  selectedPath?: string;
  onSelectFile(path: string): void;
}

/** The message, the readouts, and the changed files of one commit. */
export function CommitReport(props: CommitReportProps) {
  const { detail, tools, selectedPath, onSelectFile } = props;
  const { commit, files } = detail;
  const lines = lineTotals(files);

  return (
    <div className={styles.report}>
      <h3 className={styles.subject}>
        <DecodeText key={commit.hash} text={commit.subject} />
      </h3>
      <div className={styles.byline}>
        <span title={detail.email}>{commit.author}</span>
        <span className={styles.hash}>{shortHash(commit.hash)}</span>
      </div>
      {tools}
      {detail.body && <p className={styles.body}>{detail.body}</p>}
      <ReadoutList>
        <Readout label="Refs" value={commit.refs.join(", ") || "None"} />
        <Readout label="Time" value={formatTime(commit.time)} />
        <Readout
          label="Parents"
          value={commit.parents.map(shortHash).join(" ") || "None"}
        />
        <Readout label="Files" value={files.length} />
        {lines.counted < files.length && (
          <Readout label="Lines of" value={`${lines.counted} files`} />
        )}
        <Readout label="Added" value={`+${lines.added}`} tone="ok" />
        <Readout label="Removed" value={`−${lines.removed}`} tone="fail" />
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
