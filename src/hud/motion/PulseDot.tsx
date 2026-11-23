import type { Tone } from "../tone";
import styles from "./PulseDot.module.css";

interface PulseDotProps {
  tone?: Tone;
  /** Shows a ring that expands from the dot. */
  pulse?: boolean;
}

/** A small status light. */
export function PulseDot({ tone = "accent", pulse = false }: PulseDotProps) {
  return (
    <span
      className={styles.dot}
      data-tone={tone}
      data-pulse={pulse || undefined}
      aria-hidden="true"
    />
  );
}
