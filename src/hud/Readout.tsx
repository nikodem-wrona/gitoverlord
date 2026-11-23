import type { ReactNode } from "react";

import styles from "./Readout.module.css";
import type { Tone } from "./tone";

/** A list of label and value pairs. Put `Readout` items in it. */
export function ReadoutList({ children }: { children: ReactNode }) {
  return <dl className={styles.list}>{children}</dl>;
}

interface ReadoutProps {
  label: string;
  value: ReactNode;
  tone?: Tone;
}

/** One label and its value, for example `BRANCH  main`. */
export function Readout({ label, value, tone }: ReadoutProps) {
  return (
    <div className={styles.readout}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value} data-tone={tone}>
        {value}
      </dd>
    </div>
  );
}
