import type { ButtonHTMLAttributes } from "react";

import styles from "./Button.module.css";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

/** A command button. A light sweeps over it on hover. */
export function Button({ variant = "ghost", className, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={cx(styles.button, className)}
      data-variant={variant}
      {...rest}
    />
  );
}
