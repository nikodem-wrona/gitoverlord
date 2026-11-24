import { type ReactNode, useMemo } from "react";

import { EmptyState, useRowWindow } from "@/hud";
import type { FileDiff, LineKind } from "@/ipc";

import { type DiffRow, diffRows } from "./diffRows";
import styles from "./DiffView.module.css";

const SIGNS: Record<LineKind, string> = {
  context: " ",
  added: "+",
  removed: "−",
};

interface DiffViewProps {
  /** The accessible name of the diff. */
  label: string;
  diff: FileDiff;
  /** Makes the control at the end of a hunk header, for example a stage button. */
  hunkControl?(index: number, header: string): ReactNode;
}

/**
 * The changed lines of one file, with the old and the new line numbers.
 *
 * Only the lines in view are rendered, so a long diff stays fast.
 */
export function DiffView({ label, diff, hunkControl }: DiffViewProps) {
  const rows = useMemo(() => diffRows(diff), [diff]);
  const { scrollRef, onScroll, window } = useRowWindow(rows.length);

  if (diff.binary) {
    return (
      <EmptyState
        title="Binary file"
        message="This file has no text lines to show."
      />
    );
  }
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No changed lines"
        message="The two versions of this file have the same text."
      />
    );
  }
  return (
    <div
      ref={scrollRef}
      role="group"
      aria-label={label}
      tabIndex={0}
      className={styles.scroll}
      onScroll={onScroll}
    >
      <div className={styles.rows}>
        <div style={{ height: window.before }} />
        {rows.slice(window.start, window.end).map((row) => (
          <DiffRowView key={row.key} row={row} hunkControl={hunkControl} />
        ))}
        <div style={{ height: window.after }} />
      </div>
    </div>
  );
}

interface DiffRowViewProps {
  row: DiffRow;
  hunkControl?(index: number, header: string): ReactNode;
}

function DiffRowView({ row, hunkControl }: DiffRowViewProps) {
  if (row.type !== "line") {
    return (
      <div data-row className={styles.row} data-kind={row.type}>
        {row.type === "hunk" ? (
          <>
            <span className={styles.header}>{row.text}</span>
            {hunkControl?.(row.index, row.text)}
          </>
        ) : (
          row.text
        )}
      </div>
    );
  }
  const { kind, oldLine, newLine, text } = row.line;
  return (
    <div data-row className={styles.row} data-kind={kind}>
      <span className={styles.number}>{oldLine}</span>
      <span className={styles.number}>{newLine}</span>
      <span className={styles.sign}>{SIGNS[kind]}</span>
      <span className={styles.text}>{text}</span>
    </div>
  );
}
