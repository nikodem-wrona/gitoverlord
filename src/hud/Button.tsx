import type { ButtonHTMLAttributes } from "react";

import styles from "./Button.module.css";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** A compact button fits in a table row. */
  compact?: boolean;
  /** Shows that the command of the button runs now. */
  busy?: boolean;
}

/** A command button. A light sweeps over it on hover. */
export function Button(props: ButtonProps) {
  const { variant = "ghost", compact, busy, className, ...rest } = props;
  return (
    <button
      type="button"
      className={cx(styles.button, className)}
      data-variant={variant}
      data-compact={compact || undefined}
      data-busy={busy || undefined}
      aria-busy={busy || undefined}
      {...rest}
    />
  );
}
