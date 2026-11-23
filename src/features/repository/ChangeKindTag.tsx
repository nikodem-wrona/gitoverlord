import type { Tone } from "@/hud";
import type { ChangeKind } from "@/ipc";

import styles from "./ChangeKindTag.module.css";

const TONES: Record<ChangeKind, Tone> = {
  added: "ok",
  modified: "warn",
  deleted: "fail",
  renamed: "accent",
  typeChanged: "warn",
  untracked: "dim",
  conflicted: "fail",
};

const LABELS: Record<ChangeKind, string> = {
  added: "Added",
  modified: "Modified",
  deleted: "Deleted",
  renamed: "Renamed",
  typeChanged: "Type",
  untracked: "Untracked",
  conflicted: "Conflict",
};

interface ChangeKindTagProps {
  kind: ChangeKind;
  /** Shows only the first letter, for a narrow column. */
  short?: boolean;
}

/** Shows how a file changed, in the color of the change. */
export function ChangeKindTag({ kind, short = false }: ChangeKindTagProps) {
  const label = LABELS[kind];
  return (
    <span className={styles.tag} data-tone={TONES[kind]} title={label}>
      {short ? label.charAt(0) : label}
    </span>
  );
}
