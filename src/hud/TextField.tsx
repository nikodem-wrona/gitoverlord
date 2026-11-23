import type { KeyboardEvent, ReactNode } from "react";

import { cx } from "./cx";
import styles from "./TextField.module.css";

type FieldKeyEvent = KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>;

interface TextFieldProps {
  label: string;
  value: string;
  onChange(value: string): void;
  placeholder?: string;
  /** Shows a text area with this number of lines. */
  rows?: number;
  /** Keeps the label for assistive technology only. */
  hideLabel?: boolean;
  /** Short text at the right of the label, for example a character count. */
  hint?: ReactNode;
  onKeyDown?(event: FieldKeyEvent): void;
}

/** A text input with a label above it. With `rows`, it is a text area. */
export function TextField(props: TextFieldProps) {
  const { label, value, onChange, rows, hideLabel, hint } = props;
  const shared = {
    className: styles.input,
    value,
    placeholder: props.placeholder,
    spellCheck: false,
    onKeyDown: props.onKeyDown,
  };

  return (
    <label className={styles.field}>
      <span className={cx(styles.label, hideLabel && "visually-hidden")}>
        <span>{label}</span>
        {hint !== undefined && <span className={styles.hint}>{hint}</span>}
      </span>
      {rows ? (
        <textarea
          {...shared}
          rows={rows}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          {...shared}
          type="text"
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}
